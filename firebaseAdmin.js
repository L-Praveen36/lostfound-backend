const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG); // 👈 Load from env

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
