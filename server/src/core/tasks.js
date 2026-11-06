const router = require('express').Router();
const multer = require('multer');
const Task = require('../models/Task');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const { decodeMultipartName, safeFileName } = require('../services/taskFiles');
const v = require('./shared');
const policy = require('./placementPolicy');
const { scope, resource } = require('./workPolicy');
router.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const filter = await scope(req.user,{batchId:req.query.batchId});
    if (req.query.assignmentId) {
      const assignment=await policy.load(req.user, req.query.assignmentId);
      if(req.query.batchId&&String(assignment.batchId)!==req.query.batchId)throw new HttpError(400,'Phân công không thuộc kỳ đã chọn');
      filter.assignmentId = req.query.assignmentId;
    }
    if (req.query.status)
      filter.status = v.choice(
        req.query.status,
        ['todo', 'in_progress', 'review', 'done'],
        'Trạng thái'
      );
    const q = v.search(req.query.q);
    if (q) filter.title = q;
    res.json(await v.paged(Task, filter, req.query));
  })
);
router.post(
  '/tasks',
  requireRole('company', 'mentor'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['assignmentId', 'title', 'description', 'priority', 'dueDate']);
    const a = await policy.load(req.user, req.body.assignmentId, { active: true });
    const dueDate = v.date(req.body.dueDate, 'Hạn task');
    if (dueDate < a.startDate || dueDate > a.endDate)
      throw new HttpError(400, 'Hạn task ngoài thời gian phân công');
    res
      .status(201)
      .json(
        await Task.create({
          assignmentId: a._id,
          topicId: a.topicId,
          title: v.text(req.body.title, 'Tên task', { required: true, max: 200 }),
          description: v.text(req.body.description, 'Mô tả'),
          priority: v.choice(
            req.body.priority || 'medium',
            ['low', 'medium', 'high', 'urgent'],
            'Độ ưu tiên'
          ),
          dueDate,
          companyUserId: a.companyUserId,
          studentUserId: a.studentUserId,
          companyWallet: a.companyWallet,
          assignedStudentWallet: a.studentWallet,
          status: 'todo',
          progress: 0,
          history: [v.event(req.user, 'task.created')],
        })
      );
  })
);
router.patch(
  '/tasks/:id',
  requireRole('student', 'company', 'mentor'),
  asyncHandler(async (req, res) => {
    const { doc, assignment } = await resource(Task, req.user, req.params.id, true);
    const allowed =
      req.user.role === 'student'
        ? ['status', 'progress', 'version']
        : ['title', 'description', 'priority', 'dueDate', 'status', 'progress', 'version'];
    v.keys(req.body, allowed);
    const set = {};
    if (req.body.title !== undefined)
      set.title = v.text(req.body.title, 'Tên task', { required: true, max: 200 });
    if (req.body.description !== undefined) set.description = v.text(req.body.description, 'Mô tả');
    if (req.body.priority !== undefined)
      set.priority = v.choice(req.body.priority, ['low', 'medium', 'high', 'urgent'], 'Ưu tiên');
    if (req.body.dueDate !== undefined) {
      set.dueDate = v.date(req.body.dueDate, 'Hạn');
      if (set.dueDate < assignment.startDate || set.dueDate > assignment.endDate)
        throw new HttpError(400, 'Hạn ngoài phân công');
    }
    if (req.user.role === 'student' && ['review', 'done'].includes(doc.status))
      throw new HttpError(409, 'Công việc đang chờ duyệt hoặc đã hoàn thành');
    if (req.body.status !== undefined)
      set.status = v.choice(
        req.body.status,
        req.user.role === 'student'
          ? ['todo', 'in_progress']
          : ['todo', 'in_progress', 'review', 'done'],
        'Trạng thái'
      );
    if (req.body.progress !== undefined)
      set.progress = v.integer(
        req.body.progress,
        0,
        req.user.role === 'student' ? 99 : 100,
        'Tiến độ'
      );
    const progress = set.progress ?? doc.progress,
      status = set.status ?? doc.status;
    if (
      (status === 'done' && progress !== 100) ||
      (['todo', 'in_progress'].includes(status) && progress === 100)
    )
      throw new HttpError(
        400,
        'Hoàn thành cần tiến độ 100%; dùng Nộp bài để gửi kết quả chờ duyệt'
      );
    set.completedAt = status === 'done' ? new Date() : null;
    res.json(
      await v.updateVersion(
        Task,
        doc,
        req.body.version,
        set,
        v.event(req.user, 'task.updated', {
          before: {
            status: doc.status,
            progress: doc.progress,
            title: doc.title,
            priority: doc.priority,
            dueDate: doc.dueDate,
          },
          after: set,
        })
      )
    );
  })
);
const taskUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 4, fieldSize: 160000 },
}).single('file');
router.post(
  '/tasks/:id/submit',
  requireRole('student'),
  asyncHandler(async (req, _res, next) => {
    const context = await resource(Task, req.user, req.params.id, true);
    if (['review', 'done'].includes(context.doc.status))
      throw new HttpError(
        409,
        'Bài đang chờ duyệt hoặc đã hoàn thành; chỉ nộp lại khi được yêu cầu'
      );
    req.taskContext = context;
    next();
  }),
  (req, res, next) =>
    taskUpload(req, res, (error) => {
      if (error)
        return next(
          new HttpError(
            error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
            error.code === 'LIMIT_FILE_SIZE'
              ? 'Tệp nộp bài không được vượt quá 5 MiB'
              : 'Tệp hoặc thông tin nộp bài không hợp lệ'
          )
        );
      next();
    }),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['content', 'link', 'version', 'fileName']);
    const { doc } = req.taskContext,
      content = v.text(req.body.content, 'Nội dung bài nộp', { max: 40000 }),
      link = v.text(req.body.link, 'Liên kết kết quả', { max: 2000 });
    if (link) {
      let url;
      try {
        url = new URL(link);
      } catch {
        throw new HttpError(400, 'Liên kết kết quả không hợp lệ');
      }
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
        throw new HttpError(400, 'Chỉ nhận liên kết HTTP/HTTPS không chứa thông tin đăng nhập');
    }
    if (!content && !link && !req.file)
      throw new HttpError(400, 'Cần nội dung, liên kết hoặc tệp kết quả');
    let fileName = '',
      mime = '',
      size = 0;
    if (req.file) {
      fileName = safeFileName(
        req.body.fileName === undefined
          ? decodeMultipartName(req.file.originalname)
          : v.text(req.body.fileName, 'Tên tệp', { required: true, max: 240 })
      );
      if (!/\.(pdf|docx|zip|txt|png|jpg|jpeg)$/i.test(fileName) || !req.file.size)
        throw new HttpError(415, 'Chỉ nhận PDF, DOCX, ZIP, TXT, PNG hoặc JPG có nội dung');
      mime = 'application/octet-stream';
      size = req.file.size;
    }
    const submittedAt = new Date(),
      submission = {
        content,
        link,
        submittedAt,
        late: submittedAt > doc.dueDate,
        fileName,
        mime,
        size,
      };
    const version = req.is('multipart/form-data') ? Number(req.body.version) : req.body.version;
    const saved = await v.updateVersion(
      Task,
      doc,
      version,
      {
        submission,
        submissionFileData: req.file?.buffer || null,
        review: null,
        status: 'review',
        progress: 100,
        completedAt: null,
      },
      v.event(req.user, 'task.submitted', {
        submission,
        previous: doc.submission?.toObject?.() || doc.submission || null,
      })
    );
    const result = saved.toObject();
    delete result.submissionFileData;
    res.json(result);
  })
);
router.get(
  '/tasks/:id/submission/file',
  asyncHandler(async (req, res) => {
    const { doc } = await resource(Task, req.user, req.params.id);
    const file = await Task.findById(doc._id).select('+submissionFileData');
    if (!file?.submissionFileData || !file.submission?.fileName)
      throw new HttpError(404, 'Bài nộp chưa có tệp đính kèm');
    res
      .set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="submission.${file.submission.fileName
          .split('.')
          .pop()}"; filename*=UTF-8''${encodeURIComponent(file.submission.fileName)}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      })
      .send(file.submissionFileData);
  })
);
router.get(
  '/tasks/:id/submission/preview',
  asyncHandler(async (req, res) => {
    const { doc } = await resource(Task, req.user, req.params.id);
    const file = await Task.findById(doc._id).select('+submissionFileData'),
      bytes = file?.submissionFileData,
      name = file?.submission?.fileName;
    if (!bytes || !name) throw new HttpError(404, 'Bài nộp chưa có tệp đính kèm');
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    const extension = name.split('.').pop().toLowerCase();
    if (extension === 'txt') {
      const encoding =
        bytes[0] === 0xff && bytes[1] === 0xfe
          ? 'utf-16le'
          : bytes[0] === 0xfe && bytes[1] === 0xff
          ? 'utf-16be'
          : 'utf-8';
      const text = new TextDecoder(encoding).decode(bytes);
      if (text.length > 200000)
        throw new HttpError(413, 'Tệp văn bản quá dài để xem trực tiếp; vui lòng tải về');
      return res.json({ kind: 'text', fileName: name, text });
    }
    if (extension === 'docx') {
      if (bytes.length > 2 * 1024 * 1024)
        throw new HttpError(413, 'DOCX trên 2 MiB cần tải về để xem');
      const parsed = await require('../services/cvParser').parseCv(bytes, 'docx');
      return res.json({
        kind: 'text',
        fileName: name,
        text: parsed.text,
        note: 'Xem nội dung văn bản; tải về để xem bố cục gốc.',
      });
    }
    let mime;
    if (extension === 'pdf' && bytes.subarray(0, 5).toString() === '%PDF-')
      mime = 'application/pdf';
    if (
      extension === 'png' &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      mime = 'image/png';
    if (
      ['jpg', 'jpeg'].includes(extension) &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    )
      mime = 'image/jpeg';
    if (!mime)
      throw new HttpError(
        415,
        'Định dạng này không hỗ trợ xem trực tiếp hoặc tệp không hợp lệ; vui lòng tải về'
      );
    res
      .set({
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="preview.${extension}"`,
      })
      .send(bytes);
  })
);
router.post(
  '/tasks/:id/review',
  requireRole('company', 'mentor'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['decision', 'comment', 'version']);
    const { doc } = await resource(Task, req.user, req.params.id, true);
    if (doc.status !== 'review' || !doc.submission?.submittedAt)
      throw new HttpError(409, 'Chỉ đánh giá công việc đã nộp và đang chờ duyệt');
    const decision = v.choice(req.body.decision, ['approved', 'need_revision'], 'Kết quả'),
      comment = v.text(req.body.comment, 'Nhận xét', { required: true, max: 5000 }),
      approved = decision === 'approved';
    const review = { decision, comment, reviewedAt: new Date(), reviewerUserId: req.user._id };
    res.json(
      await v.updateVersion(
        Task,
        doc,
        req.body.version,
        {
          review,
          status: approved ? 'done' : 'in_progress',
          progress: approved ? 100 : 99,
          completedAt: approved ? new Date() : null,
        },
        v.event(req.user, 'task.reviewed', review)
      )
    );
  })
);
module.exports = router;
