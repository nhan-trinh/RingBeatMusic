import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { createPaymentUrl, verifyVNPaySignature, formatVNPayDate } from './vnpay.helper';
import { env } from '../../shared/config/env';
import { SubscriptionPlan } from '@prisma/client';

// Bảng giá (VND × 100 vì VNPAY nhân thêm 100)
const PLAN_PRICES: Record<string, number> = {
  PREMIUM_INDIVIDUAL: 59000 * 100,
  PREMIUM_DUO: 89000 * 100,
  PREMIUM_FAMILY: 119000 * 100,
  PREMIUM_STUDENT: 29500 * 100,
};

const PLAN_LABEL: Record<string, string> = {
  PREMIUM_INDIVIDUAL: 'Premium Individual (1 tháng)',
  PREMIUM_DUO: 'Premium Duo (1 tháng)',
  PREMIUM_FAMILY: 'Premium Family (1 tháng)',
  PREMIUM_STUDENT: 'Premium Student (1 tháng)',
};

export const SubscriptionService = {
  getPlans: () => {
    return Object.entries(PLAN_PRICES).map(([plan, priceRaw]) => ({
      plan,
      label: PLAN_LABEL[plan],
      price: priceRaw / 100,
      currency: 'VND',
    }));
  },

  getMySubscription: async (userId: string) => {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      take: 5,
    });
    return { ...sub, invoices };
  },

  createCheckout: async (userId: string, plan: string, req: Request) => {
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing && existing.status === 'ACTIVE') {
      throw new AppError('Bạn đã có gói Premium đang hoạt động', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const amount = PLAN_PRICES[plan];
    if (!amount) throw new AppError('Gói dịch vụ không hợp lệ', 400, ErrorCodes.VALIDATION_ERROR);

    const idempotencyKey = uuidv4();
    const txnRef = idempotencyKey.replace(/-/g, '').slice(0, 20);

    await prisma.payment.create({
      data: {
        userId,
        amount: amount / 100,
        status: 'PENDING',
        plan: plan as SubscriptionPlan,
        idempotencyKey,
        vnpayTxnRef: txnRef,
      },
    });

    const ipAddr =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const paymentUrl = createPaymentUrl({
      vnp_Amount: amount,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan ${PLAN_LABEL[plan]}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: `${env.BACKEND_URL}/api/v1/subscription/vnpay/callback`,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVNPayDate(new Date()),
    });

    return { paymentUrl, txnRef };
  },

  handleWebhook: async (params: Record<string, string>) => {
    const isValid = verifyVNPaySignature(params);
    if (!isValid) throw new AppError('Chữ ký VNPAY không hợp lệ', 400, ErrorCodes.VALIDATION_ERROR);

    const { vnp_TxnRef, vnp_ResponseCode, vnp_Amount } = params;

    const payment = await prisma.payment.findFirst({ where: { vnpayTxnRef: vnp_TxnRef } });
    if (!payment) throw new AppError('Không tìm thấy giao dịch', 404, ErrorCodes.NOT_FOUND);

    if (payment.status !== 'PENDING') {
      return { message: 'Giao dịch đã được xử lý' };
    }

    if (vnp_ResponseCode === '00') {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', paidAt: new Date(), vnpayResponseCode: vnp_ResponseCode },
        }),
        prisma.subscription.upsert({
          where: { userId: payment.userId },
          update: {
            status: 'ACTIVE',
            plan: payment.plan,
            endDate,
            autoRenew: true,
          },
          create: {
            userId: payment.userId,
            status: 'ACTIVE',
            plan: payment.plan,
            startDate: new Date(),
            endDate,
            autoRenew: true,
          },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: { role: 'USER_PREMIUM' },
        }),
        prisma.invoice.create({
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            amount: Number(vnp_Amount) / 100,
            plan: payment.plan,
          },
        }),
      ]);

      // TODO: BullMQ → gửi email xác nhận
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', vnpayResponseCode: vnp_ResponseCode },
      });
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  },

  handleCallback: (params: Record<string, string>) => {
    const isValid = verifyVNPaySignature(params);
    return {
      success: isValid && params['vnp_ResponseCode'] === '00',
      responseCode: params['vnp_ResponseCode'],
      txnRef: params['vnp_TxnRef'],
      amount: params['vnp_Amount'] ? Number(params['vnp_Amount']) / 100 : 0,
    };
  },

  cancelAutoRenew: async (userId: string) => {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub || sub.status !== 'ACTIVE') {
      throw new AppError('Không có gói đang hoạt động', 404, ErrorCodes.NOT_FOUND);
    }
    await prisma.subscription.update({
      where: { userId },
      data: { autoRenew: false },
    });
    return { message: 'Đã tắt tự động gia hạn. Gói sẽ hết vào cuối kỳ.' };
  },

  getInvoices: async (userId: string) => {
    return await prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  },

  getInvoiceById: async (userId: string, invoiceId: string) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
    if (!invoice) throw new AppError('Hóa đơn không tồn tại', 404, ErrorCodes.NOT_FOUND);
    return invoice;
  },
};
