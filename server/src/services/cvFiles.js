const crypto = require('node:crypto');
const { CV } = require('../models/BusinessModels');
const identity = require('./businessIdentity');
const { HttpError } = require('../utils/http');
const v = require('../core/shared');
const { parseCv } = require('./cvParser');
const { safeFileName } = require('./taskFiles');
const { MAX_CV_BYTES, CV_MIME_TYPES } = require('./cvFormats');
async function saveCvFile(user, { buffer, name, mime }, source = 'local') {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new HttpError(400, 'Cần nội dung tệp');
  if (buffer.length > MAX_CV_BYTES) throw new HttpError(413, 'Tệp CV không được vượt quá 2 MiB');
  if (typeof name !== 'string' || name.length > 240)
    throw new HttpError(400, 'Tên tệp không hợp lệ');
  name = safeFileName(name);
  const extension = name.toLowerCase().split('.').pop();
  const expected = CV_MIME_TYPES;
  if (!expected[extension] || mime !== expected[extension])
    throw new HttpError(415, 'Chỉ nhận PDF/DOCX với MIME đúng');
  const doc = await CV.findOne(identity.owned(user, 'ownerUserId', 'ownerWallet'));
  const parsed = await parseCv(buffer, extension),
    sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const fields = {
    fileData: buffer,
    fileName: name,
    mime,
    sha256,
    extractedText: parsed.text,
    parser: parsed.parser,
  };
  const event = v.event(user, 'cv.file_uploaded', {
    fileName: name,
    sha256,
    parser: parsed.parser,
    source,
  });
  const saved = doc
    ? await v.updateVersion(CV, doc, doc.__v, fields, event)
    : await CV.create({
        ...identity.refs(user, 'ownerUserId', 'ownerWallet'),
        title: name.replace(/\.(pdf|docx)$/i, ''),
        ...fields,
        history: [v.event(user, 'cv.created'), event],
      });
  const obj = saved.toObject();
  delete obj.fileData;
  return obj;
}
module.exports = { saveCvFile };
