import asyncHandler from "express-async-handler";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

/* =========================
   HELPERS
========================= */

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });
};

// Send JWT as HTTP-only cookie
const sendTokenResponse = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
  });

  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =========================
   REGISTER (NORMAL)
========================= */
export const registerWithOtp = asyncHandler(async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!name || !email || !password || !otp) {
    res.status(400);
    throw new Error("All fields + OTP are required");
  }

  const isValid = verifyOtp(email, otp);
  if (!isValid) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password });

  deleteOtp(email); // remove used OTP

  sendTokenResponse(res, user, 201);
});

/* =========================
   LOGIN (NORMAL)
========================= */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password required");
  }

  const user = await User.findOne({ email }).select("+password +failedLoginAttempts +lockUntil");

  if (!user || user.googleId) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60); // minutes
    res.status(403);
    throw new Error(`Account locked. Try again after ${remaining} minutes`);
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    user.failedLoginAttempts += 1;

    // Warning at 2 failed attempts
    if (user.failedLoginAttempts === 2) {
      await user.save();
      return res.status(429).json({ message: "Warning: 1 attempt left before account lock!" });
    }

    // Lock at 3 failed attempts
    if (user.failedLoginAttempts >= 3) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      user.failedLoginAttempts = 0; // reset
    }

    await user.save();
    res.status(401);
    throw new Error("Invalid credentials");
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  sendTokenResponse(res, user);
});


/* =========================
   GOOGLE AUTH
========================= */
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error("Google token missing");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name } = payload;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
    });
  }

  sendTokenResponse(res, user);
});

/* =========================
   LOGOUT
========================= */
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Get current logged-in user
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});


export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select(
    "+passwordResetOTP +passwordResetExpire +otpAttempts"
  );

  if (!user) {
    res.status(404);
    throw new Error("No user found with this email");
  }

  // Generate OTP using model method
  const otp = user.generatePasswordResetOTP();
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is ${otp}. Valid for 10 minutes.`,
  });

  res.json({
    success: true,
    message: "OTP sent to email",
  });
});


export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error("Email, OTP and new password are required");
  }

  const user = await User.findOne({ email }).select(
    "+passwordResetOTP +passwordResetExpire +otpAttempts"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check OTP expiry
  if (!user.passwordResetExpire || user.passwordResetExpire < Date.now()) {
    res.status(400);
    throw new Error("OTP expired");
  }

  // Limit OTP attempts
  if (user.otpAttempts >= 3) {
    res.status(403);
    throw new Error("Too many wrong attempts. Please request new OTP");
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  if (hashedOtp !== user.passwordResetOTP) {
    user.otpAttempts += 1;
    await user.save();
    res.status(400);
    throw new Error("Invalid OTP");
  }

  // OTP valid → reset password
  user.password = newPassword;
  user.passwordResetOTP = undefined;
  user.passwordResetExpire = undefined;
  user.otpAttempts = 0;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  await user.save();

  sendTokenResponse(res, user);
});



