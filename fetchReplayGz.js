import fs from 'fs';
import https from 'https';
import path from 'path';
import { randomUUID } from 'crypto';
import { Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { setTimeout as sleep } from 'timers/promises';
import zlib from 'zlib';

let keepAliveAgent = null;

async function validateGzip(filePath) {
  await pipeline(
    fs.createReadStream(filePath),
    zlib.createGunzip(),
    new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    }),
  );
}

export async function fetchReplayGz(
  replayId,
  gzPath,
  userAgent = null,
  minIntervalMs = 0,
) {
  if (fs.existsSync(gzPath)) {
    try {
      await validateGzip(gzPath);
      return false;
    } catch (err) {
      if (!err.code?.startsWith('Z_')) throw err;
      console.error(
        `Invalid cached replay ${replayId} at ${gzPath}: ${err.message}; downloading again`,
      );
    }
  }

  const url = `https://fumbbl.com/api/replay/get/${replayId}/gz`;
  const t0 = performance.now();
  const tempPath = path.join(
    path.dirname(gzPath),
    `.${path.basename(gzPath)}.${randomUUID()}.tmp`,
  );

  try {
    const res = await new Promise((resolve, reject) => {
      const options = {
        agent: keepAliveAgent,
        headers: userAgent ? { 'User-Agent': userAgent } : undefined,
      };

      if (minIntervalMs > 0) {
        if (!keepAliveAgent) {
          keepAliveAgent = new https.Agent({ keepAlive: true });
        }
        options.agent = keepAliveAgent;
      }

      const req = https.get(url, options, resolve);
      req.on('error', reject);
    });

    if (res.statusCode !== 200) {
      res.resume();
      throw new Error(`HTTP ${res.statusCode}`);
    }

    await pipeline(res, fs.createWriteStream(tempPath, { flags: 'wx' }));
    await validateGzip(tempPath);
    await fs.promises.rename(tempPath, gzPath);
  } catch (err) {
    throw new Error(
      `Replay ${replayId} download or cache validation failed: ${err.message}`,
      { cause: err },
    );
  } finally {
    await fs.promises.rm(tempPath, { force: true });
  }

  const elapsed = performance.now() - t0;

  if (minIntervalMs > 0) {
    const waitMs = Math.max(0, minIntervalMs - elapsed);
    if (waitMs > 0) await sleep(waitMs);
  }

  return elapsed;
}

export function closeReplayAgent() {
  if (keepAliveAgent) {
    keepAliveAgent.destroy();
    keepAliveAgent = null;
  }
}
