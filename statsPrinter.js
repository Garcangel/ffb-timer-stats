export function printStats(statsModel) {
  const teams = ['home', 'away'];

  const metrics = [
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
      label: 'Turns exceeding limit',
      fn: (team) =>
        statsModel.countTurnsExceededLimit(team, statsModel.turnLimitMs),
    },
    {
      label: 'Total turn time used',
      fn: (team) => `${formatMs(statsModel.getTotalTime(team), true)}`,
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
      label: 'Passive event count',
      fn: (team) => statsModel.getPassiveEventCount(team),
    },
    {
      label: 'Total passive time',
      fn: (team) => `${formatMs(statsModel.getTotalPassiveTime(team), false)}`,
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
      label: 'Number of drives',
      fn: (team) => statsModel.getNumberOfDrives(),
    },
    {
      label: 'Total setup time',
      fn: (team) => formatMs(statsModel.getTotalSetupTime(team), false),
    },
    {
      label: 'Average setup time',
      fn: (team) => formatMs(statsModel.getAverageSetupTime(team), false),
    },
    {
      label: 'Timed kickoff event count',
      fn: (team) => statsModel.getTimedKickoffCount(team),
    },
    {
      label: 'Total timed kickoff time',
      fn: (team) => formatMs(statsModel.getTotalTimedKickoffTime(team), false),
    },
    {
      label: 'Average timed kickoff time',
      fn: (team) =>
        formatMs(statsModel.getAverageTimedKickoffTime(team), false),
    },
  ];

  console.log(''.padEnd(34) + 'Home'.padEnd(18) + 'Away');

  // Metrics
  for (const m of metrics) {
    const home = String(m.fn('home')).padEnd(18);
    const away = String(m.fn('away'));
    console.log(m.label.padEnd(34) + home + away);
  }
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
