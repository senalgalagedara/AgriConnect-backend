import { Router } from 'express';
import * as CheckoutController from '../controllers/CheckoutController';

const router = Router();

// GET /:userId -> returns { cart, totals, contact, shipping }
router.get('/:userId', CheckoutController.getCheckoutForUser);

export default router;
