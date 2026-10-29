const test = require("node:test");
const assert = require("node:assert/strict");
const { ethers } = require("ethers");
const h = require("./helpers");

test.before(h.start);
test.after(h.stop);

test("health trả về trạng thái DB và IPFS", async () => {
  const r = await h.api("GET", "/health");
  assert.equal(r.status, 200);
  assert.equal(r.body.dbState, "connected");
  assert.equal(r.body.ipfsConfigured, false);
});

test("endpoint không tồn tại trả 404 JSON", async () => {
  const r = await h.api("GET", "/khong-co");
  assert.equal(r.status, 404);
});

test("nonce: từ chối ví không hợp lệ", async () => {
  const r = await h.api("POST", "/auth/nonce", { body: { walletAddress: "abc" } });
  assert.equal(r.status, 400);
});

test("login: không có chữ ký bị từ chối", async () => {
  const w = ethers.Wallet.createRandom();
  await h.api("POST", "/auth/nonce", { body: { walletAddress: w.address } });
  const r = await h.api("POST", "/auth/login-wallet", { body: { walletAddress: w.address, role: "student" } });
  assert.equal(r.status, 400);
  assert.equal(r.body.code, "NO_SIGNATURE");
});

test("login: chữ ký của ví khác bị từ chối (401)", async () => {
  const victim = ethers.Wallet.createRandom();
  const attacker = ethers.Wallet.createRandom();
  const nonce = await h.api("POST", "/auth/nonce", { body: { walletAddress: victim.address } });
  const signature = await attacker.signMessage(nonce.body.message);
  const r = await h.api("POST", "/auth/login-wallet", { body: { walletAddress: victim.address, signature, role: "company" } });
  assert.equal(r.status, 401);
  assert.equal(r.body.code, "BAD_SIGNATURE");
});

test("login: không có nonce thì từ chối", async () => {
  const w = ethers.Wallet.createRandom();
  const signature = await w.signMessage("bất kỳ");
  const r = await h.api("POST", "/auth/login-wallet", { body: { walletAddress: w.address, signature } });
  assert.equal(r.status, 401);
  assert.equal(r.body.code, "NONCE_INVALID");
});

test("login: nonce chỉ dùng được một lần (chống replay)", async () => {
  const w = ethers.Wallet.createRandom();
  const nonce = await h.api("POST", "/auth/nonce", { body: { walletAddress: w.address } });
  const signature = await w.signMessage(nonce.body.message);
  const first = await h.api("POST", "/auth/login-wallet", { body: { walletAddress: w.address, signature, role: "student" } });
  assert.equal(first.status, 200);
  assert.ok(first.body.token);
  const replay = await h.api("POST", "/auth/login-wallet", { body: { walletAddress: w.address, signature, role: "student" } });
  assert.equal(replay.status, 401);
});

test("login: không cho tự đăng ký role mentor/admin", async () => {
  for (const role of ["mentor", "admin"]) {
    const w = ethers.Wallet.createRandom();
    const r = (await h.loginAs(role, "x", w)).res;
    assert.equal(r.status, 400, role);
  }
});

test("login: user cũ giữ nguyên role dù gửi role khác", async () => {
  const w = ethers.Wallet.createRandom();
  await h.loginAs("student", "SV", w);
  const again = await h.loginAs("company", "Hack", w);
  assert.equal(again.user.role, "student");
});

test("/me cần token hợp lệ", async () => {
  assert.equal((await h.api("GET", "/auth/me")).status, 401);
  assert.equal((await h.api("GET", "/auth/me", { token: "rác" })).status, 401);
  const s = await h.loginAs("student", "SV");
  const me = await h.api("GET", "/auth/me", { token: s.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.walletAddress, s.address);
});

test("profile: chỉ chủ tài khoản được sửa", async () => {
  const a = await h.loginAs("student", "A");
  const b = await h.loginAs("student", "B");
  const bad = await h.api("PUT", `/auth/profile/${a.address}`, { token: b.token, body: { name: "bị hack" } });
  assert.equal(bad.status, 403);
  const noAuth = await h.api("PUT", `/auth/profile/${a.address}`, { body: { name: "x" } });
  assert.equal(noAuth.status, 401);
  const ok = await h.api("PUT", `/auth/profile/${a.address}`, { token: a.token, body: { skills: ["Solidity"] } });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.user.skills, ["Solidity"]);
});

test("PUT /data/students|companies cần xác thực và đúng chủ", async () => {
  const a = await h.loginAs("student", "A");
  const b = await h.loginAs("student", "B");
  assert.equal((await h.api("PUT", `/data/students/${a.address}`, { body: { university: "X" } })).status, 401);
  assert.equal((await h.api("PUT", `/data/students/${a.address}`, { token: b.token, body: { university: "X" } })).status, 403);
  assert.equal((await h.api("PUT", `/data/students/${a.address}`, { token: a.token, body: { university: "HUST" } })).status, 200);
});

test("tạo đề tài: cần đăng nhập, đúng role company", async () => {
  const body = { title: "T", description: "D", kpis: h.kpis2() };
  assert.equal((await h.api("POST", "/topics", { body })).status, 401);
  const s = await h.loginAs("student", "SV");
  assert.equal((await h.api("POST", "/topics", { token: s.token, body })).status, 403);
});

test("tạo đề tài: tổng trọng số KPI phải = 100%", async () => {
  const c = await h.loginAs("company", "Cty");
  const bad = h.kpis2();
  bad[1].weightPercent = 50;
  const r = await h.api("POST", "/topics", { token: c.token, body: { title: "T", description: "D", kpis: bad } });
  assert.equal(r.status, 400);
  assert.equal(r.body.code, "KPI_WEIGHT_TOTAL");
  const empty = await h.api("POST", "/topics", { token: c.token, body: { title: "T", description: "D", kpis: [] } });
  assert.equal(empty.status, 400);
  const frac = h.kpis2();
  frac[0].weightPercent = 40.5;
  assert.equal((await h.api("POST", "/topics", { token: c.token, body: { title: "T", description: "D", kpis: frac } })).status, 400);
});

test("tạo đề tài: danh tính công ty lấy từ token, bỏ qua companyWallet trong body", async () => {
  const c = await h.loginAs("company", "Cty");
  const r = await h.api("POST", "/topics", {
    token: c.token,
    body: { title: "T", description: "D", kpis: h.kpis2(), companyWallet: "0x0000000000000000000000000000000000000001", txHash: "0xfake", onChainId: 99 },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.topic.companyWallet, c.address);
  assert.equal(r.body.topic.txHash, "");
  assert.equal(r.body.topic.onChainId, undefined);
  assert.equal(r.body.topic.ipfsDetailsHash, "");
  assert.equal(r.body.topic.kpis.length, 2);
});

test("công ty khác không được sửa/phân công/hoàn thành đề tài", async () => {
  const owner = await h.loginAs("company", "Chủ");
  const other = await h.loginAs("company", "Khác");
  const sv = await h.loginAs("student", "SV");
  const t = (await h.api("POST", "/topics", { token: owner.token, body: { title: "T", description: "D", kpis: h.kpis2() } })).body.topic;
  for (const [path, body] of [
    [`/topics/${t._id}/assign`, { studentWallet: sv.address }],
    [`/topics/${t._id}/complete`, {}],
    [`/topics/${t._id}/kpis`, { title: "k", criteria: "c", weightPercent: 1 }],
    [`/topics/${t._id}/mentor`, { mentorWallet: sv.address }],
  ]) {
    const r = await h.api("POST", path, { token: other.token, body });
    assert.equal(r.status, 403, path);
    assert.equal((await h.api("POST", path, { body })).status, 401, path);
  }
});

test("phân công: sinh viên phải là tài khoản student đã đăng ký", async () => {
  const c = await h.loginAs("company", "Cty");
  const t = (await h.api("POST", "/topics", { token: c.token, body: { title: "T", description: "D", kpis: h.kpis2() } })).body.topic;
  const unknown = ethers.Wallet.createRandom().address;
  assert.equal((await h.api("POST", `/topics/${t._id}/assign`, { token: c.token, body: { studentWallet: unknown } })).status, 404);
  assert.equal((await h.api("POST", `/topics/${t._id}/assign`, { token: c.token, body: { studentWallet: "xyz" } })).status, 400);
  const company2 = await h.loginAs("company", "C2");
  assert.equal((await h.api("POST", `/topics/${t._id}/assign`, { token: c.token, body: { studentWallet: company2.address } })).status, 404);
});

test("luồng đầy đủ: assign → nộp → đánh giá → hoàn thành, kiểm tra phân quyền từng bước", async () => {
  const ipfs = require("../src/services/ipfsService");
  const original = ipfs.uploadToIPFS;
  let counter = 0;
  ipfs.uploadToIPFS = async () => ({ ipfsHash: `bafyTEST${++counter}`, url: "https://example/ipfs" });
  try {
    const c = await h.loginAs("company", "Cty");
    const sv = await h.loginAs("student", "SV");
    const other = await h.loginAs("student", "SV2");
    const t = (await h.api("POST", "/topics", { token: c.token, body: { title: "Đề tài", description: "Mô tả", kpis: h.kpis2() } })).body.topic;
    const id = t._id;

    // Chưa phân công thì không ai nộp được.
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/submit`, { token: sv.token, body: { submissionContent: "x" } })).status, 403);
    assert.equal((await h.api("POST", `/topics/${id}/assign`, { token: c.token, body: { studentWallet: sv.address } })).status, 200);
    // Hết slot
    assert.equal((await h.api("POST", `/topics/${id}/assign`, { token: c.token, body: { studentWallet: other.address } })).status, 409);

    // Sinh viên khác không nộp được; nội dung rỗng bị từ chối.
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/submit`, { token: other.token, body: { submissionContent: "x" } })).status, 403);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/submit`, { token: sv.token, body: { submissionContent: "  " } })).status, 400);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/9/submit`, { token: sv.token, body: { submissionContent: "x" } })).status, 404);

    // Chưa nộp thì chưa chấm được; chưa đủ KPI thì chưa hoàn thành.
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/evaluate`, { token: c.token, body: { status: "approved", score: 80 } })).status, 409);
    assert.equal((await h.api("POST", `/topics/${id}/complete`, { token: c.token })).status, 409);

    for (const i of [0, 1]) {
      const sub = await h.api("POST", `/topics/${id}/kpis/${i}/submit`, { token: sv.token, body: { submissionContent: "Báo cáo smart contract thiết kế kiến trúc triển khai" } });
      assert.equal(sub.status, 200, JSON.stringify(sub.body));
      assert.match(sub.body.ipfsHash, /^bafyTEST/);
      assert.ok(sub.body.aiAnalysis.engine);
      // Nộp lại khi đang chờ chấm bị chặn.
      assert.equal((await h.api("POST", `/topics/${id}/kpis/${i}/submit`, { token: sv.token, body: { submissionContent: "lại" } })).status, 409);
    }

    // Sinh viên không được tự chấm điểm; điểm ngoài 0-100 bị từ chối.
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/evaluate`, { token: sv.token, body: { status: "approved", score: 100 } })).status, 403);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/evaluate`, { token: c.token, body: { status: "approved", score: 101 } })).status, 400);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/evaluate`, { token: c.token, body: { status: "approved", score: -1 } })).status, 400);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/evaluate`, { token: c.token, body: { status: "approved" } })).status, 400);

    // KPI 0 approved, KPI 1 rejected → chưa đủ để hoàn thành.
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/evaluate`, { token: c.token, body: { status: "approved", score: 80, mentorFeedback: "tốt" } })).status, 200);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/1/evaluate`, { token: c.token, body: { status: "rejected", score: 40 } })).status, 200);
    assert.equal((await h.api("POST", `/topics/${id}/complete`, { token: c.token })).status, 409);

    // Nộp lại KPI bị từ chối rồi duyệt.
    assert.equal((await h.api("POST", `/topics/${id}/kpis/1/submit`, { token: sv.token, body: { submissionContent: "Bản sửa triển khai smart contract" } })).status, 200);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/1/evaluate`, { token: c.token, body: { status: "approved", score: 90 } })).status, 200);

    const done = await h.api("POST", `/topics/${id}/complete`, { token: c.token });
    assert.equal(done.status, 200);
    assert.equal(done.body.topic.status, "completed");
    assert.equal(done.body.topic.finalScore, Math.round(80 * 0.4 + 90 * 0.6)); // 86
    assert.match(done.body.topic.certificateIpfsHash, /^bafyTEST/);
    // Không hoàn thành hai lần, không nộp sau khi kết thúc.
    assert.equal((await h.api("POST", `/topics/${id}/complete`, { token: c.token })).status, 409);
    assert.equal((await h.api("POST", `/topics/${id}/kpis/0/submit`, { token: sv.token, body: { submissionContent: "x" } })).status, 409);
  } finally {
    ipfs.uploadToIPFS = original;
  }
});

test("mentor được chỉ định có quyền chấm, mentor lạ thì không", async () => {
  const ipfs = require("../src/services/ipfsService");
  const original = ipfs.uploadToIPFS;
  ipfs.uploadToIPFS = async () => ({ ipfsHash: "bafyMENTOR", url: "u" });
  try {
    const User = require("../src/models/User");
    const c = await h.loginAs("company", "Cty");
    const sv = await h.loginAs("student", "SV");
    // mentor không thể tự đăng ký -> hệ thống cấp: tạo trực tiếp trong DB.
    const mentorWallet = ethers.Wallet.createRandom();
    const stranger = ethers.Wallet.createRandom();
    for (const [w, n] of [[mentorWallet, "Mentor"], [stranger, "Lạ"]]) {
      await User.create({ walletAddress: w.address.toLowerCase(), name: n, role: "mentor" });
    }
    const mt = await h.loginAs("mentor", "Mentor", mentorWallet);
    const st = await h.loginAs("mentor", "Lạ", stranger);
    assert.equal(mt.res.status, 200);

    const t = (await h.api("POST", "/topics", { token: c.token, body: { title: "T", description: "D", kpis: h.kpis2() } })).body.topic;
    assert.equal((await h.api("POST", `/topics/${t._id}/mentor`, { token: c.token, body: { mentorWallet: sv.address } })).status, 400);
    assert.equal((await h.api("POST", `/topics/${t._id}/mentor`, { token: c.token, body: { mentorWallet: mt.address } })).status, 200);
    await h.api("POST", `/topics/${t._id}/assign`, { token: c.token, body: { studentWallet: sv.address } });
    await h.api("POST", `/topics/${t._id}/kpis/0/submit`, { token: sv.token, body: { submissionContent: "nội dung báo cáo" } });
    assert.equal((await h.api("POST", `/topics/${t._id}/kpis/0/evaluate`, { token: st.token, body: { status: "approved", score: 70 } })).status, 403);
    assert.equal((await h.api("POST", `/topics/${t._id}/kpis/0/evaluate`, { token: mt.token, body: { status: "approved", score: 70 } })).status, 200);
    // Mentor không được hoàn thành đề tài (chỉ công ty chủ).
    assert.equal((await h.api("POST", `/topics/${t._id}/complete`, { token: mt.token })).status, 403);
  } finally {
    ipfs.uploadToIPFS = original;
  }
});

test("nộp báo cáo khi chưa cấu hình PINATA_JWT trả 503, không tạo CID giả", async () => {
  const c = await h.loginAs("company", "Cty");
  const sv = await h.loginAs("student", "SV");
  const t = (await h.api("POST", "/topics", { token: c.token, body: { title: "T", description: "D", kpis: h.kpis2() } })).body.topic;
  await h.api("POST", `/topics/${t._id}/assign`, { token: c.token, body: { studentWallet: sv.address } });
  const r = await h.api("POST", `/topics/${t._id}/kpis/0/submit`, { token: sv.token, body: { submissionContent: "báo cáo" } });
  assert.equal(r.status, 503);
  assert.equal(r.body.code, "IPFS_NOT_CONFIGURED");
  const after = await h.api("GET", `/topics/${t._id}`);
  assert.equal(after.body.kpis[0].status, "pending");
  assert.equal(after.body.kpis[0].submissionIpfsHash, "");
});

test("ID đề tài sai định dạng trả 400, không tồn tại trả 404", async () => {
  assert.equal((await h.api("GET", "/topics/abc")).status, 400);
  assert.equal((await h.api("GET", "/topics/64b000000000000000000000")).status, 404);
});
