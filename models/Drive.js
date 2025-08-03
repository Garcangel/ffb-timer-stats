export class Drive {
  constructor(
    kickoffType = null,
    setupTimeHome,
    setupTimeAway,
    kickoffStartTime,
  ) {
    this.turns = [];
    this.kickoffType = kickoffType;
    this.setupTimeHome = setupTimeHome;
    this.setupTimeAway = setupTimeAway;
    this.kickoffStartTime = kickoffStartTime;
    this.timedKickoffEndTime = null;
    this.timedKickoffTeam = null;
    this.timedKickoff = null;
  }

  toJSON() {
    return {
      kickoffType: this.kickoffType,
      setupTimeHome: this.setupTimeHome,
      setupTimeAway: this.setupTimeAway,
      timedKickoff: this.timedKickoff,
      timedKickoffTeam: this.timedKickoffTeam,
      turns: this.turns.map((turn) =>
        typeof turn.toJSON === 'function' ? turn.toJSON() : turn,
      ),
    };
  }
}
