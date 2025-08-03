const KICKOFF_TURN_MODES = ['solidDefence', 'blitz', 'quickSnap'];

function isKickoffTurn(turnMode) {
  return KICKOFF_TURN_MODES.includes(turnMode);
}

export function updateKickoffStats(
  miniGameState,
  statsModel,
  data,
  modelChange,
) {
  // Only handle kickoff in a current drive
  const drive = statsModel.currentDrive;
  if (!drive) return;

  if (modelChange.modelChangeId === 'gameSetTurnMode') {
    const newMode = modelChange.modelChangeValue;
    const lastMode = miniGameState.lastTurnMode;

    // If entering a kickoff mode and not already set
    if (isKickoffTurn(newMode) && drive.timedKickoffTeam == null) {
      drive.timedKickoffTeam = miniGameState.isHomePlaying ? 'home' : 'away';
    }

    // If exiting a kickoff mode (last was kickoff, new is not) and end time not set
    if (
      lastMode &&
      isKickoffTurn(lastMode) &&
      !isKickoffTurn(newMode) &&
      drive.timedKickoffEndTime == null
    ) {
      drive.timedKickoffEndTime = data.gameTime;
      drive.timedKickoff = data.gameTime - drive.kickoffStartTime;
    }
  }
}
