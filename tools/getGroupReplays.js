import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { closeReplayAgent, fetchReplayGz } from '../fetchReplayGz.js';
import dotenv from 'dotenv';
dotenv.config();

const USER_AGENT = process.env.USER_AGENT || null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../data/groupReplays/cache');

const TOURNAMENTS_CACHE = (groupId) =>
  path.join(CACHE_DIR, `tournaments_${groupId}.json`);

const TOURNAMENT_SCHEDULE_CACHE = (id) =>
  path.join(CACHE_DIR, `schedule_${id}.json`);

async function fetchGroupTournaments(groupId) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = TOURNAMENTS_CACHE(groupId);

  try {
    const data = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(data);
  } catch {
    //
  }

  const url = `https://fumbbl.com/api/group/tournaments/${groupId}`;
  const res = await fetch(url, {
    headers: USER_AGENT ? { 'User-Agent': USER_AGENT } : {},
  });
  if (!res.ok) throw new Error(`Failed to fetch tournaments: ${res.status}`);
  const tournaments = await res.json();

  await fs.writeFile(cachePath, JSON.stringify(tournaments, null, 2), 'utf8');
  return tournaments;
}

async function fetchTournamentSchedule(tournamentId) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = TOURNAMENT_SCHEDULE_CACHE(tournamentId);

  try {
    const data = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(data);
  } catch {
    //
  }

  const url = `https://fumbbl.com/api/tournament/schedule/${tournamentId}`;
  const res = await fetch(url, {
    headers: USER_AGENT ? { 'User-Agent': USER_AGENT } : {},
  });
  if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status}`);
  const schedule = await res.json();
  await fs.writeFile(cachePath, JSON.stringify(schedule, null, 2), 'utf8');
  return schedule;
}

function getTournamentIds(tournaments) {
  return tournaments.map((t) => t.id);
}

function extractReplayIdsFromSchedule(scheduleArr) {
  return scheduleArr
    .map((e) => e.result?.replayId)
    .filter((id) => typeof id === 'number' && id > 0);
}

async function saveReplayIds(groupId, replayIds) {
  const dir = path.join(__dirname, '../data/groupReplays/replayIds');
  await fs.mkdir(dir, { recursive: true });
  const replayIdsPath = path.join(dir, `replayIds_${groupId}.json`);
  await fs.writeFile(replayIdsPath, JSON.stringify(replayIds, null, 2), 'utf8');
  console.log(`Saved ${replayIds.length} replayIds to ${replayIdsPath}`);
}

async function fetchAllReplayIdsForGroup(groupId) {
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

async function downloadAllReplays(replayIds) {
  const replaysDir = path.join(__dirname, '../data/replays');
  await fs.mkdir(replaysDir, { recursive: true });

  for (let i = 0; i < replayIds.length; i++) {
    const replayId = replayIds[i];
    const gzPath = path.join(replaysDir, `replay_${replayId}.json.gz`);
    try {
      const elapsed = await fetchReplayGz(replayId, gzPath, USER_AGENT, 1000);

      if (elapsed !== false) {
        console.log(
          `Downloaded ${i + 1} of ${replayIds.length}: replay_${replayId}.json.gz | ${elapsed.toFixed(2)} ms`,
        );
      } else {
        console.log(
          `Skipped ${i + 1} of ${replayIds.length}: replay_${replayId}.json.gz already exists`,
        );
      }
    } catch (e) {
      console.error(`Failed to download replay ${replayId}: ${e.message}`);
    }
  }
  closeReplayAgent();
}

async function loadReplayIds(groupId) {
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
const groupId = 'nonBlackbox';

//const replayIds = await fetchAllReplayIdsForGroup(groupId);
//console.log(replayIds);

const replayIds = await loadReplayIds(groupId);

await downloadAllReplays(replayIds);
