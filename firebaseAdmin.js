const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk.json"); // ✅ Make sure this path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
