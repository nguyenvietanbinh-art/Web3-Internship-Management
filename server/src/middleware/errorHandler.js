const { HttpError } = require("../utils/http");

const notFound = (_req, res) => res.status(404).json({ error: "Không tìm thấy endpoint" });

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.code && { code: err.code }) });
  }
  if (err.name === "ValidationError") return res.status(400).json({ error: err.message, code: "VALIDATION" });
  if (err.name === "CastError") return res.status(400).json({ error: "Tham số không hợp lệ", code: "BAD_ID" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON không hợp lệ" });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Nội dung vượt giới hạn cho phép', code: 'PAYLOAD_TOO_LARGE' });
  if (err.code === 11000) return res.status(409).json({ error: "Bản ghi đã tồn tại", code: "DUPLICATE" });
  console.error('Unhandled internal server error'); // Never log request bodies, headers or downstream error objects.
  res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
}

module.exports = { notFound, errorHandler };
