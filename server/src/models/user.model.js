import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      select: false,
    },

    googleId: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* ===== Login Protection ===== */
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    /* ===== OTP Password Reset ===== */
    passwordResetOTP: {
      type: String,
      select: false,
    },

    passwordResetExpire: {
      type: Date,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* =========================
   HASH PASSWORD
========================= */
userSchema.pre("save", async function () {
  if (!this.isModified("password") || this.googleId) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* =========================
   MATCH PASSWORD
========================= */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* =========================
   GENERATE OTP
========================= */
userSchema.methods.generatePasswordResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  this.passwordResetOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.otpAttempts = 0;

  return otp;
};

const User = mongoose.model("User", userSchema);
export default User;
