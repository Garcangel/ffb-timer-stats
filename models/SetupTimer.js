class SetupTimer {
  constructor() {
    this.reset();
  }

  reset() {
    this.teamOrder = []; // 'home', 'away'
    this.startTimes = {};
    this.endTimes = {};
    this.durations = {};
    this.activeTeam = null;
    this.inSetup = false;
    this.alreadySwitched = false;
  }

  start(team, time) {
    this.reset();
    this.inSetup = true;
    this.activeTeam = team;
    this.teamOrder.push(team);
    this.startTimes[team] = time;
  }

  switch(team, time) {
    if (this.alreadySwitched) return;
    // End current team, start next team
    if (this.activeTeam) {
      this.endTimes[this.activeTeam] = time;
      this.durations[this.activeTeam] = time - this.startTimes[this.activeTeam];
    }
    this.activeTeam = team;
    if (!this.teamOrder.includes(team)) this.teamOrder.push(team);
    this.startTimes[team] = time;
    this.alreadySwitched = true;
  }

  end(time) {
    if (this.activeTeam) {
      this.endTimes[this.activeTeam] = time;
      this.durations[this.activeTeam] = time - this.startTimes[this.activeTeam];
    }
    this.inSetup = false;
    this.activeTeam = null;
  }

  getDuration(team) {
    return this.durations[team] || 0;
  }

  toObject() {
    return {
      durations: { ...this.durations },
      startTimes: { ...this.startTimes },
      endTimes: { ...this.endTimes },
      teamOrder: [...this.teamOrder],
    };
  }
}

export default SetupTimer;
