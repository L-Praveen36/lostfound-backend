// backend/routes/report.js
const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken"); // Correct path

router.post("/submit", verifyFirebaseToken, async (req, res) => {
  const { email, uid, name, picture } = req.user;

  console.log("✅ Firebase Authenticated User:", { email, uid, name, picture });

  // You can now use these details to create or link a user in your DB, or track submissions

  res.status(200).json({
    message: "Report submitted successfully",
    user: { email, uid, name, picture }
  });
});

module.exports = router;
