import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Clean initial state (no pre-seeded QRs, clients, or reviews)
const defaultData = {
  users: [
    {
      id: 'user-superadmin-1',
      username: 'sadmin',
      password: 'sadmin@123',
      name: 'Super Admin',
      role: 'superadmin'
    },
    {
      id: 'user-client-1',
      username: 'admin',
      password: 'admin@123',
      name: 'Client Admin',
      role: 'admin',
      clientId: null
    }
  ],
  qrs: [],
  clients: [],
  reviews: []
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return defaultData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

export {
  readDb,
  writeDb
};

export default {
  readDb,
  writeDb
};
