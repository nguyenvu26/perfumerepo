import {
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
export class PaymentsService {
  private payos: PayOS;
  private readonly payosReturnUrl: string;
  private readonly payosCancelUrl: string;

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

    if (!this.payosReturnUrl || !this.payosCancelUrl) {
      throw new InternalServerErrorException('PayOS URLs not configured');
    }
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

  async handlePayOSWebhook(webhookBody: any) {
    try {
      // Verify webhook signature
      const isValid = await this.payos.webhooks.verify(webhookBody);
      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const { code, orderCode, amount } = webhookBody;

      if (!orderCode) {
        throw new BadRequestException(
          'Invalid webhook data: missing orderCode',
        );
      }

      // Find payment by transactionId (orderCode)
      const payment = await this.prisma.payment.findFirst({
        where: {
          transactionId: orderCode.toString(),
        },
        include: {
          order: {
            include: { items: true },
          },
        },
      });

      if (!payment) {
        console.warn(`Payment not found for orderCode: ${orderCode}`);
        // Still return success to PayOS to prevent retry loops
        return { success: true, message: 'Payment not found' };
      }

      // Prevent processing already completed payments
      if (payment.status === PaymentStatus.PAID) {
        return { success: true, message: 'Payment already processed' };
      }

      // Determine payment status based on PayOS response code
      // PayOS code '00' means success
      const paymentStatus =
        code === '00' ? PaymentStatus.PAID : PaymentStatus.FAILED;

      // Update payment and order in transaction
      await this.prisma.$transaction(async (tx) => {
        // Update payment record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentStatus,
            providerRawData: JSON.stringify({
              ...JSON.parse(payment.providerRawData || '{}'),
              payosWebhook: webhookBody,
            }),
          },
        });

        // Update order status if payment succeeded
        if (paymentStatus === PaymentStatus.PAID) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              status: 'CONFIRMED',
            },
          });
        } else {
          // Payment failed
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: PaymentStatus.FAILED,
              status: 'CANCELLED',
            },
          });
        }
      });

      if (paymentStatus === PaymentStatus.PAID) {
        try {
          await this.shippingService.createGhnShipment(payment.orderId);
        } catch (e) {
          console.warn('GHN shipment creation failed:', e?.message);
        }
      }

      console.log(
        `Payment ${payment.id} processed successfully with status: ${paymentStatus}`,
      );
      return { success: true, message: 'Payment processed' };
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
}
