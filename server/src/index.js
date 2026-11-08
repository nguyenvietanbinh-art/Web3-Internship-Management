const config = require("./config/env");
const mongoose = require("mongoose");
const { connectionOptions, verifyIndexes, verifyDatabaseIdentity } = require('./services/databaseSafety');
const databaseOptions = connectionOptions(process.env, config.mongoUri);
// Set defaults before importing modules that register models; buffered init must not
// queue collection/index writes against a non-TEST database.
mongoose.set('autoIndex', databaseOptions.autoIndex);
mongoose.set('autoCreate', databaseOptions.autoCreate);
const { createApp } = require("./app");
const { startChainListener } = require("./services/chainListener");

// Fail-fast nếu thiếu JWT_SECRET (getter ném lỗi).
config.jwtSecret;

const app = createApp();

mongoose
  .connect(config.mongoUri, databaseOptions)
  .then(async () => {
    await verifyDatabaseIdentity();
    if (process.env.NODE_ENV === 'test') await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    await verifyIndexes(config.coreBusinessEnabled);
    console.log("Connected to MongoDB successfully!");
    app.listen(config.port, config.host, () => console.log(`Backend Server running on ${config.host}:${config.port}`));
    if (config.chainListenerEnabled) startChainListener().catch((err) => console.warn("Lỗi khởi động chain listener:", err.message));
  })
  .catch((err) => {
    console.error("Backend startup failed:", err.code === 'INDEX_REVIEW_REQUIRED' ? err.message : err.name);
    process.exit(1);
  });
