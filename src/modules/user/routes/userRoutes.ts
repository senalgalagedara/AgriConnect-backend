import { Router } from 'express';
import * as UserController from '../controllers/UserController';

const router = Router();

router.get('/', UserController.getAllUsers);

export default router;
