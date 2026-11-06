// Idempotent update of the existing course database. Never creates a database or indexes.
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const uri = process.env.MONGODB_URI_TEST;
require('../src/config/testDatabaseGuard').assertTestEnvironment({
  nodeEnv: process.env.NODE_ENV,
  uri,
  allowlistedUri: process.env.MONGODB_URI_TEST_ALLOWLIST,
});
if (
  new URL(uri).pathname !== '/web3_internship_test_phase1_khoa_20261106' ||
  !process.argv.includes('--apply')
)
  throw Error('Only the existing course database is authorized; pass --apply');
process.env.USER_ID_BUSINESS_ENABLED = 'true';
process.env.EMAIL_AUTH_ENABLED = 'true';
process.env.GOOGLE_AUTH_ENABLED = 'true';
process.env.CORE_BUSINESS_ENABLED = 'true';
mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);
const User = require('../src/models/User'),
  Topic = require('../src/models/Topic'),
  Registration = require('../src/models/BatchRegistration'),
  Assignment = require('../src/models/Assignment');
const { InternshipBatch } = require('../src/models/BusinessModels');
const { ensureProfile } = require('../src/services/accountProfiles');
const companies = [
  {
    email: 'congngheviet@gmail.com',
    name: 'Công ty Công nghệ Việt',
    titles: [
      'Cổng thông tin tuyển dụng React và Node.js',
      'Ứng dụng quản lý kho MongoDB',
      'Hệ thống đặt lịch và thông báo trực tuyến',
    ],
  },
  {
    email: 'giaiphapso@gmail.com',
    name: 'Công ty Giải pháp Số',
    titles: [
      'Website thương mại điện tử và thanh toán',
      'Dashboard phân tích dữ liệu doanh nghiệp',
      'API quản lý khách hàng và chăm sóc khách hàng',
    ],
  },
  {
    email: 'saokhue@gmail.com',
    name: 'Công ty Phần mềm Sao Khuê',
    titles: [
      'Ứng dụng quản lý học tập và bài tập',
      'Chatbot hỗ trợ tra cứu tài liệu nội bộ',
      'Kiểm thử tự động cho hệ thống quản lý thực tập',
    ],
  },
];
const mentors = [
  { email: 'gv.minhanh@gmail.com', name: 'GV Nguyễn Minh Anh' },
  { email: 'gv.hoangnam@gmail.com', name: 'GV Lê Hoàng Nam' },
  { email: 'gv.thuhien@gmail.com', name: 'GV Phạm Thu Hiền' },
];
(async () => {
  try {
    await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
    if ((await User.countDocuments()) === 0) throw Error('Refuse to provision an empty database');
    const batch = await InternshipBatch.findOne({
      status: 'open',
      endDate: { $gt: new Date() },
    }).sort({ startDate: -1 });
    if (!batch) throw Error('Need an existing open internship batch');
    const rows = await Registration.find().lean();
    let migrated = 0;
    for (const row of rows)
      if (!row.choices?.length && row.requestType === 'application' && row.topicId) {
        const topic = await Topic.findById(row.topicId).lean();
        if (!topic?.companyUserId)
          throw Error('Registration needs a verified topic owner: ' + row._id);
        const status =
          row.status === 'placed'
            ? 'accepted'
            : row.status === 'rejected'
            ? 'rejected'
            : row.status === 'withdrawn'
            ? 'declined'
            : 'submitted';
        await Registration.updateOne(
          { _id: row._id },
          {
            $set: {
              choices: [
                {
                  topicId: topic._id,
                  companyUserId: topic.companyUserId,
                  status,
                  message: row.message || '',
                  reason: row.reason || '',
                  appliedAt: row.createdAt || new Date(),
                },
              ],
              selectedTopicId: row.status === 'placed' ? topic._id : null,
            },
            $inc: { __v: 1 },
          }
        );
        migrated++;
      }
    const claims = new Map();
    const claim = (topicId, batchId, studentId) => {
      if (!topicId || !batchId || !studentId) return;
      const id = String(topicId);
      if (!claims.has(id)) claims.set(id, new Set());
      claims.get(id).add(`${batchId}:${studentId}`);
    };
    for (const a of await Assignment.find({
      batchId: { $type: 'objectId' },
      lifecycle: { $ne: 'cancelled' },
    }).lean())
      claim(a.topicId, a.batchId, a.studentUserId);
    for (const r of await Registration.find({
      status: { $in: ['submitted', 'processing', 'placed'] },
    }).lean())
      for (const c of r.choices || [])
        if (['submitted', 'accepted'].includes(c.status))
          claim(c.topicId, r.batchId, r.studentUserId);
    for (const t of await Topic.find().select('+applicantKeys').lean()) {
      const keys = [...(claims.get(String(t._id)) || [])],
        maxSlots = Math.max(t.maxSlots || 1, keys.length);
      if (
        JSON.stringify([...(t.applicantKeys || [])].sort()) !== JSON.stringify([...keys].sort()) ||
        t.maxSlots !== maxSlots
      )
        await Topic.updateOne(
          { _id: t._id },
          { $set: { applicantKeys: keys, maxSlots }, $inc: { __v: 1 } }
        );
    }
    const accounts = [];
    let addedAccounts = 0,
      addedTopics = 0;
    for (const spec of [
      ...companies.map((c) => ({ ...c, role: 'company', password: 'DN123456' })),
      ...mentors.map((m) => ({ ...m, role: 'mentor', password: 'GV123456' })),
    ]) {
      let user = await User.findOne({ $or: [{ loginEmail: spec.email }, { email: spec.email }] });
      if (user && user.role !== spec.role)
        throw Error('Email exists with a different role: ' + spec.email);
      if (!user) {
        user = await User.create({
          name: spec.name,
          email: spec.email,
          loginEmail: spec.email,
          passwordHash: await require('bcryptjs').hash(spec.password, 12),
          role: spec.role,
          ...(spec.role === 'company' ? { companyName: spec.name } : {}),
          auditHistory: [{ action: 'course.accounts_added', actorRole: 'admin', at: new Date() }],
        });
        addedAccounts++;
      }
      await ensureProfile(user);
      accounts.push({
        role: spec.role,
        name: user.name,
        email: spec.email,
        password: spec.password,
      });
      if (spec.titles)
        for (const title of spec.titles) {
          if (await Topic.exists({ companyUserId: user._id, title })) continue;
          const start = batch.startDate.getTime(),
            span = batch.endDate.getTime() - start;
          await Topic.create({
            companyUserId: user._id,
            companyName: user.companyName || user.name,
            title,
            description: `Thực tập tại ${
              user.name
            }: phân tích yêu cầu, xây dựng ${title.toLowerCase()}, kiểm thử và bàn giao mã nguồn, tài liệu triển khai.`,
            maxSlots: 3,
            applicantKeys: [],
            kpis: [
              {
                milestoneIndex: 0,
                title: 'Phân tích và thiết kế',
                description: 'Hoàn thiện yêu cầu, thiết kế giao diện và dữ liệu.',
                weightPercent: 30,
                deadline: new Date(start + span * 0.4),
              },
              {
                milestoneIndex: 1,
                title: 'Triển khai chức năng',
                description: 'Lập trình chức năng, tích hợp API và quản lý mã nguồn.',
                weightPercent: 50,
                deadline: new Date(start + span * 0.7),
              },
              {
                milestoneIndex: 2,
                title: 'Kiểm thử và bàn giao',
                description: 'Kiểm thử, viết tài liệu, nộp báo cáo và demo sản phẩm.',
                weightPercent: 20,
                deadline: new Date(start + span * 0.95),
              },
            ],
          });
          addedTopics++;
        }
    }
    const doc = [
      '# Tài khoản thực hành bổ sung',
      '',
      'Các tài khoản phục vụ bài thực hành trên database hiện tại. Mật khẩu dưới đây chỉ dành cho dữ liệu thực hành.',
      '',
      '## Doanh nghiệp',
      '',
      ...accounts
        .filter((a) => a.role === 'company')
        .map((a) => `- ${a.name}: ${a.email} / ${a.password}`),
      '',
      '## Giảng viên',
      '',
      ...accounts
        .filter((a) => a.role === 'mentor')
        .map((a) => `- ${a.name}: ${a.email} / ${a.password}`),
      '',
      'Mỗi doanh nghiệp bổ sung có 3 đề tài, mỗi đề tài nhận tối đa 3 ứng viên.',
      'Sinh viên ứng tuyển tối đa 3 đề tài trong mỗi kỳ, chọn 1 đề tài đã được doanh nghiệp nhận.',
      'Nhà trường hỗ trợ phân công từ 7 ngày trước ngày bắt đầu kỳ hoặc khi kỳ đã bắt đầu.',
      '',
    ].join('\n');
    const docs = path.resolve(__dirname, '../../docs');
    fs.mkdirSync(docs, { recursive: true });
    fs.writeFileSync(path.join(docs, 'TAI_KHOAN_THUC_HANH.md'), doc);
    console.log(
      JSON.stringify({
        database: mongoose.connection.name,
        addedAccounts,
        addedTopics,
        migratedRegistrations: migrated,
        totalCompanies: await User.countDocuments({ role: 'company' }),
        totalMentors: await User.countDocuments({ role: 'mentor' }),
        totalTopics: await Topic.countDocuments(),
        newDatabases: 0,
      })
    );
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
