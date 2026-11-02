// Helper dùng chung cho test: app thật + MongoDB thật (DB riêng) + ví ethers thật ký nonce.
const crypto = require('node:crypto');
const { testUriFromEnvironment, assertTestEnvironment } = require('./testEnvironment');
process.env.MONGODB_URI = testUriFromEnvironment();
// The base URI was authorized above; now allowlist the exact derived child used
// by runtime Web3 guards too. This never admits root/demo or broad URI patterns.
process.env.MONGODB_URI_TEST_ALLOWLIST = process.env.MONGODB_URI;
assertTestEnvironment({nodeEnv:process.env.NODE_ENV,uri:process.env.MONGODB_URI,allowlistedUri:process.env.MONGODB_URI_TEST_ALLOWLIST});
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.CHAIN_LISTENER_ENABLED = 'false';
process.env.CHAIN_VERIFICATION_ENABLED = 'false';
process.env.DEMO_MODE = 'false';
process.env.PINATA_JWT = ''; // Prevent dotenv from loading a real credential.
process.env.CORS_ORIGIN = 'http://127.0.0.1:5175';
process.env.AI_SERVICE_URL = process.env.AI_SERVICE_URL_TEST || 'http://127.0.0.1:8001';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.AI_SERVICE_URL)) throw new Error('Test AI service must use loopback');

const mongoose = require("mongoose");
const { MongoClient } = require('mongodb');
const { ethers } = require("ethers");
const { createApp } = require("../src/app");

let server;
let base;

async function start(options) {
  const probe = new MongoClient(process.env.MONGODB_URI);
  try {
    await probe.connect();
    if ((await probe.db().listCollections().toArray()).length) throw new Error('Refuse to reuse a nonempty test database');
  } finally { await probe.close(); }
  const app = createApp(options); // Register every enabled model before awaiting index readiness.
  await mongoose.connect(process.env.MONGODB_URI);
  if (mongoose.connection.name !== new URL(process.env.MONGODB_URI).pathname.slice(1)) throw new Error('Connected test database mismatch');
  console.log('TEST_DB_VERIFIED ' + mongoose.connection.name);
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
}

async function stop() {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Đăng nhập bằng ví thật: xin nonce → ký → nhận JWT. */
async function loginAs(role, name, wallet = ethers.Wallet.createRandom()) {
  const nonce = await api("POST", "/auth/nonce", { body: { walletAddress: wallet.address } });
  const signature = await wallet.signMessage(nonce.body.message);
  const res = await api("POST", "/auth/login-wallet", { body: { walletAddress: wallet.address, signature, role, name } });
  return { wallet, address: wallet.address.toLowerCase(), token: res.body.token, user: res.body.user, res };
}

const futureDate = (days = 14) => new Date(Date.now() + days * 86400000).toISOString();
const kpis2 = () => [
  { title: "Thiết kế", criteria: "Hoàn thành thiết kế kiến trúc", weightPercent: 40, deadline: futureDate(7) },
  { title: "Triển khai", criteria: "Triển khai smart contract và giao diện", weightPercent: 60, deadline: futureDate(14) },
];

module.exports = { start, stop, api, loginAs, kpis2, futureDate, get baseURL() { return base; } };
