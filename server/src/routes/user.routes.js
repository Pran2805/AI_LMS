import express from "express";
import {
  registerWithOtp,
  loginUser,
  googleAuth,
  logoutUser,
  getMe,
  forgotPassword,
  resetPasswordWithOtp,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { sendOtp } from "../controllers/otp.controller.js";

import {
  loginLimiter,
  otpLimiter,
  forgotPasswordLimiter,
} from "../middlewares/rateLimit.middleware.js";


const router = express.Router();

/*
 @route   POST /api/users/send-otp
 @desc    Send OTP for registration
 @access  Public
*/
router.post("/send-otp",otpLimiter, sendOtp);

/*
 @route   POST /api/users/register
 @desc    Register user using OTP
 @access  Public
*/
router.post("/register", registerWithOtp);

/*
 @route   POST /api/users/login
 @desc    Login user
 @access  Public
*/
router.post("/login",loginLimiter, loginUser);

/*
 @route   POST /api/users/google
 @desc    Google OAuth
 @access  Public
*/
router.post("/google", googleAuth);

/*
 @route   POST /api/users/logout
 @desc    Logout user
 @access  Private
*/
router.post("/logout", logoutUser);

/*
 @route   GET /api/users/me
 @desc    Get logged-in user
 @access  Private
*/
router.get("/me", protect, getMe);

/*
 @route   POST /api/users/forgot-password
 @desc    Send OTP for password reset
 @access  Public
*/
router.post("/forgot-password",forgotPasswordLimiter, forgotPassword);

/*
 @route   POST /api/users/reset-password
 @desc    Reset password using OTP
 @access  Public
*/
router.post("/reset-password", resetPasswordWithOtp);

export default router;
