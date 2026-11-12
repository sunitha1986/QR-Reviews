import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const QR_DIR = path.join(UPLOADS_DIR, 'qr-codes');
const LOGOS_DIR = path.join(UPLOADS_DIR, 'logos');
const DATA_DIR = path.join(__dirname, '..', 'data');

export {
  UPLOADS_DIR,
  QR_DIR,
  LOGOS_DIR,
  DATA_DIR
};

export default {
  UPLOADS_DIR,
  QR_DIR,
  LOGOS_DIR,
  DATA_DIR
};
