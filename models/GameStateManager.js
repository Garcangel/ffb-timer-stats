import SetupTimer from './SetupTimer.js';

export class GameStateManager {
  constructor(game) {
    // ---- Immutable metadata ----
    this.teamHomeCoach = game.teamHome.coach;
    this.teamAwayCoach = game.teamAway.coach;
    this.teamHomeId = game.teamHome.teamId;
    this.teamAwayId = game.teamAway.teamId;

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
    this.playerTeam = this.buildPlayerTeamMap(game);

    // ---- Per-processor state ----

    // Turn stats state
    this.turn = {
      half: 1,
      turnMode: 'startGame',
      lastTurnMode: 'startGame',
      turnNumber: 0,
      lastTurnNumber: 0,
      isHomePlaying: null,
      lastIsHomePlaying: null,
      newHomeTurnNr: false,
      newAwayTurnNr: false,
      homeTurnNrChanged: false,
      awayTurnNrChanged: false,
      timeUntilFirstActionHome: null,
      timeUntilFirstActionAway: null,
      pendingTimeUntilFirstActionHome: null,
      pendingTimeUntilFirstActionAway: null,
    };

    // Passive stats state
    this.passive = {
      passiveStartTime: null,
      passiveForTeam: null,
    };

    // Setup stats state
    this.setup = {
      setupTimer: new SetupTimer(),
    };

    // Add other processors as needed (kickoff, etc.)
    this.kickoff = {
      // Fields as required by kickoff processor
    };
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
