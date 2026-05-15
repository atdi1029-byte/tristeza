// Tristeza Tem Fim — Google Apps Script backend
// Paste into a new Apps Script project bound to a Google Sheet.
// Deploy as Web App: Execute as Me, Access: Anyone.
// Returns JSONP (same pattern as Cadence) — bypasses all CORS issues.

const SHEET_NAME = 'MoodData';
const DATA_CELL  = 'A1';   // stores entire JSON blob

function doGet(e) {
  const cb     = e.parameter.callback || '';
  const action = e.parameter.action   || '';

  if (action === 'mood_push') return respond(cb, push(e));
  if (action === 'mood_pull') return respond(cb, pull());
  return respond(cb, { ok: true, status: 'tristeza running' });
}

// ── Save ──────────────────────────────────────────────────────
function push(e) {
  try {
    const raw      = decodeURIComponent(e.parameter.data || '{}');
    const incoming = JSON.parse(raw);
    const sheet    = getSheet();
    const existing = readData(sheet);
    const merged   = Object.assign({}, existing, incoming);
    writeData(sheet, merged);
    return { ok: true, count: Object.keys(merged).length };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// ── Load ──────────────────────────────────────────────────────
function pull() {
  try {
    return { ok: true, data: readData(getSheet()) };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// ── Helpers ───────────────────────────────────────────────────
function readData(sheet) {
  const val = sheet.getRange(DATA_CELL).getValue();
  if (!val) return {};
  try { return JSON.parse(val); } catch { return {}; }
}

function writeData(sheet, data) {
  sheet.getRange(DATA_CELL).setValue(JSON.stringify(data));
  // Also write a human-readable table next to it (col B/C)
  const labels = { '2':'Great','1':'Good','-1':'Low','-2':'Rough' };
  const rows = Object.entries(data)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([date,val]) => [date, labels[String(val)] || val]);
  if (rows.length) {
    sheet.getRange(1, 2, sheet.getMaxRows(), 2).clearContent();
    sheet.getRange(1, 2, rows.length, 2).setValues(rows);
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

// JSONP wrapper — same as Cadence
function respond(cb, obj) {
  const json = JSON.stringify(obj);
  const body = cb ? `${cb}(${json})` : json;
  const mime = cb
    ? ContentService.MimeType.JAVASCRIPT
    : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(body).setMimeType(mime);
}
