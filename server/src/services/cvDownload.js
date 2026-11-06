const dns = require('node:dns').promises,
  https = require('node:https'),
  net = require('node:net');
const { HttpError } = require('../utils/http');
const { safeFileName } = require('./taskFiles');
const { MAX_CV_BYTES } = require('./cvFormats');
function publicIpv4(address) {
  if (net.isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}
function parseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, 'Đường dẫn CV không hợp lệ');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    value.length > 2048 ||
    !url.hostname ||
    url.hostname.includes(':')
  )
    throw new HttpError(400, 'Dùng đường dẫn HTTPS công khai trực tiếp tới tệp PDF/DOCX');
  url.hash = '';
  return url;
}
async function downloadCv(value, { lookup = dns.lookup.bind(dns), request = https.request } = {}) {
  let url = parseUrl(value);
  const until = Date.now() + 15000;
  for (let hop = 0; hop <= 3; hop++) {
    const remaining = until - Date.now();
    if (remaining <= 0)
      throw new HttpError(504, 'Tải CV quá thời gian; hãy tải file về máy và chọn lại');
    let timer, addresses;
    try {
      addresses = await Promise.race([
        lookup(url.hostname, { all: true, family: 4 }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('DNS timeout')), Math.min(3000, remaining));
        }),
      ]);
    } catch {
      throw new HttpError(400, 'Không truy cập được tên miền của CV');
    } finally {
      clearTimeout(timer);
    }
    if (!addresses.length || addresses.some((a) => !publicIpv4(a.address)))
      throw new HttpError(400, 'Đường dẫn CV phải thuộc máy chủ công khai');
    const address = addresses[0].address;
    const result = await new Promise((resolve, reject) => {
      let settled = false,
        timeout;
      const finish = (error, data) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        error ? reject(error) : resolve(data);
      };
      const req = request(
        url,
        {
          method: 'GET',
          family: 4,
          lookup: (_host, options, callback) => {
            if (typeof options === 'function') {
              callback = options;
              options = {};
            }
            callback(null, options?.all ? [{ address, family: 4 }] : address, 4);
          },
          headers: {
            Accept:
              'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/octet-stream',
            'Accept-Encoding': 'identity',
            'User-Agent': 'Internova-CV-Import/1.0',
          },
        },
        (response) => {
          response.on('error', () => finish(new HttpError(502, 'Không tải được tệp CV')));
          if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
            response.destroy();
            return finish(null, { redirect: response.headers.location });
          }
          if (response.statusCode !== 200) {
            response.destroy();
            return finish(
              new HttpError(
                400,
                'Liên kết không trả về tệp CV công khai; hãy kiểm tra quyền chia sẻ'
              )
            );
          }
          const mime = String(response.headers['content-type'] || '')
            .split(';')[0]
            .trim()
            .toLowerCase();
          if (
            ![
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/octet-stream',
            ].includes(mime)
          ) {
            response.destroy();
            return finish(
              new HttpError(
                415,
                'Link phải dẫn trực tiếp tới PDF/DOCX, không phải trang web xem CV'
              )
            );
          }
          if (Number(response.headers['content-length']) > MAX_CV_BYTES) {
            response.destroy();
            return finish(new HttpError(413, 'Tệp CV không được vượt quá 2 MiB'));
          }
          const chunks = [];
          let size = 0;
          response.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_CV_BYTES) {
              response.destroy();
              finish(new HttpError(413, 'Tệp CV không được vượt quá 2 MiB'));
            } else chunks.push(chunk);
          });
          response.on('aborted', () => finish(new HttpError(502, 'Kết nối tải CV bị gián đoạn')));
          response.on('end', () => {
            if (!size) return finish(new HttpError(400, 'Tệp CV không có nội dung'));
            let name;
            const disposition = String(response.headers['content-disposition'] || ''),
              utf8 = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i),
              plain = disposition.match(/filename\s*=\s*"([^"]+)"/i);
            try {
              name = utf8
                ? decodeURIComponent(utf8[1])
                : plain
                ? plain[1]
                : decodeURIComponent(url.pathname.split('/').pop() || '');
            } catch {
              name = '';
            }
            const extension =
              mime === 'application/pdf'
                ? 'pdf'
                : mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ? 'docx'
                : name?.toLowerCase().split('.').pop();
            if (!['pdf', 'docx'].includes(extension))
              return finish(new HttpError(415, 'Không xác định được tệp PDF/DOCX từ đường dẫn'));
            if (!name || !name.toLowerCase().endsWith('.' + extension)) name = 'CV.' + extension;
            finish(null, {
              buffer: Buffer.concat(chunks),
              name: safeFileName(name),
              mime:
                extension === 'pdf'
                  ? 'application/pdf'
                  : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
          });
        }
      );
      timeout = setTimeout(() => {
        req.destroy();
        finish(new HttpError(504, 'Tải CV quá thời gian; hãy tải file về máy và chọn lại'));
      }, Math.max(1, until - Date.now()));
      req.on('error', () =>
        finish(new HttpError(502, 'Không tải được tệp CV; kiểm tra link hoặc chọn file từ máy'))
      );
      req.end();
    });
    if (!Object.hasOwn(result, 'redirect')) return result;
    if (!result.redirect || hop === 3)
      throw new HttpError(400, 'Link chuyển hướng quá nhiều hoặc không hợp lệ');
    try {
      url = parseUrl(new URL(result.redirect, url).href);
    } catch (e) {
      throw e instanceof HttpError ? e : new HttpError(400, 'Link chuyển hướng không hợp lệ');
    }
  }
}
module.exports = { downloadCv, publicIpv4, parseUrl };
