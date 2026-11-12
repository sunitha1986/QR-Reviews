import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { QR_DIR, LOGOS_DIR, UPLOADS_DIR } from './config/constants.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { initDatabase } from './config/db.js';

// Global error handlers to prevent unhandled process termination on IIS / Hostinger
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]:', reason);
});

const app = express();

// Ensure uploads directories exist
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

// CORS & Body Parsers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file servers for uploads & logos
app.use('/uploads/qr-codes', express.static(QR_DIR));
app.use('/uploads/new-QRs', express.static(QR_DIR));
app.use('/uploads/logos', express.static(LOGOS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Mount API Master Router
app.use('/api', apiRoutes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'QR-Reviews API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start HTTP Server as the sole main entry point
const server = app.listen(PORT, () => {
  console.log(`Backend server running on port/pipe: ${PORT}`);
  console.log(`Connected to MySQL DB: ${process.env.DB_NAME || 'u597277762_qr_reviews'}`);
  console.log(`QR codes upload directory: ${QR_DIR}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already in use by another process.`);
    console.error(`👉 Close the process using port ${PORT} or run: npx kill-port ${PORT}\n`);
    process.exit(1);
  } else {
    console.error('[Server Error]:', err);
  }
});

// Initialize MySQL tables and default schemas asynchronously in background
initDatabase()
  .catch((err) => {
    console.error('[MySQL Warning] Database initialization failed on startup:', err.message);
  });

export { app, server };
export default server;
