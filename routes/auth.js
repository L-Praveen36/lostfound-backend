// routes/auth.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const upload = require("../utils/cloudinary");
const Otp = require("../models/Otp");

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  try {
    // Remove old OTPs for the email
    await Otp.findOneAndDelete({ email });

    // Save new OTP
    await Otp.create({ email, otp, expiresAt });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Lost & Found" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your verification code is: ${otp}`,
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await Otp.findOne({ email });

    if (!record) return res.status(400).json({ message: "No OTP sent" });
    if (new Date() > record.expiresAt)
      return res.status(400).json({ message: "OTP expired" });

    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    await Otp.deleteOne({ email });
    res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Optional: Upload profile picture to Cloudinary
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
