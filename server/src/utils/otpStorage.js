const otpStorage = {}; // key = email, value = { otp, expires }

export const setOtp = (email, otp, expiresInMs = 5 * 60 * 1000) => {
  otpStorage[email] = { otp, expires: Date.now() + expiresInMs };
};

export const verifyOtp = (email, otp) => {
  const record = otpStorage[email];
  if (!record) return false;
  if (record.expires < Date.now()) return false;
  return record.otp === otp;
};

export const deleteOtp = (email) => {
  delete otpStorage[email];
};
