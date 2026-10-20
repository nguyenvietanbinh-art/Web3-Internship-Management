require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth.routes");
const topicRoutes = require("./routes/topic.routes");
const dataRoutes = require("./routes/data.routes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/web3_internship";

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/data", dataRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully!");
  })
  .catch((err) => {
    console.warn("MongoDB connection notice:", err.message);
    console.warn("Server is running. Please configure MongoDB Atlas in .env (MONGODB_URI) or start local mongod.");
  });

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
