export function printStats(statsModel) {
  const teams = ['home', 'away'];

  const metrics = [
    { label: 'Game Info', isBlockTitle: true },
    {
      label: 'Coach',
      fn: (team) =>
        team === 'home' ?
          statsModel.getCoachNameHome()
        : statsModel.getCoachNameAway(),
    },
    {
      label: 'Total turns',
      fn: (team) => statsModel._getTurns(team).length,
    },
    {
      label: 'Number of drives',
      fn: (team) => statsModel.getNumberOfDrives(),
    },

    //
    { label: 'Turn Stats', isBlockTitle: true },
    {
      label: 'Turns exceeding limit',
      fn: (team) =>
        statsModel.countTurnsExceededLimit(team, statsModel.turnLimitMs),
    },
    {
      label: 'Average turn time',
      fn: (team) => `${formatMs(statsModel.getAverageTurnTime(team), false)}`,
    },
    {
      label: 'Median turn time',
      fn: (team) => `${formatMs(statsModel.getMedianTurnTime(team), false)}`,
    },
    {
      label: 'Min turn time',
      fn: (team) => `${formatMs(statsModel.getMinTurnTime(team), false)}`,
    },
    {
      label: 'Max turn time',
      fn: (team) => `${formatMs(statsModel.getMaxTurnTime(team), false)}`,
    },
    {
      label: 'Average time per player turn',
      fn: (team) =>
        `${formatMs(statsModel.getAverageTimePerPlayerTurn(team), false)}`,
    },
    {
      label: 'Average time until first action',
      fn: (team) =>
        `${formatMs(statsModel.getAverageTimeUntilFirstAction(team), false)}`,
    },
    {
      label: 'Median time until first action',
      fn: (team) =>
        `${formatMs(statsModel.getMedianTimeUntilFirstAction(team), false)}`,
    },
    {
      label: 'Total turn time used',
      fn: (team) => `${formatMs(statsModel.getTotalTime(team), true)}`,
      bold: true,
      color: 36, // cyan
    },

    //
    { label: 'Passive Events', isBlockTitle: true },
    {
      label: 'Passive event count',
      fn: (team) => statsModel.getPassiveEventCount(team),
    },
    {
      label: 'Average passive event time',
      fn: (team) =>
        `${formatMs(statsModel.getAveragePassiveEventTime(team), false)}`,
    },
    {
      label: 'Median passive event time',
      fn: (team) =>
        `${formatMs(statsModel.getMedianPassiveEventTime(team), false)}`,
    },
    {
      label: 'Total passive time',
      fn: (team) => `${formatMs(statsModel.getTotalPassiveTime(team), false)}`,
      bold: true,
      color: 36, // cyan
    },

    //
    { label: 'Setup', isBlockTitle: true },
    {
      label: 'Average setup time',
      fn: (team) => formatMs(statsModel.getAverageSetupTime(team), false),
    },
    {
      label: 'Total setup time',
      fn: (team) => formatMs(statsModel.getTotalSetupTime(team), false),
      bold: true,
      color: 36, // cyan
    },

    //
    { label: 'Kickoff', isBlockTitle: true },
    {
      label: 'Timed kickoff event count',
      fn: (team) => statsModel.getTimedKickoffCount(team),
    },
    {
      label: 'Average timed kickoff time',
      fn: (team) =>
        formatMs(statsModel.getAverageTimedKickoffTime(team), false),
    },
    {
      label: 'Total timed kickoff time',
      fn: (team) => formatMs(statsModel.getTotalTimedKickoffTime(team), false),
      bold: true,
      color: 36, // cyan
    },

    //
    { label: 'Summary', isBlockTitle: true },
    {
      label: 'Total combined time',
      fn: (team) => formatMs(statsModel.getTotalCombinedTime(team), true),
      bold: true,
      color: 36, // cyan
    },
  ];

  const homeCoach = statsModel.getCoachNameHome();

  const minColWidth = 10;
  const homeColWidth = Math.max(minColWidth, homeCoach.length + 2);

  // Header
  console.log(
    ''.padEnd(34) +
      '\x1b[1m' +
      'Home'.padEnd(homeColWidth) +
      '\x1b[0m' +
      '\x1b[1m' +
      'Away' +
      '\x1b[0m',
  );

  // Metrics
  for (const m of metrics) {
    if (m.isBlockTitle) {
      // Print header with styling
      console.log('\x1b[1m\x1b[4m' + m.label + '\x1b[0m'); // bold+underline
      continue;
    }
    let label = m.label.padEnd(34);
    let home = String(m.fn('home')).padEnd(homeColWidth);
    let away = String(m.fn('away'));

    // Style logic for label
    if (m.bold && m.color) {
      label = `\x1b[1m\x1b[${m.color}m${label}\x1b[0m`;
    } else if (m.bold) {
      label = `\x1b[1m${label}\x1b[0m`;
    } else if (m.color) {
      label = `\x1b[${m.color}m${label}\x1b[0m`;
    }

    // Style logic for values
    if (m.bold && m.color) {
      home = `\x1b[1m\x1b[${m.color}m${home}\x1b[0m`;
      away = `\x1b[1m\x1b[${m.color}m${away}\x1b[0m`;
    } else if (m.bold) {
      home = `\x1b[1m${home}\x1b[0m`;
      away = `\x1b[1m${away}\x1b[0m`;
    } else if (m.color) {
      home = `\x1b[${m.color}m${home}\x1b[0m`;
      away = `\x1b[${m.color}m${away}\x1b[0m`;
    }

    console.log(label + home + away);
  }
  console.log('\n');
}

export function printTurns(statsModel) {
  const halves = [
    { label: 'First half drives/turns:', half: statsModel.firstHalf },
    { label: 'Second half drives/turns:', half: statsModel.secondHalf },
    { label: 'Overtime drives/turns:', half: statsModel.overtime },
  ];

  const header = 'Drive  Turn  Team   Num    Time    First  Passive';
  const divider = '-'.repeat(header.length);

  for (const { label, half } of halves) {
    console.log('\n' + label);
    console.log(header);
    console.log(divider);
    half.drives.forEach((drive, dIdx) => {
      drive.turns.forEach((turn, tIdx) => {
        const driveNum = pad(dIdx + 1, 2);
        const turnNum = pad(tIdx + 1, 2);
        const team = turn.isHomeActive ? 'Home' : 'Away';
        const num = pad(turn.number, 2);
        const time = padTime(turn.turnTime, 7);
        const first = padTime(turn.timeUntilFirstAction, 5);
        const passive = padTime(turn.passiveTime, 6);

        console.log(
          `${driveNum}     ${turnNum}    ${team.padEnd(5)}  ${num}   ${time}   ${first}   ${passive}`,
        );
      });
    });
  }
}

export async function printCoachTimeStats(stats) {
  // Prepare, sort descending by totalCombinedTime
  const arr = Object.entries(stats)
    .map(([coach, data]) => ({
      coach,
      averageTurnTime: data.averageTurnTime,
      totalCombinedTime: data.totalCombinedTime,
    }))
    .sort((a, b) => (b.averageTurnTime ?? 0) - (a.averageTurnTime ?? 0));

  // Get max width for coach column
  const coachColWidth = Math.max(5, ...arr.map((row) => row.coach.length));

  // Print header
  const header =
    'Coach'.padEnd(coachColWidth) +
    ' | ' +
    'Avg Turn'.padEnd(12) +
    ' | ' +
    'Total Time';
  console.log(header);
  console.log('-'.repeat(header.length));

  // Print rows
  for (const row of arr) {
    const avgTurn =
      row.averageTurnTime != null ? formatMs(row.averageTurnTime, false) : '-';
    const total =
      row.totalCombinedTime != null ?
        formatMs(row.totalCombinedTime, true)
      : '-';
    console.log(
      row.coach.padEnd(coachColWidth) +
        ' | ' +
        avgTurn.padEnd(12) +
        ' | ' +
        total,
    );
  }
}

function pad(num, len = 2) {
  return String(num).padStart(len, '0');
}
function padTime(ms, len = 6) {
  return String(ms).padStart(len, ' ');
}

function formatMs(ms, withHours = true) {
  let totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60);
  const minutes = totalSeconds % 60;
  const hours = Math.floor(totalSeconds / 60);

  if (withHours) {
    return `${hours.toString().padStart(2, '0')}h${minutes
      .toString()
      .padStart(2, '0')}m${seconds.toString().padStart(2, '0')}s`;
  } else {
    return `${minutes.toString().padStart(2, '0')}m${seconds
      .toString()
      .padStart(2, '0')}s`;
  }
}
