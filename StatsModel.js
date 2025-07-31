import { Drive, Half, Turn } from './Models.js';

export class StatsModel {
  constructor() {
    this.firstHalf = new Half();
    this.secondHalf = new Half();
    this.overtime = new Half();
    this.currentHalf = this.firstHalf;
    this.currentDrive = null;
    this.lastTurn = null;
    this.lastTurnHome = null;
    this.lastTurnAway = null;
    this.homeCoach = null;
    this.awayCoach = null;
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

  getTurnsHome() {
    return [
      ...this.firstHalf.drives,
      ...this.secondHalf.drives,
      ...this.overtime.drives,
    ]
      .flatMap((drive) => drive.turns)
      .filter((turn) => turn.isHomeActive === true);
  }
  getTurnsAway() {
    return [
      ...this.firstHalf.drives,
      ...this.secondHalf.drives,
      ...this.overtime.drives,
    ]
      .flatMap((drive) => drive.turns)
      .filter((turn) => turn.isHomeActive === false);
  }

  getTotalTimeHome() {
    return this.getTurnsHome().reduce(
      (sum, turn) => sum + (turn.turnTime || 0),
      0,
    );
  }
  getTotalTimeAway() {
    return this.getTurnsAway().reduce(
      (sum, turn) => sum + (turn.turnTime || 0),
      0,
    );
  }

  getAverageTurnTimeHome() {
    const turns = this.getTurnsHome();
    if (!turns.length) return 0;
    return Math.round(this.getTotalTimeHome() / turns.length);
  }
  getAverageTurnTimeAway() {
    const turns = this.getTurnsAway();
    if (!turns.length) return 0;
    return Math.round(this.getTotalTimeAway() / turns.length);
  }

  getMedianTurnTimeHome() {
    const times = this.getTurnsHome()
      .map((t) => t.turnTime || 0)
      .sort((a, b) => a - b);
    if (!times.length) return 0;
    const mid = Math.floor(times.length / 2);
    return times.length % 2 ?
        times[mid]
      : Math.round((times[mid - 1] + times[mid]) / 2);
  }
  getMedianTurnTimeAway() {
    const times = this.getTurnsAway()
      .map((t) => t.turnTime || 0)
      .sort((a, b) => a - b);
    if (!times.length) return 0;
    const mid = Math.floor(times.length / 2);
    return times.length % 2 ?
        times[mid]
      : Math.round((times[mid - 1] + times[mid]) / 2);
  }

  countTurnsExceededLimitHome(turnLimitMs) {
    return this.getTurnsHome().filter(
      (turn) => (turn.turnTime || 0) > turnLimitMs,
    ).length;
  }
  countTurnsExceededLimitAway(turnLimitMs) {
    return this.getTurnsAway().filter(
      (turn) => (turn.turnTime || 0) > turnLimitMs,
    ).length;
  }
}
