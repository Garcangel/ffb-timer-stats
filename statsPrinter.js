export function printStats(statsModel) {
  const teams = ['home', 'away'];

  const metrics = [
    {
      label: 'Total turns',
      fn: (team) => statsModel._getTurns(team).length,
    },
    {
      label: 'Total time used',
      fn: (team) =>
        `${formatMs(statsModel.getTotalTime(team), true)} (${statsModel.getTotalTime(team)}ms)`,
    },
    {
      label: 'Average turn time',
      fn: (team) =>
        `${formatMs(statsModel.getAverageTurnTime(team), false)} (${statsModel.getAverageTurnTime(team)}ms)`,
    },
    {
      label: 'Median turn time',
      fn: (team) =>
        `${formatMs(statsModel.getMedianTurnTime(team), false)} (${statsModel.getMedianTurnTime(team)}ms)`,
    },
    {
      label: 'Turns exceeding limit',
      fn: (team) =>
        statsModel.countTurnsExceededLimit(team, statsModel.turnLimitMs),
    },
    {
      label: 'Average time per player turn',
      fn: (team) =>
        `${formatMs(statsModel.getAverageTimePerPlayerTurn(team), false)} (${statsModel.getAverageTimePerPlayerTurn(team)}ms)`,
    },
    {
      label: 'Average time until first action',
      fn: (team) =>
        `${formatMs(statsModel.getAverageTimeUntilFirstAction(team), false)} (${statsModel.getAverageTimeUntilFirstAction(team)}ms)`,
    },
    {
      label: 'Median time until first action',
      fn: (team) =>
        `${formatMs(statsModel.getMedianTimeUntilFirstAction(team), false)} (${statsModel.getMedianTimeUntilFirstAction(team)}ms)`,
    },
  ];

  // Header
  console.log(
    `Home Coach: ${statsModel.getCoachNameHome()} | Away Coach: ${statsModel.getCoachNameAway()}`,
  );
  console.log('Metric'.padEnd(34) + 'Home'.padEnd(28) + 'Away');

  // Metrics
  for (const m of metrics) {
    const home = String(m.fn('home')).padEnd(28);
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
