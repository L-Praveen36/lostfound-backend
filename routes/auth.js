const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const upload = require("../utils/cloudinary");
const Otp = require("../models/Otp");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const admin = require("../firebaseAdmin");

// ✅ Check how email is registered
router.post("/check-email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await admin.auth().getUserByEmail(email);
    const providers = user.providerData.map(p => p.providerId);
    const hasPassword = providers.includes("password");

    const primaryProvider = providers.includes("google.com") ? "google" : hasPassword ? "password" : providers[0];

    res.json({
      exists: true,
      provider: primaryProvider,
      hasPassword,
    });
  } catch (err) {
    res.json({ exists: false });
  }
});

// ✅ Allow Google users to set a password
router.post("/create-password", verifyFirebaseToken, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ message: "Password is required" });

  try {
    const userRecord = await admin.auth().getUser(req.user.uid);
    const provider = userRecord.providerData[0]?.providerId;

    if (provider !== "google.com") {
      return res.status(400).json({ message: "Only Google accounts can create a password this way." });
    }

    await admin.auth().updateUser(req.user.uid, {
      password: newPassword,
    });

    res.json({ message: "Password created successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to create password." });
  }
});

// ✅ Send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  try {
    await Otp.findOneAndDelete({ email });
    await Otp.create({ email, otp, expiresAt });

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
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    // Optional: rate limit by IP/email/session
    const otp = generateOtp(); // Your logic
    await saveOtpToDB(email, otp); // Update DB or memory
    await sendOtpEmail(email, otp); // Your email sending logic

    res.status(200).json({ message: "OTP sent" });
  } catch (err) {
    console.error("Failed to resend OTP:", err);
    res.status(500).json({ message: "Could not resend OTP" });
  }
});

// ✅ Verify OTP
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
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Upload Profile Picture to Cloudinary
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
