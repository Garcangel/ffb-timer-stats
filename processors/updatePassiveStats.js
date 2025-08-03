export function updatePassiveStats(
  miniGameState,
  statsModel,
  data,
  modelChange,
) {
  if (modelChange.modelChangeId === 'gameSetWaitingForOpponent') {
    if (modelChange.modelChangeValue === true) {
      // Start passive timer
      const team = miniGameState.isHomePlaying ? 'away' : 'home';
      miniGameState.passiveTimer.start(team, data.gameTime);
    } else if (
      modelChange.modelChangeValue === false &&
      miniGameState.passiveTimer.active
    ) {
      // End passive timer
      miniGameState.passiveTimer.end(data.gameTime);
      const lastEvent = miniGameState.passiveTimer.history.at(-1);
      if (lastEvent) {
        const affectedTeam = lastEvent.team;
        let lastTurn =
          affectedTeam === 'home' ?
            statsModel.lastTurnHome
          : statsModel.lastTurnAway;
        if (lastTurn) {
          lastTurn.passiveTime =
            (lastTurn.passiveTime || 0) + lastEvent.duration;
          lastTurn.addPassiveEvent(lastEvent.start, lastEvent.end);
        }
      }
    }
  }
}
