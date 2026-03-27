import crypto from 'crypto';
import { env } from '../../shared/config/env';

const sortObject = (obj: Record<string, string | number | undefined>) => {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') {
      sorted[key] = encodeURIComponent(String(val)).replace(/%20/g, '+');
    }
  }
  return sorted;
};

export interface CreatePaymentParams {
  vnp_Amount: number;
  vnp_TxnRef: string;
  vnp_OrderInfo: string;
  vnp_OrderType?: string;
  vnp_ReturnUrl: string;
  vnp_IpAddr: string;
  vnp_CreateDate: string;
}

export const createPaymentUrl = (params: CreatePaymentParams): string => {
  const vnpUrl = env.VNPAY_URL ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  const raw: Record<string, string | number | undefined> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: env.VNPAY_TMN_CODE ?? '',
    vnp_Amount: params.vnp_Amount,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.vnp_TxnRef,
    vnp_OrderInfo: params.vnp_OrderInfo,
    vnp_OrderType: params.vnp_OrderType ?? 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: params.vnp_ReturnUrl,
    vnp_IpAddr: params.vnp_IpAddr,
    vnp_CreateDate: params.vnp_CreateDate,
  };

  const sorted = sortObject(raw);
  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const secret = env.VNPAY_HASH_SECRET ?? '';
  const hmac = crypto.createHmac('sha512', secret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const qs = new URLSearchParams(sorted as Record<string, string>);
  qs.append('vnp_SecureHash', signed);

  return `${vnpUrl}?${qs.toString()}`;
};

export const verifyVNPaySignature = (params: Record<string, string>): boolean => {
  const secureHash = params['vnp_SecureHash'];
  if (!secureHash) return false;

  const filtered: Record<string, string> = { ...params };
  delete filtered['vnp_SecureHash'];
  delete filtered['vnp_SecureHashType'];

  const sorted = sortObject(filtered);
  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const secret = env.VNPAY_HASH_SECRET ?? '';
  const hmac = crypto.createHmac('sha512', secret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return signed === secureHash;
};

export const formatVNPayDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}${mo}${d}${h}${mi}${s}`;
};
