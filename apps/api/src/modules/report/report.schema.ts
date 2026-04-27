import { z } from 'zod';
import { ReportType, ReportReason } from '@prisma/client';

export const createReportSchema = z.object({
  body: z.object({
    targetId: z.string().uuid('ID không hợp lệ'),
    targetType: z.nativeEnum(ReportType, {
      errorMap: () => ({ message: 'Loại nội dung báo cáo không hợp lệ' }),
    }),
    reason: z.nativeEnum(ReportReason, {
      errorMap: () => ({ message: 'Lý do báo cáo không hợp lệ' }),
    }),
    description: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
  }),
});
