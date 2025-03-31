// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Get JWT_SECRET and MONGO_URI from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "87fc898c2cfd0345e75ad3a3f24f2507b53f4913fc340521d2aae0e403c5fef6";
const MONGO_URI = process.env.MONGO_URI ||"mongodb+srv://User1:ELZxNOZWSLLF6eZx@cluster0.hv37n7o.mongodb.net/fire_detection_db?retryWrites=true&w=majority&appName=Cluster0";

// ✅ Define the User Schema and Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

// ✅ MongoDB Connection
mongoose.connect("mongodb+srv://User1:ELZxNOZWSLLF6eZx@cluster0.hv37n7o.mongodb.net/fire_detection_db?retryWrites=true&w=majority&appName=Cluster0 ")
    .then(() => {
        console.log("🔥 MongoDB Connected!");
        console.log("Connected to database:", mongoose.connection.db.databaseName); // Log the database name
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Middleware to verify JWT
const tokenMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return res.status(401).json({ message: "Access Denied: No token provided" });
    }
    try {
        const token = authHeader.split(" ")[1]; // Extract token
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
};

// ✅ Signup API (Register a new user)
app.post("/api/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        console.log(`✅ New user registered: ${email}`);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Login API
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        console.log(`✅ User logged in: ${email}`);
        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Protected Route: Get User Profile
app.get("/api/profile", tokenMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Default Route
app.get("/", (req, res) => {
    res.send("🚀 Fire Detection Backend is Running!");
});


// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
