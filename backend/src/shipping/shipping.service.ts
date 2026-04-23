import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GHNService } from '../ghn/ghn.service';
import { ShippingProvider, ShipmentStatus, PaymentProvider } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const GHN_STATUS_MAP: Record<string, ShipmentStatus> = {
  ready_to_pick: ShipmentStatus.PENDING,
  picking: ShipmentStatus.PICKED_UP,
  storing: ShipmentStatus.IN_TRANSIT,
  delivering: ShipmentStatus.IN_TRANSIT,
  delivered: ShipmentStatus.DELIVERED,
  cancel: ShipmentStatus.FAILED,
  return: ShipmentStatus.RETURNED,
  lost: ShipmentStatus.FAILED,
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'đang chờ lấy hàng',
  PICKED_UP: 'đã lấy hàng',
  IN_TRANSIT: 'đang vận chuyển',
  DELIVERED: 'đã giao thành công',
  FAILED: 'giao hàng thất bại',
  RETURNED: 'đã hoàn hàng',
};

@Injectable()
export class ShippingService implements OnModuleInit, OnModuleDestroy {
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private readonly syncIntervalMs: number;
  private readonly syncBatchSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ghn: GHNService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
  ) {
    this.syncIntervalMs = Number(
      this.config.get<string>('GHN_SYNC_INTERVAL_MS') || 30000,
    );
    this.syncBatchSize = Number(
      this.config.get<string>('GHN_SYNC_BATCH_SIZE') || 20,
    );
  }

  onModuleInit() {
    this.syncTimer = setInterval(() => {
      void this.syncActiveShipmentsFallback();
    }, this.syncIntervalMs);
  }

  onModuleDestroy() {
    if (this.syncTimer) clearInterval(this.syncTimer);
  }

  async createGhnShipmentForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.createGhnShipment(orderId);
  }

  async createGhnShipment(
    orderId: string,
  ): Promise<{ shipmentId: string; orderCode: string; fee: number }> {
    if (!this.ghn.isConfigured()) {
      throw new BadRequestException('GHN chưa được cấu hình');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.channel !== 'ONLINE')
      throw new BadRequestException('Chỉ đơn ONLINE mới tạo GHN');
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Đơn đã bị hủy');
    }
    if (!order.shippingDistrictId || !order.shippingWardCode) {
      throw new BadRequestException('Đơn chưa có đủ thông tin giao hàng');
    }
    this.validateOrderAddressForGhn(order);

    let serviceId = order.shippingServiceId;
    if (!serviceId || serviceId === 0) {
      const availableServices = await this.ghn.getAvailableServices(
        order.shippingDistrictId,
      );
      if (availableServices.length > 0) {
        serviceId = availableServices[0].service_id;
      } else {
        throw new BadRequestException(
          'Không có dịch vụ vận chuyển khả dụng cho khu vực này',
        );
      }
    }

    const existing = await this.prisma.shipment.findFirst({
      where: { orderId, provider: ShippingProvider.GHN },
    });
    if (existing) {
      return {
        shipmentId: existing.id,
        orderCode: existing.ghnOrderCode ?? '',
        fee: existing.fee ?? 0,
      };
    }

    const paidOnlinePayment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        status: 'PAID',
        provider: { not: 'COD' },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Identify if this order was intended to be paid online by checking for any online payment records
    const onlinePaymentAttempts = await this.prisma.payment.findMany({
      where: {
        orderId,
        provider: { notIn: [PaymentProvider.COD] },
      },
    });

    if (
      order.channel === 'ONLINE' &&
      order.paymentStatus !== 'PAID' &&
      !paidOnlinePayment &&
      onlinePaymentAttempts.length > 0
    ) {
      throw new BadRequestException(
        'Đơn online chưa thanh toán thành công, chưa thể tạo GHN',
      );
    }

    const normalizedPhone = this.normalizeVietnamPhone(order.phone || '');
    const weight = 500;
    const items = order.items.map((item) => ({
      name: item.variant.product.name + ' ' + item.variant.name,
      quantity: item.quantity,
      price: item.unitPrice,
      weight: Math.ceil(weight / order.items.length),
    }));

    const codAmount =
      paidOnlinePayment || order.paymentStatus === 'PAID'
        ? 0
        : order.finalAmount;

    const result = await this.ghn.createOrder({
      toName: order.recipientName ?? 'Khách hàng',
      toPhone: normalizedPhone || '',
      toAddress: order.shippingAddress ?? '',
      toWardCode: order.shippingWardCode,
      toDistrictId: order.shippingDistrictId,
      weight,
      length: 20,
      width: 15,
      height: 10,
      serviceId: serviceId,
      serviceTypeId: 2,
      paymentTypeId: 1,
      codAmount,
      content: `Đơn hàng ${order.code}`,
      clientOrderCode: order.code,
      items,
    });

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        provider: ShippingProvider.GHN,
        trackingCode: result.order_code,
        ghnOrderCode: result.order_code,
        fee: result.total_fee,
        status: ShipmentStatus.PENDING,
        address: order.shippingAddress,
        rawProviderData: JSON.stringify(result),
      },
    });

    return {
      shipmentId: shipment.id,
      orderCode: result.order_code,
      fee: result.total_fee,
    };
  }

  private validateOrderAddressForGhn(order: {
    recipientName: string | null;
    phone: string | null;
    shippingAddress: string | null;
    shippingDistrictId: number | null;
    shippingWardCode: string | null;
  }) {
    const recipientName = (order.recipientName || '').trim();
    const shippingAddress = (order.shippingAddress || '').trim();
    const wardCode = (order.shippingWardCode || '').trim();
    const normalizedPhone = this.normalizeVietnamPhone(order.phone || '');

    if (!recipientName || recipientName.length < 2) {
      throw new BadRequestException('Tên người nhận không hợp lệ');
    }
    if (!normalizedPhone) {
      throw new BadRequestException('Số điện thoại người nhận không hợp lệ');
    }
    if (!shippingAddress || shippingAddress.length < 6) {
      throw new BadRequestException('Địa chỉ giao hàng không hợp lệ');
    }
    if (!order.shippingDistrictId || order.shippingDistrictId <= 0) {
      throw new BadRequestException('Thiếu quận/huyện giao hàng hợp lệ');
    }
    if (!wardCode) {
      throw new BadRequestException('Thiếu phường/xã giao hàng');
    }
  }

  private normalizeVietnamPhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length === 11) {
      return `0${digits.slice(2)}`;
    }
    if (/^0\d{9}$/.test(digits)) {
      return digits;
    }
    return null;
  }

  async createGhnReturnPickup(
    returnRequestId: string,
    paymentTypeId: number = 1,
  ): Promise<{ orderCode: string; fee: number }> {
    if (!this.ghn.isConfigured()) {
      throw new BadRequestException('GHN chưa được cấu hình');
    }

    const ret = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        order: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });

    if (!ret) throw new NotFoundException('Return request not found');
    if (ret.origin !== 'ONLINE')
      throw new BadRequestException('Chỉ đơn Online mới hỗ trợ GHN thu hồi');

    // Store address as Receiver
    const toDistrictId = parseInt(
      this.config.get('SHIPPING_GHN_FROM_DISTRICT_ID') ?? '0',
      10,
    );
    const toWardCode = this.config.get('SHIPPING_GHN_FROM_WARD_CODE') ?? '';
    const toAddress = this.config.get('SHIPPING_GHN_RETURN_ADDRESS') ?? '';
    const toName = 'Kho nước hoa Perfume GPT';
    const toPhone = this.config.get('SHIPPING_GHN_RETURN_PHONE') ?? '';

    const items = ret.items.map((item) => ({
      name: item.variant.product.name + ' ' + item.variant.name,
      quantity: item.quantity,
      price: item.variant.price, // Use actual price for insurance purposes
      weight: 100,
    }));

    const result = await this.ghn.createOrder({
      toName,
      toPhone,
      toAddress,
      toWardCode,
      toDistrictId,
      fromName: ret.order.recipientName ?? 'Khách trả hàng',
      fromPhone: ret.order.phone ?? '',
      fromAddress: ret.order.shippingAddress ?? '',
      fromWardCode: ret.order.shippingWardCode ?? '',
      fromDistrictId: ret.order.shippingDistrictId ?? 0,
      weight: 500,
      length: 20,
      width: 15,
      height: 10,
      serviceId: ret.order.shippingServiceId ?? 0,
      serviceTypeId: 2,
      paymentTypeId, // 1: Shop (Receiver) pays, 2: Customer (Sender) pays
      codAmount: 0,
      insuranceValue: ret.totalAmount ?? 0,
      content: `Thu hồi đơn hàng ${ret.order.code} - Return ID: ${ret.id}`,
      clientOrderCode: `RETURN-${ret.id.substring(0, 8)}`,
      items,
    });

    // Create a return shipment record
    await this.prisma.returnShipment.create({
      data: {
        returnRequestId,
        courier: 'GHN',
        trackingNumber: result.order_code,
        shippedAt: new Date(),
      },
    });

    return {
      orderCode: result.order_code,
      fee: result.total_fee,
    };
  }

  async createGhnReturnToCustomer(
    returnRequestId: string,
  ): Promise<{ orderCode: string; fee: number }> {
    if (!this.ghn.isConfigured()) {
      throw new BadRequestException('GHN chưa được cấu hình');
    }

    const ret = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        order: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });

    if (!ret) throw new NotFoundException('Return request not found');
    if (ret.origin !== 'ONLINE')
      throw new BadRequestException('Chỉ đơn Online mới hỗ trợ GHN gửi trả');

    const fromDistrictId = parseInt(
      this.config.get('SHIPPING_GHN_FROM_DISTRICT_ID') ?? '0',
      10,
    );
    const fromWardCode = this.config.get('SHIPPING_GHN_FROM_WARD_CODE') ?? '';
    const fromAddress = this.config.get('SHIPPING_GHN_RETURN_ADDRESS') ?? '';
    const fromName = 'Kho nước hoa Perfume GPT';
    const fromPhone = this.config.get('SHIPPING_GHN_RETURN_PHONE') ?? '';

    const items = ret.items.map((item) => ({
      name: item.variant.product.name + ' ' + item.variant.name,
      quantity: item.quantity,
      price: item.variant.price,
      weight: 100,
    }));

    const result = await this.ghn.createOrder({
      toName: ret.order.recipientName ?? 'Khách hàng',
      toPhone: ret.order.phone ?? '',
      toAddress: ret.order.shippingAddress ?? '',
      toWardCode: ret.order.shippingWardCode ?? '',
      toDistrictId: ret.order.shippingDistrictId ?? 0,
      fromName,
      fromPhone,
      fromAddress,
      fromWardCode,
      fromDistrictId,
      weight: 500,
      length: 20,
      width: 15,
      height: 10,
      serviceId: ret.order.shippingServiceId ?? 0,
      serviceTypeId: 2,
      paymentTypeId: 2, // 2: Receiver (Customer) pays
      codAmount: 0,
      insuranceValue: ret.totalAmount ?? 0,
      content: `Gửi trả hàng lỗi đơn ${ret.order.code} - Return ID: ${ret.id}`,
      clientOrderCode: `BACK-${ret.id.substring(0, 8)}`,
      items,
    });

    // Create a return shipment record
    await this.prisma.returnShipment.create({
      data: {
        returnRequestId,
        courier: 'GHN',
        trackingNumber: result.order_code,
        shippedAt: new Date(),
        status: 'RETURN_TO_CUSTOMER',
      },
    });

    return {
      orderCode: result.order_code,
      fee: result.total_fee,
    };
  }

  async handleGhnWebhook(payload: {
    ClientOrderCode?: string;
    OrderCode?: string;
    Status?: string;
    TotalFee?: number;
    [key: string]: any;
  }) {
    const clientCode = payload.ClientOrderCode ?? payload.client_order_code;
    const status = payload.Status ?? payload.status;
    const orderCode = payload.OrderCode ?? payload.order_code;

    if (!clientCode && !orderCode) return;

    // Check for normal Order Shipment
    let shipment = orderCode
      ? await this.prisma.shipment.findFirst({
        where: { ghnOrderCode: orderCode, provider: ShippingProvider.GHN },
        include: { order: true },
      })
      : clientCode && clientCode.startsWith('ORD-')
        ? await this.prisma.shipment.findFirst({
          where: { order: { code: clientCode } },
          include: { order: true },
        })
        : null;

    if (shipment) {
      const newStatus = status
        ? (GHN_STATUS_MAP[status] ?? shipment.status)
        : shipment.status;
      await this.prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          status: newStatus,
          rawProviderData: JSON.stringify({ ...payload, updatedAt: new Date() }),
        },
      });

      // Notify user about shipping status change
      if (shipment.order.userId && newStatus !== shipment.status) {
        const label = SHIPMENT_STATUS_LABELS[newStatus] || newStatus;
        this.notificationsService
          .create({
            userId: shipment.order.userId,
            type: 'SHIPPING',
            title: 'Cập nhật vận chuyển',
            content: `Đơn hàng ${shipment.order.code} ${label}.`,
            data: {
              orderId: shipment.orderId,
              orderCode: shipment.order.code,
              shipmentStatus: newStatus,
            },
          })
          .catch(() => { });
      }

      if (newStatus === ShipmentStatus.DELIVERED && shipment.order.userId) {
        await this.prisma.order.update({
          where: { id: shipment.orderId },
          data: { status: 'COMPLETED' },
        });
      } else if (
        (newStatus === ShipmentStatus.FAILED ||
          newStatus === ShipmentStatus.RETURNED) &&
        shipment.order.status !== 'COMPLETED'
      ) {
        await this.prisma.order.update({
          where: { id: shipment.orderId },
          data: { status: 'CANCELLED' },
        });
      }
      return;
    }

    // Check for Return Shipment
    let returnShipment = orderCode
      ? await this.prisma.returnShipment.findFirst({
        where: { trackingNumber: orderCode },
        include: { returnRequest: { include: { order: true } } },
      })
      : clientCode && clientCode.startsWith('RETURN-')
        ? await this.prisma.returnShipment.findFirst({
          where: { returnRequest: { id: { startsWith: clientCode.replace('RETURN-', '') } } },
          include: { returnRequest: { include: { order: true } } },
        })
        : null;

    if (returnShipment) {
      const newStatus = status
        ? (GHN_STATUS_MAP[status] ?? returnShipment.status)
        : returnShipment.status;

      await this.prisma.returnShipment.update({
        where: { id: returnShipment.id },
        data: {
          status: newStatus,
          rawProviderData: JSON.stringify({ ...payload, updatedAt: new Date() }),
        },
      });

      // If return shipment is picked up, update ReturnRequest status to RETURNING
      if (newStatus === ShipmentStatus.PICKED_UP || newStatus === ShipmentStatus.IN_TRANSIT) {
        if (returnShipment.returnRequest.status !== 'RETURNING') {
          await this.prisma.returnRequest.update({
            where: { id: returnShipment.returnRequestId },
            data: { status: 'RETURNING' },
          });
        }
      }

      // If return shipment is delivered to shop, notify staff
      if (newStatus === ShipmentStatus.DELIVERED && returnShipment.returnRequest.order.userId) {
        // Find staff/admin to notify
        this.notificationsService.create({
          userId: returnShipment.returnRequest.order.userId, // Default notify customer too
          type: 'RETURN',
          title: 'Hàng trả đã đến kho',
          content: `Đơn hàng hoàn trả cho mã đơn ${returnShipment.returnRequest.order.code} đã được giao tới kho. Vui lòng kiểm tra và xử lý.`,
          data: { returnId: returnShipment.returnRequestId },
        }).catch(() => { });
        
        // Log audit
        await this.prisma.returnAudit.create({
          data: {
            returnId: returnShipment.returnRequestId,
            action: 'SHIPMENT_DELIVERED',
            payload: { orderCode },
          }
        }).catch(() => {});
      }
    }
  }

  async getShipmentByOrderId(orderId: string) {
    return this.prisma.shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getShipmentsForUserOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) return [];
    return this.getShipmentByOrderId(orderId);
  }

  // ── Admin methods ──────────────────────────────────────────

  async listAllShipments(skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        skip,
        take,
        include: { order: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shipment.count(),
    ]);
    return { data, total, skip, take, pages: Math.ceil(total / take) };
  }

  async createGhnShipmentAdmin(orderId: string) {
    return this.createGhnShipment(orderId);
  }

  async syncShipmentStatus(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (!shipment.ghnOrderCode)
      throw new BadRequestException('Shipment has no GHN order code');

    const detail = await this.ghn.getOrderDetail(shipment.ghnOrderCode);
    const ghnStatus = detail.status?.toLowerCase();
    const newStatus = ghnStatus
      ? (GHN_STATUS_MAP[ghnStatus] ?? shipment.status)
      : shipment.status;

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: newStatus,
        rawProviderData: JSON.stringify({ ...detail, syncedAt: new Date() }),
      },
    });

    // Auto-complete order if delivered
    if (
      newStatus === ShipmentStatus.DELIVERED &&
      shipment.order.status !== 'COMPLETED'
    ) {
      await this.prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'COMPLETED' },
      });
    } else if (
      (newStatus === ShipmentStatus.FAILED ||
        newStatus === ShipmentStatus.RETURNED) &&
      shipment.order.status !== 'COMPLETED'
    ) {
      await this.prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'CANCELLED' },
      });
    }

    return updated;
  }

  async cancelGhnShipment(orderId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { orderId, provider: ShippingProvider.GHN },
    });
    if (!shipment)
      throw new NotFoundException('Shipment not found for this order');
    if (!shipment.ghnOrderCode)
      throw new BadRequestException('Shipment has no GHN order code');

    await this.ghn.cancelOrder([shipment.ghnOrderCode]);

    return this.prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: ShipmentStatus.FAILED },
    });
  }

  async getShipmentDetailAdmin(orderId: string) {
    const shipments = await this.prisma.shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const result: Array<(typeof shipments)[number] & { ghnDetail: any }> = [];
    for (const s of shipments) {
      let ghnDetail: any = null;
      if (
        s.ghnOrderCode &&
        s.status !== ShipmentStatus.FAILED &&
        s.status !== ShipmentStatus.DELIVERED
      ) {
        try {
          ghnDetail = await this.ghn.getOrderDetail(s.ghnOrderCode);
        } catch {
          // GHN may be unavailable, continue without detail
        }
      }
      result.push({ ...s, ghnDetail });
    }
    return result;
  }

  private async syncActiveShipmentsFallback() {
    if (this.isSyncing || !this.ghn.isConfigured()) return;
    this.isSyncing = true;
    try {
      const active = await this.prisma.shipment.findMany({
        where: {
          provider: ShippingProvider.GHN,
          ghnOrderCode: { not: null },
          status: {
            in: [
              ShipmentStatus.PENDING,
              ShipmentStatus.PICKED_UP,
              ShipmentStatus.IN_TRANSIT,
            ],
          },
        },
        orderBy: { updatedAt: 'asc' },
        take: this.syncBatchSize,
      });

      for (const s of active) {
        try {
          await this.syncShipmentStatus(s.id);
        } catch (e: any) {
          console.warn(`GHN fallback sync failed for ${s.id}: ${e?.message}`);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
}
