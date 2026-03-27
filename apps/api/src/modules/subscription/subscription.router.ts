import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { checkoutSchema } from './subscription.schema';

export const subscriptionRouter = Router();

// Public — không cần đăng nhập
subscriptionRouter.get('/plans', subscriptionController.getPlans);
subscriptionRouter.get('/vnpay/callback', subscriptionController.handleCallback);
subscriptionRouter.post('/vnpay/webhook', subscriptionController.handleWebhook);

// Protected
subscriptionRouter.use(authMiddleware);
subscriptionRouter.get('/me', subscriptionController.getMySubscription);
subscriptionRouter.post('/checkout', validateRequest(checkoutSchema), subscriptionController.createCheckout);
subscriptionRouter.post('/cancel', subscriptionController.cancelAutoRenew);
subscriptionRouter.get('/invoices', subscriptionController.getInvoices);
subscriptionRouter.get('/invoices/:id', subscriptionController.getInvoiceById);
