import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { fumbblCommandProcessor } from './processors/fumbblCommandProcessor.js';
import { MiniGameState } from './models/MiniGameState.js';
import { StatsModel } from './models/StatsModel.js';
import { printStats, printTurns } from './statsPrinter.js';
import { pathToFileURL } from 'url';
import { runAllTests } from './tests.js';
import { fetchReplayGz } from './fetchReplayGz.js';

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

export async function timerStats(
  folderPath,
  replayId,
  print = false,
  log = false,
  turns = false,
  test = false,
  userAgent = null,
) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const replayGz = path.join(
      __dirname,
      folderPath,
      `replay_${replayId}.json.gz`,
    );

    if (!fs.existsSync(path.dirname(replayGz))) {
      fs.mkdirSync(path.dirname(replayGz), { recursive: true });
    }

    const t0 = performance.now();

    await fetchReplayGz(replayId, replayGz, userAgent); // Download
    const t1 = performance.now();

    const replayJson = await loadReplayJson(replayGz); // Unzip & parse JSON
    const t2 = performance.now();

    if (!replayJson) throw new Error('replayJson is null or undefined');
    if (!replayJson.game)
      throw new Error('replayJson.game is missing or falsy');
    if (!replayJson.gameLog) throw new Error('replayJson.gameLog is missing');
    if (!Array.isArray(replayJson.gameLog.commandArray))
      throw new Error('replayJson.gameLog.commandArray is not an array');

    const miniGameState = new MiniGameState(replayJson.game);
    const statsModel = new StatsModel({
      homeCoach: miniGameState.teamHomeCoach,
      awayCoach: miniGameState.teamAwayCoach,
      turnLimitMs: miniGameState.turnLimit,
      totalPlayerTurnsHome: miniGameState.totalPlayerTurnsHome,
      totalPlayerTurnsAway: miniGameState.totalPlayerTurnsAway,
      wasConceded: miniGameState.wasConceded,
    });

    const commands = [...replayJson.gameLog.commandArray];

    const t3 = performance.now();
    for (const command of commands) {
      await fumbblCommandProcessor(command, miniGameState, statsModel);
    }
    const t4 = performance.now();
    if (turns) printTurns(statsModel);
    if (print) printStats(statsModel);
    const t5 = performance.now();

    if (log) {
      console.log(
        `Replay ${replayId} | Commands: ${commands.length}\n` +
          `Download: ${(t1 - t0).toFixed(2)} ms | Unzip+Parse: ${(t2 - t1).toFixed(2)} ms\n` +
          `Setup+Sort: ${(t3 - t2).toFixed(2)} ms | Command Proc: ${(t4 - t3).toFixed(2)} ms | Print: ${(t5 - t4).toFixed(2)} ms\n` +
          `Total: ${(t5 - t0).toFixed(2)} ms`,
      );
    }

    let testResult = true;
    if (test) {
      testResult = runAllTests(statsModel);
      if (testResult === true) {
        //console.log('All tests passed.');
      } else {
        console.log(`Test errors for replayId ${replayId}:`, testResult);
      }
    }

    return { statsModel, tests: testResult };
  } catch (err) {
    console.error('timerStats error:', err);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await import('dotenv/config');
  (async () => {
    const gameLink = 'https://fumbbl.com/ffblive.jnlp?replay=1462624';
    const match = gameLink.match(/replay=(\d+)/);
    if (!match) {
      console.error('❌ Invalid gameLink format. Must contain ?replay=XXXXXX');
      process.exit(1);
    }
    const replayId = match[1];

    try {
      const replaysDir = './data/replays';
      const start = performance.now();
      const print = true;
      const log = true;
      const turns = true;
      const test = true;
      const USER_AGENT = process.env.USER_AGENT || null;
      const { statsModel } = await timerStats(
        replaysDir,
        replayId,
        print,
        log,
        turns,
        test,
        USER_AGENT,
      );
      const end = performance.now();
      if (!log) {
        console.log(
          `Total timerStats execution: ${(end - start).toFixed(2)} ms`,
        );
      }

      //console.log('json :>> ', JSON.stringify(statsModel, null, 2));
    } catch (err) {
      console.error('Failed to generate stats:', err);
      process.exit(1);
    }
  })();
}
