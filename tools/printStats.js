import { printGlobalTimeStats } from '../statsPrinter.js';
import fs from 'fs/promises';

export async function loadAndPrintGlobalStats(filePath) {
  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const summary = data.global || data; // handle both saved formats
  await printGlobalTimeStats(summary);
}

// NBFL new : 15668
// NCBB new: 15469
// NWBL: 14726
// GDR: 17628
// FDL: 14630
// blackbox: 'blackbox'
const groupId = 'blackbox';
await loadAndPrintGlobalStats('./data/stats/stats_blackbox_summary.json');
