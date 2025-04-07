// models/Video.js (create this file)

const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
    videoData: Buffer, // Store video as binary data (optional: store as base64 if needed)
    contentType: String, // e.g., "video/webm"
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Video", videoSchema);
