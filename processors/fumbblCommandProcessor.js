import { updateGameState } from './updateGameState.js';
import { updateKickoffStats } from './updateKickoffStats.js';
import { updatePassiveStats } from './updatePassiveStats.js';
import { updateSetupStats } from './updateSetupStats.js';
import { updateTurnStats } from './updateTurnStats.js';

export async function fumbblCommandProcessor(data, miniGameState, statsModel) {
  if (data.netCommandId !== 'serverModelSync') return;

  const modelChangeArray = data.modelChangeList.modelChangeArray;

  for (const modelChange of modelChangeArray) {
    updateGameState(miniGameState, statsModel, data, modelChange);
    updatePassiveStats(miniGameState, statsModel, data, modelChange);
    updateSetupStats(miniGameState, data, modelChange);
    updateKickoffStats(miniGameState, statsModel, data, modelChange);
  }

  if (data.reportList) {
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
          data.gameTime,
        );
        miniGameState.setupTimer.reset();
      } else if (report.reportId === 'receiveChoice') {
        const isHomeChoosing = report.teamId === miniGameState.teamHomeId;
        const isHomeReceiving =
          isHomeChoosing ? report.receiveChoice : !report.receiveChoice;
        // Home sets up first if home is NOT receiving
        miniGameState.isHomePlaying = !isHomeReceiving;
      }
    }
  }

  updateTurnStats(miniGameState, statsModel, data);
}
