const axios = require("axios");
const { sendEmail } = require("./emailService");

async function checkFireDetection() {
    try {
        const response = await axios.get(process.env.FIRE_API_URL);
        const result = response.data.status;  // Assume API returns {status: "fire" | "smoke" | "neutral"}

        console.log("🔥 Fire API Result:", result);

        if (result === "Fire") {
            await sendEmail("all", "🔥 Fire Detected!", "Fire detected! Please take action immediately!");
            require("./alarmService").playAlarm();
        } else if (result === "Smoke") {
            await sendEmail("admin", "⚠️ Smoke Detected!", "Smoke detected! Please investigate.");
        }
    } catch (error) {
        console.error("❌ Fire Detection Error:", error);
    }
}

module.exports = { checkFireDetection };
