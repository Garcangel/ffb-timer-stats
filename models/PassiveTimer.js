class PassiveTimer {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.startTime = null;
    this.team = null;
    this.lastElapsed = null;
    this.history = []; // Optional: stores all passive events
  }

  start(team, time) {
    this.active = true;
    this.startTime = time;
    this.team = team;
  }

  end(time) {
    if (this.active && this.startTime != null && this.team) {
      const elapsed = time - this.startTime;
      this.lastElapsed = elapsed;
      this.history.push({
        team: this.team,
        start: this.startTime,
        end: time,
        duration: elapsed,
      });
      this.active = false;
      this.startTime = null;
      this.team = null;
      return elapsed;
    }
    return null;
  }

  getLastElapsed() {
    return this.lastElapsed;
  }

  getHistory() {
    return this.history.slice();
  }
}

export default PassiveTimer;
