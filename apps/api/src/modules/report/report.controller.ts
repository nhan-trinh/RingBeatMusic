import { Request, Response } from 'express';
import { ReportService } from './report.service';

export const ReportController = {
  create: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const report = await ReportService.createReport(userId, req.body);
    
    res.status(201).json({
      message: 'Báo cáo của bạn đã được gửi thành công. Cảm ơn bạn đã góp phần xây dựng cộng đồng!',
      data: report
    });
  },
};
