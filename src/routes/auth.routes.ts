/**
 * Auth Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import { AuthController } from '@/controllers';
import { validateBody } from '@/middlewares/validation.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { registerValidation, loginValidation, updateProfileValidation } from '@/validations/auth.validation';

const router = Router();

router.post('/register', validateBody(registerValidation), AuthController.register);
router.post('/login', validateBody(loginValidation), AuthController.login);
router.get('/profile', authenticate, AuthController.getProfile);
router.patch('/profile', authenticate, validateBody(updateProfileValidation), AuthController.updateProfile);

export default router;
