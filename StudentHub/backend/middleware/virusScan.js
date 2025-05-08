const NodeClam = require('clamscan');

let clamscan;

async function initClamScan() {
  if (!clamscan) {
    const ClamScan = await new NodeClam().init({
      removeInfected: true,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      preference: 'clamscan',
    });
    clamscan = ClamScan;
  }
}

async function virusScan(req, res, next) {
  try {
    await initClamScan();
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const { path } = req.file;
    const { isInfected, viruses } = await clamscan.isInfected(path);
    if (isInfected) {
      return res.status(400).json({ message: 'File is infected', viruses });
    }
    next();
  } catch (err) {
    console.error('Virus scan error:', err);
    res.status(500).json({ message: 'Virus scan failed' });
  }
}

module.exports = virusScan;
