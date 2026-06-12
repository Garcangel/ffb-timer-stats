import dotenv from 'dotenv';
import { timerStats } from './timerStats.js';

dotenv.config({ quiet: true });

function parseArgs(argv) {
  const args = {
    folderPath: './data/replays',
    print: false,
    log: false,
    turns: false,
    test: false,
    userAgent: process.env.USER_AGENT || null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--replay-id') args.replayId = argv[++i];
    else if (arg === '--folder-path') args.folderPath = argv[++i];
    else if (arg === '--user-agent') args.userAgent = argv[++i];
    else if (arg === '--print') args.print = true;
    else if (arg === '--log') args.log = true;
    else if (arg === '--turns') args.turns = true;
    else if (arg === '--test') args.test = true;
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.replayId || !/^\d+$/.test(args.replayId)) {
    throw new Error('Missing or invalid --replay-id');
  }

  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));

  const result = await timerStats(
    args.folderPath,
    args.replayId,
    args.print,
    args.log,
    args.turns,
    args.test,
    args.userAgent,
  );

  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (err) {
  console.error(err?.message || String(err));
  process.exitCode = 1;
}
