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
        process.exit(1);
      }
      const outputPath = path.join(processedDir, `processed_${replayId}.json`);
      await fs.writeFile(
        outputPath,
        JSON.stringify(statsModel, null, 2),
        'utf8',
      );
      console.log(`Processed ${i + 1} of ${replayIds.length}: ${outputPath}`);
    } catch (err) {
      console.error(`Failed to process replay ${replayId}: ${err.message}`);
    }
  }
}

await processGroupReplays(15668);
