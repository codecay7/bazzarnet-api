import express from 'express';
import { forgotPassword, resetPassword } from '../controllers/passwordResetController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/passwordResetValidator.js';

const router = express.Router();

// Public routes for password reset
router.post('/forgot', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset/:token', validate(resetPasswordSchema), resetPassword);

export default router;