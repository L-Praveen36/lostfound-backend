const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sendNotification = require('../utils/mailer');
const Otp = require('../models/Otp'); // ✅ Import OTP model

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ✅ Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  try {
    // ✅ Remove any old OTPs for this email
    await Otp.deleteMany({ email });

    // ✅ Save new OTP
    await new Otp({ email, otp, expiresAt }).save();

    // ✅ Send mail
    await sendNotification(email, "🔐 Your OTP for Login", `Your OTP is: ${otp}\nIt is valid for 5 minutes.`);
    res.status(200).json({ message: "OTP sent" });
  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ✅ Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const record = await Otp.findOne({ email, otp });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ Delete OTP after use
    await Otp.deleteMany({ email });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

module.exports = router;
