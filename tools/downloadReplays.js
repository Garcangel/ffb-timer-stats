import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchReplayGz } from '../timerStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gamesFolderPath = path.join(__dirname, '../../fumbblgames_verbose');
const replaysFolderPath = path.join(__dirname, '../data/replays');

async function getReplayIdFromMatchFile(matchId) {
  const matchPath = path.join(gamesFolderPath, `${matchId}_verbose.json`);
  try {
    const raw = await fs.readFile(matchPath, 'utf8');
    const data = JSON.parse(raw);
    if (data && data.replayId) return data.replayId;
    return null;
  } catch {
    return null;
  }
}

export async function downloadReplayForMatch(matchId) {
  const replayId = await getReplayIdFromMatchFile(matchId);
  if (!replayId) {
    console.log(`No replayId for match ${matchId}`);
    return false;
  }
  try {
    await fs.mkdir(replaysFolderPath, { recursive: true });
  } catch {
    //
  }
  const gzPath = path.join(replaysFolderPath, `${replayId}.json.gz`);
  const ok = await fetchReplayGz(replayId, gzPath);
  if (ok) {
    console.log(
      `Downloaded replay for match ${matchId} (replayId ${replayId})`,
    );
  } else {
    console.log(
      `Failed to download replay for match ${matchId} (replayId ${replayId})`,
    );
  }
  return ok;
}

export async function downloadReplaysFromMatchesInRange(
  startMatchId,
  endMatchId,
) {
  const maxNulls = 20;
  let nullCount = 0;
  for (let matchId = startMatchId; matchId >= endMatchId; matchId--) {
    const ok = await downloadReplayForMatch(matchId);
    if (ok) {
      nullCount = 0;
    } else {
      nullCount++;
      if (nullCount >= maxNulls) {
        console.log(
          `Stopped: reached ${maxNulls} consecutive null/missing matches.`,
        );
        break;
      }
    }
  }
}

export async function downloadReplaysFromMatches(
  startMatchId,
  direction = 'forward',
) {
  const maxNulls = 20;
  let matchId = startMatchId;
  let nullCount = 0;

  while (nullCount < maxNulls) {
    const ok = await downloadReplayForMatch(matchId);
    if (ok) {
      nullCount = 0;
    } else {
      nullCount++;
    }
    matchId = direction === 'forward' ? matchId + 1 : matchId - 1;
  }
  console.log(`Stopped: reached ${maxNulls} consecutive null/missing replies.`);
}

const startMatchId = 4629710;
const endMatchId = 4324892;
// Example usage
// downloadReplaysFromMatches(startMatchId);
// downloadReplaysFromMatchesInRange(startMatchId, endMatchId);
