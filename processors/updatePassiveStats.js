export function updatePassiveStats(
  miniGameState,
  statsModel,
  data,
  modelChange,
) {
  if (modelChange.modelChangeId === 'gameSetWaitingForOpponent') {
    if (modelChange.modelChangeValue === true) {
      // Start passive timer
      miniGameState.passiveStartTime = data.gameTime;
      miniGameState.passiveForTeam =
        miniGameState.isHomePlaying ? 'away' : 'home';
    } else if (
      modelChange.modelChangeValue === false &&
      miniGameState.passiveStartTime != null
    ) {
      // End passive timer
      const elapsed = data.gameTime - miniGameState.passiveStartTime;
      const team = miniGameState.passiveForTeam;
      let lastTurn =
        team === 'home' ? statsModel.lastTurnHome : statsModel.lastTurnAway;
      if (lastTurn) {
        lastTurn.passiveTime = (lastTurn.passiveTime || 0) + elapsed;
        lastTurn.addPassiveEvent(miniGameState.passiveStartTime, data.gameTime);
      }
      miniGameState.passiveStartTime = null;
      miniGameState.passiveForTeam = null;
    }
  }
}
