const KICKOFF_TURN_MODES = ['solidDefence', 'blitz', 'quickSnap'];

function isActionTurn(turnMode) {
  return KICKOFF_TURN_MODES.includes(turnMode);
}

export function updateGameState(miniGameState, statsModel, data, modelChange) {
  const { modelChangeId, modelChangeKey, modelChangeValue } = modelChange;

  if (modelChangeId === 'gameSetHomePlaying') {
    miniGameState.lastIsHomePlaying = miniGameState.isHomePlaying;
    miniGameState.isHomePlaying = modelChangeValue;
  } else if (modelChangeId === 'gameSetTurnMode') {
    miniGameState.lastTurnMode = miniGameState.turnMode;
    miniGameState.turnMode = modelChangeValue;
  } else if (modelChangeId === 'turnDataSetTurnNr') {
    if (modelChangeKey === 'home') {
      miniGameState.newHomeTurnNr = modelChangeValue;
      miniGameState.homeTurnNrChanged = true;
    } else if (modelChangeKey === 'away') {
      miniGameState.newAwayTurnNr = modelChangeValue;
      miniGameState.awayTurnNrChanged = true;
    }
  } else if (modelChangeId === 'gameSetWaitingForOpponent') {
    miniGameState.waitingForOpponent = modelChangeValue;
  } else if (
    modelChangeId === 'turnDataSetTurnStarted' &&
    modelChangeValue === true
  ) {
    if (modelChangeKey === 'home') {
      // If current turn exists, set directly; else buffer
      if (
        statsModel.lastTurnHome &&
        statsModel.lastTurnHome.turnMode === miniGameState.turnMode &&
        statsModel.lastTurnHome.number === miniGameState.newHomeTurnNr
      ) {
        statsModel.lastTurnHome.timeUntilFirstAction = data.turnTime;
      } else {
        miniGameState.pendingTimeUntilFirstActionHome = data.turnTime;
      }
    }
    if (modelChangeKey === 'away') {
      if (
        statsModel.lastTurnAway &&
        statsModel.lastTurnAway.turnMode === miniGameState.turnMode &&
        statsModel.lastTurnAway.number === miniGameState.newAwayTurnNr
      ) {
        statsModel.lastTurnAway.timeUntilFirstAction = data.turnTime;
      } else {
        miniGameState.pendingTimeUntilFirstActionAway = data.turnTime;
      }
    }
  } else if (data.netCommandId === 'serverAddPlayer') {
    miniGameState.addPlayer(data.player, data.teamId);
  }
}
