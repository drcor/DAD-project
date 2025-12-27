# Bisca Platform - Gap Analysis
**Date**: December 27, 2025  
**Branch**: multiplayer

## Executive Summary

### ✅ **Implemented Features** (Core Gameplay)
- Database schema (comprehensive - all tables defined)
- Basic authentication (login/logout with Sanctum)
- Game and Match persistence
- Single-player mode (bot logic)
- Multiplayer mode (WebSockets with Socket.IO)
- Game variants (Bisca de 3 and Bisca de 9)
- Match system (4 marks = bandeira)
- Resignation functionality (forfeits match, awards all cards)
- Timeout system (20-second timer, awards all cards)
- Real-time game state synchronization
- Proper point calculation on all game endings

### ❌ **Missing Critical Features** (Requirements)

Based on the project requirements document, here's what still needs implementation:

---

## G1. USER REGISTRATION, AUTHENTICATION, PROFILE, END SESSION, ACCOUNT REMOVAL

### ✅ Implemented
- Basic authentication (login/logout)
- Database schema supports all fields (nickname, photo, type, blocked, soft deletes)

### ❌ Missing
- [ ] **User Registration endpoint** with welcome bonus (10 coins)
- [ ] **Profile management** (view/update email, nickname, name, photo/avatar, password)
- [ ] **Photo/avatar upload** functionality
- [ ] **Account deletion** with confirmation (forfeit coins, soft delete if has transactions/games)
- [ ] **Administrator account creation** (by existing admin only)
- [ ] **Email uniqueness validation**
- [ ] **Nickname uniqueness validation**
- [ ] **Password minimum length** (3 characters) validation

**Priority**: 🔴 **CRITICAL** - No way for users to register currently

---

## G2. COINS AND TRANSACTIONS

### ✅ Implemented
- Database schema complete (`users.coins_balance`, `coin_transactions`, `coin_purchases`, `coin_transaction_types`)
- Transaction types seeded (Bonus, Purchase, Fee, Stake, Payout)

### ❌ Missing
- [ ] **View coin balance** endpoint
- [ ] **Purchase coins** endpoint (€1 = 10 coins, €1 increments)
- [ ] **External payment API** integration (simulate payment transactions)
- [ ] **Welcome bonus** (10 coins on registration)
- [ ] **Transaction history** endpoint (players see own, admins see all)
- [ ] **Automatic transaction logging** for:
  - [ ] Welcome bonuses
  - [ ] Coin purchases
  - [ ] Game entry fees (2 coins for standalone game)
  - [ ] Match stakes (3-100 coins per player)
  - [ ] Game payouts (3 for basic win, 4 for capote, 6 for bandeira)
  - [ ] Match payouts (combined stake - 1 coin commission)
  - [ ] Coin refunds on draw (1 coin per player)
- [ ] **Platform commission** deduction (1 coin on match payouts)
- [ ] **Coin balance updates** on all transactions
- [ ] **Mutual stake agreement** system for matches (up to 100 coins)

**Priority**: 🔴 **CRITICAL** - Core business model, required for multiplayer games

---

## G3. GAMES AND MATCHES

### ✅ Implemented
- Single-player mode (bot logic working)
- Multiplayer mode (WebSockets, real-time)
- Both variants (Bisca de 3 and Bisca de 9)
- Match system (4 marks)
- Resignation (forfeits match, awards all remaining cards + trump)
- Timeout (20s timer, awards all remaining cards + trump)
- Game/match persistence
- Server as source of truth

### ❌ Missing
- [ ] **Entry fee enforcement** (2 coins for standalone game)
- [ ] **Stake enforcement** for matches (3-100 coins)
- [ ] **Mutual stake agreement** UI/logic before match starts
- [ ] **Automatic payouts** based on game outcome:
  - [ ] 3 coins for basic win (≥61 points)
  - [ ] 4 coins for capote (≥91 points)
  - [ ] 6 coins for bandeira (120 points)
  - [ ] 1 coin refund on draw
- [ ] **Match payout** (combined stake - 1 coin commission)
- [ ] **Coin validation** before game/match start (sufficient balance)
- [ ] **Anonymous user restrictions** (single-player only)
- [ ] **Registered user privileges** (both modes)
- [ ] **Game metadata persistence**:
  - [ ] Start/end timestamps (schema has it, need to populate)
  - [ ] Variant tracking
  - [ ] Outcome details (capote, bandeira flags)
  - [ ] Duration calculation
  - [ ] Status updates (Pending → Playing → Ended)

**Priority**: 🔴 **CRITICAL** - Coin economy must work for multiplayer

---

## G4. GAME HISTORY AND LEADERBOARDS

### ✅ Implemented
- Database schema supports all metadata
- Basic game/match retrieval endpoints

### ❌ Missing
- [ ] **Multiplayer game history** endpoint (player sees own, admin sees all)
- [ ] **Match history** endpoint
- [ ] **Detailed game/match records** (visible to participants and admins)
- [ ] **Filtering/pagination** for histories
- [ ] **Personal leaderboards** (owner only):
  - [ ] Total game wins
  - [ ] Total match wins
  - [ ] Total capotes
  - [ ] Total bandeiras
  - [ ] Optional: segmented by variant
- [ ] **Global leaderboards** (public, including anonymous):
  - [ ] Top players by game wins
  - [ ] Top players by match wins
  - [ ] Top players by capotes
  - [ ] Top players by bandeiras
  - [ ] Tie-breaking (earlier achiever ranks higher)
- [ ] **Single-player exclusion** (don't track bot games)

**Priority**: 🟡 **HIGH** - Required feature, but not blocking core gameplay

---

## G5. ADMINISTRATION

### ✅ Implemented
- Database schema (user.type, user.blocked, soft deletes)

### ❌ Missing
- [ ] **Admin dashboard** (read-only access)
- [ ] **View all users** (players + administrators)
- [ ] **Block/unblock players** endpoint
- [ ] **Create administrator accounts** endpoint (admin-only)
- [ ] **Remove accounts** endpoint (any except own)
- [ ] **Soft delete enforcement** (players with transactions/games)
- [ ] **Admin restrictions**:
  - [ ] Cannot play games
  - [ ] Cannot hold coins
  - [ ] Cannot delete own account
  - [ ] Cannot register publicly (only created by existing admin)
- [ ] **Read-only transaction access** (all players)
- [ ] **Read-only game/match access** (all players)
- [ ] **Platform usage summaries**:
  - [ ] Total registered players
  - [ ] Total games played
  - [ ] Total matches played
  - [ ] Recent activity
  - [ ] Purchases by period
  - [ ] Purchases by player
  - [ ] Game/match volumes over time

**Priority**: 🟡 **HIGH** - Platform management essential

---

## G6. STATISTICS

### ✅ Implemented
- None

### ❌ Missing
- [ ] **Anonymous/player statistics** (generic, anonymized):
  - [ ] Total registered players
  - [ ] Games and matches played
  - [ ] Recent activity
  - [ ] Aggregate metrics (no individual data)
- [ ] **Administrator statistics** (full, non-anonymized):
  - [ ] Breakdowns by player
  - [ ] Time-series data
  - [ ] Purchase analytics by period
  - [ ] Purchase analytics by player
  - [ ] Game/match volume trends
- [ ] **Visual charts** (implementation choice)
- [ ] **Textual/tabular formats**
- [ ] **Privacy enforcement** (anonymize for non-admins)

**Priority**: 🟢 **MEDIUM** - Nice-to-have, enhances platform value

---

## G7. EXPLORATION AND IMPLEMENTATION

### ✅ Implemented
- Real-time WebSockets (Socket.IO)
- Separate frontend/backend/WebSocket architecture

### ❌ Custom Features to Consider
- [ ] Three or more players per game (optional extension)
- [ ] Spectator mode for multiplayer games/matches
- [ ] Full game playback from history
- [ ] Custom card sets
- [ ] Advanced bot capabilities (difficulty levels)
- [ ] Bots in multiplayer games (fill empty slots)

### ❌ Implementation Improvements to Consider
- [ ] Queue server for async operations (coin purchases, payouts)
- [ ] Horizontal scaling of WebSocket server
- [ ] Session recovery after WebSocket failure
- [ ] Cache server (Redis for leaderboards, statistics)
- [ ] NoSQL database (MongoDB for game state snapshots)
- [ ] Load balancing demonstration
- [ ] Benchmarking and performance testing
- [ ] Failure injection tests
- [ ] CDN for static assets

**Priority**: 🟢 **LOW** - Extra credit, not required for passing grade

---

## Technical Debt

### Backend (Laravel API)
- [ ] Create **Transaction Service** for coin operations
- [ ] Create **Payment Service** for external API integration
- [ ] Create **Leaderboard Service** for rankings calculations
- [ ] Create **Statistics Service** for aggregations
- [ ] Add **proper validation rules** everywhere
- [ ] Add **authorization policies** (Policies for User, Game, Match, Transaction)
- [ ] Create **Transaction model**
- [ ] Create **CoinPurchase model**
- [ ] Create **CoinTransactionType model**
- [ ] Update **User model** with relationships and methods
- [ ] Add **API resources** for clean JSON responses
- [ ] Add **comprehensive error handling**
- [ ] Add **rate limiting** for public endpoints
- [ ] Add **database transactions** for coin operations
- [ ] Add **idempotency** for payment operations

### WebSocket Server
- [ ] **Integrate coin deduction** before game/match start
- [ ] **Integrate payout calculation** on game/match end
- [ ] **Call Laravel API** to:
  - [ ] Deduct entry fees/stakes
  - [ ] Award payouts
  - [ ] Create transaction records
- [ ] Add **reconnection handling** (session recovery)
- [ ] Add **game state snapshots** for restoration
- [ ] Add **error handling** for API failures
- [ ] Add **retry logic** for persistence calls

### Frontend (Vue)
- [ ] Create **Registration page**
- [ ] Create **Profile page** (view/edit)
- [ ] Create **Coin purchase page/modal**
- [ ] Create **Transaction history page**
- [ ] Create **Game history page**
- [ ] Create **Match history page**
- [ ] Create **Leaderboards page** (personal + global)
- [ ] Create **Statistics page** (different for anonymous/player/admin)
- [ ] Create **Admin dashboard**
- [ ] Add **coin balance display** in navbar/header
- [ ] Add **stake agreement UI** before match starts
- [ ] Add **insufficient coins** warnings
- [ ] Add **account deletion** confirmation flow
- [ ] Update **routing** for all new pages
- [ ] Add **role-based UI** (show/hide features based on user type)
- [ ] Add **photo/avatar upload** component

---

## Implementation Priority Roadmap

### Phase 1: Core User Management (Week 1)
**Goal**: Allow users to register and manage accounts

1. **User Registration** (G1)
   - Registration endpoint with validation
   - Welcome bonus (10 coins) transaction
   - Email/nickname uniqueness checks
   - Frontend registration page

2. **Profile Management** (G1)
   - View profile endpoint
   - Update profile endpoint
   - Password change
   - Photo/avatar upload
   - Frontend profile page

3. **Models & Services**
   - Transaction model
   - TransactionService
   - Update User model with relationships

### Phase 2: Coin Economy (Week 2)
**Goal**: Enable coin purchases and game payments

1. **Coin Purchases** (G2)
   - View balance endpoint
   - Purchase endpoint
   - External payment API integration (simulate)
   - CoinPurchase model
   - Frontend coin purchase page

2. **Transaction System** (G2)
   - Transaction history endpoint
   - Transaction logging for all operations
   - Platform commission logic
   - Frontend transaction history page

3. **Game Fees & Payouts** (G3)
   - Entry fee enforcement (2 coins)
   - Payout calculation (3/4/6 coins)
   - Draw refunds (1 coin each)
   - WebSocket integration with coin API

### Phase 3: Match Economy (Week 3)
**Goal**: Complete match stake system

1. **Match Stakes** (G3)
   - Stake agreement system (3-100 coins)
   - Mutual consent UI
   - Stake enforcement
   - Match payout (combined - 1 coin)
   - WebSocket stake handling

2. **Anonymous Restrictions** (G3)
   - Enforce single-player only for anonymous
   - Registered user privilege checks
   - Frontend route guards

### Phase 4: History & Leaderboards (Week 4)
**Goal**: Show game data and rankings

1. **Game History** (G4)
   - Multiplayer history endpoint
   - Match history endpoint
   - Detailed records view
   - Frontend history pages

2. **Leaderboards** (G4)
   - Personal leaderboard calculation
   - Global leaderboard calculation
   - Tie-breaking logic
   - Frontend leaderboards page

### Phase 5: Administration (Week 5)
**Goal**: Platform management tools

1. **Admin Dashboard** (G5)
   - User management (view, block, create admin, remove)
   - Transaction view (read-only)
   - Game/match view (read-only)
   - Usage summaries
   - Frontend admin dashboard

2. **Account Deletion** (G1)
   - Delete endpoint with confirmation
   - Soft delete logic (has transactions/games)
   - Hard delete logic (new users)
   - Frontend deletion flow

### Phase 6: Statistics & Polish (Week 6)
**Goal**: Analytics and final touches

1. **Statistics** (G6)
   - Anonymous/player stats endpoint
   - Admin stats endpoint (detailed)
   - Chart data endpoints
   - Frontend statistics pages

2. **Polish**
   - UI/UX improvements
   - Error handling
   - Loading states
   - Accessibility
   - Mobile responsiveness

### Phase 7: Exploration (Optional)
**Goal**: Extra features for distinction

1. **Custom Features** (G7)
   - Spectator mode
   - Game playback
   - Custom card sets
   - Advanced bots

2. **Technical Improvements** (G7)
   - Queue server (Bull/Redis)
   - WebSocket scaling
   - Session recovery
   - Cache layer
   - Performance tests
   - Documentation

---

## Quick Start: Next Immediate Steps

### 1. User Registration (CRITICAL - Blocks Everything)
```bash
# Create UserController with registration
# Create TransactionService for welcome bonus
# Frontend: Registration page
```

### 2. Coin Purchase (CRITICAL - Enables Multiplayer)
```bash
# Create TransactionController
# Create PaymentService (simulate external API)
# Frontend: Purchase modal/page
```

### 3. Game Fees (CRITICAL - Complete Economy)
```bash
# Update WebSocket to check/deduct coins before game
# Update WebSocket to award coins after game
# Create transaction records via API calls
```

---

## Testing Checklist

### User Registration
- [ ] Register with unique email/nickname
- [ ] Register with duplicate email (should fail)
- [ ] Register with duplicate nickname (should fail)
- [ ] Verify 10 coins welcome bonus in database
- [ ] Verify transaction record created

### Coin Purchases
- [ ] Purchase coins (€1 = 10 coins)
- [ ] Verify balance updated
- [ ] Verify transaction record
- [ ] Verify coin_purchase record
- [ ] Test payment API integration

### Game Economy
- [ ] Start standalone game (2 coins deducted)
- [ ] Win basic game (3 coins awarded)
- [ ] Win capote (4 coins awarded)
- [ ] Win bandeira (6 coins awarded)
- [ ] Draw game (1 coin refunded each)
- [ ] Insufficient coins (game blocked)

### Match Economy
- [ ] Start match with 3 coins stake
- [ ] Agree on higher stake (up to 100)
- [ ] Win match (combined stake - 1 commission)
- [ ] Verify commission deducted

### Administration
- [ ] Admin creates new admin account
- [ ] Admin blocks player
- [ ] Admin views all transactions
- [ ] Admin views all games
- [ ] Admin removes player with history (soft delete)
- [ ] Admin removes new player (hard delete)
- [ ] Admin cannot delete own account

### Leaderboards
- [ ] Personal stats accurate
- [ ] Global rankings accurate
- [ ] Tie-breaking works (earlier wins)
- [ ] Only multiplayer games counted

---

## Database Changes Needed

### Users Table
- ✅ Already has all needed columns (type, nickname, blocked, coins_balance, photo_avatar_filename, soft deletes)

### Games Table
- [ ] Populate `began_at` timestamp when game starts
- [ ] Populate `ended_at` timestamp when game ends
- [ ] Calculate and store `total_time`
- [ ] Update `status` correctly (Pending → Playing → Ended)
- [ ] Consider adding `outcome_type` (normal, capote, bandeira, draw, forfeit)

### Matches Table
- [ ] Populate all timestamp fields
- [ ] Calculate and store `total_time`
- [ ] Update `status` correctly

### Coin Transactions
- ✅ Schema ready, just need to create records

### Coin Purchases
- ✅ Schema ready, just need to create records

---

## Estimated Effort

| Feature Group | Priority | Effort (hours) | Complexity |
|--------------|----------|----------------|------------|
| User Registration + Profile | 🔴 Critical | 16-20 | Medium |
| Coin Purchase System | 🔴 Critical | 12-16 | Medium |
| Game Fee Enforcement | 🔴 Critical | 8-12 | High (WebSocket integration) |
| Match Stake System | 🔴 Critical | 8-12 | High (mutual agreement) |
| Transaction History | 🟡 High | 8-10 | Low |
| Game/Match History | 🟡 High | 10-12 | Medium |
| Leaderboards | 🟡 High | 12-16 | Medium (ranking calculations) |
| Admin Dashboard | 🟡 High | 16-20 | Medium |
| Statistics | 🟢 Medium | 12-16 | Medium (charts) |
| Account Deletion | 🟢 Medium | 6-8 | Low |
| Custom Features | 🟢 Low | 20-40+ | Varies |

**Total Core Features**: ~100-140 hours  
**Total with Statistics**: ~120-160 hours  
**Total with Custom Features**: ~140-200 hours

---

## Conclusion

**Current Status**: ~25% complete (database schema + core gameplay mechanics)

**Critical Path**: User Registration → Coin Purchase → Game Fees → Match Stakes

**Recommendation**: Focus on Phases 1-3 first (user management + coin economy) to get a functional multiplayer economy. Then add history/leaderboards (Phase 4) and administration (Phase 5). Statistics and custom features can come last if time permits.

**Blockers**: No user registration means no way to test multiplayer with real users and coins.
