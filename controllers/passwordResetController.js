import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';
import { generatePasswordResetToken } from '../utils/helpers.js';
import env from '../config/env.js';

// @desc    Request password reset (send email with token)
// @route   POST /api/password-reset/forgot
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // For security, always send a generic success message even if user not found
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken();
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 3600000; // Token valid for 1 hour
  await user.save();

  // Create reset URL (frontend URL)
  const resetUrl = `${env.FRONTEND_URL}/reset-password/${resetToken}`; // Assuming frontend has a /reset-password/:token route

  const emailHtml = `
    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <p>This link is valid for 1 hour.</p>
  `;

  try {
    await sendEmail(user.email, 'Password Reset Request for BazzarNet', 'Please use the link to reset your password.', emailHtml);
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(500);
    throw new Error('Error sending password reset email. Please try again later.');
  }
});

// @desc    Reset password with token
// @route   POST /api/password-reset/reset/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }, // Token must not be expired
  });

  if (!user) {
    res.status(400);
    throw new Error('Password reset token is invalid or has expired.');
  }

  user.password = password; // Mongoose pre-save hook will hash this
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
});

export { forgotPassword, resetPassword };