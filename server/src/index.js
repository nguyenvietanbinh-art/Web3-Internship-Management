const config = require("./config/env");
const mongoose = require("mongoose");
const { createApp } = require("./app");
const { startChainListener } = require("./services/chainListener");

// Fail-fast nếu thiếu JWT_SECRET (getter ném lỗi).
config.jwtSecret;

const app = createApp();

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    startChainListener().catch((err) => console.warn("Lỗi khởi động chain listener:", err.message));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

app.listen(config.port, () => console.log(`Backend Server running on port ${config.port}`));
