import { Drive } from './Drive.js';
import { Half } from './Half.js';
import { Turn } from './Turn.js';

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

  startNewDrive(kickoffType, setupTimeHome, setupTimeAway, kickoffStartTime) {
    this.currentDrive = new Drive(
      kickoffType,
      setupTimeHome,
      setupTimeAway,
      kickoffStartTime,
    );
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
    return this._calcMedian(this.getAllPassiveEventDurations(team));
  }
  getPassiveEventCount(team) {
    return this.getAllPassiveEventDurations(team).length;
  }

  getTotalSetupTime(team) {
    const drives = this._getDrives();
    const key = team === 'home' ? 'setupTimeHome' : 'setupTimeAway';
    return drives.reduce((sum, d) => sum + (d[key] || 0), 0);
  }

  getAverageSetupTime(team) {
    const drives = this._getDrives();
    const key = team === 'home' ? 'setupTimeHome' : 'setupTimeAway';
    // Only count drives where setup time > 0
    const arr = drives.map((d) => d[key] || 0).filter((ms) => ms > 0);
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  getNumberOfDrives() {
    return this._getDrives().length;
  }

  getTotalTimedKickoffTime(team) {
    return this._getDrives()
      .filter((d) => d.timedKickoffTeam === team && d.timedKickoff)
      .reduce((sum, d) => sum + d.timedKickoff, 0);
  }
  getAverageTimedKickoffTime(team) {
    const arr = this._getDrives()
      .filter((d) => d.timedKickoffTeam === team && d.timedKickoff)
      .map((d) => d.timedKickoff);
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
  getTimedKickoffCount(team) {
    return this._getDrives().filter(
      (d) => d.timedKickoffTeam === team && d.timedKickoff,
    ).length;
  }
  _getDrives() {
    return [
      ...this.firstHalf.drives,
      ...this.secondHalf.drives,
      ...this.overtime.drives,
    ];
  }

  getTotalCombinedTime(team) {
    return (
      this.getTotalTime(team) +
      this.getTotalPassiveTime(team) +
      this.getTotalSetupTime(team) +
      this.getTotalTimedKickoffTime(team)
    );
  }

  // --- Serialization ---
  toJSON() {
    return {
      firstHalf: this.firstHalf.toJSON(),
      secondHalf: this.secondHalf.toJSON(),
      overtime: this.overtime.toJSON(),

      turnLimit: this.turnLimitMs,
      homeCoach: this.homeCoach,
      awayCoach: this.awayCoach,
      totalTurnsHome: this._getTurns('home').length,
      totalTurnsAway: this._getTurns('away').length,

      totalTimeHome: this.getTotalTime('home'),
      totalTimeAway: this.getTotalTime('away'),
      averageTurnTimeHome: this.getAverageTurnTime('home'),
      averageTurnTimeAway: this.getAverageTurnTime('away'),
      medianTurnTimeHome: this.getMedianTurnTime('home'),
      medianTurnTimeAway: this.getMedianTurnTime('away'),
      turnsExceedingLimitHome: this.countTurnsExceededLimit(
        'home',
        this.turnLimitMs,
      ),
      turnsExceedingLimitAway: this.countTurnsExceededLimit(
        'away',
        this.turnLimitMs,
      ),

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

      totalSetupTimeHome: this.getTotalSetupTime('home'),
      totalSetupTimeAway: this.getTotalSetupTime('away'),
      averageSetupTimeHome: this.getAverageSetupTime('home'),
      averageSetupTimeAway: this.getAverageSetupTime('away'),
      numberOfDrives: this.getNumberOfDrives(),

      totalTimedKickoffTimeHome: this.getTotalTimedKickoffTime('home'),
      totalTimedKickoffTimeAway: this.getTotalTimedKickoffTime('away'),
      averageTimedKickoffTimeHome: this.getAverageTimedKickoffTime('home'),
      averageTimedKickoffTimeAway: this.getAverageTimedKickoffTime('away'),
      timedKickoffCountHome: this.getTimedKickoffCount('home'),
      timedKickoffCountAway: this.getTimedKickoffCount('away'),

      totalCombinedTimeHome: this.getTotalCombinedTime('home'),
      totalCombinedTimeAway: this.getTotalCombinedTime('away'),
    };
  }
}
