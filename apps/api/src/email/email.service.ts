import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.getOrThrow<string>('SMTP_FROM'),
        to: email,
        subject: 'Verify your email address',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6">
            <h2>Email Verification</h2>
            <p>Your one-time verification code is:</p>
            <div style="
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 4px;
              margin: 16px 0;
            ">
              ${otp}
            </div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
            <hr />
            <small>Family Tree Maker</small>
          </div>
        `,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
