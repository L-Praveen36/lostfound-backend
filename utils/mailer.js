const nodemailer = require('nodemailer');
require('dotenv').config();

// ✅ Configure transporter using Gmail SMTP and App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,       // Your Gmail address (e.g., lostfound.app@gmail.com)
    pass: process.env.EMAIL_PASS        // App password (not account password)
  }
});

// ✅ Optional: verify transporter connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter verification failed:", error.message);
  } else {
    console.log("✅ Email transporter is ready to send emails");
  }
});

/**
 * Send a plain text email notification
 * @param {string} to - Recipient's email address
 * @param {string} subject - Subject of the email
 * @param {string} text - Plain text body of the email
 */
const sendNotification = async (to, subject, text) => {
  try {
    if (!to || !/\S+@\S+\.\S+/.test(to)) {
      console.warn(`⚠️ Invalid email skipped: "${to}"`);
      return;
    }

    const info = await transporter.sendMail({
      from: `"Lost & Found Alerts" <lunavathpraveen36@gmail.com>`,
      to,
      subject: "Lost & Found Match Notification",
      text
    });

    console.log(`📨 Email sent to ${to}: Message ID: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
};

module.exports = sendNotification;
