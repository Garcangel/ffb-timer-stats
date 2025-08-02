# FFB Turn Time & Drive Statistics Module

## Overview

This Node.js module parses **FUMBBL FFB replays** (official API, zipped JSON streams) to extract and analyze **per-turn timing**, drive structure, **passive event times**, and coach statistics for Blood Bowl games.

- **Tracks every regular turn** for both teams (home and away).
- **Tracks passive events** (opponent dialogs, “waiting for opponent”, skill use, apothecary, etc.), with total, average, and median passive time per team.
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
- **Turn time** (from server, not computed).
- **Passive time:** All periods during a turn where control is handed to the opponent, including skill-use dialogs and apothecary decisions.
- **Passive event count:** Total number of passive handoffs per turn/team.
- Turn and passive time min/max/avg/median.
- Turns exceeding time limit.

---

## Data Flow

### 1. Input

- **Input:** Just a FUMBBL replay ID or game link.
- All downloading, caching, decompressing, and parsing handled automatically.

### 2. Processing

- For each `serverModelSync` command:
  - Processes all `reportList` entries and `modelChangeList.modelChangeArray` entries:
    - **Half/drive updates:** `startHalf`, `kickoffResult`
    - **Turn state:** `gameSetHomePlaying`, `gameSetTurnMode`, `turnDataSetTurnNr`
    - **Turn timing:** Updates the latest turn’s time.
    - **Passive events:** `gameSetDialogParameter`, `gameSetWaitingForOpponent` (tracks start/stop, assigns to team/turn).

- All stats and structures organized in-memory, accessible via `StatsModel`.

### 3. Output

- Console prints (see below).
- Stats can be serialized to JSON.

---

## Model/Classes

### `MiniGameState`

- Holds current side, half, turn mode, options, coach names, player-team map, and handles passive timing state.

### `StatsModel`

- All stats and turn objects for both teams.
- Methods for total, mean, median, min, max, per-turn and per-passive-event analytics.

### `Turn`

- Holds all timing for the turn, including passive event count/timing.

---

## Output Example

```
Metric                            Home                        Away
Coach                             happygrue                   BaronBucky
Total turns                       23                          23
Turns exceeding limit             2                           0
Total time used                   01h05m29s                   00h36m44s
Average turn time                 02m50s                      01m35s
Median turn time                  02m59s                      01m37s
Min turn time                     00m48s                      00m36s
Max turn time                     05m14s                      03m28s
Average time per player turn      00m15s                      00m09s
Average time until first action   00m39s                      00m15s
Median time until first action    00m18s                      00m08s
Total passive time                00m41s                      00m16s
Average passive time              00m20s                      00m08s
Median passive time               00m19s                      00m07s
Passive event count               2                           2
```

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
timerStats.js                # Entry point, orchestrates everything
/replays/
  replay_<replayId>.json.gz  # Downloaded replay files
fumbblCommandProcessor.js    # Command/event parsing logic
MiniGameState.js             # Per-game state
StatsModel.js                # Statistics and analytics
```

---

## Credits

- **FUMBBL FFB Client:** [christerk/ffb](https://github.com/christerk/ffb)
- **Original FFB Stats logic:** [Candlejack/FFBStats](https://github.com/candlejack/ffb-stats)
- **Node.js implementation:** Garcangel

---
