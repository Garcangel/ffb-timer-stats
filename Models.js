export class Turn {
  constructor(isHomeActive, turnMode, number) {
    this.isHomeActive = isHomeActive;
    this.turnMode = turnMode;
    this.number = number;
    this.turnTime;
  }
}

export class Drive {
  constructor(kickoffType = null) {
    this.turns = [];
    this.kickoffType = kickoffType;
  }
}

export class Half {
  constructor() {
    this.drives = [];
  }
}
