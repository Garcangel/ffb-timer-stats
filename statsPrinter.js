export function printStats(statsModel) {
  const halves = [
    { label: 'First half drives/turns:', half: statsModel.firstHalf },
    { label: 'Second half drives/turns:', half: statsModel.secondHalf },
    { label: 'Overtime drives/turns:', half: statsModel.overtime },
  ];

  for (const { label, half } of halves) {
    console.log(label);
    half.drives.forEach((drive, dIdx) => {
      drive.turns.forEach((turn, tIdx) => {
        console.log(
          `Drive ${dIdx + 1}, Turn ${tIdx + 1}: ` +
            `Team: ${turn.isHomeActive ? 'Home' : 'Away'}, ` +
            `Mode: ${turn.turnMode}, ` +
            `Number: ${turn.number}, ` +
            `Time: ${turn.turnTime}`,
        );
      });
    });
  }

  console.log('Home Coach:', statsModel.getCoachNameHome());
  console.log('Away Coach:', statsModel.getCoachNameAway());

  console.log('Home total turns:', statsModel.getTurnsHome().length);
  console.log('Away total turns:', statsModel.getTurnsAway().length);

  console.log(
    'Home total time used:',
    `${formatMs(statsModel.getTotalTimeHome(), true)} (${statsModel.getTotalTimeHome()}ms)`,
  );
  console.log(
    'Away total time used:',
    `${formatMs(statsModel.getTotalTimeAway(), true)} (${statsModel.getTotalTimeAway()}ms)`,
  );

  console.log(
    'Home average turn time:',
    `${formatMs(statsModel.getAverageTurnTimeHome(), false)} (${statsModel.getAverageTurnTimeHome()}ms)`,
  );
  console.log(
    'Away average turn time:',
    `${formatMs(statsModel.getAverageTurnTimeAway(), false)} (${statsModel.getAverageTurnTimeAway()}ms)`,
  );

  console.log(
    'Home median turn time:',
    `${formatMs(statsModel.getMedianTurnTimeHome(), false)} (${statsModel.getMedianTurnTimeHome()}ms)`,
  );
  console.log(
    'Away median turn time:',
    `${formatMs(statsModel.getMedianTurnTimeAway(), false)} (${statsModel.getMedianTurnTimeAway()}ms)`,
  );

  console.log(
    'Home turns exceeding limit:',
    statsModel.countTurnsExceededLimitHome(statsModel.turnLimitMs),
  );
  console.log(
    'Away turns exceeding limit:',
    statsModel.countTurnsExceededLimitAway(statsModel.turnLimitMs),
  );
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
