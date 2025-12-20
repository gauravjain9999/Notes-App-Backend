const crypto = require("crypto");
const Otp = require("../models/otp.model");
const nodemailer = require("nodemailer");

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendOtp(email) {
  const otpCode = generateOtp();

  await Otp.create({ email, otp: otpCode });

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.EMAIL_USER}`,
      pass: process.env.TWO_FACTOR_APP_PASSWORD
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP connection failed:', error.message);
    } else {
      console.log('✅ SMTP connection successful, ready to send emails.');
    }
  });

  await transporter.sendMail({
    from: '"SmartNotes" gauravjain0931@gmail.com',
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otpCode}. It will expire in 5 minutes.`,
  });

  return otpCode;
}

async function verifyOtp(email, otp) {
  const record = await Otp.findOne({ email, otp });
  if (!record) return { success: false, message: "Invalid OTP" };
  return { success: true, message: "OTP verified successfully" };
}

module.exports = { sendOtp, verifyOtp };
