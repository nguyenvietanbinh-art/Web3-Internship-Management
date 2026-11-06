// Complete only the three existing companies that still have three topics.
// No accounts, databases, indexes or test fixtures are created.
const mongoose = require('mongoose');
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
  throw Error('Use the existing course database and --apply');
process.env.EMAIL_AUTH_ENABLED = 'true';
process.env.USER_ID_BUSINESS_ENABLED = 'true';
mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);
const User = require('../src/models/User'),
  Topic = require('../src/models/Topic');
const groups = [
  {
    email: 'congngheviet@gmail.com',
    projects: [
      [
        'Ứng dụng quản lý tài sản và bảo trì thiết bị',
        'Quản lý thiết bị, bàn giao tài sản, lập lịch bảo trì, ghi nhận sự cố và thống kê sử dụng bằng React, Node.js và MongoDB.',
      ],
      [
        'Hệ thống quản lý văn bản và phê duyệt nội bộ',
        'Xây dựng kho văn bản, tìm kiếm, phân quyền truy cập, luồng trình ký và theo dõi lịch sử phê duyệt.',
      ],
    ],
  },
  {
    email: 'giaiphapso@gmail.com',
    projects: [
      [
        'Nền tảng quản lý chương trình khách hàng thân thiết',
        'Quản lý thành viên, tích điểm, đổi ưu đãi, kiểm soát điều kiện sử dụng và báo cáo tương tác khách hàng.',
      ],
      [
        'Hệ thống quản lý chiến dịch marketing đa kênh',
        'Quản lý chiến dịch, phân nhóm khách hàng, lập lịch nội dung, thống kê hiệu quả và xuất báo cáo có phân quyền.',
      ],
    ],
  },
  {
    email: 'saokhue@gmail.com',
    projects: [
      [
        'Ứng dụng quản lý thư viện và mượn trả sách',
        'Xây dựng danh mục sách, tra cứu, đặt mượn, xác nhận trả, nhắc hạn và thống kê hoạt động thư viện.',
      ],
      [
        'Cổng đánh giá chất lượng phần mềm và quản lý lỗi',
        'Quản lý phiên bản, kịch bản kiểm thử, phiếu lỗi, mức ưu tiên, phân công xử lý và dashboard chất lượng sản phẩm.',
      ],
    ],
  },
];
(async () => {
  try {
    await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
    const plans = [];
    for (const spec of groups) {
      const company = await User.findOne({ role: 'company', email: spec.email });
      if (!company) throw Error('Missing existing company: ' + spec.email);
      const topics = await Topic.find({ companyUserId: company._id })
        .select('+applicantKeys')
        .sort({ createdAt: 1, _id: 1 });
      if (topics.length < 3 || topics.length > 5)
        throw Error('Unexpected topic count for ' + spec.email);
      const missing = spec.projects.filter(([title]) => !topics.some((t) => t.title === title));
      if (topics.length + missing.length !== 5)
        throw Error('Refuse to duplicate or replace existing topics: ' + spec.email);
      if (
        !topics[0].kpis.length ||
        topics[0].kpis.reduce((sum, k) => sum + k.weightPercent, 0) !== 100
      )
        throw Error('Existing topic has no valid KPI template');
      for (let i = 0; i < topics.length; i++)
        if (topics[i].applicantKeys.length > [3, 4, 5, 3, 5][i])
          throw Error('Existing reservations exceed requested capacity');
      plans.push({ company, topics, missing });
    }
    let added = 0,
      changed = 0;
    for (const { company, topics, missing } of plans) {
      for (let i = 0; i < topics.length; i++) {
        const t = topics[i],
          maxSlots = [3, 4, 5, 3, 5][i];
        if (t.maxSlots === maxSlots) continue;
        const result = await Topic.updateOne(
          {
            _id: t._id,
            __v: t.__v,
            $expr: { $lte: [{ $size: { $ifNull: ['$applicantKeys', []] } }, maxSlots] },
          },
          { $set: { maxSlots }, $inc: { __v: 1 } }
        );
        if (result.modifiedCount !== 1) throw Error('Topic changed concurrently; reload and retry');
        changed++;
      }
      let nextIndex = topics.length;
      for (const [title, description] of missing) {
        const index = nextIndex++;
        await Topic.create({
          companyUserId: company._id,
          companyName: company.companyName || company.name,
          title,
          description,
          status: 'open',
          maxSlots: [3, 4, 5, 3, 5][index],
          applicantKeys: [],
          kpis: topics[0].kpis.map((k, i) => ({
            milestoneIndex: i,
            title: k.title,
            description:
              i === 0
                ? 'Phân tích yêu cầu, thiết kế giao diện và mô hình dữ liệu cho đề tài.'
                : i === 1
                ? 'Xây dựng các chức năng theo mô tả, tích hợp API và quản lý mã nguồn.'
                : 'Kiểm thử, viết hướng dẫn triển khai, bàn giao mã nguồn và báo cáo.',
            weightPercent: k.weightPercent,
            deadline: k.deadline,
          })),
        });
        added++;
      }
    }
    const result = [];
    for (const { company } of plans) {
      const topics = await Topic.find({ companyUserId: company._id }).select('title maxSlots');
      if (topics.length !== 5 || topics.some((t) => t.maxSlots < 3 || t.maxSlots > 5))
        throw Error('Final verification failed');
      result.push({
        company: company.name,
        count: topics.length,
        capacities: topics.map((t) => t.maxSlots),
      });
    }
    console.log(
      JSON.stringify({
        database: mongoose.connection.name,
        addedTopics: added,
        updatedCapacities: changed,
        companies: result,
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
