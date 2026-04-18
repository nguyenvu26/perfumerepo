import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ShippingService } from '../shipping/shipping.service';
import {
  ReturnStatus,
  ReturnOrigin,
  ReceivedLocation,
  RefundStatus,
  ItemCondition,
  OrderStatus,
} from '@prisma/client';
import { CreateReturnDto } from './dto/create-return.dto';
import { ReviewReturnDto, RequestMoreInfoDto } from './dto/review-return.dto';
import { ReceiveReturnDto } from './dto/receive-return.dto';
import { CreateReturnShipmentDto } from './dto/create-shipment.dto';
import { TriggerRefundDto } from './dto/trigger-refund.dto';

/** Return policy: days after order completion when returns are allowed */
const RETURN_WINDOW_DAYS = 7;

/** Valid state transitions map */
const VALID_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: [
    ReturnStatus.REVIEWING,
    ReturnStatus.APPROVED,
    ReturnStatus.REJECTED,
    ReturnStatus.AWAITING_CUSTOMER,
    ReturnStatus.CANCELLED,
    ReturnStatus.RECEIVED, // For POS direct jump
  ],
  REVIEWING: [
    ReturnStatus.APPROVED,
    ReturnStatus.REJECTED,
    ReturnStatus.AWAITING_CUSTOMER,
    ReturnStatus.CANCELLED,
    ReturnStatus.RECEIVED, // For POS direct jump
  ],
  AWAITING_CUSTOMER: [ReturnStatus.REVIEWING, ReturnStatus.CANCELLED],
  APPROVED: [ReturnStatus.RETURNING, ReturnStatus.CANCELLED],
  RETURNING: [ReturnStatus.RECEIVED, ReturnStatus.REJECTED_AFTER_RETURN],
  RECEIVED: [ReturnStatus.REFUNDING, ReturnStatus.REJECTED_AFTER_RETURN],
  REFUNDING: [ReturnStatus.COMPLETED, ReturnStatus.REFUND_FAILED],
  REFUND_FAILED: [ReturnStatus.REFUNDING],
  COMPLETED: [],
  REJECTED: [],
  REJECTED_AFTER_RETURN: [],
  CANCELLED: [],
};

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly shippingService: ShippingService,
  ) {}

  // ─────────── HELPERS ───────────

  async getSuggestedRefundAmount(id: string) {
    const ret = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!ret) throw new NotFoundException('Return not found');

    const order = await this.prisma.order.findUnique({
      where: { id: ret.orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Luxury policy: Refund shipping if store fault or VIP
    const isStoreFault =
      ret.reason?.includes('[DAMAGED]') || ret.reason?.includes('[WRONG_ITEM]');
    const isVIP = ((ret as any).user?.loyaltyPoints || 0) >= 5000;

    const shippingRefundable =
      isStoreFault || isVIP ? Number(order.shippingFee || 0) : 0;

    const refundAmount = this.calculateRefundAmount(
      order.items,
      ret.items.map((ri) => ({
        variantId: ri.variantId,
        quantity: ri.quantity,
        qtyReceived: ri.qtyReceived,
      })),
      order.discountAmount,
      shippingRefundable,
    );

    return { suggestedAmount: refundAmount };
  }

  async findReturnOrThrow(id: string) {
    const ret = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { order: 'asc' as const }, take: 1 },
                  },
                },
              },
            },
          },
        },
        shipments: true,
        audits: { orderBy: { createdAt: 'desc' as const } },
        refunds: true,
        order: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            loyaltyPoints: true,
          },
        },
        staff: { select: { id: true, fullName: true } },
      },
    });
    if (!ret) throw new NotFoundException('Return request not found');
    return ret;
  }

  private async checkIdempotency(
    idempotencyKey: string | undefined,
    returnId: string,
    action: 'create' | 'refund',
  ): Promise<{ existing: boolean; result?: any }> {
    if (!idempotencyKey) {
      return { existing: false };
    }
    const scope = `${action}_${returnId}_${idempotencyKey}`;
    const existing = await this.prisma.returnAudit.findFirst({
      where: {
        action: `IDEMPOTENT_${action.toUpperCase()}`,
        payload: { path: ['scope'], equals: scope },
      },
    });
    if (existing) {
      const ret = await this.findReturnOrThrow(returnId);
      return { existing: true, result: ret };
    }
    return { existing: false };
  }

  private async recordIdempotency(
    tx: any,
    returnId: string,
    idempotencyKey: string,
    action: 'create' | 'refund',
    payload: any,
  ) {
    await tx.returnAudit.create({
      data: {
        returnId,
        actorId: null,
        action: `IDEMPOTENT_${action.toUpperCase()}`,
        payload: {
          scope: `${action}_${returnId}_${idempotencyKey}`,
          payload,
        },
      },
    });
  }

  private validateTransition(current: ReturnStatus, target: ReturnStatus) {
    const allowed = VALID_TRANSITIONS[current] || [];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${target}`,
      );
    }
  }

  private async createAudit(
    tx: any,
    returnId: string,
    actorId: string | null,
    action: string,
    payload?: any,
  ) {
    await tx.returnAudit.create({
      data: {
        returnId,
        actorId,
        action,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      },
    });
  }

  private calculateRefundAmount(
    orderItems: any[],
    returnItems: {
      variantId: string;
      quantity: number;
      qtyReceived?: number | null;
    }[],
    orderDiscount: number = 0,
    shippingRefundable: number = 0,
  ): number {
    let subtotal = 0;
    const orderItemsValue = orderItems.reduce(
      (sum, o) => sum + (Number(o.totalPrice) || 0),
      0,
    );

    for (const ri of returnItems) {
      const oi = orderItems.find((o) => o.variantId === ri.variantId);
      if (!oi) continue;
      const qty = ri.qtyReceived ?? ri.quantity;
      subtotal += (Number(oi.unitPrice) || 0) * qty;
    }

    if (orderItemsValue === 0) return subtotal + shippingRefundable;

    // Pro-rata discount allocation
    const subtotalRatio = subtotal / orderItemsValue;
    const discountShare = (Number(orderDiscount) || 0) * subtotalRatio;

    // Standard e-commerce logic:
    // Refund = (Gross Price for returned items) - (Discount proportion) + (Shipping if applicable)
    const total = subtotal - discountShare + shippingRefundable;

    return Math.max(0, Math.round(total));
  }

  // ─────────── CUSTOMER: CREATE ───────────

  async createReturn(
    userId: string,
    dto: CreateReturnDto,
    staffId?: string,
    idempotencyKey?: string,
  ) {
    // For CREATE: Check if return already exists for this order (idempotency check)
    // We don't pre-check audit table because returnId doesn't exist yet
    if (idempotencyKey) {
      const existingReturn = await this.prisma.returnRequest.findFirst({
        where: { orderId: dto.orderId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: { orderBy: { order: 'asc' as const }, take: 1 },
                    },
                  },
                },
              },
            },
          },
          shipments: true,
          audits: { orderBy: { createdAt: 'desc' as const } },
          refunds: true,
          order: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              loyaltyPoints: true,
            },
          },
          staff: { select: { id: true, fullName: true } },
        },
      });
      if (existingReturn) {
        // Return already exists for this order, treat as successful idempotent response
        return existingReturn;
      }
    }

    const isStaff = !!staffId;
    const origin =
      isStaff && dto.origin === 'POS' ? ReturnOrigin.POS : ReturnOrigin.ONLINE;

    // 1) Find order
    const order = await this.prisma.order.findFirst({
      where: isStaff ? { id: dto.orderId } : { id: dto.orderId, userId },
      include: { items: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // 2) Order must be COMPLETED
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Chỉ có thể trả hàng với đơn đã hoàn thành',
      );
    }

    // 3) Check time window
    const completedAt = order.updatedAt;
    const daysSinceCompleted =
      (Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCompleted > RETURN_WINDOW_DAYS) {
      throw new BadRequestException(
        `Đã quá thời hạn trả hàng (${RETURN_WINDOW_DAYS} ngày)`,
      );
    }

    // 4) Check quantities
    const previousReturns = await this.prisma.returnRequest.findMany({
      where: {
        orderId: dto.orderId,
        status: { notIn: [ReturnStatus.CANCELLED, ReturnStatus.REJECTED] },
      },
      include: { items: true },
    });

    for (const item of dto.items) {
      const orderItem = order.items.find(
        (oi) => oi.variantId === item.variantId,
      );
      if (!orderItem) {
        throw new BadRequestException(
          `Variant ${item.variantId} không thuộc đơn hàng này`,
        );
      }

      const previouslyReturned = previousReturns.reduce((sum, pr) => {
        const pItem = pr.items.find((pi) => pi.variantId === item.variantId);
        return sum + (pItem?.quantity ?? 0);
      }, 0);

      if (item.quantity > orderItem.quantity - previouslyReturned) {
        throw new BadRequestException(
          `Số lượng trả vượt quá cho phép (variant ${item.variantId}). Đã mua: ${orderItem.quantity}, đã trả trước đó: ${previouslyReturned}`,
        );
      }
    }

    // 5) Calculate expected refund amount (enhanced)
    // Luxury Strategy: Refund shipping if reason is DAMAGED or WRONG_ITEM, OR if VIP
    const isStoreFault =
      dto.reason?.includes('[DAMAGED]') || dto.reason?.includes('[WRONG_ITEM]');

    // Check if VIP (e.g. loyalty points > 5000)
    const isVIP = (order.user?.loyaltyPoints ?? 0) >= 5000;

    // For a full order return with store fault or VIP status, we refund full original shipping
    const shippingRefundable =
      isStoreFault || isVIP ? Number(order.shippingFee || 0) : 0;

    const totalAmount = this.calculateRefundAmount(
      order.items,
      dto.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      order.discountAmount,
      shippingRefundable,
    );

    // 6) Create in transaction

    const result = await this.prisma.$transaction(async (tx) => {
      const ret = await tx.returnRequest.create({
        data: {
          orderId: dto.orderId,
          // Nếu là staff và order.userId không có (POS khách lẻ), cho phép null
          userId: isStaff ? (order.userId ?? null) : userId,
          origin,
          createdBy: isStaff ? staffId : undefined,
          reason: dto.reason,
          videoUrl: dto.videoUrl,
          paymentInfo: dto.paymentInfo ? dto.paymentInfo : undefined,
          totalAmount,
          items: {
            create: dto.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              reason: item.reason,
              images: item.images ?? [],
            })),
          },
        },
        include: {
          items: true,
        },
      });

      await this.createAudit(
        tx,
        ret.id,
        isStaff ? staffId! : userId,
        'CREATED',
        {
          origin,
          reason: dto.reason,
          items: dto.items,
        },
      );

      // Note: No idempotency recording needed for CREATE here
      // We check idempotency by querying returnRequest directly (see above)

      return ret;
    });

    // Notify nếu có userId
    if (order.userId) {
      this.notificationsService
        .create({
          userId: order.userId,
          type: 'ORDER',
          title: 'Yêu cầu trả hàng đã được tạo',
          content: `Yêu cầu trả hàng cho đơn ${order.code} đã được ghi nhận.`,
          data: { returnRequestId: result.id, orderId: order.id },
        })
        .catch(() => {});
    }

    // Notify all admins so they can review/approve the POS return
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
      });
      await Promise.all(
        admins.map((a) =>
          this.notificationsService
            .create({
              userId: a.id,
              type: 'ORDER',
              title: 'Yêu cầu trả hàng mới (POS)',
              content: `Có yêu cầu trả hàng mới (${result.id}) từ POS cho đơn ${order.code}. Vui lòng kiểm tra và xét duyệt.`,
              data: { returnRequestId: result.id, orderId: order.id },
            })
            .catch(() => {}),
        ),
      );
    } catch (e) {
      // don't block on notification failures
    }

    return result;
  }

  // ─────────── CUSTOMER: LIST & DETAIL ───────────

  async listMyReturns(userId: string) {
    return this.prisma.returnRequest.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: { orderBy: { order: 'asc' }, take: 1 } },
                },
              },
            },
          },
        },
        order: { select: { id: true, code: true, finalAmount: true } },
        shipments: true,
        refunds: {
          select: { id: true, amount: true, status: true, method: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyReturnById(userId: string, id: string) {
    const ret = await this.findReturnOrThrow(id);
    if (ret.userId !== userId) {
      throw new ForbiddenException('Không có quyền xem yêu cầu này');
    }
    return ret;
  }

  // ─────────── CUSTOMER: ADD SHIPMENT ───────────

  async addShipment(userId: string, id: string, dto: CreateReturnShipmentDto) {
    const ret = await this.findReturnOrThrow(id);
    if (ret.userId !== userId) throw new ForbiddenException();

    if (ret.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Chỉ có thể gửi hàng khi đã được duyệt');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.returnShipment.create({
        data: {
          returnRequestId: id,
          courier: dto.courier,
          trackingNumber: dto.trackingNumber,
          shippedAt: new Date(),
        },
      });

      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.RETURNING },
        include: { shipments: true },
      });

      await this.createAudit(tx, id, userId, 'SHIPMENT_ADDED', {
        courier: dto.courier,
        trackingNumber: dto.trackingNumber,
      });

      return updated;
    });

    return result;
  }

  // ─────────── CUSTOMER: CANCEL ───────────

  async cancelReturn(userId: string, id: string, reason?: string) {
    const ret = await this.findReturnOrThrow(id);
    if (ret.userId !== userId) throw new ForbiddenException();

    const CUSTOMER_CANCELLABLE: ReturnStatus[] = [
      ReturnStatus.REQUESTED,
      ReturnStatus.AWAITING_CUSTOMER,
      ReturnStatus.REVIEWING,
    ];

    if (!CUSTOMER_CANCELLABLE.includes(ret.status)) {
      throw new BadRequestException(
        'Không thể hủy yêu cầu ở trạng thái hiện tại',
      );
    }

    // Ensure no shipment attached
    if (ret.shipments.length > 0) {
      throw new BadRequestException(
        'Không thể hủy khi đã có thông tin vận chuyển',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.CANCELLED, note: reason },
      });

      await this.createAudit(tx, id, userId, 'CANCELLED', { reason });

      return updated;
    });
  }

  async handoverReturn(userId: string, id: string) {
    const ret = await this.findReturnOrThrow(id);
    if (ret.userId !== userId) throw new ForbiddenException();

    // Handover is valid if in APPROVED (for automated) or RETURNING (for manual retry)
    const VALID_HANDOVER: ReturnStatus[] = [
      ReturnStatus.APPROVED,
      ReturnStatus.RETURNING,
    ];

    if (!VALID_HANDOVER.includes(ret.status)) {
      throw new BadRequestException(
        'Không thể xác nhận bàn giao ở trạng thái hiện tại',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.RETURNING },
      });

      await this.createAudit(tx, id, userId, 'HANDOVER_CONFIRMED', {
        previousStatus: ret.status,
      });

      return updated;
    });
  }

  // ─────────── ADMIN: LIST ALL ───────────

  async listAllReturns(
    skip: number,
    take: number,
    status?: string,
    orderId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
                  },
                },
              },
            },
          },
          order: {
            select: { id: true, code: true, finalAmount: true, channel: true, storeId: true },
          },
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          staff: { select: { id: true, fullName: true } },
          shipments: true,
          refunds: { select: { id: true, amount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return { data, total, skip, take, pages: Math.ceil(total / take) };
  }

  async getReturnById(id: string) {
    return this.findReturnOrThrow(id);
  }

  // ─────────── ADMIN: REVIEW ───────────

  async reviewReturn(adminId: string, id: string, dto: ReviewReturnDto) {
    const ret = await this.findReturnOrThrow(id);

    if (
      ret.status !== ReturnStatus.REQUESTED &&
      ret.status !== ReturnStatus.REVIEWING &&
      ret.status !== ReturnStatus.AWAITING_CUSTOMER
    ) {
      throw new BadRequestException('Yêu cầu không ở trạng thái có thể review');
    }

    const isPosApprove = ret.origin === 'POS' && dto.action === 'approve';
    const newStatus = isPosApprove
      ? ReturnStatus.RECEIVED
      : dto.action === 'approve'
        ? ReturnStatus.APPROVED
        : ReturnStatus.REJECTED;

    this.validateTransition(ret.status, newStatus);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.returnRequest.update({
        where: { id },
        data: {
          status: newStatus,
          note: dto.note,
          ...(isPosApprove && {
            receivedAt: new Date(),
            receivedLocation: 'POS',
          }),
        },
      });

      await this.createAudit(tx, id, adminId, dto.action.toUpperCase(), {
        previousStatus: ret.status,
        note: dto.note,
        isPosJump: isPosApprove,
      });

      if (isPosApprove) {
        // Update quantities as received if jumping
        for (const item of ret.items) {
          await tx.returnItem.update({
            where: { id: item.id },
            data: { qtyReceived: item.quantity },
          });
        }
      }

      return result;
    });

    // Notify customer
    if (ret.userId) {
      const msg =
        dto.action === 'approve'
          ? 'Yêu cầu trả hàng đã được duyệt. Vui lòng gửi hàng về và cung cấp mã vận đơn.'
          : `Yêu cầu trả hàng bị từ chối. ${dto.note || ''}`;

      this.notificationsService
        .create({
          userId: ret.userId,
          type: 'ORDER',
          title:
            dto.action === 'approve'
              ? 'Yêu cầu trả hàng được duyệt'
              : 'Yêu cầu trả hàng bị từ chối',
          content: msg,
          data: { returnRequestId: id },
        })
        .catch(() => {});
    }

    // ─────────── AUTOMATED GHN PICKUP ───────────
    if (
      newStatus === ReturnStatus.APPROVED &&
      ret.origin === 'ONLINE' &&
      !ret.createdBy
    ) {
      try {
        const pickupResult =
          await this.shippingService.createGhnReturnPickup(id);
        await this.prisma.returnAudit.create({
          data: {
            returnId: id,
            actorId: adminId,
            action: 'AUTOMATED_PICKUP_CREATED',
            payload: { ...pickupResult, provider: 'GHN' },
          },
        });
      } catch (err) {
        console.error('Failed to create automated GHN pickup:', err);
        await this.prisma.returnAudit.create({
          data: {
            returnId: id,
            actorId: adminId,
            action: 'AUTOMATED_PICKUP_FAILED',
            payload: { message: err.message },
          },
        });
        // We don't throw here to avoid rolling back the approval,
        // but we might want to notify staff to retry manually.
      }
    }

    return updated;
  }

  // ─────────── ADMIN: REQUEST MORE INFO ───────────

  async requestMoreInfo(adminId: string, id: string, dto: RequestMoreInfoDto) {
    const ret = await this.findReturnOrThrow(id);
    this.validateTransition(ret.status, ReturnStatus.AWAITING_CUSTOMER);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.returnRequest.update({
        where: { id },
        data: {
          status: ReturnStatus.AWAITING_CUSTOMER,
          note: dto.message,
        },
      });

      await this.createAudit(tx, id, adminId, 'REQUEST_MORE_INFO', {
        message: dto.message,
        deadline: dto.deadline,
      });

      return result;
    });

    // Notify customer
    if (ret.userId) {
      this.notificationsService
        .create({
          userId: ret.userId,
          type: 'ORDER',
          title: 'Cần bổ sung thông tin trả hàng',
          content: dto.message,
          data: { returnRequestId: id },
        })
        .catch(() => {});
    }

    return updated;
  }

  // ─────────── ADMIN: RECEIVE ───────────

  async receiveReturn(adminId: string, id: string, dto: ReceiveReturnDto) {
    const ret = await this.findReturnOrThrow(id);

    // For online returns, status must be RETURNING
    // For POS returns, status can be APPROVED (staff skips shipping step)
    const allowedStatuses: ReturnStatus[] = [
      ReturnStatus.RETURNING,
      ReturnStatus.APPROVED, // POS quick flow
    ];
    if (!allowedStatuses.includes(ret.status)) {
      throw new BadRequestException(
        'Yêu cầu không ở trạng thái có thể nhận hàng',
      );
    }

    // Check for seal integrity - reject if broken seal on perfume
    const hasUnsealedItem = dto.items.some((item) => item.sealIntact === false);
    const allUnsealed = dto.items.every((item) => item.sealIntact === false);

    const newStatus = allUnsealed
      ? ReturnStatus.REJECTED_AFTER_RETURN
      : ReturnStatus.RECEIVED;

    const receivedLocation =
      (dto.receivedLocation as ReceivedLocation) ?? ReceivedLocation.WAREHOUSE;

    const result = await this.prisma.$transaction(async (tx) => {
      // Update each return item with received info
      for (const dtoItem of dto.items) {
        const returnItem = ret.items.find(
          (ri) => ri.variantId === dtoItem.variantId,
        );
        if (!returnItem) continue;

        await tx.returnItem.update({
          where: { id: returnItem.id },
          data: {
            qtyReceived: dtoItem.qtyReceived,
            condition: dtoItem.condition as ItemCondition | undefined,
            sealIntact: dtoItem.sealIntact,
          },
        });

        // If item seal is intact → restock per-item (not gated by hasUnsealedItem)
        if (dtoItem.sealIntact !== false && dtoItem.qtyReceived > 0) {
          await tx.productVariant.update({
            where: { id: dtoItem.variantId },
            data: { stock: { increment: dtoItem.qtyReceived } },
          });

          await tx.inventoryLog.create({
            data: {
              variantId: dtoItem.variantId,
              staffId: adminId,
              type: 'RETURN',
              quantity: dtoItem.qtyReceived,
              reason: `Return received: ${id}`,
            },
          });
        }
      }

      // Update shipment receivedAt if exists
      const shipments = await tx.returnShipment.findMany({
        where: { returnRequestId: id },
      });
      if (shipments.length > 0) {
        await tx.returnShipment.update({
          where: { id: shipments[shipments.length - 1].id },
          data: {
            receivedAt: new Date(),
            receivedLocation,
          },
        });
      }

      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status: newStatus,
          receivedAt: new Date(),
          receivedLocation,
          note: dto.note,
        },
      });

      await this.createAudit(tx, id, adminId, 'RECEIVED', {
        items: dto.items,
        receivedLocation,
        resultStatus: newStatus,
        note: dto.note,
      });

      return updated;
    });

    // Notify customer
    if (ret.userId) {
      const msg = hasUnsealedItem
        ? 'Hàng trả về bị từ chối do seal đã bị mở.'
        : 'Hàng trả về đã được nhận. Đang xử lý hoàn tiền.';
      this.notificationsService
        .create({
          userId: ret.userId,
          type: 'ORDER',
          title: hasUnsealedItem ? 'Hàng trả bị từ chối' : 'Đã nhận hàng trả',
          content: msg,
          data: { returnRequestId: id },
        })
        .catch(() => {});
    }

    return result;
  }

  // ─────────── ADMIN: TRIGGER REFUND ───────────

  async triggerRefund(
    adminId: string,
    id: string,
    dto: TriggerRefundDto,
    idempotencyKey?: string,
    role?: string,
  ) {
    // Idempotency check
    const check = await this.checkIdempotency(idempotencyKey, id, 'refund');
    if (check.existing) {
      return check.result;
    }

    const ret = await this.findReturnOrThrow(id);

    // Mandatory return rule: must be RECEIVED before refund
    if (
      ret.status !== ReturnStatus.RECEIVED &&
      ret.status !== ReturnStatus.REFUND_FAILED
    ) {
      throw new BadRequestException(
        'Không thể hoàn tiền khi chưa nhận hàng (status phải là RECEIVED hoặc REFUND_FAILED)',
      );
    }

    // Calculate actual refund
    const order = await this.prisma.order.findUnique({
      where: { id: ret.orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Luxury policy: Refund shipping if store fault or VIP
    const isStoreFault =
      ret.reason?.includes('[DAMAGED]') || ret.reason?.includes('[WRONG_ITEM]');
    const isVIP = ((ret as any).user?.loyaltyPoints || 0) >= 5000;

    const shippingRefundable =
      isStoreFault || isVIP ? Number(order.shippingFee || 0) : 0;

    const refundAmount = this.calculateRefundAmount(
      order.items,
      ret.items.map((ri) => ({
        variantId: ri.variantId,
        quantity: ri.quantity,
        qtyReceived: ri.qtyReceived,
      })),
      order.discountAmount,
      shippingRefundable,
    );

    if (refundAmount <= 0) {
      throw new BadRequestException('Số tiền hoàn trả phải lớn hơn 0');
    }

    // Role limit: Removing the STAFF_REFUND_LIMIT as Admin has already approved the return request at an earlier stage.
    // If we wanted to keep some sanity check, we could, but the user explicitly requested removal.

    // Gateway or manual - stub gateway for now (PayOS refund if available)
    const isGateway = dto.method === 'gateway';
    const method = isGateway
      ? 'GATEWAY'
      : dto.method === 'cash'
        ? 'CASH'
        : 'BANK_TRANSFER';
    let refundStatus: RefundStatus = RefundStatus.PROCESSING;
    let gatewayRefundId: string | null = null;

    if (isGateway) {
      // Stub - integrate with payments.service PayOS refund
      console.log('Gateway refund stub - would call PayOS refund here');
      // refundStatus = RefundStatus.SUCCESS; // simulate
      gatewayRefundId = `payos_ref_${Date.now()}`;
    } else {
      refundStatus = RefundStatus.SUCCESS;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Get latest refund if retrying (not just ret.refunds[0] which might be old)
      let attempts = 1;
      if (ret.status === ReturnStatus.REFUND_FAILED) {
        const latestRefund = await tx.refund.findFirst({
          where: { returnRequestId: id },
          orderBy: { createdAt: 'desc' },
        });
        attempts = (latestRefund?.attempts || 0) + 1;
      }

      const refund = await tx.refund.create({
        data: {
          returnRequestId: id,
          amount: refundAmount,
          method,
          transactionId: dto.transactionId || gatewayRefundId,
          status: refundStatus,
          note: dto.note,
          receiptImage: dto.receiptImage,
          attempts,
        },
      });

      const newStatus: ReturnStatus =
        refundStatus === RefundStatus.SUCCESS
          ? ReturnStatus.COMPLETED
          : isGateway
            ? ReturnStatus.REFUNDING
            : ReturnStatus.COMPLETED;
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status: newStatus,
          refundAmount,
        },
      });

      // Re-read order in transaction to ensure atomic update (avoid race condition)
      const currentOrder = await tx.order.findUnique({
        where: { id: ret.orderId },
      });
      if (!currentOrder)
        throw new NotFoundException('Order not found in refund transaction');

      const totalRefunded = currentOrder.refundAmount + refundAmount;
      const newPaymentStatus =
        totalRefunded >= currentOrder.finalAmount
          ? 'REFUNDED'
          : 'PARTIALLY_REFUNDED';

      await tx.order.update({
        where: { id: ret.orderId },
        data: {
          paymentStatus: newPaymentStatus,
          refundAmount: totalRefunded,
        },
      });

      await this.createAudit(tx, id, adminId, 'REFUND_TRIGGERED', {
        refundId: refund.id,
        amount: refundAmount,
        method: dto.method,
        gatewayRefundId,
        retry: ret.status === ReturnStatus.REFUND_FAILED,
      });

      // Record idempotency
      if (idempotencyKey) {
        await this.recordIdempotency(tx, id, idempotencyKey, 'refund', {
          dto,
          refundAmount,
          refundStatus,
        });
      }

      // Loyalty points reversal
      if (ret.userId && refundStatus === RefundStatus.SUCCESS) {
        const pointsToDeduct = Math.floor(refundAmount / 10000);
        if (pointsToDeduct > 0) {
          const orderRef = await tx.order.findUnique({
            where: { id: ret.orderId },
          });
          const orderCodeStr = orderRef?.code || 'unknown';
          await tx.loyaltyTransaction.create({
            data: {
              userId: ret.userId,
              points: -pointsToDeduct,
              reason: `Tru points do hoan tra don hang ${orderCodeStr}`,
            },
          });

          await tx.user.update({
            where: { id: ret.userId },
            data: { loyaltyPoints: { decrement: pointsToDeduct } },
          });
        }
      }

      // Stub retry queue
      if (
        (newStatus as ReturnStatus) === ReturnStatus.REFUND_FAILED ||
        newStatus === ReturnStatus.REFUNDING
      ) {
        console.log(
          `Retry queue stub: schedule refund retry for ${id} (attempts: ${refund.attempts})`,
        );
        // In production: bullmq/setTimeout queue
      }

      return { ...updated, refund };
    });

    // Notify
    if (ret.userId) {
      this.notificationsService
        .create({
          userId: ret.userId,
          type: 'ORDER',
          title:
            refundStatus === RefundStatus.SUCCESS
              ? 'Hoàn tiền thành công'
              : 'Hoàn tiền đang xử lý',
          content: `Đã hoàn (hoặc đang xử lý) ${refundAmount.toLocaleString('vi-VN')}đ.`,
          data: { returnRequestId: id, refundAmount },
        })
        .catch(() => {});
    }

    return result;
  }

  // ─────────── ADMIN: CANCEL ───────────

  async adminCancelReturn(adminId: string, id: string, reason?: string) {
    const ret = await this.findReturnOrThrow(id);

    const ADMIN_CANCELLABLE: ReturnStatus[] = [
      ReturnStatus.REQUESTED,
      ReturnStatus.AWAITING_CUSTOMER,
      ReturnStatus.REVIEWING,
      ReturnStatus.APPROVED,
    ];

    if (!ADMIN_CANCELLABLE.includes(ret.status)) {
      throw new BadRequestException(
        'Không thể hủy yêu cầu ở trạng thái hiện tại',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.CANCELLED, note: reason },
      });

      await this.createAudit(tx, id, adminId, 'ADMIN_CANCELLED', { reason });

      // Notify customer
      if (ret.userId) {
        this.notificationsService
          .create({
            userId: ret.userId,
            type: 'ORDER',
            title: 'Yêu cầu trả hàng bị hủy',
            content: `Yêu cầu trả hàng đã bị hủy bởi quản trị viên. ${reason || ''}`,
            data: { returnRequestId: id },
          })
          .catch(() => {});
      }

      return updated;
    });
  }

  // ─────────── ADMIN: LIST REFUNDS ───────────

  async listRefunds(returnId: string) {
    return this.prisma.refund.findMany({
      where: { returnRequestId: returnId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────── ADMIN: LIST AUDITS ───────────

  async listAudits(returnId: string) {
    return this.prisma.returnAudit.findMany({
      where: { returnId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
