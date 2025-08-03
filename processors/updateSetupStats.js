export function updateSetupStats(miniGameState, data, modelChange) {
  if (modelChange.modelChangeId === 'gameSetHomePlaying') {
    if (miniGameState.turnMode === 'setup') {
      const side = modelChange.modelChangeValue ? 'home' : 'away';
      miniGameState.setupTimer.switch(side, data.gameTime);
    }
  } else if (modelChange.modelChangeId === 'gameSetTurnMode') {
    if (modelChange.modelChangeValue === 'setup') {
      const side = miniGameState.isHomePlaying ? 'home' : 'away';
      miniGameState.setupTimer.start(side, data.gameTime);
    } else if (
      miniGameState.lastTurnMode === 'setup' &&
      miniGameState.setupTimer.inSetup
    ) {
      miniGameState.setupTimer.end(data.gameTime);
    }
  }
}
