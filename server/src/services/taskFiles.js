// Multipart filenames from older browsers may arrive as UTF-8 decoded as Latin-1.
function decodeMultipartName(value) {
  if (typeof value !== 'string') return '';
  if ([...value].every((c) => c.codePointAt(0) <= 255)) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(value, 'latin1'));
    } catch {
      /* Already Unicode or not UTF-8; preserve it. */
    }
  }
  return value;
}
function safeFileName(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[\\/\u0000-\u001f\u007f]/g, '_')
    .trim()
    .slice(-180);
}
module.exports = { decodeMultipartName, safeFileName };
