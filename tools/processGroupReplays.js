import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { timerStats } from '../timerStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function processGroupReplays(groupId) {
  const replayIdsPath = path.join(
    __dirname,
    '../data/groupReplays/replayIds',
    `replayIds_${groupId}.json`,
  );

  const processedDir = path.join(__dirname, '../data/processedReplays');
  await fs.mkdir(processedDir, { recursive: true });

  const errorsDir = path.join(__dirname, '../data/errors');
  await fs.mkdir(processedDir, { recursive: true });

  const errorsPath = path.join(errorsDir, `errors_${groupId}.json`);
  let errors = [];

  // If an errors file exists from a previous run, load and continue appending.
  try {
    const prev = await fs.readFile(errorsPath, 'utf8');
    errors = JSON.parse(prev);
  } catch {
    /* no previous file */
  }

  const replayIds = JSON.parse(await fs.readFile(replayIdsPath, 'utf8'));
  const replaysDirRel = './data/replays';

  for (let i = 0; i < replayIds.length; i++) {
    const replayId = replayIds[i];
    try {
      const { statsModel, tests } = await timerStats(
        replaysDirRel,
        replayId,
        false, // print
        false, // log
        false, // turns
        true, // test
      );

      if (tests !== true) {
        errors.push({
          replayId,
          type: 'tests_failed',
          details: Array.isArray(tests) ? tests : ['Unknown test failure'],
        });
        await fs.writeFile(errorsPath, JSON.stringify(errors, null, 2), 'utf8');
        console.warn(
          `Tests failed for ${replayId} (${i + 1}/${replayIds.length}).`,
        );
        continue; // do NOT exit; move on
      }

      const outputPath = path.join(processedDir, `processed_${replayId}.json`);
      await fs.writeFile(
        outputPath,
        JSON.stringify(statsModel, null, 2),
        'utf8',
      );
      console.log(`Processed ${i + 1} of ${replayIds.length}: ${outputPath}`);
    } catch (err) {
      errors.push({
        replayId,
        type: 'exception',
        message: err?.message ?? String(err),
      });
      await fs.writeFile(errorsPath, JSON.stringify(errors, null, 2), 'utf8');
      console.error(
        `Failed to process replay ${replayId}: ${err?.message ?? err}`,
      );
    }
  }

  console.log(
    `Done. Total: ${replayIds.length} | Errors: ${errors.length} | Errors file: ${errorsPath}`,
  );
}

// NBFL new : 15668
// NCBB new: 15469
// NWBL: 14726
// GDR: 17628
// FDL: 14630
// blackbox: 'blackbox'

await processGroupReplays('blackbox');
