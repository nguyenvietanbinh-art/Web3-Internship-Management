const MAX_CV_BYTES = 2 * 1024 * 1024;
const CV_MIME_TYPES = Object.freeze({
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

module.exports = { MAX_CV_BYTES, CV_MIME_TYPES };
