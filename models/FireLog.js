const mongoose = require("mongoose");

const fireLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    location: { type: String, required: true },
    cameraId: { type: String },
    detectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const FireLog = mongoose.model("FireLog", fireLogSchema);
module.exports = FireLog;
