import {
  OnModuleDestroy,
  OnModuleInit,
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { PayOS } from '@payos/node';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private payos: PayOS;
  private readonly payosReturnUrl: string;
  private readonly payosCancelUrl: string;
  private pollTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private isCleaningUp = false;
  private readonly pollIntervalMs: number;
  private readonly pollBatchSize: number;
  private readonly pollConcurrency: number;
  private readonly pendingTimeoutMinutes: number;
  private readonly cleanupIntervalMs: number;
  private readonly enableVerbosePollingLog: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly shippingService: ShippingService,
  ) {
    const clientId = this.config.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.config.get<string>('PAYOS_API_KEY');
    const checksumKey = this.config.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      throw new InternalServerErrorException(
        'PayOS credentials not configured',
      );
    }

    this.payos = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });

    this.payosReturnUrl = this.config.get<string>('PAYOS_RETURN_URL') || '';
    this.payosCancelUrl = this.config.get<string>('PAYOS_CANCEL_URL') || '';
    this.pollIntervalMs = Number(
      this.config.get<string>('PAYOS_FALLBACK_INTERVAL_MS') || 30000,
    );
    this.pollBatchSize = Number(
      this.config.get<string>('PAYOS_POLL_BATCH_SIZE') || 20,
    );
    this.pollConcurrency = Number(
      this.config.get<string>('PAYOS_POLL_CONCURRENCY') || 5,
    );
    this.pendingTimeoutMinutes = Number(
      this.config.get<string>('ORDER_PAYMENT_TTL_MINUTES') || 10,
    );
    this.cleanupIntervalMs = Number(
      this.config.get<string>('PAYOS_CLEANUP_INTERVAL_MS') || 600000,
    );
    this.enableVerbosePollingLog =
      (this.config.get<string>('PAYOS_VERBOSE_POLLING_LOG') || 'true') ===
      'true';

    if (!this.payosReturnUrl || !this.payosCancelUrl) {
      throw new InternalServerErrorException('PayOS URLs not configured');
    }
  }

  onModuleInit() {
    this.pollTimer = setInterval(() => {
      void this.runPendingPaymentPolling();
    }, this.pollIntervalMs);

    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredPendingOrders();
    }, this.cleanupIntervalMs);
  }

  onModuleDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async createPayOSPaymentLink(
    orderId: string,
    orderCode: number,
    amount: number,
    items?: any[],
  ) {
    try {
      // Validate inputs
      if (!orderId || !orderCode || !amount || amount <= 0) {
        throw new BadRequestException('Invalid payment parameters');
      }

      const paymentData = {
        orderCode,
        amount: Math.round(amount), // PayOS requires integer amounts
        description: 'Thanh toan DH', // Max 25 characters for PayOS
        returnUrl: `${this.payosReturnUrl}?orderId=${orderId}&orderCode=${orderCode}`,
        cancelUrl: `${this.payosCancelUrl}?orderId=${orderId}&orderCode=${orderCode}`,
        items: items?.map((item) => ({
          name: item.product?.name || item.name || 'Product',
          quantity: item.quantity || 1,
          price: Math.round(item.unitPrice || item.price || 0),
        })),
        buyerEmail: '',
        buyerName: 'Customer',
        buyerPhone: '',
        buyerAddress: '',
      };

      const response = await this.payos.paymentRequests.create(paymentData);

      // PayOS qrCode is raw data, convert to proper format if needed
      const qrCodeValue = response.qrCode || '';

      // If qrCode is raw QRIP data (starts with 00020101), encode it as SVG or data URL
      if (qrCodeValue && qrCodeValue.startsWith('00020101')) {
        // This is raw QRIP data, need to generate QR code image
        // For now, return the raw data and let frontend handle it
        // Or you can use a library to generate SVG
        console.warn(
          'QR code in raw QRIP format, may need additional processing',
        );
      }

      // Create payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          provider: PaymentProvider.PAYOS,
          amount: Math.round(amount),
          status: PaymentStatus.PENDING,
          transactionId: orderCode.toString(),
          providerRawData: JSON.stringify(response),
        },
        include: { order: true },
      });

      return {
        paymentId: payment.id,
        checkoutUrl: response.checkoutUrl,
        qrCode: response.qrCode,
        accountName: response.accountName,
        accountNumber: response.accountNumber,
        amount: response.amount,
        description: response.description,
        orderCode: response.orderCode,
      };
    } catch (error: any) {
      console.error('PayOS payment creation error:', error);
      const errorMessage = error.message || 'Failed to create payment';
      throw new BadRequestException(`Payment creation failed: ${errorMessage}`);
    }
  }

  private extractWebhookData(webhookBody: any): {
    orderCode?: string;
    statusCode?: string;
    rawData: any;
  } {
    const data = webhookBody?.data ?? webhookBody ?? {};
    const orderCode = data?.orderCode ?? data?.order_code ?? webhookBody?.orderCode;
    const statusCode = data?.code ?? webhookBody?.code ?? data?.status;
    return {
      orderCode: orderCode?.toString(),
      statusCode: statusCode?.toString(),
      rawData: data,
    };
  }

  private mapPayOSStatus(
    statusCode?: string,
  ): PaymentStatus | 'PENDING' | 'UNKNOWN' {
    const normalized = (statusCode || '').toUpperCase();
    if (normalized === '00' || normalized === 'PAID' || normalized === 'SUCCESS')
      return PaymentStatus.PAID;
    if (
      normalized === 'FAILED' ||
      normalized === 'FAIL' ||
      normalized === 'CANCELLED' ||
      normalized === 'EXPIRED'
    )
      return PaymentStatus.FAILED;
    if (
      normalized === 'PENDING' ||
      normalized === 'PROCESSING' ||
      normalized === ''
    )
      return 'PENDING';
    return 'UNKNOWN';
  }

  private async finalizePaymentByOrderCode(params: {
    orderCode: string;
    statusCode?: string;
    rawPayload?: any;
    source: 'webhook' | 'sync';
  }) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        transactionId: params.orderCode,
        provider: PaymentProvider.PAYOS,
      },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return { success: true, message: 'Payment not found' };
    }

    const nextStatus = this.mapPayOSStatus(params.statusCode);
    if (nextStatus === 'PENDING' || nextStatus === 'UNKNOWN') {
      if (this.enableVerbosePollingLog) {
        console.log(
          `[PAYOS][${params.source}] skip finalize for orderCode=${params.orderCode}, status=${params.statusCode ?? 'N/A'}`,
        );
      }
      return { success: true, message: 'Payment not finalized yet' };
    }
    if (payment.status === PaymentStatus.PAID) {
      return { success: true, message: 'Payment already processed' };
    }

    await this.prisma.$transaction(async (tx) => {
      const previousRaw = payment.providerRawData
        ? JSON.parse(payment.providerRawData)
        : {};

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          providerRawData: JSON.stringify({
            ...previousRaw,
            lastSyncSource: params.source,
            lastSyncedAt: new Date().toISOString(),
            lastPayload: params.rawPayload ?? null,
            mappedStatus: nextStatus,
          }),
        },
      });

      if (nextStatus === PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: 'CONFIRMED',
          },
        });
      } else if (payment.status !== PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            status: 'CANCELLED',
          },
        });
      }
    });

    // GHN shipment creation is now triggered manually via admin interface

    return { success: true, message: 'Payment finalized' };
  }

  async handlePayOSWebhook(webhookBody: any) {
    try {
      // Verify webhook signature
      const isValid = await this.payos.webhooks.verify(webhookBody);
      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const { orderCode, statusCode, rawData } = this.extractWebhookData(webhookBody);
      if (!orderCode) {
        throw new BadRequestException(
          'Invalid webhook data: missing orderCode',
        );
      }
      return this.finalizePaymentByOrderCode({
        orderCode,
        statusCode,
        rawPayload: rawData,
        source: 'webhook',
      });
    } catch (error: any) {
      console.error('Webhook handling error:', error);
      throw new BadRequestException(
        error.message || 'Webhook verification failed',
      );
    }
  }

  async getPaymentById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentByOrderId(orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      include: {
        order: {
          include: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payment;
  }

  async verifyAndSyncPaymentStatus(orderId: string) {
    // 1. Find the latest payment for this order
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, provider: PaymentProvider.PAYOS },
      orderBy: { createdAt: 'desc' },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('No PayOS payment record found for this order');
    }

    // 2. If already PAID, no need to sync
    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    try {
      // 3. Query PayOS API for actual status using transactionId (orderCode)
      if (!payment.transactionId) {
        throw new BadRequestException('Payment transaction ID (orderCode) is missing');
      }

      const payosInfo = await this.payos.paymentRequests.get(
        parseInt(payment.transactionId, 10),
      );
      await this.finalizePaymentByOrderCode({
        orderCode: payment.transactionId,
        statusCode: payosInfo?.status,
        rawPayload: payosInfo,
        source: 'sync',
      });
      return this.getPaymentById(payment.id);
    } catch (error) {
      console.error('PayOS Sync Error:', error);
      return payment;
    }
  }

  private async runPendingPaymentPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    const pollStartedAt = new Date();
    try {
      if (this.enableVerbosePollingLog) {
        console.log(
          `[PAYOS][poll] tick start at=${pollStartedAt.toISOString()} intervalMs=${this.pollIntervalMs} batch=${this.pollBatchSize} concurrency=${this.pollConcurrency}`,
        );
      }
      const timeoutThreshold = new Date(
        Date.now() - this.pendingTimeoutMinutes * 60 * 1000,
      );
      const pendingPayments = await this.prisma.payment.findMany({
        where: {
          provider: PaymentProvider.PAYOS,
          status: PaymentStatus.PENDING,
          order: {
            paymentStatus: PaymentStatus.PENDING,
            createdAt: { gte: timeoutThreshold },
          },
        },
        include: { order: true },
        orderBy: { createdAt: 'asc' },
        take: this.pollBatchSize,
      });
      if (this.enableVerbosePollingLog) {
        console.log(
          `[PAYOS][poll] fetched pending payments count=${pendingPayments.length} timeoutMin=${this.pendingTimeoutMinutes}`,
        );
      }

      const queue = [...pendingPayments];
      const workerCount = Math.max(1, this.pollConcurrency);
      let successCount = 0;
      let failedCount = 0;
      const workers = Array.from({ length: workerCount }).map(async () => {
        while (queue.length > 0) {
          const payment = queue.shift();
          if (!payment?.transactionId) continue;
          try {
            if (this.enableVerbosePollingLog) {
              console.log(
                `[PAYOS][poll] checking paymentId=${payment.id} orderId=${payment.orderId} orderCode=${payment.transactionId}`,
              );
            }
            const payosInfo = await this.payos.paymentRequests.get(
              parseInt(payment.transactionId, 10),
            );
            if (this.enableVerbosePollingLog) {
              console.log(
                `[PAYOS][poll] payos response paymentId=${payment.id} status=${payosInfo?.status ?? 'N/A'}`,
              );
            }
            await this.finalizePaymentByOrderCode({
              orderCode: payment.transactionId,
              statusCode: payosInfo?.status,
              rawPayload: payosInfo,
              source: 'sync',
            });
            successCount += 1;
          } catch (e: any) {
            failedCount += 1;
            console.warn(
              `PayOS polling failed for payment ${payment.id}: ${e?.message}`,
            );
          }
        }
      });
      await Promise.all(workers);
      if (this.enableVerbosePollingLog) {
        console.log(
          `[PAYOS][poll] tick done checked=${pendingPayments.length} success=${successCount} failed=${failedCount}`,
        );
      }
    } finally {
      this.isPolling = false;
    }
  }

  private async cleanupExpiredPendingOrders() {
    if (this.isCleaningUp) return;
    this.isCleaningUp = true;
    try {
      const timeoutThreshold = new Date(
        Date.now() - this.pendingTimeoutMinutes * 60 * 1000,
      );
      const expiredOrders = await this.prisma.order.findMany({
        where: {
          channel: 'ONLINE',
          status: 'PENDING',
          paymentStatus: PaymentStatus.PENDING,
          createdAt: { lt: timeoutThreshold },
          shipments: { none: {} },
          payments: {
            some: {
              provider: PaymentProvider.PAYOS,
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: {
          payments: {
            where: {
              provider: PaymentProvider.PAYOS,
              status: PaymentStatus.PENDING,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        take: Math.max(10, this.pollBatchSize),
      });

      for (const order of expiredOrders) {
        const latestPayment = order.payments[0];
        if (latestPayment?.transactionId) {
          try {
            const payosInfo = await this.payos.paymentRequests.get(
              parseInt(latestPayment.transactionId, 10),
            );
            if ((payosInfo?.status || '').toUpperCase() === 'PAID') {
              await this.finalizePaymentByOrderCode({
                orderCode: latestPayment.transactionId,
                statusCode: payosInfo?.status,
                rawPayload: payosInfo,
                source: 'sync',
              });
              continue;
            }
          } catch {
            // Keep going with timeout cancellation below
          }
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: PaymentStatus.FAILED,
            },
          });
          await tx.payment.updateMany({
            where: {
              orderId: order.id,
              provider: PaymentProvider.PAYOS,
              status: PaymentStatus.PENDING,
            },
            data: { status: PaymentStatus.FAILED },
          });
        });
      }
    } finally {
      this.isCleaningUp = false;
    }
  }
}
