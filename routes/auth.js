// routes/auth.js
const express = require("express");
const router = express.Router();
const upload = require("../utils/cloudinary");
const otpStore = {}; // For demo only – use Redis or DB in production
const nodemailer = require("nodemailer");

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min expiry

  // Replace with your mailer config
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Lost & Found" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your verification code is: ${otp}`,
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ message: "No OTP sent" });
  if (Date.now() > record.expiresAt)
    return res.status(400).json({ message: "OTP expired" });

  if (record.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  delete otpStore[email]; // Invalidate OTP after success
  res.json({ message: "OTP verified" });
});

// Profile image upload route
router.post("/upload-profile", upload.single("profile"), async (req, res) => {
  try {
    const url = req.file?.path;
    if (!url) return res.status(400).json({ message: "No file uploaded" });
    res.status(200).json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
