const ACTION_TURN_MODES = ['regular', 'blitz'];

function isActionTurn(turnMode) {
  return ACTION_TURN_MODES.includes(turnMode);
}

function isNewTurn(lastTurn, isHomeActive, turnNumber, turnMode) {
  return (
    !lastTurn ||
    lastTurn.isHomeActive !== isHomeActive ||
    lastTurn.number !== turnNumber ||
    lastTurn.turnMode !== turnMode
  );
}

export function updateTurnStats(miniGameState, statsModel, data) {
  // HOME
  if (
    miniGameState.homeTurnNrChanged &&
    isActionTurn(miniGameState.turnMode) &&
    isNewTurn(
      statsModel.lastTurnHome,
      true,
      miniGameState.newHomeTurnNr,
      miniGameState.turnMode,
    )
  ) {
    statsModel.lastTurnHome = statsModel.addTurn(
      true,
      miniGameState.turnMode,
      miniGameState.newHomeTurnNr,
    );
    miniGameState.lastTurnNumberHome = miniGameState.newHomeTurnNr;

    // Buffer assignment
    if (miniGameState.pendingTimeUntilFirstActionHome != null) {
      statsModel.lastTurnHome.timeUntilFirstAction =
        miniGameState.pendingTimeUntilFirstActionHome;
      miniGameState.pendingTimeUntilFirstActionHome = null;
    }
  }

  // AWAY
  if (
    miniGameState.awayTurnNrChanged &&
    isActionTurn(miniGameState.turnMode) &&
    isNewTurn(
      statsModel.lastTurnAway,
      false,
      miniGameState.newAwayTurnNr,
      miniGameState.turnMode,
    )
  ) {
    statsModel.lastTurnAway = statsModel.addTurn(
      false,
      miniGameState.turnMode,
      miniGameState.newAwayTurnNr,
    );
    miniGameState.lastTurnNumberAway = miniGameState.newAwayTurnNr;

    if (miniGameState.pendingTimeUntilFirstActionAway != null) {
      statsModel.lastTurnAway.timeUntilFirstAction =
        miniGameState.pendingTimeUntilFirstActionAway;
      miniGameState.pendingTimeUntilFirstActionAway = null;
    }
  }

  // Per-turn timing update
  if (
    data.turnTime !== undefined &&
    statsModel.currentDrive &&
    statsModel.currentDrive.turns.length > 0
  ) {
    const currentTurn =
      statsModel.currentDrive.turns[statsModel.currentDrive.turns.length - 1];
    if (
      currentTurn.turnTime === undefined ||
      data.turnTime >= currentTurn.turnTime
    ) {
      currentTurn.turnTime = data.turnTime;
    }
  }
  // Reset turn change flags
  miniGameState.homeTurnNrChanged = false;
  miniGameState.awayTurnNrChanged = false;
}
