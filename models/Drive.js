export class Drive {
  constructor(kickoffType = null, setupTimeHome, setupTimeAway) {
    this.turns = [];
    this.kickoffType = kickoffType;
    this.setupTimeHome = setupTimeHome;
    this.setupTimeAway = setupTimeAway;
  }

  toJSON() {
    return {
      kickoffType: this.kickoffType,
      setupTimeHome: this.setupTimeHome,
      setupTimeAway: this.setupTimeAway,
      turns: this.turns.map((turn) =>
        typeof turn.toJSON === 'function' ? turn.toJSON() : turn,
      ),
    };
  }
}
