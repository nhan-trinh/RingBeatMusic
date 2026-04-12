import * as nodemailer from 'nodemailer';
import { env } from '../config/env';

class MailUtility {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,        // ← LUÔN LUÔN dùng 587 trên Render
      secure: false,    // ← false vì port 587 dùng STARTTLS, không phải SSL
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS, // App Password 16 ký tự
      },
      family: 4,
      tls: {
        rejectUnauthorized: false, // ← Thêm cái này để Render không reject
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    } as any);

    // Verify kết nối khi server khởi động
    this.transporter.verify((error) => {
      if (error) {
        console.error('[MailUtil] ❌ Kết nối SMTP thất bại:', error.message);
      } else {
        console.log('[MailUtil] ✅ SMTP Gmail sẵn sàng gửi mail');
      }
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      console.log(`[MailUtil] Đang gửi email tới ${to}...`);

      const info = await this.transporter.sendMail({
        from: `"RingBeat Music" <${env.SMTP_USER}>`, // Dùng SMTP_USER thay EMAIL_FROM cho chắc
        to,
        subject,
        text,
        html: html || text,
      });

      console.log(`[MailUtil] ✅ Gửi thành công! ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error(`[MailUtil] ❌ Gửi thất bại tới ${to}`);
      console.error(`  Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Response: ${error.response}`);
      return false;
    }
  }

  async sendOTP(email: string, otp: string, context: 'Đăng Ký' | 'Quên Mật Khẩu' = 'Đăng Ký'): Promise<boolean> {
    const subject = `[RingBeat Music] Mã OTP ${context}`;
    const text = `Mã OTP của bạn là: ${otp}. Vui lòng không chia sẻ mã này. Mã có hiệu lực 10 phút.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #1DB954; text-align: center;">RingBeat Music</h2>
        <p style="font-size: 16px;">Xin chào,</p>
        <p style="font-size: 16px;">Bạn vừa yêu cầu mã OTP cho thao tác: <strong>${context}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; background: #eee; padding: 10px 20px; border-radius: 4px; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #555;">Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        <p style="font-size: 14px; color: #555;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="text-align: center; font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} RingBeat Music.</p>
      </div>
    `;

    return this.sendEmail(email, subject, text, html);
  }
}

export const MailUtil = new MailUtility();