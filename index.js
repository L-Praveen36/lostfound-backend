require("dotenv").config();
const upload = require("./utils/cloudinary");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const verifyToken = require('./middlewares/verifyToken');
const Item = require("./models/Item");

const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendNotification = require("./utils/mailer");

// CORS configuration for production
app.use(cors({
  origin: ['http://localhost:3000', 'https://lostfound-api.netlify.app'],
  credentials: true
}));

app.use(express.json());
console.log("DEBUG MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Test route
app.get("/", (req, res) => {
  res.send("Lost & Found API running!");
});

// -----------------------------
// 🔐 Admin Auth Routes
// -----------------------------
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});


// POST /api/items - Submit new item


app.post("/api/items", upload.single("image"), async (req, res) => {
  try {
    const {
  title,
  description,
  category,
  type,
  location,
  date,
  contactInfo,
  submittedBy
} = req.body;

    const imageUrl = req.file ? req.file.path : "";

     if (!title || !description || !location || !type || !contactInfo) {
  return res.status(400).json({ message: "Missing required fields" });
}


    const newItem = new Item({
  title,
  description,
  category,
  type,
  location,
  date,
  contactInfo,
  submittedBy,
  status: "pending", // if moderation flow
  image: imageUrl,
  submittedAt: new Date()
});


    await newItem.save();

    // 🔔 Check for matches if item is "found"
    if (type === "found") {
      const matchingLostItems = await Item.find({
        status: "lost",
        resolved: { $ne: true },
        location: { $regex: location, $options: "i" },
        title: { $regex: title, $options: "i" }
      });

      for (const match of matchingLostItems) {
        if (match.contact) {
          await sendNotification(
            match.contact,
            "🎉 Your Lost Item Might Be Found!",
            `Someone reported a found item that might match your lost item: "${title}" in "${location}". Please check the Lost & Found portal to verify.`
          );
        }
      }
    }

    res.status(201).json({ message: "Item saved!", item: newItem });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});



// GET /api/items - Get approved items only (public)
app.get("/api/items", async (req, res) => {
  try {
    const { type, location, category, search } = req.query;
    let filter = { status: 'approved' }; // Only show approved items

    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const items = await Item.find(filter).sort({ submittedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Item.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Admin routes
app.get("/api/admin/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ submittedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/items/:id/moderate",verifyToken, async (req, res) => {
  try {
    const { status, moderatorName } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status,
        moderatedBy: moderatorName || 'Admin',
        moderatedAt: new Date()
      },
      { new: true }
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark item as resolved
app.put("/api/admin/items/:id/resolve",verifyToken,async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories for dropdown
app.get("/api/categories",verifyToken, async (req, res) => {
  try {
    const categories = await Item.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
