const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const emailService = require("./emailService");
const sound = require("sound-play");
const path = require("path");

let lastDetection = "Neutral"; // Track last detection
let isChecking = false;        // Prevent overlapping checks

// 🔥 Fire detection checker
async function checkFireDetection() {
    if (isChecking) return; // Skip if already running
    isChecking = true;

    try {
        const imagePath = path.join(__dirname, "test_fire.jpeg");

        const formData = new FormData();
        formData.append("file", fs.createReadStream(imagePath));

        const response = await axios.post(
            "https://fireapi-nzfe.onrender.com/predict/",
            formData,
            { headers: formData.getHeaders() }
        );

        const result = response.data.prediction;
        console.log("🔥 Fire Detection Result:", result);

        switch (result) {
            case "Fire":
                if (lastDetection !== "Fire") {
                    console.log("🚨 Fire detected! Sending alerts...");
                    await emailService.sendToAllUsers(
                        "🚨 Fire Alert!",
                        "A fire has been detected!"
                    );
                    sound.play(path.join(__dirname, "../public/fire_alarm.mp3"));
                    lastDetection = "Fire";
                }
                break;

            case "Smoke":
                if (lastDetection !== "Smoke") {
                    console.log("💨 Smoke detected! Notifying admin...");
                    await emailService.sendToAdmin(
                        "⚠ Smoke Warning!",
                        "Smoke detected, please check."
                    );
                    lastDetection = "Smoke";
                }
                break;

            case "Neutral":
                if (lastDetection !== "Neutral") {
                    console.log("✅ All clear. No fire detected.");
                    lastDetection = "Neutral";
                }
                break;

            default:
                console.warn("⚠ Unexpected detection result:", result);
        }
    } catch (error) {
        if (error.response) {
            console.error("❌ API Error:", error.response.status, error.response.data);
        } else {
            console.error("❌ Error:", error.message);
        }
    } finally {
        isChecking = false; // Allow next check
    }
}

// 🔄 Start monitoring loop
function startMonitoring() {
    console.log("🚀 Fire detection monitoring started...");
    setInterval(checkFireDetection, 10000); // every 10 seconds
}

module.exports = { startMonitoring };