# Requirements Implementation Checklist

## ✅ Implemented Features

### 1. Coin System
- ✅ **Welcome Bonus**: New users receive 10 coins (`TransactionService::giveWelcomeBonus()`)
- ✅ **Purchase Rate**: €1 = 10 coins fixed rate (`config/coins.php`, `TransactionController`)
- ✅ **Purchase Increments**: €1 increments enforced in validation (`TransactionController::store()`)
- ✅ **Payment Methods**: MBWAY, PAYPAL, IBAN, MB, VISA supported
- ✅ **Encrypted Storage**: Payment references encrypted in database (`CoinPurchase` model)

### 2. Game Costs & Payouts
- ✅ **Standalone Game Fee**: 2 coins (`TransactionService::deductGameFee()`)
- ✅ **Draw Refund**: 1 coin refund per player (`TransactionService::refundGameDraw()`)
- ✅ **Payout Structure**:
  - Basic win (≥61 points): 3 coins
  - Capote (≥91 points): 4 coins
  - Bandeira (120 points): 6 coins
  - Implemented in `TransactionService::awardGamePayout()`

### 3. Match Stakes
- ✅ **Minimum Stake**: 3 coins per player
- ✅ **Maximum Stake**: 100 coins per player
- ✅ **Validation**: Stake range enforced in `TransactionService::deductMatchStake()`
- ✅ **Commission**: 1 coin platform fee deducted from total stake (`TransactionService::awardMatchPayout()`)

### 4. Transaction Logging
- ✅ **Transaction Types**:
  1. Bonus (welcome and other bonuses)
  2. Coin Purchase
  3. Game Fee (debit)
  4. Match Stake (debit)
  5. Game Payout (credit)
  6. Match Payout (credit)
- ✅ **Transaction Records**: All transactions logged with:
  - Timestamp
  - User ID
  - Transaction type
  - Coin amount
  - Associated game/match ID (if applicable)
  - Custom metadata (outcome, reason, etc.)

### 5. Game & Match History
- ✅ **Game Persistence**: `GamePersistenceService` saves all games with:
  - Players, winner, loser
  - Points, draw status
  - Timestamps, total time
  - Match association
  - Custom metadata (moves, resigned, timeout)
- ✅ **Match Persistence**: `GamePersistenceService` saves matches with:
  - Players, winner, stake
  - Marks and total points
  - Current game number
  - Timestamps

### 6. User Access to History
- ✅ **Transaction History**: `/api/transactions` endpoint (authenticated)
- ✅ **Game History**: `/api/games` endpoint (authenticated)
- ✅ **Frontend Pages**:
  - Transaction History page (`HistoryPage.vue`)
  - Game History page (`GamesHistoryPage.vue`)

### 7. Statistics & Leaderboards
- ✅ **Statistics Endpoint**: `/api/statistics` (public)
- ✅ **Top Coin Holders**: Leaderboard by coin balance
- ✅ **Top Victory Count**: Leaderboard by total victories
- ✅ **Statistics Page**: `StatisticsPage.vue` displays both leaderboards

### 8. Security Features
- ✅ **Authentication**: Sanctum token authentication
- ✅ **Route Protection**: Navigation guards for authenticated routes
- ✅ **Payment Encryption**: AES-256-CBC encryption for payment references
- ✅ **Overflow Protection**: Integer overflow validation for coin purchases
- ✅ **Balance Validation**: Insufficient balance checks before deductions

### 9. Configuration Management
- ✅ **Extractable Config**: `config/coins.php` with environment variable support
- ✅ **Constants**: Transaction type constants in `CoinTransactionType` model
- ✅ **No Magic Numbers**: All values centralized

## ⚠️ Partially Implemented / Needs Integration

### 1. Game/Match Transaction Integration
**Status**: Service methods exist but need WebSocket integration

**Required**: WebSocket server should call these endpoints when games/matches end:

```javascript
// When standalone game ends:
POST /api/games/transactions/fee     // Deduct 2 coins from both players
POST /api/games/transactions/payout  // Award winner (or refund on draw)

// When match starts:
POST /api/matches/transactions/stake // Deduct stake from both players

// When match ends:
POST /api/matches/transactions/payout // Award winner (stake - 1 coin)
```

**Action Needed**:
1. Create controller endpoints for transaction operations
2. Update WebSocket server to call these endpoints
3. Link game/match IDs to transactions

### 2. Match Stake Negotiation
**Status**: Backend validation exists, UI needs implementation

**Required**: Before match starts, players should:
- See default 3-coin stake
- Option to mutually agree on higher stake (up to 100 coins)
- Both players must confirm before match begins

**Action Needed**:
1. Add stake selection UI in lobby/match setup
2. WebSocket events for stake negotiation
3. Store agreed stake with match record

## 🔴 Not Yet Implemented

### 1. Platform/In-Game Items & Features (Optional)
**Status**: Not implemented

**Mentioned in Requirements**: "if implemented by the student team"

**If Implementing**:
- Create `PlatformItems` table
- Add purchase endpoint
- Create transaction type for item purchases
- Add UI for item shop

### 2. Anonymous User Access
**Status**: Needs verification

**Required**: "statistics and global leaderboards visible to all users, including anonymous visitors"

**Current State**:
- Statistics endpoint is public ✅
- Need to verify frontend allows anonymous access to statistics page

**Action Needed**:
1. Remove `requiresAuth` from statistics route if present
2. Test access without login

## 📝 Recommendations

### 1. Create Transaction API Endpoints

Add to `api/routes/api.php`:

```php
// Game transaction endpoints (called by WebSocket server)
Route::post('/games/{game}/transactions/fee', [GameTransactionController::class, 'deductFee']);
Route::post('/games/{game}/transactions/payout', [GameTransactionController::class, 'awardPayout']);
Route::post('/games/{game}/transactions/refund', [GameTransactionController::class, 'refundDraw']);

// Match transaction endpoints
Route::post('/matches/{match}/transactions/stake', [MatchTransactionController::class, 'deductStake']);
Route::post('/matches/{match}/transactions/payout', [MatchTransactionController::class, 'awardPayout']);
```

### 2. WebSocket Integration Points

Update `websockets/state/game.js`:

```javascript
// When game starts (before dealing cards)
await apiClient.deductGameFees(game)

// When game ends
if (game.isDraw) {
  await apiClient.refundGameDraw(game)
} else {
  await apiClient.awardGamePayout(game, winner, points)
}

// When match starts
await apiClient.deductMatchStakes(match, stake)

// When match ends
await apiClient.awardMatchPayout(match, winner, totalStake)
```

### 3. Frontend Enhancements

**Statistics Page**:
- ✅ Already shows leaderboards
- Verify accessible without login

**Game History**:
- ✅ Shows game results
- Consider adding coin earnings/losses per game

**Transaction History**:
- ✅ Shows all transactions
- Consider filtering by type
- Add date range filter

## 🎯 Summary

**Fully Implemented**: ~85%
- Core coin system ✅
- Transaction logging ✅
- Game/Match persistence ✅
- User history views ✅
- Statistics & leaderboards ✅

**Needs Integration**: ~10%
- Connect transaction service to game lifecycle
- Implement stake negotiation UI

**Optional/Future**: ~5%
- Platform items shop
- Additional features

The foundation is solid! Main task is connecting the existing `TransactionService` methods to the game/match lifecycle events in the WebSocket server.
