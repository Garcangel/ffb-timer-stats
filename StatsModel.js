import { Drive, Half, Turn } from './Models.js';

export class StatsModel {
  constructor({
    homeCoach,
    awayCoach,
    turnLimitMs,
    totalPlayerTurnsHome,
    totalPlayerTurnsAway,
  }) {
    this.firstHalf = new Half();
    this.secondHalf = new Half();
    this.overtime = new Half();
    this.currentHalf = this.firstHalf;
    this.currentDrive = null;
    this.lastTurn = null;
    this.lastTurnHome = null;
    this.lastTurnAway = null;
    this.homeCoach = homeCoach;
    this.awayCoach = awayCoach;
    this.turnLimitMs = turnLimitMs;
    this.totalPlayerTurnsHome = totalPlayerTurnsHome;
    this.totalPlayerTurnsAway = totalPlayerTurnsAway;
  }

  setHalf(halfNum) {
    if (halfNum === 1) this.currentHalf = this.firstHalf;
    else if (halfNum === 2) this.currentHalf = this.secondHalf;
    else this.currentHalf = this.overtime;
    this.currentDrive = null; // reset for new half
  }

  startNewDrive(kickoffType = null) {
    this.currentDrive = new Drive(kickoffType);
    this.currentHalf.drives.push(this.currentDrive);
  }

  addTurn(isHomeActive, turnMode, turnNumber) {
    if (!this.currentDrive) this.startNewDrive();
    const turn = new Turn(isHomeActive, turnMode, turnNumber);
    this.currentDrive.turns.push(turn);
    return turn;
  }

  getCoachNameHome() {
    return this.homeCoach;
  }
  getCoachNameAway() {
    return this.awayCoach;
  }

  // --- DRY helpers ---
  _getTurns(team) {
    return [
      ...this.firstHalf.drives,
      ...this.secondHalf.drives,
      ...this.overtime.drives,
    ]
      .flatMap((drive) => drive.turns)
      .filter((turn) => turn.isHomeActive === (team === 'home'));
  }

  _getStatArray(team, accessor) {
    return this._getTurns(team)
      .map(accessor)
      .filter((v) => typeof v === 'number' && v >= 0);
  }

  _calcMean(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length);
  }

  _calcMedian(arr) {
    if (!arr.length) return 0;
    arr = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ?
        arr[mid]
      : Math.round((arr[mid - 1] + arr[mid]) / 2);
  }

  // --- Public stat methods ---
  getTotalTime(team) {
    return this._getStatArray(team, (t) => t.turnTime || 0).reduce(
      (a, b) => a + b,
      0,
    );
  }

  getAverageTurnTime(team) {
    return this._calcMean(this._getStatArray(team, (t) => t.turnTime || 0));
  }

  getMedianTurnTime(team) {
    return this._calcMedian(this._getStatArray(team, (t) => t.turnTime || 0));
  }

  getAverageTimeUntilFirstAction(team) {
    return this._calcMean(
      this._getStatArray(team, (t) => t.timeUntilFirstAction),
    );
  }

  getMedianTimeUntilFirstAction(team) {
    return this._calcMedian(
      this._getStatArray(team, (t) => t.timeUntilFirstAction),
    );
  }

  countTurnsExceededLimit(team, turnLimitMs) {
    return this._getStatArray(team, (t) => t.turnTime || 0).filter(
      (v) => v > turnLimitMs,
    ).length;
  }

  getAverageTimePerPlayerTurn(team) {
    const totalPlayerTurns =
      team === 'home' ? this.totalPlayerTurnsHome : this.totalPlayerTurnsAway;
    if (!totalPlayerTurns) return 0;
    return Math.round(this.getTotalTime(team) / totalPlayerTurns);
  }

  getMinTurnTime(team) {
    const arr = this._getStatArray(team, (t) => t.turnTime || 0);
    return arr.length ? Math.min(...arr) : 0;
  }
  getMaxTurnTime(team) {
    const arr = this._getStatArray(team, (t) => t.turnTime || 0);
    return arr.length ? Math.max(...arr) : 0;
  }

  getTotalPassiveTime(team) {
    return this._getTurns(team).reduce(
      (sum, t) => sum + (t.passiveTime || 0),
      0,
    );
  }
  getAllPassiveEventDurations(team) {
    return this._getTurns(team)
      .flatMap((turn) => turn.passiveEvents)
      .map((ev) => ev.duration)
      .filter((ms) => ms > 0);
  }
  getAveragePassiveEventTime(team) {
    const arr = this.getAllPassiveEventDurations(team);
    if (!arr.length) return 0;
    return Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length);
  }
  getMedianPassiveEventTime(team) {
    const arr = this.getAllPassiveEventDurations(team).sort((a, b) => a - b);
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ?
        arr[mid]
      : Math.round((arr[mid - 1] + arr[mid]) / 2);
  }
  getPassiveEventCount(team) {
    return this.getAllPassiveEventDurations(team).length;
  }

  // --- Serialization ---
  toJSON() {
    return {
      homeCoach: this.homeCoach,
      awayCoach: this.awayCoach,
      firstHalf: this.firstHalf.toJSON(),
      secondHalf: this.secondHalf.toJSON(),
      overtime: this.overtime.toJSON(),

      totalTimeHome: this.getTotalTime('home'),
      totalTimeAway: this.getTotalTime('away'),
      averageTurnTimeHome: this.getAverageTurnTime('home'),
      averageTurnTimeAway: this.getAverageTurnTime('away'),
      medianTurnTimeHome: this.getMedianTurnTime('home'),
      medianTurnTimeAway: this.getMedianTurnTime('away'),

      minTurnTimeHome: this.getMinTurnTime('home'),
      minTurnTimeAway: this.getMinTurnTime('away'),
      maxTurnTimeHome: this.getMaxTurnTime('home'),
      maxTurnTimeAway: this.getMaxTurnTime('away'),

      averageTimePerPlayerTurnHome: this.getAverageTimePerPlayerTurn('home'),
      averageTimePerPlayerTurnAway: this.getAverageTimePerPlayerTurn('away'),

      averageTimeUntilFirstActionHome:
        this.getAverageTimeUntilFirstAction('home'),
      averageTimeUntilFirstActionAway:
        this.getAverageTimeUntilFirstAction('away'),
      medianTimeUntilFirstActionHome:
        this.getMedianTimeUntilFirstAction('home'),
      medianTimeUntilFirstActionAway:
        this.getMedianTimeUntilFirstAction('away'),

      totalPassiveTimeHome: this.getTotalPassiveTime('home'),
      totalPassiveTimeAway: this.getTotalPassiveTime('away'),
      averagePassiveTimeHome: this.getAveragePassiveEventTime('home'),
      averagePassiveTimeAway: this.getAveragePassiveEventTime('away'),
      medianPassiveTimeHome: this.getMedianPassiveEventTime('home'),
      medianPassiveTimeAway: this.getMedianPassiveEventTime('away'),
      passiveEventCountHome: this.getPassiveEventCount('home'),
      passiveEventCountAway: this.getPassiveEventCount('away'),
    };
  }
}
