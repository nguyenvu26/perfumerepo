import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (!host || !user || !pass) {
            console.warn('SMTP configuration is missing. Emails will not be sent.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: { user, pass },
        });
    }

    async sendMail(to: string, subject: string, html: string) {
        const from = this.configService.get<string>('SMTP_FROM') || '"Perfume Sales" <no-reply@perfumesales.com>';

        try {
            const info = await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
            });
            console.log('Message sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            // In development, don't throw error to allow testing the flow without valid SMTP
            if (process.env.NODE_ENV === 'production') {
                throw error;
            }
        }
    }

    async sendPasswordResetMail(email: string, resetLink: string) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password for Perfume Sales.</p>
        <p>Please click the link below to set a new password. This link is valid for 1 hour.</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">Perfume Sales House - Archival Essences</p>
      </div>
    `;
        return this.sendMail(email, 'Reset Your Password - Perfume Sales', html);
    }

    async sendVerificationMail(email: string, verificationLink: string) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Welcome to Perfume Sales! Please verify your email by clicking the link below.</p>
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p>This link is valid for 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">Perfume Sales House - Archival Essences</p>
      </div>
    `;
        return this.sendMail(email, 'Verify Your Email - Perfume Sales', html);
    }

    async sendOrderConfirmationMail(email: string, userName: string, orderCode: string, totalAmount: number) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Xác nhận đơn hàng</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại <strong>PerfumeGPT</strong>. Đơn hàng của bạn đã được tiếp nhận và đang trong quá trình xử lý.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> ${orderCode}</p>
          <p style="margin: 5px 0;"><strong>Tổng thanh toán:</strong> ${totalAmount.toLocaleString('vi-VN')} VND</p>
        </div>
        <p>Chúng tôi sẽ thông báo cho bạn ngay khi đơn hàng được gửi đi.</p>
        <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với bộ phận chăm sóc khách hàng của chúng tôi.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
    `;
        return this.sendMail(email, `Xác nhận đơn hàng ${orderCode} - PerfumeGPT`, html);
    }

    async sendOrderStatusUpdateMail(email: string, userName: string, orderCode: string, statusLabel: string) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333 text-align: center;">Cập nhật trạng thái đơn hàng</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Đơn hàng <strong>${orderCode}</strong> của bạn vừa có cập nhật mới:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
          <p style="font-size: 18px; color: #000; margin: 0;">Trạng thái: <strong>${statusLabel.toUpperCase()}</strong></p>
        </div>
        <p>Bạn có thể theo dõi tiến độ đơn hàng tại trang cá nhân trên website của chúng tôi.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
    `;
        return this.sendMail(email, `Cập nhật đơn hàng ${orderCode} - PerfumeGPT`, html);
    }

    async sendPromotionMail(email: string, userName: string, promoCode: string, description: string) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; background-color: #fffaf0;">
        <h2 style="color: #d4af37; text-align: center;">Quà tặng dành riêng cho bạn!</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Bạn vừa nhận được một mã giảm giá đặc biệt từ <strong>PerfumeGPT</strong>:</p>
        <div style="border: 2px dashed #d4af37; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; background-color: #fff;">
          <p style="font-size: 24px; font-weight: bold; color: #d4af37; margin: 0;">${promoCode}</p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">${description}</p>
        </div>
        <p>Hãy sử dụng mã này trong lần mua hàng tới để nhận ưu đãi nhé!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
    `;
        return this.sendMail(email, `Ưu đãi mới dành cho bạn: ${promoCode} - PerfumeGPT`, html);
    }

    async sendRefundConfirmationMail(email: string, userName: string, orderCode: string, amount: number) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Hoàn tiền thành công</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p><strong>PerfumeGPT</strong> đã hoàn tất việc chuyển khoản hoàn tiền cho đơn hàng của bạn:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
          <p style="font-size: 18px; color: #000; margin: 0;">Mã đơn hàng: <strong>${orderCode}</strong></p>
          <p style="font-size: 18px; color: #d4af37; margin: 10px 0;">Số tiền: <strong>${amount.toLocaleString('vi-VN')} VND</strong></p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">Trạng thái: <strong>ĐÃ HOÀN TIỀN</strong></p>
        </div>
        <p>Quý khách vui lòng kiểm tra chi tiết đơn hàng để xem biên lai chuyển khoản và đối chiếu thông tin tài khoản.</p>
        <p>Hy vọng sớm được phục vụ bạn với những mùi hương tinh tế khác.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
    `;
        return this.sendMail(email, `Hoàn tiền thành công đơn hàng ${orderCode} - PerfumeGPT`, html);
    }

    async sendReturnApprovedMail(email: string, userName: string, orderCode: string) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #2E7D32; text-align: center;">Yêu cầu trả hàng đã được chấp thuận</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Yêu cầu trả hàng cho đơn hàng <strong>${orderCode}</strong> đã được đội ngũ chuyên gia của <strong>PerfumeGPT</strong> xem xét và chấp thuận.</p>
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Các bước tiếp theo:</strong></p>
            <ul>
                <li>Đóng gói sản phẩm cẩn thận (bao gồm quà tặng kèm nếu có).</li>
                <li>Shipper từ GHN sẽ liên hệ với bạn để lấy hàng (nếu chọn thu hồi tự động).</li>
                <li>Hoặc gửi về Showroom theo địa chỉ trong ứng dụng.</li>
            </ul>
        </div>
        <p>Vui lòng theo dõi hành trình trả hàng tại mục "Đơn hàng của tôi" trên ứng dụng.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
    `;
        return this.sendMail(email, `Yêu cầu trả hàng ${orderCode} đã được duyệt - PerfumeGPT`, html);
    }

    async sendReturnRejectedMail(email: string, userName: string, orderCode: string, reason: string) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #C62828; text-align: center;">Phản hồi về yêu cầu trả hàng</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Chúng tôi đã xem xét yêu cầu trả hàng cho đơn hàng <strong>${orderCode}</strong> của bạn.</p>
        <p>Rất tiếc, yêu cầu này hiện tại <strong>chưa thể được chấp thuận</strong> với lý do:</p>
        <div style="background-color: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #C62828; margin: 0;"><strong>Lý do từ chối:</strong> ${reason}</p>
        </div>
        <p>Bạn có thể kiểm tra chi tiết phản hồi hoặc liên hệ với bộ phận hỗ trợ nếu cần thêm thông tin.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
    `;
        return this.sendMail(email, `Phản hồi yêu cầu trả hàng ${orderCode} - PerfumeGPT`, html);
    }

    async sendReturnRejectedAfterReceiptMail(email: string, userName: string, orderCode: string) {
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #C62828; text-align: center;">Thông báo kiểm tra hàng hoàn trả</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Chúng tôi đã nhận và tiến hành kiểm tra kỹ lưỡng các sản phẩm hoàn trả của đơn hàng <strong>${orderCode}</strong>.</p>
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <p>Rất tiếc, chúng tôi không thể tiến hành hoàn tiền do sản phẩm <strong>không đáp ứng đủ điều kiện nhập kho</strong> (mất seal, hư hại hoặc không còn nguyên vẹn).</p>
        </div>
        <p>Chúng tôi sẽ tiến hành <strong>gửi trả lại sản phẩm</strong> này cho bạn qua đơn vị vận chuyển. Quý khách vui lòng kiểm tra ứng dụng để theo dõi mã vận đơn mới.</p>
        <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với bộ phận CSKH để được hỗ trợ.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
    `;
        return this.sendMail(email, `Cập nhật quan trọng về đơn hàng hoàn trả ${orderCode} - PerfumeGPT`, html);
    }
}
