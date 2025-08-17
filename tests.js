export function runAllTests(json) {
  const tests = [
    testDriveHasTurns,
    testAlternatingTurns,
    testFirstTeamSwitches,
    testSetupTimesNonZero,
    testNoNegativeTimes,
    testTurnNumbersMonotonic,
  ];

  const errors = [];
  for (const testFn of tests) {
    const result = testFn(json);
    if (result !== true) errors.push(result);
  }
  return errors.length === 0 ? true : errors;
}

function testAlternatingTurns(json) {
  const halves = ['firstHalf', 'secondHalf'];
  for (const half of halves) {
    const drives = json[half]?.drives || [];
    for (let driveIdx = 0; driveIdx < drives.length; driveIdx++) {
      const drive = drives[driveIdx];
      let lastActive = null;
      for (let turnIdx = 0; turnIdx < drive.turns.length; turnIdx++) {
        const turn = drive.turns[turnIdx];
        if (lastActive === null) {
          lastActive = turn.isHomeActive;
          continue;
        }
        if (turn.isHomeActive === lastActive) {
          return `ERROR: Turns do not alternate in ${half} drive ${driveIdx + 1}, turn ${turnIdx + 1} (two ${turn.isHomeActive ? 'home' : 'away'} in a row)`;
        }
        lastActive = turn.isHomeActive;
      }
    }
  }
  return true;
}

function testFirstTeamSwitches(json) {
  const firstDrive1 = json.firstHalf?.drives?.[0];
  const firstDrive2 = json.secondHalf?.drives?.[0];

  if (!firstDrive1 || !firstDrive2) {
    if (json.wasConceded) return true;
    if (json.adminMode) return true;
    return 'ERROR: Missing drives for one or both halves';
  }

  const firstTeamFirstHalf = firstDrive1.turns?.[0]?.isHomeActive;
  const firstTeamSecondHalf = firstDrive2.turns?.[0]?.isHomeActive;

  if (
    typeof firstTeamFirstHalf !== 'boolean' ||
    typeof firstTeamSecondHalf !== 'boolean'
  ) {
    if (json.wasConceded) return true;
    return 'ERROR: Missing or invalid turn data';
  }

  if (firstTeamFirstHalf === firstTeamSecondHalf) {
    return `ERROR: First team to act in both halves is the same (${firstTeamFirstHalf ? 'home' : 'away'}). Should switch.`;
  }

  return true;
}

function testSetupTimesNonZero(json) {
  if (json.wasConceded) return true;
  const halves = ['firstHalf', 'secondHalf', 'overtime'];
  for (const half of halves) {
    const drives = json[half]?.drives || [];
    for (let driveIdx = 0; driveIdx < drives.length; driveIdx++) {
      const drive = drives[driveIdx];
      if (!drive.setupTimeHome || drive.setupTimeHome === 0) {
        return `ERROR: setupTimeHome is zero or missing in ${half} drive ${driveIdx + 1}`;
      }
      if (!drive.setupTimeAway || drive.setupTimeAway === 0) {
        return `ERROR: setupTimeAway is zero or missing in ${half} drive ${driveIdx + 1}`;
      }
    }
  }
  return true;
}

function testDriveHasTurns(json) {
  if (json.wasConceded) return true;
  const halves = ['firstHalf', 'secondHalf', 'overtime'];
  for (const half of halves) {
    const drives = json[half]?.drives || [];
    for (let driveIdx = 0; driveIdx < drives.length; driveIdx++) {
      const drive = drives[driveIdx];
      if (!Array.isArray(drive.turns) || drive.turns.length === 0) {
        return `ERROR: ${half} drive ${driveIdx + 1} has no turns`;
      }
    }
  }
  return true;
}

function testNoNegativeTimes(json) {
  const halves = ['firstHalf', 'secondHalf', 'overtime'];
  for (const half of halves) {
    const drives = json[half]?.drives || [];
    for (let driveIdx = 0; driveIdx < drives.length; driveIdx++) {
      const drive = drives[driveIdx];
      const fields = [
        { key: 'setupTimeHome', value: drive.setupTimeHome },
        { key: 'setupTimeAway', value: drive.setupTimeAway },
        { key: 'timedKickoff', value: drive.timedKickoff },
      ];
      for (const { key, value } of fields) {
        if (typeof value === 'number' && value < 0) {
          return `ERROR: ${key} is negative in ${half} drive ${driveIdx + 1}`;
        }
      }
      if (!Array.isArray(drive.turns)) continue;
      for (let turnIdx = 0; turnIdx < drive.turns.length; turnIdx++) {
        const turn = drive.turns[turnIdx];
        for (const [key, value] of Object.entries(turn)) {
          if (typeof value === 'number' && value < 0) {
            return `ERROR: Turn field '${key}' is negative in ${half} drive ${driveIdx + 1}, turn ${turnIdx + 1}`;
          }
        }
      }
    }
  }
  return true;
}

// Turn number should not decrease for a given team (isHomeActive) within a drive.
function testTurnNumbersMonotonic(json) {
  const halves = ['firstHalf', 'secondHalf', 'overtime'];
  for (const half of halves) {
    const drives = json[half]?.drives || [];
    for (let driveIdx = 0; driveIdx < drives.length; driveIdx++) {
      const drive = drives[driveIdx];
      let lastHomeTurn = -Infinity;
      let lastAwayTurn = -Infinity;
      for (let turnIdx = 0; turnIdx < drive.turns.length; turnIdx++) {
        const turn = drive.turns[turnIdx];
        if (turn.isHomeActive) {
          if (turn.number < lastHomeTurn) {
            return `ERROR: Home turn number decreased in ${half} drive ${driveIdx + 1}, turn ${turnIdx + 1}`;
          }
          lastHomeTurn = turn.number;
        } else {
          if (turn.number < lastAwayTurn) {
            return `ERROR: Away turn number decreased in ${half} drive ${driveIdx + 1}, turn ${turnIdx + 1}`;
          }
          lastAwayTurn = turn.number;
        }
      }
    }
  }
  return true;
}
