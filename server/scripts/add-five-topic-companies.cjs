// Adds only the requested companies/topics to the existing course database; no test DB or indexes.
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
process.env.USER_ID_BUSINESS_ENABLED = 'true';
process.env.EMAIL_AUTH_ENABLED = 'true';
process.env.GOOGLE_AUTH_ENABLED = 'true';
mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);
const User = require('../src/models/User'),
  Topic = require('../src/models/Topic');
const { InternshipBatch } = require('../src/models/BusinessModels');
const { ensureProfile } = require('../src/services/accountProfiles');
const companies = [
  {
    name: 'Công ty Công nghệ An Phát',
    email: 'anphattech@gmail.com',
    projects: [
      [
        'Website bán hàng và quản lý đơn hàng',
        'Xây dựng danh mục sản phẩm, giỏ hàng, đặt hàng và trang quản trị đơn hàng bằng React, Node.js và MongoDB.',
      ],
      [
        'Cổng tuyển dụng và quản lý hồ sơ ứng viên',
        'Xây dựng tin tuyển dụng, tìm kiếm, nộp CV và quy trình xét duyệt ứng viên theo vai trò.',
      ],
      [
        'Hệ thống CRM quản lý khách hàng',
        'Quản lý khách hàng, lịch sử tương tác, lịch hẹn chăm sóc và báo cáo hiệu quả kinh doanh.',
      ],
      [
        'Ứng dụng quản lý kho bằng mã QR',
        'Quản lý hàng hóa, nhập xuất kho, quét QR và cảnh báo tồn kho; lưu lịch sử giao dịch.',
      ],
      [
        'Helpdesk tiếp nhận và xử lý yêu cầu hỗ trợ',
        'Xây dựng phiếu hỗ trợ, phân công nhân viên, mức ưu tiên, thời hạn và thống kê xử lý.',
      ],
    ],
  },
  {
    name: 'Công ty Giải pháp số Minh Phát',
    email: 'minhphatdigital@gmail.com',
    projects: [
      [
        'Ứng dụng đặt lịch phòng khám trực tuyến',
        'Quản lý bác sĩ, chuyên khoa, lịch trống, đặt lịch và thông báo thay đổi lịch hẹn.',
      ],
      [
        'Nền tảng đặt tour và quản lý du lịch',
        'Xây dựng danh sách tour, lịch khởi hành, đặt chỗ, kiểm soát số lượng và quản lý khách hàng.',
      ],
      [
        'Dashboard doanh thu và hiệu quả bán hàng',
        'Tổng hợp dữ liệu doanh thu, lọc theo kỳ, hiển thị biểu đồ và xuất báo cáo có phân quyền.',
      ],
      [
        'Ứng dụng quản lý nhà trọ và hợp đồng',
        'Quản lý phòng, người thuê, hợp đồng, chỉ số điện nước và hóa đơn thanh toán.',
      ],
      [
        'Hệ thống quản lý sự kiện và đăng ký tham dự',
        'Quản lý sự kiện, giới hạn vé, đăng ký, check-in QR và báo cáo người tham dự.',
      ],
    ],
  },
  {
    name: 'Công ty Phần mềm Thiên Long',
    email: 'thienlongsoftware@gmail.com',
    projects: [
      [
        'Hệ thống cấp và xác minh chứng nhận trên blockchain',
        'Xây dựng quy trình cấp chứng nhận, lưu mã xác minh, tra cứu và kiểm tra tính toàn vẹn của chứng nhận.',
      ],
      [
        'Nền tảng học trực tuyến và bài tập theo tuần',
        'Quản lý khóa học, bài học, giao bài theo tuần, hạn nộp, chấm điểm và nhận xét.',
      ],
      [
        'Ứng dụng quản lý dự án và cộng tác nhóm',
        'Quản lý dự án, thành viên, công việc theo sprint, ưu tiên, deadline và bảng theo dõi tiến độ.',
      ],
      [
        'Chatbot tra cứu tài liệu và hỗ trợ người dùng',
        'Xây dựng kho tài liệu, giao diện hội thoại, tìm kiếm nội dung và đánh giá chất lượng câu trả lời.',
      ],
      [
        'Bộ kiểm thử tự động cho ứng dụng web',
        'Thiết kế kịch bản đăng nhập, phân quyền, quản lý dữ liệu và nộp bài; tạo báo cáo lỗi và kết quả kiểm thử.',
      ],
    ],
  },
];
(async () => {
  try {
    await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
    if (!(await User.exists({ role: 'admin' })))
      throw Error('Refuse to provision an empty or unrelated database');
    const batch = await InternshipBatch.findOne({
      status: 'open',
      endDate: { $gt: new Date() },
    }).sort({ startDate: -1 });
    if (!batch) throw Error('An existing open batch is required');
    const start = Math.max(batch.startDate.getTime(), Date.now()),
      span = batch.endDate.getTime() - start;
    if (span < 86400000) throw Error('The current batch has less than one day left');
    const capacities = [3, 4, 5, 3, 5];
    let addedAccounts = 0,
      addedTopics = 0;
    for (const spec of companies) {
      let user = await User.findOne({ $or: [{ loginEmail: spec.email }, { email: spec.email }] });
      if (user && (user.role !== 'company' || (user.companyName || user.name) !== spec.name))
        throw Error('Existing email belongs to a different account: ' + spec.email);
      if (!user) {
        user = await User.create({
          name: spec.name,
          companyName: spec.name,
          email: spec.email,
          loginEmail: spec.email,
          passwordHash: await require('bcryptjs').hash('DN123456', 12),
          role: 'company',
          auditHistory: [
            { action: 'course.five_topic_company_added', actorRole: 'admin', at: new Date() },
          ],
        });
        addedAccounts++;
      }
      await ensureProfile(user);
      for (const [index, [title, description]] of spec.projects.entries()) {
        if (await Topic.exists({ companyUserId: user._id, title })) continue;
        await Topic.create({
          companyUserId: user._id,
          companyName: spec.name,
          title,
          description:
            description +
            ' Sản phẩm bàn giao gồm mã nguồn, hướng dẫn triển khai, dữ liệu minh họa và báo cáo thực tập.',
          maxSlots: capacities[index],
          applicantKeys: [],
          status: 'open',
          kpis: [
            {
              milestoneIndex: 0,
              title: 'Phân tích yêu cầu và thiết kế',
              description: 'Hoàn thành đặc tả, sơ đồ dữ liệu, phân quyền và thiết kế giao diện.',
              weightPercent: 30,
              deadline: new Date(start + span * 0.3),
            },
            {
              milestoneIndex: 1,
              title: 'Xây dựng và tích hợp chức năng',
              description:
                'Hoàn thành chức năng chính, tích hợp API, kiểm tra đầu vào và quản lý mã nguồn.',
              weightPercent: 50,
              deadline: new Date(start + span * 0.65),
            },
            {
              milestoneIndex: 2,
              title: 'Kiểm thử, tài liệu và bàn giao',
              description:
                'Kiểm thử luồng nghiệp vụ, xử lý lỗi, viết hướng dẫn triển khai và trình bày sản phẩm.',
              weightPercent: 20,
              deadline: new Date(start + span * 0.9),
            },
          ],
        });
        addedTopics++;
      }
      const rows = await Topic.find({
        companyUserId: user._id,
        title: { $in: spec.projects.map((p) => p[0]) },
      }).lean();
      if (rows.length !== 5 || rows.some((t) => t.maxSlots < 3 || t.maxSlots > 5))
        throw Error('Unexpected topic count/capacity for ' + spec.name);
    }
    console.log(
      JSON.stringify({
        database: mongoose.connection.name,
        addedAccounts,
        addedTopics,
        totalCompanies: await User.countDocuments({ role: 'company' }),
        totalTopics: await Topic.countDocuments(),
        capacitiesPerCompany: capacities,
        newDatabases: 0,
      })
    );
  } finally {
    await mongoose.disconnect();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
