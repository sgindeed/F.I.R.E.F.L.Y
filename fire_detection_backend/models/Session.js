const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    loginAt: { type: Date, default: Date.now },
    logoutAt: { type: Date }
});

const Session = mongoose.model("Session", SessionSchema);
module.exports = Session;
