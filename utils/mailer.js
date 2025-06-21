// mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure transporter using Gmail SMTP with App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,        // Your Gmail address
    pass: process.env.EMAIL_PASS         // Your Gmail App Password (not account password)
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
    const info = await transporter.sendMail({
      from: `"Lost & Found" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }

};

module.exports = sendNotification;
