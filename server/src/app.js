const express = require("express");
const path = require('node:path');
const fs = require('node:fs');
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./config/env");
const { HttpError } = require('./utils/http');
const { notFound, errorHandler } = require("./middleware/errorHandler");

/** Tạo Express app (không listen) để test import trực tiếp. */
function createApp(options = {}) {
  const app = express();
  // Render terminates TLS in front of this process. Limit trust to its immediate proxy.
  if (process.env.APP_ENV === 'CLOUD_DEMO') app.set('trust proxy', 1);
  if(options.googleVerifier){
    require('./config/testDatabaseGuard').assertTestEnvironment({nodeEnv:process.env.NODE_ENV,uri:config.mongoUri,allowlistedUri:process.env.MONGODB_URI_TEST_ALLOWLIST});
    app.locals.googleVerifier=options.googleVerifier;
  }
  const origins = config.corsOrigin.split(',').map(s => s.trim()).filter(s => s && s !== '*');
  app.use(cors({ credentials:true, origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    callback(new HttpError(403, 'Origin không được phép', 'CORS_DENIED'));
  } }));
  app.use(express.json({ limit: "1mb" }));
  const authAttempts = new Map();
  app.use('/api/auth', (req, res, next) => {
    if (req.method !== 'POST') return next();
    const now = Date.now(), key = req.ip;
    for (const [ip, value] of authAttempts) if (value.until <= now) authAttempts.delete(ip);
    const bucket = authAttempts.get(key) || { count: 0, until: now + 60000 };
    bucket.count += 1; authAttempts.set(key, bucket);
    if (bucket.count > config.authRateLimit) {
      res.set('Retry-After', String(Math.ceil((bucket.until - now) / 1000)));
      return next(new HttpError(429, 'Thử lại sau ít phút', 'RATE_LIMITED'));
    }
    next();
  });

  app.use('/api/auth', require('./routes/walletIdentity.routes'));
  app.use('/api/auth', require('./routes/email.routes'));
  app.use('/api/auth', require('./routes/google.routes').router);
  app.use("/api/auth", require("./routes/auth.routes"));
  const legacyOnly=(req,_res,next)=>config.userIdBusiness && !(req.method==='GET'&&req.originalUrl.startsWith('/api/internship/certificate/'))?next(new HttpError(410,'Sử dụng API nghiệp vụ User ID của hệ thống thống nhất','LEGACY_ROUTE_DISABLED')):next();
  app.use("/api/topics", legacyOnly, require("./routes/topic.routes"));
  app.use("/api/data", legacyOnly, require("./routes/data.routes"));
  app.use("/api/internship", legacyOnly, require("./routes/internship.routes"));
  app.get('/api/core/capabilities', (_req,res)=>res.json({enabled:config.coreBusinessEnabled,authentication:config.userIdBusiness?'user-id':'wallet',unified:config.userIdBusiness,schoolWorkflow:config.schoolWorkflowEnabled,environment:process.env.NODE_ENV==='test'?'practice':'standard'}));
  if(config.coreBusinessEnabled) app.use('/api/core',require('./core'));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "online",
      dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      ipfsConfigured: Boolean(config.pinataJwt),
      demoEnabled: config.demoMode,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (_req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({ ready: mongoose.connection.readyState === 1 }));

  app.use("/api", notFound);
  if (process.env.SERVE_CLIENT === 'true') {
    const directory = path.resolve(__dirname, '../../client/dist');
    if (!fs.existsSync(path.join(directory, 'index.html'))) throw Error('Frontend build missing');
    app.use(express.static(directory));
    app.get('*', (_req, res) => res.sendFile(path.join(directory, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
