# 20-Second Move Timer Implementation

## Overview
Implemented a 20-second countdown timer for each player's turn in multiplayer Bisca games. When time runs out, the player who timed out forfeits the game, with all remaining cards awarded to the opponent.

## Backend Changes

### 1. Game State (websockets/state/game.js)

#### Added Timer Fields
```javascript
// Timer state
moveTimer: null,           // setTimeout reference for timeout detection
moveStartTime: null,       // Timestamp when timer started
timeRemaining: 20,         // Current seconds remaining
```

#### New Timer Functions

**`startMoveTimer(game, io)`**
- Clears any existing timer
- Sets `moveStartTime` to current timestamp
- Emits `timer-tick` event every second with remaining time
- Emits `timer-warning` at 5 seconds
- Calls `handleTimeout()` after 20 seconds

**`clearMoveTimer(game)`**
- Cancels the timer using `clearTimeout()`
- Resets `moveTimer` to null

**`handleTimeout(game, io)`**
- Awards all remaining cards to opponent (hands + deck)
- Calculates points and awards 4 marks (bandeira) to opponent
- Marks game as complete
- Checks if match is over (opponent has 4+ marks)
- Emits `timeout`, `game-state`, and `game-over` events

### 2. Event Handlers (websockets/events/game.js)

#### Updated Events

**`join-game`**
- Starts timer after dealing cards when both players join

**`play-card`**
- Clears and restarts timer after each valid move
- Stops timer when both cards are played (during trick resolution)

**`resign`**
- Clears timer when player resigns

**`start-next-match-game`**
- Starts timer for the new game in a match

#### Timer Data in Game State
Added to `getGameStateForPlayer()`:
```javascript
timeRemaining: game.timeRemaining,
moveStartTime: game.moveStartTime,
```

## Frontend Changes

### 1. Socket Store (frontend/src/stores/socket.js)

#### New Event Listeners

**`timer-tick`**
- Updates `timeRemaining` in game store
- Called every second

**`timer-warning`**
- Sets `timerWarning` to true when < 5 seconds
- Triggers visual warning in UI

**`timeout`**
- Calls `gameStore.handleTimeout()` with event data
- Shows timeout modal

### 2. Game Store (frontend/src/stores/game.js)

#### Added State
```javascript
timeRemaining: ref(20)           // Current seconds
timerWarning: ref(false)         // Warning state
showTimeoutModal: ref(false)     // Modal visibility
timeoutData: ref(null)           // Timeout event data
```

#### New Methods

**`setTimeRemaining(time)`**
- Updates `timeRemaining` from socket events
- Clears warning if time > 5

**`setTimerWarning(warning)`**
- Sets warning state for UI

**`handleTimeout(data)`**
- Stores timeout data
- Shows timeout modal
- Resets timer to 0

**`closeTimeoutModal()`**
- Hides timeout modal
- Clears timeout data

#### Updated Methods

**`setMultiplayerGame(game)`**
- Updates `timeRemaining` from server state
- Resets warning when time > 5

**`multiplayerGame` computed**
- Includes `timeRemaining` and `timerWarning` in return value

### 3. UI Component (frontend/src/pages/game/MultiPlayerPage.vue)

#### Timer Display
Added in sidebar below Match Progress:
- Progress bar showing time remaining (20s → 0s)
- Numeric countdown display
- Color coding:
  - Blue when it's your turn
  - Gray when it's opponent's turn
  - Red when < 5 seconds (warning state)
- Shows whose turn it is
- Only visible during active games (not when complete)

#### Timeout Modal
Displays when a timeout occurs:
- Clock icon with red styling
- Shows who timed out (you or opponent)
- Explains all cards were awarded to winner
- "Continue" button to dismiss and see game-over modal

## Game Flow

### Normal Turn Flow
1. Player joins game → timer starts (20s)
2. Player plays card → timer clears and restarts for next player
3. Both cards played → timer stops during trick resolution (1.5s delay)
4. Trick resolved → timer restarts for next turn
5. Repeat until game ends

### Timeout Flow
1. Timer reaches 0 seconds
2. Backend:
   - Stops timer
   - Awards opponent: their hand + timed-out player's hand + deck
   - Calculates points
   - Awards 4 marks to opponent (forfeit penalty)
   - Checks if match is over
   - Emits timeout event
3. Frontend:
   - Shows timeout modal
   - Displays who timed out
   - User clicks "Continue"
   - Game-over modal appears with results

### Timer Lifecycle Events
- **Start**: Game begins, both players join, next game starts, trick resolved
- **Stop**: Card played (briefly), both cards played, game ends, timeout, resignation
- **Warning**: Time drops below 5 seconds
- **Forfeit**: Time reaches 0 seconds

## Timeout Penalty
When a player times out:
- **Immediate**: All remaining cards → opponent's spoils
- **Marks**: +4 marks to opponent (maximum penalty, same as bandeira/120 points)
- **Match**: If opponent reaches 4+ marks, match ends immediately
- **No Appeal**: Automatic forfeit, no recovery

## Visual Feedback

### Timer States
| State | Color | Indicator |
|-------|-------|-----------|
| Your turn, plenty of time | Blue | Blue progress bar |
| Opponent's turn | Gray | Gray progress bar |
| Warning (< 5s) | Red | Red progress bar + pulsing number |
| Timeout | Red | Modal notification |

### Progress Bar
- Width: 100% at 20s → 0% at 0s
- Smooth transition (300ms CSS)
- Border for visibility
- Monospace font for countdown number

## Testing Checklist
- [ ] Timer starts when game begins
- [ ] Timer shows correct value (20, 19, 18...)
- [ ] Timer restarts after each move
- [ ] Timer stops during trick resolution
- [ ] Warning appears at 5 seconds
- [ ] Timeout occurs at 0 seconds
- [ ] All cards awarded to opponent on timeout
- [ ] 4 marks awarded on timeout
- [ ] Match ends if opponent reaches 4 marks
- [ ] Timeout modal displays correct info
- [ ] Timer syncs across both players
- [ ] Timer clears on resign
- [ ] Timer restarts for next match game

## Future Enhancements
- [ ] Sound effect for timeout warning
- [ ] Configurable timer duration (admin setting)
- [ ] Pause timer during disconnection (grace period)
- [ ] Time bank (reserve time for critical moves)
- [ ] Move history with time taken per move
- [ ] Average time per move statistics
