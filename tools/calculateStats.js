import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { printCoachTimeStats } from '../statsPrinter.js';
import { P2Median } from './P2Median.js';

const BASE_FIELDS = [
  'totalTurns',
  'totalTime',
  'averageTurnTime',
  'medianTurnTime',
  'turnsExceededLimit',
  'minTurnTime',
  'maxTurnTime',
  'averageTimePerPlayerTurn',
  'averageTimeUntilFirstAction',
  'medianTimeUntilFirstAction',
  'totalPassiveTime',
  'averagePassiveTime',
  'medianPassiveTime',
  'passiveEventCount',
  'totalSetupTime',
  'averageSetupTime',
  'totalTimedKickoffTime',
  'averageTimedKickoffTime',
  'timedKickoffCount',
  'totalCombinedTime',
];

// median helper only when values are stored (global)
function statsFromArray(arr) {
  if (!arr.length) return { avg: 0, median: 0, min: 0, max: 0, n: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const median =
    n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return { avg: sum / n, median, min: sorted[0], max: sorted[n - 1], n };
}

function initAccumulator(storeValues) {
  const acc = { entries: 0, _storeValues: !!storeValues };
  for (const f of BASE_FIELDS) {
    acc[f] = 0; // sum
    acc[`${f}_min`] = Number.POSITIVE_INFINITY;
    acc[`${f}_max`] = Number.NEGATIVE_INFINITY;
    if (storeValues) acc[`${f}_values`] = [];
    else acc[`${f}_p2`] = new P2Median();
  }
  return acc;
}

function ensureCoach(map, name) {
  if (!map[name]) map[name] = initAccumulator(false); // no values per coach
  return map[name];
}

function addValue(acc, field, v) {
  acc[field] += v;
  acc[`${field}_min`] = Math.min(acc[`${field}_min`], v);
  acc[`${field}_max`] = Math.max(acc[`${field}_max`], v);
  if (acc._storeValues) acc[`${field}_values`].push(v);
  else acc[`${field}_p2`].update(v);
}

async function aggregateCombined(
  processedDir,
  groupReplayIds = null,
  { globalMedians = false } = {},
) {
  const files = (await fs.readdir(processedDir)).filter((f) =>
    f.endsWith('.json'),
  );
  const filtered =
    groupReplayIds ?
      files.filter((f) => {
        const m = f.match(/(\d+)\.json$/);
        return m && groupReplayIds.includes(Number(m[1]));
      })
    : files;

  const global = initAccumulator(globalMedians);
  const coachStats = {};

  for (const file of filtered) {
    const data = JSON.parse(
      await fs.readFile(path.join(processedDir, file), 'utf8'),
    );

    const homeCoach = data.homeCoach;
    const awayCoach = data.awayCoach;
    const home = ensureCoach(coachStats, homeCoach);
    const away = ensureCoach(coachStats, awayCoach);

    // each file contributes two “entries”: home+away
    global.entries += 2;
    home.entries += 1;
    away.entries += 1;

    for (const base of BASE_FIELDS) {
      const hVal = data[`${base}Home`] ?? 0;
      const aVal = data[`${base}Away`] ?? 0;

      addValue(global, base, hVal);
      addValue(global, base, aVal);

      addValue(home, base, hVal);
      addValue(away, base, aVal);
    }
  }

  // summaries
  global.summary = {};
  for (const base of BASE_FIELDS) {
    const count = global.entries;
    let median = 0,
      min = 0,
      max = 0;
    if (global._storeValues) {
      const s = statsFromArray(global[`${base}_values`]);
      median = s.median;
      min = s.min;
      max = s.max;
    } else {
      min = global[`${base}_min`] === Infinity ? 0 : global[`${base}_min`];
      max = global[`${base}_max`] === -Infinity ? 0 : global[`${base}_max`];
    }
    global.summary[base] = {
      avg: count ? global[base] / count : 0,
      median,
      min,
      max,
      n: count,
    };
  }

  for (const [coach, acc] of Object.entries(coachStats)) {
    const count = acc.entries;
    acc.summary = {};
    for (const base of BASE_FIELDS) {
      acc.summary[base] = {
        avg: count ? acc[base] / count : 0,
        median: acc[`${base}_p2`].get(),
        min: acc[`${base}_min`] === Infinity ? 0 : acc[`${base}_min`],
        max: acc[`${base}_max`] === -Infinity ? 0 : acc[`${base}_max`],
        n: count,
      };
    }
  }

  return { global, coachStats };
}

export async function calculateDirectoryStats(processedDir) {
  const { global, coachStats } = await aggregateCombined(processedDir, null, {
    globalMedians: true,
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const statsDir = path.join(__dirname, '../data/stats');
  await fs.mkdir(statsDir, { recursive: true });

  await fs.writeFile(
    path.join(statsDir, 'stats_global.json'),
    JSON.stringify({ global, coachStats }, null, 2),
    'utf8',
  );

  const summaries = {
    global: global.summary,
    coachStats: Object.fromEntries(
      Object.entries(coachStats).map(([coach, s]) => [coach, s.summary]),
    ),
  };
  await fs.writeFile(
    path.join(statsDir, 'stats_global_summary.json'),
    JSON.stringify(summaries, null, 2),
    'utf8',
  );
}

export async function calculateGroupStats(processedDir, groupId) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const groupJsonPath = path.join(
    __dirname,
    '../data/groupReplays/replayIds',
    `replayIds_${groupId}.json`,
  );
  const groupReplayIds = JSON.parse(await fs.readFile(groupJsonPath, 'utf8'));

  const { global, coachStats } = await aggregateCombined(
    processedDir,
    groupReplayIds,
    { globalMedians: true },
  );

  const statsDir = path.join(__dirname, '../data/stats');
  await fs.mkdir(statsDir, { recursive: true });

  await fs.writeFile(
    path.join(statsDir, `stats_${groupId}.json`),
    JSON.stringify({ global, coachStats }, null, 2),
    'utf8',
  );

  const summaries = {
    global: global.summary,
    coachStats: Object.fromEntries(
      Object.entries(coachStats).map(([coach, s]) => [coach, s.summary]),
    ),
  };
  await fs.writeFile(
    path.join(statsDir, `stats_${groupId}_summary.json`),
    JSON.stringify(summaries, null, 2),
    'utf8',
  );
}

export async function extractCoachTimeStats(statsPath) {
  const stats = JSON.parse(await fs.readFile(statsPath, 'utf8'));
  const outPath = path.join(path.dirname(statsPath), 'coach_time_stats.json');

  const coachStats = stats.coachStats;
  const result = {};
  for (const [coach, obj] of Object.entries(coachStats)) {
    const src = obj.summary ? obj.summary : obj;
    result[coach] = {
      averageTurnTime: src.averageTurnTime?.avg ?? null,
      medianTurnTime: src.medianTurnTime?.median ?? null,
      totalCombinedTime: src.totalCombinedTime?.avg ?? null,
      averageTimePerPlayerTurn: src.averageTimePerPlayerTurn?.avg ?? null,
    };
  }

  await printCoachTimeStats(result);
  await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved coach time stats to ${outPath}`);
}

// --- usage ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const processedDir = path.join(__dirname, '../data/processedReplays');

// NBFL new : 15668
// NCBB new: 15469
// NWBL: 14726
// GDR: 17628
// FDL: 14630
// blackbox: 'blackbox'
const groupId = 'blackbox';
await calculateGroupStats(processedDir, groupId);
//await calcualteDirectoryStats(processedDir);

// Example:
//await extractCoachTimeStats('./data/stats/stats_global_summary.json');
// or
await extractCoachTimeStats(`./data/stats/stats_${groupId}_summary.json`);
