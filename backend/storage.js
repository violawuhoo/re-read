const fs = require('fs');
const path = require('path');
const os = require('os');
const { reportLibrary } = require('./report-fixtures');

const dataDir = process.env.REREAD_DATA_DIR
  ? path.resolve(process.env.REREAD_DATA_DIR)
  : path.join(os.homedir(), '.reread');
const storeFile = path.join(dataDir, 'generated-reports.json');

const ensureStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(reportLibrary, null, 2), 'utf-8');
  }
};

const loadReports = () => {
  ensureStore();
  return JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
};

const saveReports = (reports) => {
  ensureStore();
  fs.writeFileSync(storeFile, JSON.stringify(reports, null, 2), 'utf-8');
};

module.exports = {
  loadReports,
  saveReports,
  storeFile
};
