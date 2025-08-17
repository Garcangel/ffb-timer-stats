import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchReplayGz } from '../timerStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../data/groupReplays/cache');

const TOURNAMENTS_CACHE = (groupId) =>
  path.join(CACHE_DIR, `tournaments_${groupId}.json`);

const TOURNAMENT_SCHEDULE_CACHE = (id) =>
  path.join(CACHE_DIR, `schedule_${id}.json`);

export async function fetchGroupTournaments(groupId) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = TOURNAMENTS_CACHE(groupId);

  try {
    const data = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(data);
  } catch {
    //
  }

  const url = `https://fumbbl.com/api/group/tournaments/${groupId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch tournaments: ${res.status}`);
  const tournaments = await res.json();

  await fs.writeFile(cachePath, JSON.stringify(tournaments, null, 2), 'utf8');
  return tournaments;
}

export async function fetchTournamentSchedule(tournamentId) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = TOURNAMENT_SCHEDULE_CACHE(tournamentId);

  try {
    const data = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(data);
  } catch {
    //
  }

  const url = `https://fumbbl.com/api/tournament/schedule/${tournamentId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status}`);
  const schedule = await res.json();
  await fs.writeFile(cachePath, JSON.stringify(schedule, null, 2), 'utf8');
  return schedule;
}

export function getTournamentIds(tournaments) {
  return tournaments.map((t) => t.id);
}

export function extractReplayIdsFromSchedule(scheduleArr) {
  return scheduleArr
    .map((e) => e.result?.replayId)
    .filter((id) => typeof id === 'number' && id > 0);
}

export async function saveReplayIds(groupId, replayIds) {
  const dir = path.join(__dirname, '../data/groupReplays/replayIds');
  await fs.mkdir(dir, { recursive: true });
  const replayIdsPath = path.join(dir, `replayIds_${groupId}.json`);
  await fs.writeFile(replayIdsPath, JSON.stringify(replayIds, null, 2), 'utf8');
  console.log(`Saved ${replayIds.length} replayIds to ${replayIdsPath}`);
}

export async function fetchAllReplayIdsForGroup(groupId) {
  const tournaments = await fetchGroupTournaments(groupId);
  const tournamentIds = getTournamentIds(tournaments);
  console.log('Tournament IDs:', tournamentIds);

  let allReplayIds = [];
  for (let i = 0; i < tournamentIds.length; i++) {
    const id = tournamentIds[i];
    const schedule = await fetchTournamentSchedule(id);
    const replayIds = extractReplayIdsFromSchedule(schedule);
    allReplayIds.push(...replayIds);
    console.log(
      `Downloaded ${i + 1} of ${tournamentIds.length}: Tournament ${id} (${replayIds.length} replayIds)`,
    );
  }
  allReplayIds = [...new Set(allReplayIds)];
  await saveReplayIds(groupId, allReplayIds);
  return allReplayIds;
}

export async function downloadAllReplays(replayIds) {
  const replaysDir = path.join(__dirname, '../data/replays');
  await fs.mkdir(replaysDir, { recursive: true });
  for (let i = 0; i < replayIds.length; i++) {
    const replayId = replayIds[i];
    const gzPath = path.join(replaysDir, `replay_${replayId}.json.gz`);
    const t0 = performance.now();
    try {
      await fetchReplayGz(replayId, gzPath);
      const t1 = performance.now();
      console.log(
        `Downloaded ${i + 1} of ${replayIds.length}: replay_${replayId}.json.gz | ${(t1 - t0).toFixed(2)} ms`,
      );
    } catch (e) {
      const t1 = performance.now();
      console.error(
        `Failed to download replay ${replayId} (${(t1 - t0).toFixed(2)} ms): ${e.message}`,
      );
    }
  }
}

export async function loadReplayIds(groupId) {
  const dir = path.join(__dirname, '../data/groupReplays/replayIds');
  const replayIdsPath = path.join(dir, `replayIds_${groupId}.json`);
  try {
    const data = await fs.readFile(replayIdsPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    throw new Error(`Failed to load replayIds: ${e.message}`);
  }
}

// NBFL new : 15668
// NCBB new: 15469
// NWBL: 14726
// GDR: 17628
// FDL: 14630
// blackbox: 'blackbox'
const groupId = 'blackbox';

//const replayIds = await fetchAllReplayIdsForGroup(groupId);
//console.log(replayIds);

const replayIds = await loadReplayIds(groupId);

await downloadAllReplays(replayIds);
