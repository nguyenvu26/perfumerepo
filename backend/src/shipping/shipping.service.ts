import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GHNService } from '../ghn/ghn.service';
import { ShippingProvider, ShipmentStatus } from '@prisma/client';
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
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ghn: GHNService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    if (
      !order.shippingDistrictId ||
      !order.shippingWardCode ||
      !order.shippingServiceId
    ) {
      throw new BadRequestException('Đơn chưa có đủ thông tin giao hàng');
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

    const weight = 500;
    const items = order.items.map((item) => ({
      name: item.variant.product.name + ' ' + item.variant.name,
      quantity: item.quantity,
      price: item.unitPrice,
      weight: Math.ceil(weight / order.items.length),
    }));

    const result = await this.ghn.createOrder({
      toName: order.recipientName ?? 'Khách hàng',
      toPhone: order.phone ?? '',
      toAddress: order.shippingAddress ?? '',
      toWardCode: order.shippingWardCode,
      toDistrictId: order.shippingDistrictId,
      weight,
      length: 20,
      width: 15,
      height: 10,
      serviceId: order.shippingServiceId,
      serviceTypeId: 2,
      paymentTypeId: 1,
      codAmount: order.finalAmount,
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

    let shipment = orderCode
      ? await this.prisma.shipment.findFirst({
          where: { ghnOrderCode: orderCode, provider: ShippingProvider.GHN },
          include: { order: true },
        })
      : clientCode
        ? await this.prisma.shipment.findFirst({
            where: { order: { code: clientCode } },
            include: { order: true },
          })
        : null;

    if (!shipment) return;

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
        .catch(() => {});
    }

    if (newStatus === ShipmentStatus.DELIVERED && shipment.order.userId) {
      await this.prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'COMPLETED' },
      });
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
}
