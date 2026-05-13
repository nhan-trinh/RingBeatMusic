/**
 * SessionUtil — Tập hợp các helper thuần (pure/near-pure) cho Session Management.
 *
 * Design principles:
 *  - Mỗi hàm có 1 trách nhiệm duy nhất (SRP)
 *  - Không có side-effect ngoài những gì được khai báo rõ ràng
 *  - Dễ mock và unit-test độc lập với Prisma/Redis
 */

import { createHash } from 'crypto';
import { randomBytes } from 'crypto';
import { UAParser } from 'ua-parser-js';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** Giới hạn số session active tối đa trên mỗi tài khoản */
export const MAX_SESSIONS_PER_USER = 5;

/** Thời hạn sống của Refresh Token (ngày) */
export const REFRESH_TOKEN_TTL_DAYS = 30;

// ──────────────────────────────────────────────
// Token Helpers
// ──────────────────────────────────────────────

/**
 * Tạo một Refresh Token ngẫu nhiên dạng Opaque (64 bytes hex).
 * Đây là chuỗi thô sẽ được gửi vào cookie HttpOnly.
 * KHÔNG bao giờ lưu chuỗi này vào DB.
 */
export function generateOpaqueToken(): string {
  return randomBytes(64).toString('hex');
}

/**
 * Hash một token bằng SHA-256.
 * Đây là giá trị được lưu vào cột `tokenHash` trong DB.
 * Nếu DB bị leak, attacker không thể đảo ngược thành token gốc.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Tính ngày hết hạn cho một session mới.
 */
export function getSessionExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

// ──────────────────────────────────────────────
// User-Agent Parser
// ──────────────────────────────────────────────

export interface DeviceInfo {
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
}

/**
 * Phân tích User-Agent string thành các thông tin thiết bị có thể đọc được.
 * Fallback an toàn về 'Unknown' nếu UA không hợp lệ.
 */
export function parseUserAgent(userAgent?: string): DeviceInfo {
  if (!userAgent) {
    return {
      deviceName: 'Unknown Device',
      deviceType: 'unknown',
      os: 'Unknown OS',
      browser: 'Unknown Browser',
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const osName = result.os.name ?? 'Unknown OS';
  const osVersion = result.os.version ?? '';
  const browserName = result.browser.name ?? 'Unknown Browser';
  const browserVersion = result.browser.major ?? '';

  const os = osVersion ? `${osName} ${osVersion}` : osName;
  const browser = browserVersion ? `${browserName} ${browserVersion}` : browserName;
  const deviceName = `${browser} on ${os}`;

  // ua-parser-js: device.type là 'mobile' | 'tablet' | 'smarttv' | ... hoặc undefined (= desktop)
  const rawType = result.device.type;
  const deviceType: DeviceInfo['deviceType'] =
    rawType === 'mobile' ? 'mobile' :
    rawType === 'tablet' ? 'tablet' :
    rawType === undefined ? 'desktop' : 'unknown';

  return { deviceName, deviceType, os, browser };
}

// ──────────────────────────────────────────────
// IP Address Helper
// ──────────────────────────────────────────────

/**
 * Trích xuất IP thực của client từ request.
 * Xử lý trường hợp đứng sau proxy/load balancer (X-Forwarded-For).
 */
export function getClientIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }
  return req.ip ?? 'Unknown';
}
