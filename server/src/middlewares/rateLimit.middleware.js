import rateLimit from "express-rate-limit";

/* =========================
   LOGIN RATE LIMITER
========================= */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================
   OTP RATE LIMITER
========================= */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 10 minutes.",
  },
});

/* =========================
   FORGOT PASSWORD LIMITER
========================= */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: "Too many reset attempts. Try again after 1 hour.",
  },
});
