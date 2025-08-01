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

export async function fumbblCommandProcessor(data, miniGameState, statsModel) {
  if (data.netCommandId === 'serverModelSync' && data.reportList) {
    for (const report of data.reportList.reports) {
      if (report.reportId === 'startHalf') {
        statsModel.setHalf(report.half);
      }
      if (report.reportId === 'kickoffResult') {
        statsModel.startNewDrive(report.kickoffResult);
      }
    }
  }

  if (data.netCommandId === 'serverModelSync') {
    const modelChangeArray = data.modelChangeList.modelChangeArray;

    // Track turn number updates (deferred)
    let homeTurnNrChanged = false,
      awayTurnNrChanged = false;
    let newHomeTurnNr, newAwayTurnNr;

    // Per-turn timing update (can still happen in loop)
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

    for (const modelChange of modelChangeArray) {
      const { modelChangeId, modelChangeKey, modelChangeValue } = modelChange;

      // Home/away playing & mode (affect state, needed for isNewTurn)
      if (modelChangeId === 'gameSetHomePlaying') {
        miniGameState.lastIsHomePlaying = miniGameState.isHomePlaying;
        miniGameState.isHomePlaying = modelChangeValue;
      }
      if (modelChangeId === 'gameSetTurnMode') {
        miniGameState.lastTurnMode = miniGameState.turnMode;
        miniGameState.turnMode = modelChangeValue;
      }

      // Mark when turn number is changed for home/away (defer addTurn logic)
      if (modelChangeId === 'turnDataSetTurnNr') {
        if (modelChangeKey === 'home') {
          homeTurnNrChanged = true;
          newHomeTurnNr = modelChangeValue;
        }
        if (modelChangeKey === 'away') {
          awayTurnNrChanged = true;
          newAwayTurnNr = modelChangeValue;
        }
      }

      if (
        modelChangeId === 'turnDataSetTurnStarted' &&
        modelChangeValue === true
      ) {
        const currentTurn =
          statsModel.currentDrive.turns[
            statsModel.currentDrive.turns.length - 1
          ];
        if (currentTurn.timeUntilFirstAction == null) {
          currentTurn.timeUntilFirstAction = data.turnTime;
        }
      }
    }

    // ---- Only after processing all changes: check for new turn ----

    if (
      homeTurnNrChanged &&
      isActionTurn(miniGameState.turnMode) &&
      isNewTurn(
        statsModel.lastTurnHome,
        true,
        newHomeTurnNr,
        miniGameState.turnMode,
      )
    ) {
      statsModel.lastTurnHome = statsModel.addTurn(
        true,
        miniGameState.turnMode,
        newHomeTurnNr,
      );
      miniGameState.lastTurnNumberHome = newHomeTurnNr;
    }

    if (
      awayTurnNrChanged &&
      isActionTurn(miniGameState.turnMode) &&
      isNewTurn(
        statsModel.lastTurnAway,
        false,
        newAwayTurnNr,
        miniGameState.turnMode,
      )
    ) {
      statsModel.lastTurnAway = statsModel.addTurn(
        false,
        miniGameState.turnMode,
        newAwayTurnNr,
      );
      miniGameState.lastTurnNumberAway = newAwayTurnNr;
    }
  }
}
