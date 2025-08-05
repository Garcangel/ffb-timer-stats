import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { printCoachTimeStats } from '../statsPrinter.js';

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

function getStatsFromArray(arr) {
  if (!arr.length) return { avg: 0, median: 0, min: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const median =
    sorted.length % 2 === 0 ?
      (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  return {
    avg,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function initAccumulator() {
  const obj = { games: 0 };
  for (const base of BASE_FIELDS) {
    obj[base] = 0;
    obj[`_${base}_values`] = [];
  }
  return obj;
}

async function aggregateCombined(processedDir, groupReplayIds = null) {
  const files = (await fs.readdir(processedDir)).filter((f) =>
    f.endsWith('.json'),
  );
  const filteredFiles =
    groupReplayIds ?
      files.filter((f) => {
        const match = f.match(/(\d+)\.json$/);
        return match && groupReplayIds.includes(Number(match[1]));
      })
    : files;

  let global = initAccumulator();
  let coachStats = {};

  for (const file of filteredFiles) {
    const data = JSON.parse(
      await fs.readFile(path.join(processedDir, file), 'utf8'),
    );

    // Home coach
    const homeCoach = data.homeCoach;
    if (!coachStats[homeCoach]) coachStats[homeCoach] = initAccumulator();
    coachStats[homeCoach].games++;
    global.games++;

    // Away coach
    const awayCoach = data.awayCoach;
    if (!coachStats[awayCoach]) coachStats[awayCoach] = initAccumulator();
    coachStats[awayCoach].games++;
    global.games++;

    for (const base of BASE_FIELDS) {
      // Home
      const hVal = data[`${base}Home`] ?? 0;
      global[base] += hVal;
      global[`_${base}_values`].push(hVal);
      coachStats[homeCoach][base] += hVal;
      coachStats[homeCoach][`_${base}_values`].push(hVal);

      // Away
      const aVal = data[`${base}Away`] ?? 0;
      global[base] += aVal;
      global[`_${base}_values`].push(aVal);
      coachStats[awayCoach][base] += aVal;
      coachStats[awayCoach][`_${base}_values`].push(aVal);
    }
  }

  // Attach summaries
  global.summary = {};
  for (const base of BASE_FIELDS) {
    global.summary[base] = getStatsFromArray(global[`_${base}_values`]);
  }
  for (const coach of Object.keys(coachStats)) {
    coachStats[coach].summary = {};
    for (const base of BASE_FIELDS) {
      coachStats[coach].summary[base] = getStatsFromArray(
        coachStats[coach][`_${base}_values`],
      );
    }
  }

  return { global, coachStats };
}

export async function calcualteDirectoryStats(processedDir) {
  const { global, coachStats } = await aggregateCombined(processedDir);

  console.log('Global summary:', global.summary);
  for (const [coach, stats] of Object.entries(coachStats)) {
    console.log(`Stats for ${coach}:`, stats.summary);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const statsDir = path.join(__dirname, '../data/stats');
  await fs.mkdir(statsDir, { recursive: true });

  // Save full stats
  await fs.writeFile(
    path.join(statsDir, `stats_global.json`),
    JSON.stringify({ global, coachStats }, null, 2),
    'utf8',
  );

  // Save summaries only
  const summaries = {
    global: global.summary,
    coachStats: Object.fromEntries(
      Object.entries(coachStats).map(([coach, stats]) => [
        coach,
        stats.summary,
      ]),
    ),
  };
  await fs.writeFile(
    path.join(statsDir, `stats_global_summary.json`),
    JSON.stringify(summaries, null, 2),
    'utf8',
  );
}

export async function calculateGroupStats(processedDir, groupId) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const statsDir = path.join(__dirname, '../data/stats');
  const groupJsonPath = path.join(
    __dirname,
    '../data/groupReplays/replayIds',
    `replayIds_${groupId}.json`,
  );
  const groupReplayIds = JSON.parse(await fs.readFile(groupJsonPath, 'utf8'));

  const { global, coachStats } = await aggregateCombined(
    processedDir,
    groupReplayIds,
  );

  console.log(`Global summary for group ${groupId}:`, global.summary);
  for (const [coach, stats] of Object.entries(coachStats)) {
    console.log(`Stats for ${coach}:`, stats.summary);
  }

  await fs.mkdir(statsDir, { recursive: true });

  // Save full stats
  await fs.writeFile(
    path.join(statsDir, `stats_${groupId}.json`),
    JSON.stringify({ global, coachStats }, null, 2),
    'utf8',
  );

  // Save summaries only
  const summaries = {
    global: global.summary,
    coachStats: Object.fromEntries(
      Object.entries(coachStats).map(([coach, stats]) => [
        coach,
        stats.summary,
      ]),
    ),
  };
  await fs.writeFile(
    path.join(statsDir, `stats_${groupId}_summary.json`),
    JSON.stringify(summaries, null, 2),
    'utf8',
  );
}

export async function extractCoachTimeStats(statsPath) {
  // Load full or summary stats
  const stats = JSON.parse(await fs.readFile(statsPath, 'utf8'));
  const outPath = path.join(path.dirname(statsPath), 'coach_time_stats.json');

  // Handles both { coachStats: { [coach]: { summary: {...} } } } and { coachStats: { [coach]: {...} } }
  const coachStats = stats.coachStats;

  const result = {};
  for (const [coach, obj] of Object.entries(coachStats)) {
    // Pick source (summary or root)
    const src = obj.summary ? obj.summary : obj;

    result[coach] = {
      averageTurnTime: src.averageTurnTime?.avg ?? null,
      medianTurnTime: src.medianTurnTime?.avg ?? null,
      totalCombinedTime: src.totalCombinedTime?.avg ?? null,
      averageTimePerPlayerTurn: src.averageTimePerPlayerTurn?.avg ?? null,
    };
  }
  await printCoachTimeStats(result);

  await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved coach time stats to ${outPath}`);
}

// Usage example (ESM):
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const processedDir = path.join(__dirname, '../data/processedReplays');

const groupId = 15668;
await calculateGroupStats(processedDir, groupId);
await calcualteDirectoryStats(processedDir);

// Example:
//await extractCoachTimeStats('./data/stats/stats_global_summary.json');
// or
await extractCoachTimeStats('./data/stats/stats_15668_summary.json');
