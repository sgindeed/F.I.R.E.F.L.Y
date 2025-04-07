require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Models
const Session = require("./models/Session.js");
const Video = require("./models/video.js");

// Optional fireAlarm module if you have real-time fire detection
const fireAlarm = require("./fireAlarm");

// Express App Init
const app = express();
app.use(express.json());
app.use(cors());

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "87fc898c2cfd0345e75ad3a3f24f2507b53f4913fc340521d2aae0e403c5fef6";
const MONGO_URI = process.env.MONGO_URI;

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected!");
        console.log("Connected to database:", mongoose.connection.name);
    })
    .catch(err => console.error(" MongoDB Connection Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

//  JWT Middleware
const tokenMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ message: "Access Denied: No token provided" });
    try {
        const token = authHeader.split(" ")[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
};

// Auth Routes
app.post("/api/signup", async (req, res) => {
    try {
        let { name, email, password } = req.body;
        name = name.trim();
        email = email.trim().toLowerCase();
        password = password.trim();

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { userId: user._id, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        const session = new Session({
            userId: user._id,
            token: token,
            loginAt: new Date()
        });
        await session.save();

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.post("/api/logout", async (req, res) => {
    try {
        const {token} = req.body;

        const deletedSession = await Session.deleteOne({ token });
        if (deletedSession.deletedCount === 0) {
            return res.status(400).json({ error: "Session not found" });
        }

        return res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("❌ Logout Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


// Protected Profile Route
app.get("/api/profile", tokenMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//  Fire Detection Prediction API
app.post("/predict", async (req, res) => {
    try {
        const { inputData } = req.body;
        if (!inputData) {
            return res.status(400).json({ error: "Missing inputData in request" });
        }

        const prediction = "Fire Detected"; // Replace with ML model call
        res.json({ message: "Prediction successful", result: prediction });
    } catch (error) {
        console.error("❌ Error during prediction:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//  Video Upload Route
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/api/upload-video", upload.single("video"), async (req, res) => {
    try {
        const video = new Video({
            videoData: req.file.buffer,
            contentType: req.file.mimetype
        });

        await video.save();
        res.status(201).json({ message: "Video uploaded successfully!" });
    } catch (error) {
        console.error("❌ Video Upload Error:", error);
        res.status(500).json({ message: "Failed to upload video" });
    }
});
// Fire Detection Monitoring (if applicable)
if (fireAlarm && fireAlarm.startMonitoring) {
    fireAlarm.startMonitoring();
}

// Default Route
app.get("/", (req, res) => {
    res.send("🚀 Fire Detection Backend is Running!");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
