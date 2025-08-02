export class Turn {
  constructor(isHomeActive, turnMode, number) {
    this.isHomeActive = isHomeActive;
    this.turnMode = turnMode;
    this.number = number;
    this.turnTime = null;
    this.timeUntilFirstAction = null;
    this.passiveTime = 0;
    this.passiveEvents = [];
  }

  addPassiveEvent(start, end) {
    this.passiveEvents.push({ start, end, duration: end - start });
  }

  toJSON() {
    return {
      isHomeActive: this.isHomeActive,
      turnMode: this.turnMode,
      number: this.number,
      turnTime: this.turnTime,
      timeUntilFirstAction: this.timeUntilFirstAction,
      passiveTime: this.passiveTime,
    };
  }
}

export class Drive {
  constructor(kickoffType = null) {
    this.turns = [];
    this.kickoffType = kickoffType;
  }

  toJSON() {
    return {
      kickoffType: this.kickoffType,
      turns: this.turns.map((turn) =>
        typeof turn.toJSON === 'function' ? turn.toJSON() : turn,
      ),
    };
  }
}

export class Half {
  constructor() {
    this.drives = [];
  }

  toJSON() {
    return {
      drives: this.drives.map((drive) =>
        typeof drive.toJSON === 'function' ? drive.toJSON() : drive,
      ),
    };
  }
}
