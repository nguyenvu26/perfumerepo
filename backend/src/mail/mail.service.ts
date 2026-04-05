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
}
