const express = require('express');
const router = express.Router();
const identity = require('../services/businessIdentity');
const { CV } = require('../models/BusinessModels');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const v = require('./shared');
const { saveCvFile } = require('../services/cvFiles');
const { MAX_CV_BYTES, CV_MIME_TYPES } = require('../services/cvFormats');
const fileTypes = Object.values(CV_MIME_TYPES);
const cvFields = ['title', 'summary', 'skills', 'education', 'experience', 'university', 'gpa'];
function cvInput(body) {
  const data = {};
  for (const k of ['title', 'summary', 'education', 'experience', 'university'])
    data[k] = v.text(body[k], k, {
      required: k === 'title',
      max: k === 'title' || k === 'university' ? 200 : 15000,
    });
  data.skills = v.list(body.skills || [], 'Kỹ năng');
  data.gpa = body.gpa === null || body.gpa === undefined ? null : body.gpa;
  if (
    data.gpa !== null &&
    (typeof data.gpa !== 'number' || !Number.isFinite(data.gpa) || data.gpa < 0 || data.gpa > 4)
  )
    throw new HttpError(400, 'GPA phải từ0 đến4');
  return data;
}
router.get(
  '/cv',
  requireRole('student'),
  asyncHandler(async (req, res) =>
    res.json(await CV.findOne(identity.owned(req.user, 'ownerUserId', 'ownerWallet')).lean())
  )
);
router.put(
  '/cv',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, [...cvFields, 'version']);
    const data = cvInput(req.body),
      doc = await CV.findOne(identity.owned(req.user, 'ownerUserId', 'ownerWallet'));
    if (!doc) {
      if (req.body.version !== null) throw new HttpError(409, 'CV chưa có; cần phiên bản null');
      return res
        .status(201)
        .json(
          await CV.create({
            ...data,
            ...identity.refs(req.user, 'ownerUserId', 'ownerWallet'),
            history: [v.event(req.user, 'cv.created')],
          })
        );
    }
    res.json(
      await v.updateVersion(
        CV,
        doc,
        req.body.version,
        data,
        v.event(req.user, 'cv.updated', { fields: Object.keys(data) })
      )
    );
  })
);
router.post(
  '/cv/file',
  requireRole('student'),
  (req, res, next) => {
    if (!fileTypes.includes(req.get('Content-Type')?.split(';')[0].trim().toLowerCase()))
      return next(
        new HttpError(415, 'Chỉ nhận byte PDF/DOCX trực tiếp với MIME đúng, không nhận multipart')
      );
    next();
  },
  express.raw({ type: () => true, limit: MAX_CV_BYTES }),
  asyncHandler(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length)
      throw new HttpError(400, 'Cần nội dung tệp');
    let originalname;
    try {
      originalname = decodeURIComponent(req.get('X-CV-Filename') || '');
    } catch {
      throw new HttpError(400, 'Tên tệp không hợp lệ');
    }
    res.json(
      await saveCvFile(req.user, {
        name: originalname,
        mime: req.get('Content-Type').split(';')[0].trim().toLowerCase(),
        buffer: req.body,
      })
    );
  })
);
router.post(
  '/cv/import-url',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['url']);
    const url = v.text(req.body.url, 'Đường dẫn CV', { required: true, max: 2048 });
    const file = await require('../services/cvDownload').downloadCv(url);
    res.json(await saveCvFile(req.user, file, 'url'));
  })
);
router.delete(
  '/cv/file',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    v.keys(req.body, ['version']);
    v.integer(req.body.version, 0, Number.MAX_SAFE_INTEGER, 'Phiên bản');
    const doc = await CV.findOne(identity.owned(req.user, 'ownerUserId', 'ownerWallet'));
    if (!doc?.fileName) throw new HttpError(404, 'Chưa có tệp CV để xóa');
    const updated = await CV.findOneAndUpdate(
      { _id: doc._id, ...v.versionMatch(req.body.version) },
      {
        $unset: { fileData: 1, fileName: 1, mime: 1, sha256: 1, extractedText: 1, parser: 1 },
        $inc: { __v: 1 },
        $push: { history: v.event(req.user, 'cv.file_removed', { fileName: doc.fileName, sha256: doc.sha256 }) },
      },
      { new: true, runValidators: true }
    );
    if (!updated) throw new HttpError(409, 'CV đã thay đổi; tải lại trước khi xóa tệp', 'STALE_VERSION');
    res.json(updated);
  })
);
router.get(
  '/cv/file',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    const doc = await CV.findOne(identity.owned(req.user, 'ownerUserId', 'ownerWallet')).select(
      '+fileData'
    );
    if (!doc?.fileData) throw new HttpError(404, 'Chưa có tệp CV');
    res
      .set({
        'Content-Type': doc.mime,
        'Content-Disposition': `attachment; filename="cv.${
          doc.mime === 'application/pdf' ? 'pdf' : 'docx'
        }"; filename*=UTF-8''${encodeURIComponent(doc.fileName).replace(
          /['()*]/g,
          (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
        )}`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(doc.fileData);
  })
);
module.exports = router;
