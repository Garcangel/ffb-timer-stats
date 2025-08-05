import PassiveTimer from './PassiveTimer.js';
import SetupTimer from './SetupTimer.js';

export class MiniGameState {
  constructor(game) {
    this.teamHomeCoach = game.teamHome.coach;
    this.teamAwayCoach = game.teamAway.coach;
    this.teamHomeId = game.teamHome.teamId;
    this.teamAwayId = game.teamAway.teamId;
    this.half = 1;
    this.turnMode = 'startGame';
    this.lastTurnMode = 'startGame';
    this.turnNumber = 0;
    this.lastTurnNumber = 0;
    this.isHomePlaying = null;
    this.lastIsHomePlaying = null;
    this.dialogParameter = null;
    this.waitingForOpponent = false;
    this.newHomeTurnNr = false;
    this.newAwayTurnNr = false;
    this.homeTurnNrChanged = false;
    this.awayTurnNrChanged = false;

    // turn
    this.timeUntilFirstActionHome = null;
    this.timeUntilFirstActionAway = null;
    this.pendingTimeUntilFirstActionHome = null;
    this.pendingTimeUntilFirstActionAway = null;

    // passive
    this.passiveTimer = new PassiveTimer();

    // setup
    this.setupTimer = new SetupTimer();

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
    this.playerTeam = this.buildPlayerTeamMap(game); //not currently used

    this.wasConceded = null;
    if (game.gameResult.teamResultHome.conceded === true) {
      this.wasConceded = 'home';
    } else if (game.gameResult.teamResultAway.conceded === true) {
      this.wasConceded = 'away';
    }
  }

  buildPlayerTeamMap(game) {
    const map = {};
    if (game.teamHome && Array.isArray(game.teamHome.playerArray)) {
      for (const player of game.teamHome.playerArray) {
        map[player.playerId] = 'home';
      }
    }
    if (game.teamAway && Array.isArray(game.teamAway.playerArray)) {
      for (const player of game.teamAway.playerArray) {
        map[player.playerId] = 'away';
      }
    }
    return map;
  }

  addPlayer(playerObj, teamId) {
    if (!playerObj || !playerObj.playerId || !teamId) return;
    let side = undefined;
    if (teamId === this.teamHomeId) side = 'home';
    else if (teamId === this.teamAwayId) side = 'away';
    if (side) this.playerTeam[playerObj.playerId] = side;
  }
}
