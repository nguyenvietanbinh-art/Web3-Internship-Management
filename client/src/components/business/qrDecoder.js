import { BrowserQRCodeReader } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';

export function createQrReader() {
  const reader = new BrowserQRCodeReader(new Map([[DecodeHintType.TRY_HARDER, true]]), { delayBetweenScanAttempts: 200 });
  const decode = reader.reader.decode.bind(reader.reader);
  reader.reader.decode = (bitmap, hints) => {
    try { return decode(bitmap, hints); }
    catch {
      // Dense, upright QR images can confuse finder-pattern selection. The real
      // ZXing pure-image path still parses the symbol and validates error correction;
      // it never invents a payload. Ordinary camera detection remains the first path.
      const pure = new Map(hints);
      pure.set(DecodeHintType.PURE_BARCODE, true);
      return decode(bitmap, pure);
    }
  };
  return reader;
}
