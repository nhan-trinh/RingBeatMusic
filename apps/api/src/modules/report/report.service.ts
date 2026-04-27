import { prisma } from '../../shared/config/database';
import { redis } from '../../shared/config/redis';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { ReportType, ReportReason } from '@prisma/client';

const MAX_REPORTS_PER_DAY = 10;

export const ReportService = {
  createReport: async (userId: string, data: { targetId: string; targetType: ReportType; reason: ReportReason; description?: string }) => {
    const { targetId, targetType, reason, description } = data;

    // 1. Check Rate Limit (Redis)
    const today = new Date().toISOString().split('T')[0];
    const rateLimitKey = `report_limit:${userId}:${today}`;
    const reportCount = await redis.get(rateLimitKey);

    if (reportCount && parseInt(reportCount) >= MAX_REPORTS_PER_DAY) {
      throw new AppError('Bạn đã đạt giới hạn báo cáo trong ngày (tối đa 10). Vui lòng quay lại sau.', 429, ErrorCodes.BAD_REQUEST);
    }

    // 2. Prepare Data for Prisma
    const reportData: any = {
      reportedBy: userId,
      targetType,
      reason,
      description,
    };

    if (targetType === 'SONG') reportData.songId = targetId;
    if (targetType === 'PLAYLIST') reportData.playlistId = targetId;
    if (targetType === 'USER') reportData.targetUserId = targetId;

    // 3. Create Report (Prisma unique constraint handles duplicates automatically)
    try {
      const report = await prisma.report.create({
        data: reportData,
      });

      // 4. Increment Rate Limit
      if (!reportCount) {
        await redis.set(rateLimitKey, '1', 'EX', 86400); // 1 day
      } else {
        await redis.incr(rateLimitKey);
      }

      return report;
    } catch (error: any) {
      // P2002 is Prisma error code for Unique Constraint Violation
      if (error.code === 'P2002') {
        throw new AppError('Bạn đã báo cáo nội dung này rồi. Chúng tôi đang xem xét.', 400, ErrorCodes.BAD_REQUEST);
      }
      throw error;
    }
  },
};
