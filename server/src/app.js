const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");

/** Tạo Express app (không listen) để test import trực tiếp. */
function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/auth", require("./routes/auth.routes"));
  app.use("/api/topics", require("./routes/topic.routes"));
  app.use("/api/data", require("./routes/data.routes"));
  app.use("/api/internship", require("./routes/internship.routes"));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "online",
      dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      ipfsConfigured: Boolean(config.pinataJwt),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
