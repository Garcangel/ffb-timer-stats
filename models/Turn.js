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
