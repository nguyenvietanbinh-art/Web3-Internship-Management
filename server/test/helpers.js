// Helper dùng chung cho test: app thật + MongoDB thật (DB riêng) + ví ethers thật ký nonce.
process.env.JWT_SECRET = "test-secret-test-secret-123456";
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/web3_internship_test";
delete process.env.PINATA_JWT; // mặc định: IPFS chưa cấu hình

const mongoose = require("mongoose");
const { ethers } = require("ethers");
const { createApp } = require("../src/app");

let server;
let base;

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await new Promise((resolve) => { server = createApp().listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
}

async function stop() {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
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

module.exports = { start, stop, api, loginAs, kpis2, futureDate };
