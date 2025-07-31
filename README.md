# FFB Turn Time & Drive Statistics Module

## Overview

This module parses **FUMBBL FFB replays** (official API, zipped JSON streams) to extract and analyze **turn-by-turn timing**, drive structure, and coach statistics for Blood Bowl games.

- **Tracks every regular turn** for both teams (home and away).
- Associates each turn with a timing value (milliseconds), drive, and half.
- Calculates total, average, median turn times, and flags overtime/exceeded turns.
- Organizes all timing data into halves, drives, and turns.
- This module is written for Node.js and requires Node.js to run.

---

## Replay Download & Caching

- Replays are **automatically downloaded** from the FUMBBL API as `.json.gz` files and **cached** in the local `replays/` folder.
- Files are **only downloaded if missing**; otherwise, the cached version is used.
- Replay data is **decompressed and parsed in-memory**—no manual extraction needed.

---

## What the Module Does

- **Processes:** FFB game replays (as a single zipped `.json.gz` file per replay, fetched via API).
- **Extracts:**
  - Turn number, team (home/away), and type (`regular`, `blitz`).
  - Drive and half structure (`kickoffResult`, `startHalf`).
  - Millisecond-precision per-turn time (from the server, not locally computed).

- **Calculates:**
  - Total time spent per team.
  - Average and median turn time.
  - Number of turns exceeding the configured turn limit.

- **Organizes:**
  - Turns nested inside drives, drives inside halves.
  - All stats and helpers accessible via a simple model.

---

## Data Flow

### 1. **Input Requirements**

- **No manual input required.**
- The module expects **only** a FUMBBL replay ID or game link.
- All file download, caching, decompression, and parsing are handled automatically.
- Replays are stored as zipped JSON (`replay_<replayId>.json.gz`) in the local `replays/` directory.

### 2. **Processing Steps**

- For each `serverModelSync` command:
  - If `reportList` includes `startHalf` or `kickoffResult`, begins a new half/drive.
  - Scans `modelChangeList.modelChangeArray` for:
    - `gameSetHomePlaying`, `gameSetTurnMode` (update state).
    - `turnDataSetTurnNr` (triggers possible new turn for home/away).

  - Updates per-turn time using `turnTime` on each command, assigning to the latest turn if value is not a regression.
  - Strictly follows FFBStats logic for "action turns" (`regular` and `blitz`) and "isNewTurn".

### 3. **Turn Tracking Logic**

A new turn is only recorded when:

- The **turn mode** is one of `regular` or `blitz`.
- The turn number or mode or side is different from the last tracked turn for that team.

This precisely matches the official FFBStats Java repo.

---

## Model/Classes

### `MiniGameState`

- Tracks current turn mode, which side is active, half, and options like `turnLimit`.
- Extracts coach names and turn limit from the replay data.

### `StatsModel`

- Holds all tracked stats:
  - All `Half`/`Drive`/`Turn` objects for both teams.
  - Methods to calculate per-team and per-turn statistics.

#### **Key Methods**

- `.getCoachNameHome()` / `.getCoachNameAway()`
- `.getTurnsHome()` / `.getTurnsAway()`
- `.getTotalTimeHome()` / `.getTotalTimeAway()`
- `.getAverageTurnTimeHome()` / `.getAverageTurnTimeAway()`
- `.getMedianTurnTimeHome()` / `.getMedianTurnTimeAway()`
- `.countTurnsExceededLimitHome(turnLimitMs)` / `.countTurnsExceededLimitAway(turnLimitMs)`

---

## Output Example

Console logs/statistics generated from the model (see demo below):

```
Home Coach: [coach name]
Away Coach: [coach name]

Home total turns: 16
Away total turns: 16

Home total time used: 25m 41s (1541237ms)
Away total time used: 23m 53s (1433298ms)

Home average turn time: 1m 36s (96211ms)
Away average turn time: 1m 29s (89672ms)

Home median turn time: 1m 28s (88222ms)
Away median turn time: 1m 24s (84533ms)

Home turns exceeding limit: 2
Away turns exceeding limit: 3
```

---

## How to Use

1. **Configure your script:**
   Set the FUMBBL game link or replay ID in your runner script (e.g., `timerStats.js`).

2. **Run the script:**

   ```sh
   node timerStats.js
   ```

   - On first run, the replay will be downloaded and cached automatically.
   - On later runs, the cached `.json.gz` will be used directly.

3. **Read output/statistics:**
   - The script processes the replay and prints statistics to the console.
   - All decompression, parsing, and command processing are handled automatically—**no manual file management is required**.

---

## Example File Layout

```
timerStats.js                # Entry point, orchestrates everything
/replays/
  replay_<replayId>.json.gz  # Downloaded and cached replay files
fumbblCommandProcessor.js    # Core event/command logic
MiniGameState.js             # Per-game in-memory state
StatsModel.js                # Statistics accumulator and analytics
```

---

## Credits

- **FUMBBL FFB Client:** [christerk/ffb](https://github.com/christerk/ffb) – original game client, replay, and data structures
- **Original FFB Stats logic:** [Candlejack/FFBStats](https://github.com/candlejack/ffb-stats)
- **Node.js implementation & analytics:** Garcangel

---
