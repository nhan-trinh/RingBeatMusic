import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createReportSchema } from './report.schema';

const reportRouter = Router();

// Tất cả các role (trừ ADMIN không cần) đều được phép report
reportRouter.post(
  '/',
  authenticate,
  validateRequest(createReportSchema),
  ReportController.create
);

export { reportRouter };
