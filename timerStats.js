import fs from 'fs';
import path from 'path';
import https from 'https';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { fumbblCommandProcessor } from './fumbblCommandProcessor.js';
import { MiniGameState } from './MiniGameState.js';
import { StatsModel } from './StatsModel.js';
import { printStats } from './statsPrinter.js';
import { pathToFileURL } from 'url';

async function fetchReplayGz(replayId, gzPath) {
  if (fs.existsSync(gzPath)) return;

  const url = `https://fumbbl.com/api/replay/get/${replayId}/gz`;
  await new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(gzPath);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function loadReplayJson(gzPath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    fs.createReadStream(gzPath)
      .pipe(zlib.createGunzip())
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          resolve(JSON.parse(buffer.toString('utf8')));
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}

export async function timerStats(replayId) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const replayGz = path.join(
    __dirname,
    './replays',
    `replay_${replayId}.json.gz`,
  );

  if (!fs.existsSync(path.dirname(replayGz))) {
    fs.mkdirSync(path.dirname(replayGz), { recursive: true });
  }

  await fetchReplayGz(replayId, replayGz);
  const replayJson = await loadReplayJson(replayGz);

  if (!replayJson) {
    console.error('❌ replayJson is null or undefined');
    process.exit(1);
  }
  if (!replayJson.game) {
    console.error('❌ replayJson.game is missing or falsy');
    process.exit(1);
  }
  if (!replayJson.gameLog) {
    console.error('❌ replayJson.gameLog is missing');
    process.exit(1);
  }
  if (!Array.isArray(replayJson.gameLog.commandArray)) {
    console.error(
      `❌ replayJson.gameLog.commandArray is not an array (type: ${typeof replayJson
        .gameLog.commandArray})`,
    );
    process.exit(1);
  }

  const miniGameState = new MiniGameState(replayJson.game);
  const statsModel = new StatsModel();
  statsModel.homeCoach = miniGameState.teamHomeCoach;
  statsModel.awayCoach = miniGameState.teamAwayCoach;
  statsModel.turnLimitMs = miniGameState.turnLimit;

  const commands = [...replayJson.gameLog.commandArray];
  commands.sort((a, b) => a.commandNr - b.commandNr);

  const start = performance.now();
  for (const command of commands) {
    await fumbblCommandProcessor(command, miniGameState, statsModel);
  }
  const end = performance.now();
  console.log(`Processing time: ${(end - start).toFixed(2)} ms`);

  console.log(`Finished processing ${commands.length} commands.`);
  console.log(`Finished processing replay ${replayId}`);
  printStats(statsModel);

  /* const json = JSON.stringify(statsModel, null, 2); 
  fs.writeFileSync('stats.json', json, 'utf8');
  console.log('json :>> ', json); */
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Only runs if this file is executed directly, not imported
  const gameLink = 'https://fumbbl.com/ffblive.jnlp?replay=1830374';
  const match = gameLink.match(/replay=(\d+)/);
  if (!match) {
    console.error('❌ Invalid gameLink format. Must contain ?replay=XXXXXX');
    process.exit(1);
  }
  const replayId = match[1];
  timerStats(replayId);
}
