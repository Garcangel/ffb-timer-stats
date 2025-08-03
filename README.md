# FFB Turn Time & Drive Statistics Module

## Overview

This Node.js module parses **FUMBBL FFB replays** (official API, zipped JSON streams) to extract and analyze **per-turn timing**, drive structure, **passive event times**, and coach statistics for Blood Bowl games.

- **Tracks every regular turn** for both teams (home and away).
- **Tracks passive events** (opponent dialogs, “waiting for opponent”, skill use, apothecary, etc.), with total, average, and median passive time per team.
- **Tracks setup times** for each drive, both teams.
- Associates each turn with timing, passive events, drive, and half.
- Calculates total, average, median, min, and max turn times, and counts overtime/exceeded turns.
- Organizes all timing data into halves, drives, and turns.
- **No manual file management required.**

---

## Replay Download & Caching

- Replays are **downloaded from the FUMBBL API** as `.json.gz` and **cached** in `replays/`.
- **No duplicate downloads**; cached files are re-used.
- Files are **decompressed and parsed in-memory**.

---

## Features & Data Extracted

**Per Replay:**

- Turn number, team (home/away), and turn type (`regular`, `blitz`).
- Drive and half structure (`kickoffResult`, `startHalf`).
- **Turn time** (from server).
- **Passive time:** All periods during a turn where control is handed to the opponent, including skill-use dialogs and apothecary decisions.
- **Passive event count:** Total number of passive handoffs per turn/team.
- **Setup time:** Time taken by each team to set up at start of drive.
- Turn and passive time min/max/avg/median.
- Turns exceeding time limit.
- **Timed kickoff events:** Tracks time spent during kickoff events where a coach is allowed to reposition/move players (e.g. Blitz!, Quick Snap, Solid Defence).
- **Timed kickoff stats:** Total time, average time, and count for timed kickoff events (by team).

---

## Data Flow

### 1. Input

- **Input:** Just a FUMBBL replay ID or game link.
- All downloading, caching, decompressing, and parsing handled automatically.

### 2. Processing

- For each `serverModelSync` command:
  - Processes all `reportList` entries and `modelChangeList.modelChangeArray` entries:
    - **Half/drive updates:** `startHalf`, `kickoffResult`
    - **Setup:** `gameSetTurnMode`, `gameSetHomePlaying`
    - **Turn state:** `gameSetHomePlaying`, `gameSetTurnMode`, `turnDataSetTurnNr`
    - **Turn timing:** Updates the latest turn’s time.
    - **Passive events:** `gameSetDialogParameter`, `gameSetWaitingForOpponent` (tracks start/stop, assigns to team/turn).

- All stats and structures organized in-memory, accessible via `StatsModel`.

### 3. Output

- Console prints (see below).
- Stats can be serialized to JSON.

---

## Models / Classes

_All under `/models`:_

- `MiniGameState.js`
- `StatsModel.js`
- `Turn.js`
- `Drive.js`
- `Half.js`
- `SetupTimer.js`

**Description:**

- **MiniGameState:** Per-game state, current side, turn mode, player-team map, and passive/setup timers.
- **StatsModel:** Central analytics, helpers for total, mean, median, min, max, setup, passive, per-team.
- **Turn:** Holds all timing for turn, including passive events/times.
- **Drive:** Includes all turns, setup times, and tracks kickoff event timing per-drive (start, end, duration, affected team).
- **Half:** All drives in each half.
- **SetupTimer:** Utility for drive setup time tracking.

---

## Processors

_All under `/processors`:_

- `updateGameState.js`
- `updateTurnStats.js`
- `updatePassiveStats.js`
- `updateSetupStats.js`
- `updateKickoffStats.js`

---

## Output Example

```
                                  Home              Away
Coach                             CoachA            CoachB
Total turns                       16                16
Turns exceeding limit             5                 2
Total turn time used              00h51m32s         00h41m35s
Average turn time                 03m13s            02m35s
Median turn time                  03m35s            02m37s
Min turn time                     00m33s            01m18s
Max turn time                     04m54s            04m07s
Average time per player turn      00m17s            00m15s
Average time until first action   00m16s            00m15s
Median time until first action    00m08s            00m09s
Passive event count               14                18
Total passive time                01m32s            01m19s
Average passive event time        00m06s            00m04s
Median passive event time         00m03s            00m02s
Number of drives                  5                 5
Total setup time                  00h15m00s         00h08m13s
Average setup time                03m00s            01m38s
Timed kickoff event count         1                 0
Total timed kickoff time          00m24s            00m00s
Average timed kickoff time        00m24s            00m00s
```

---

## Automated Data Validation

The module runs a suite of data integrity tests on each processed replay to ensure structural and statistical correctness.
**Tests include:**

- Turns alternate home/away within each drive.
- The first team to act in the first half is different from the first in the second half.
- No drive has zero setup time for either team.
- Every drive contains at least one turn.
- No negative time values in any timing fields.
- Turn numbers never decrease for the same team within a drive.

If any test fails, an error message is printed.
If all tests pass, you see:

```
All tests passed.
```

This validation runs automatically after replay processing and before stats are output.

---

## How to Use

1. **Edit the runner script** (`timerStats.js`), set your replay link or ID.
2. **Run:**

   ```sh
   node timerStats.js
   ```

3. **View stats in the console or as JSON.**

---

## File Structure

```
timerStats.js                     # Entry point
/replays/
  replay_<replayId>.json.gz       # Downloaded replay files
/models/
  Drive.js
  Half.js
  MiniGameState.js
  SetupTimer.js
  StatsModel.js
  Turn.js
/processors/
  updateGameState.js
  updateTurnStats.js
  updatePassiveStats.js
  updateSetupStats.js
  updateKickoffStats.js
fumbblCommandProcessor.js         # Orchestrates per-frame processing
```

---

## Credits

- **FUMBBL FFB Client:** [christerk/ffb](https://github.com/christerk/ffb)
- **Original FFB Stats logic:** [Candlejack/FFBStats](https://github.com/candlejack/ffb-stats)
- **Node.js implementation:** Garcangel

---
