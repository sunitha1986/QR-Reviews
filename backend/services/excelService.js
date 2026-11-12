import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let ExcelJS = null;
let excelJsAttempted = false;

/**
 * Safely lazy-load ExcelJS so that if fast-csv or exceljs files are missing on
 * the hosting server, Node does not crash on boot and falls back to pure CSV.
 */
async function getExcelJS() {
  if (excelJsAttempted) return ExcelJS;
  excelJsAttempted = true;
  try {
    const mod = await import('exceljs');
    ExcelJS = mod.default || mod;
    return ExcelJS;
  } catch (err) {
    console.warn('[ExcelService] ExcelJS module could not be loaded, using pure CSV fallback. Reason:', err.message);
    ExcelJS = null;
    return null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Columns definition
const COLUMNS = [
  { header: 'Review ID', key: 'id', width: 20 },
  { header: 'Submission Date', key: 'date', width: 22 },
  { header: 'Client / Business', key: 'clientName', width: 28 },
  { header: 'QR Unique ID', key: 'qrId', width: 20 },
  { header: 'Customer Phone', key: 'phone', width: 20 },
  { header: 'Customer Feedback & Comments', key: 'comments', width: 55 }
];

// Helper to escape CSV cell value
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Pure Node.js CSV Fallback - appends review to CSV file with UTF-8 BOM
 */
function appendToCsv(filePath, reviewData) {
  const fileExists = fs.existsSync(filePath);

  const row = [
    escapeCsv(reviewData.id),
    escapeCsv(new Date(reviewData.createdAt).toLocaleString()),
    escapeCsv(reviewData.clientName || 'General'),
    escapeCsv(reviewData.qrId),
    escapeCsv(reviewData.phone || ''),
    escapeCsv(reviewData.comments || '')
  ].join(',') + '\r\n';

  if (!fileExists) {
    const headers = COLUMNS.map(col => escapeCsv(col.header)).join(',') + '\r\n';
    fs.writeFileSync(filePath, '\uFEFF' + headers + row, 'utf8');
  } else {
    fs.appendFileSync(filePath, row, 'utf8');
  }
}

// Helper to style header row in ExcelJS
function applyHeaderStyles(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };
    cell.font = {
      name: 'Segoe UI',
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });
}

// Helper to style data row in ExcelJS
function applyRowStyles(row, isEven) {
  row.height = 24;
  row.eachCell((cell, colNumber) => {
    cell.font = { name: 'Segoe UI', size: 10 };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNumber === 7 ? 'left' : 'center',
      wrapText: colNumber === 7
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  });
}

/**
 * Appends review to an Excel workbook file safely, falling back to CSV if ExcelJS is missing
 */
async function appendToWorkbook(filePath, reviewData) {
  const excel = await getExcelJS();
  if (!excel) {
    const csvPath = filePath.replace(/\.xlsx$/i, '.csv');
    appendToCsv(csvPath, reviewData);
    return;
  }

  try {
    let workbook = new excel.Workbook();
    let worksheet = null;

    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          await workbook.xlsx.readFile(filePath);
          worksheet = workbook.getWorksheet('Reviews') || workbook.worksheets[0];
        }
      } catch (readErr) {
        console.warn(`[ExcelService] File ${filePath} exists but could not be parsed. Resetting. Reason: ${readErr.message}`);
        worksheet = null;
      }
    }

    if (!worksheet) {
      workbook = new excel.Workbook();
      worksheet = workbook.addWorksheet('Reviews', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });
      worksheet.columns = COLUMNS;
      applyHeaderStyles(worksheet);
    }

    const rowCount = worksheet.rowCount;

    const newRow = worksheet.addRow({
      id: reviewData.id,
      date: new Date(reviewData.createdAt).toLocaleString(),
      clientName: reviewData.clientName || 'General',
      qrId: reviewData.qrId,
      phone: reviewData.phone || '',
      comments: reviewData.comments || ''
    });

    applyRowStyles(newRow, rowCount % 2 === 0);

    await workbook.xlsx.writeFile(filePath);
  } catch (excelErr) {
    console.warn('[ExcelService] ExcelJS write failed, falling back to CSV:', excelErr.message);
    const csvPath = filePath.replace(/\.xlsx$/i, '.csv');
    appendToCsv(csvPath, reviewData);
  }
}

/**
 * Main export to append a review into client & master excel/csv sheets
 */
async function recordReviewInExcel(reviewData) {
  const masterPath = path.join(DATA_DIR, 'reviews_master.xlsx');
  await appendToWorkbook(masterPath, reviewData);

  if (reviewData.clientId) {
    const safeClientId = reviewData.clientId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const clientPath = path.join(DATA_DIR, `reviews_${safeClientId}.xlsx`);
    await appendToWorkbook(clientPath, reviewData);
  }
}

/**
 * Get path to client's review export file (checks .xlsx first, then .csv, then master)
 */
function getClientExcelPath(clientId) {
  const safeClientId = clientId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const clientXlsx = path.join(DATA_DIR, `reviews_${safeClientId}.xlsx`);
  if (fs.existsSync(clientXlsx)) return clientXlsx;

  const clientCsv = path.join(DATA_DIR, `reviews_${safeClientId}.csv`);
  if (fs.existsSync(clientCsv)) return clientCsv;

  // Return master file if client file doesn't exist yet
  return getMasterExcelPath();
}

/**
 * Get path to master review export file (checks .xlsx then .csv)
 */
function getMasterExcelPath() {
  const masterXlsx = path.join(DATA_DIR, 'reviews_master.xlsx');
  if (fs.existsSync(masterXlsx)) return masterXlsx;

  const masterCsv = path.join(DATA_DIR, 'reviews_master.csv');
  if (fs.existsSync(masterCsv)) return masterCsv;

  return null;
}

export {
  recordReviewInExcel,
  getClientExcelPath,
  getMasterExcelPath
};

export default {
  recordReviewInExcel,
  getClientExcelPath,
  getMasterExcelPath
};
