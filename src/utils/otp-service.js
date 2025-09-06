const crypto = require("crypto");
const Otp = require("../models/otp");
const nodemailer = require("nodemailer");

// Generate random 6-digit OTP
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP via Email
async function sendOtp(email) {
  const otpCode = generateOtp();

  // Save OTP in DB
  await Otp.create({ email, otp: otpCode });

  // Configure mailer (use Gmail / Mailtrap / etc.)
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.EMAIL_USER}`,
      pass: process.env.TWO_FACTOR_APP_PASSWORD
    },
  });

  await transporter.sendMail({
    from: '"SmartNotes" gauravjain0931@gmail.com',
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otpCode}. It will expire in 5 minutes.`,
  });

  return otpCode; // for testing (remove in production)
}

// Verify OTP
async function verifyOtp(email, otp) {
  const record = await Otp.findOne({ email, otp });
  console.log(email, otp);

  if (!record) return { success: false, message: "Invalid OTP" };

  return { success: true, message: "OTP verified successfully" };
}

module.exports = { sendOtp, verifyOtp };
