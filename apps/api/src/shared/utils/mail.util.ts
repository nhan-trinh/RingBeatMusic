import { Resend } from 'resend';
import { env } from '../config/env';

class MailUtility {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  /**
   * Gửi Email bằng Resend
   */
  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      console.log(`[MailUtil] BẮT ĐẦU xử lý gửi Email tới > ${to} qua máy chủ Resend...`);
      
      const { data, error } = await this.resend.emails.send({
        from: `"RingBeat Music" <${env.EMAIL_FROM}>`,
        to: [to],
        subject,
        text,
        html: html || text,
      });

      if (error) {
         console.error(`[MailUtil] Resend API trả về lỗi:`, error);
         return false;
      }

      console.log(`[MailUtil] THÀNH CÔNG! Email đã bay tới ${to}. ID: ${data?.id}`);
      return true;
    } catch (error) {
      console.error(`[MailUtil] LỖI CỰC ĐỘ khi gửi tới ${to}:`, error);
      return false;
    }
  }

  /**
   * Layout gửi OTP chung
   */
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
        <p style="font-size: 14px; color: #555;">Vui lòng nhập mã này vào hệ thống để tiếp tục. Mã chỉ có hiệu lực trong <strong>10 phút</strong>.</p>
        <p style="font-size: 14px; color: #555;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="text-align: center; font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} RingBeat Music.</p>
      </div>
    `;

    return this.sendEmail(email, subject, text, html);
  }
}

export const MailUtil = new MailUtility();
