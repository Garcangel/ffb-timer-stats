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
  if (data.netCommandId === 'serverModelSync') {
    const modelChangeArray = data.modelChangeList.modelChangeArray;

    // Track turn number updates (deferred)
    let homeTurnNrChanged = false,
      awayTurnNrChanged = false;
    let newHomeTurnNr, newAwayTurnNr;

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

    for (const modelChange of modelChangeArray) {
      const { modelChangeId, modelChangeKey, modelChangeValue } = modelChange;

      if (modelChangeId === 'gameSetHomePlaying') {
        miniGameState.lastIsHomePlaying = miniGameState.isHomePlaying;
        miniGameState.isHomePlaying = modelChangeValue;

        if (miniGameState.turnMode === 'setup') {
          const side = modelChangeValue ? 'home' : 'away';
          miniGameState.setupTimer.switch(side, data.gameTime);
        }
      } else if (modelChangeId === 'gameSetTurnMode') {
        miniGameState.lastTurnMode = miniGameState.turnMode;
        miniGameState.turnMode = modelChangeValue;

        if (modelChangeValue === 'setup') {
          const side = miniGameState.isHomePlaying ? 'home' : 'away';
          miniGameState.setupTimer.start(side, data.gameTime);
        } else if (
          miniGameState.lastTurnMode === 'setup' &&
          miniGameState.setupTimer.inSetup
        ) {
          miniGameState.setupTimer.end(data.gameTime);
        }
      } else if (modelChangeId === 'turnDataSetTurnNr') {
        if (modelChangeKey === 'home') {
          homeTurnNrChanged = true;
          newHomeTurnNr = modelChangeValue;
        } else if (modelChangeKey === 'away') {
          awayTurnNrChanged = true;
          newAwayTurnNr = modelChangeValue;
        }
      } else if (
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
      } else if (modelChangeId === 'gameSetWaitingForOpponent') {
        if (modelChangeValue === true) {
          // Start passive timer
          miniGameState.passiveStartTime = data.gameTime;
          miniGameState.passiveForTeam =
            miniGameState.isHomePlaying ? 'away' : 'home';
        } else if (
          modelChangeValue === false &&
          miniGameState.passiveStartTime != null
        ) {
          // End passive timer
          const elapsed = data.gameTime - miniGameState.passiveStartTime;
          const team = miniGameState.passiveForTeam;
          let lastTurn =
            team === 'home' ? statsModel.lastTurnHome : statsModel.lastTurnAway;
          if (lastTurn) {
            lastTurn.passiveTime = (lastTurn.passiveTime || 0) + elapsed;
            lastTurn.addPassiveEvent(
              miniGameState.passiveStartTime,
              data.gameTime,
            );
          }
          miniGameState.passiveStartTime = null;
          miniGameState.passiveForTeam = null;
        }
      } else if (data.netCommandId === 'serverAddPlayer') {
        miniGameState.addPlayer(data.player, data.teamId);
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

  // Its important to keep this here if not setup timea fter half breaks.
  if (data.netCommandId === 'serverModelSync' && data.reportList) {
    for (const report of data.reportList.reports) {
      if (report.reportId === 'startHalf') {
        statsModel.setHalf(report.half);
        miniGameState.setupTimer.reset();
        const side = miniGameState.isHomePlaying ? 'home' : 'away';
        miniGameState.setupTimer.start(side, data.gameTime);
      } else if (report.reportId === 'kickoffResult') {
        statsModel.startNewDrive(
          report.kickoffResult,
          miniGameState.setupTimer.getDuration('home'),
          miniGameState.setupTimer.getDuration('away'),
        );
        miniGameState.setupTimer.reset();
      } else if (report.reportId === 'receiveChoice') {
        miniGameState.isHomePlaying =
          report.teamId === miniGameState.teamHomeId;
      }
    }
  }
}
