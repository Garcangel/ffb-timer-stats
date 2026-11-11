import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { gzipSync, gunzipSync } from 'node:zlib';
import { fetchReplayGz } from './fetchReplayGz.js';

test('replay cache recovers corrupt files and never publishes incomplete downloads', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'replay-cache-'));
  const file = path.join(dir, 'replay_123.json.gz');
  const originalGet = https.get;
  let body = gzipSync('complete replay');
  let requests = 0;

  https.get = (_url, _options, callback) => {
    requests++;
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = Readable.from([body]);
      response.statusCode = 200;
      callback(response);
    });
    return request;
  };

  try {
    await fs.writeFile(file, body.subarray(0, 8));
    await fetchReplayGz('123', file);
    assert.equal(gunzipSync(await fs.readFile(file)).toString(), 'complete replay');
    assert.equal(requests, 1);
    await fetchReplayGz('123', file);
    assert.equal(requests, 1);

    await fs.unlink(file);
    body = body.subarray(0, 8);
    await assert.rejects(fetchReplayGz('123', file), /Replay 123/);
    assert.deepEqual(await fs.readdir(dir), []);

    body = gzipSync('complete replay');
    await Promise.all([fetchReplayGz('123', file), fetchReplayGz('123', file)]);
    assert.equal(gunzipSync(await fs.readFile(file)).toString(), 'complete replay');
    assert.deepEqual(await fs.readdir(dir), ['replay_123.json.gz']);
  } finally {
    https.get = originalGet;
    await fs.rm(dir, { recursive: true, force: true });
  }
});
