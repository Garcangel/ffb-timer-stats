export class MiniGameState {
  constructor(game) {
    this.teamHomeCoach = game.teamHome?.coach;
    this.teamAwayCoach = game.teamAway?.coach;
    this.half = 1;
    this.turnMode = 'startGame';
    this.lastTurnMode = 'startGame';
    this.turnNumber = 0;
    this.lastTurnNumber = 0;
    this.isHomePlaying = null;
    this.lastIsHomePlaying = null;

    const turntimeOption = game.gameOptions?.gameOptionArray?.find(
      (opt) => opt.gameOptionId === 'turntime',
    );
    this.turnLimit =
      turntimeOption ?
        Number(turntimeOption.gameOptionValue) * 1000
      : 240 * 1000;

    const playerResultsHome =
      game.gameResult.teamResultHome.playerResults || [];
    const playerResultsAway =
      game.gameResult.teamResultAway.playerResults || [];

    this.totalPlayerTurnsHome = playerResultsHome.reduce(
      (sum, p) => sum + (p.turnsPlayed || 0),
      0,
    );
    this.totalPlayerTurnsAway = playerResultsAway.reduce(
      (sum, p) => sum + (p.turnsPlayed || 0),
      0,
    );
  }
}
