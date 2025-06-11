require("dotenv").config();
const upload = require("./utils/cloudinary");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const Item = require("./models/Item");

const app = express();

// CORS configuration for production
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-netlify-app.netlify.app'],
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

// POST /api/items - Submit new item
const sendNotification = require("./utils/mailer");

app.post("/api/items", upload.single("image"), async (req, res) => {
  try {
    const { title, description, location, status, contact } = req.body;
    const imageUrl = req.file ? req.file.path : "";

    const newItem = new Item({
      title,
      description,
      location,
      status,
      contact,
      image: imageUrl
    });

    await newItem.save();

    // 🔔 Check for matches if item is "found"
    if (status === "found") {
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

// Admin routes
app.get("/api/admin/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ submittedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/items/:id/moderate", async (req, res) => {
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
app.put("/api/admin/items/:id/resolve", async (req, res) => {
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
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Item.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
