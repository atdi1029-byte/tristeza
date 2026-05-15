// Tristeza Tem Fim — Google Apps Script backend
// Paste this into a new Apps Script project, deploy as Web App
// (Execute as: Me, Who can access: Anyone)
// Then copy the deployment URL into the app's Sync card.

const SHEET_NAME = 'MoodData';
const SETTINGS_CELL = 'A1'; // stores JSON blob of all mood data

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'mood_push') return push(e);
  if (action === 'mood_pull') return pull();
  return ok({ status: 'tristeza running' });
}

// Save entire mood dataset from the app
function push(e) {
  try {
    const raw = decodeURIComponent(e.parameter.data || '{}');
    const incoming = JSON.parse(raw);
    const sheet = getSheet();

    // Merge with existing data (don't overwrite entries not in incoming)
    const existing = readData(sheet);
    const merged = Object.assign({}, existing, incoming);
    writeData(sheet, merged);
    return ok({ status: 'saved', count: Object.keys(merged).length });
  } catch(err) {
    return ok({ status: 'error', msg: err.toString() });
  }
}

// Return all mood data as JSON
function pull() {
  try {
    const sheet = getSheet();
    const data = readData(sheet);
    return ok(data);
  } catch(err) {
    return ok({ status: 'error', msg: err.toString() });
  }
}

function readData(sheet) {
  const val = sheet.getRange(SETTINGS_CELL).getValue();
  if (!val) return {};
  try { return JSON.parse(val); } catch { return {}; }
}

function writeData(sheet, data) {
  sheet.getRange(SETTINGS_CELL).setValue(JSON.stringify(data));
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Also write a human-readable table starting at B1
    sheet.getRange('B1:C1').setValues([['Date', 'Mood']]);
  }
  return sheet;
}

function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: rebuild human-readable table (run manually if you want to see it)
function rebuildTable() {
  const sheet = getSheet();
  const data = readData(sheet);
  const labels = { '2':'Great', '1':'Good', '-1':'Low', '-2':'Rough' };
  const rows = Object.entries(data)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([date, val]) => [date, labels[String(val)] || val]);
  if (!rows.length) return;
  const range = sheet.getRange(2, 2, rows.length, 2);
  range.setValues(rows);
}
