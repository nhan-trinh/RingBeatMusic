import { randomInt } from 'crypto';

export const OtpUtil = {
  /**
   * Tạo chuỗi số ngẫu nhiên 6 chữ số
   */
  generateNumeric: (): string => {
    const otp = randomInt(100000, 999999).toString();
    return otp;
  },
};
