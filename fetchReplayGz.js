import fs from 'fs';
import https from 'https';
import { setTimeout as sleep } from 'timers/promises';

let keepAliveAgent = null;

export async function fetchReplayGz(
  replayId,
  gzPath,
  userAgent = null,
  minIntervalMs = 0,
) {
  if (fs.existsSync(gzPath)) return false;

  const url = `https://fumbbl.com/api/replay/get/${replayId}/gz`;

  const t0 = performance.now();

  await new Promise((resolve, reject) => {
    const options = {
      agent: keepAliveAgent,
      headers: userAgent ? { 'User-Agent': userAgent } : undefined,
    };

    // attach keepAlive agent if throttling is enabled
    if (minIntervalMs > 0) {
      if (!keepAliveAgent) {
        keepAliveAgent = new https.Agent({ keepAlive: true });
      }
      options.agent = keepAliveAgent;
    }

    const req = https.get(url, options, (res) => {
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

  const elapsed = performance.now() - t0;

  if (minIntervalMs > 0) {
    const waitMs = Math.max(0, minIntervalMs - elapsed);
    if (waitMs > 0) await sleep(waitMs);
  }

  return elapsed;
}

// call this after all downloads are finished
export function closeReplayAgent() {
  if (keepAliveAgent) {
    keepAliveAgent.destroy();
    keepAliveAgent = null;
  }
}
