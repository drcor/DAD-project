# Database Schema Documentation


## Table of Contents

- [Database Schema Documentation](#database-schema-documentation)
  - [Table of Contents](#table-of-contents)
  - [users](#users)
  - [password\_reset\_tokens](#password_reset_tokens)
  - [matches](#matches)
  - [games](#games)
  - [coin\_transaction\_types](#coin_transaction_types)
  - [coin\_transactions](#coin_transactions)
  - [coin\_purchases](#coin_purchases)
  - [personal\_access\_tokens](#personal_access_tokens)
  - [Entity Relationship Diagram](#entity-relationship-diagram)
  - [Database Statistics](#database-statistics)
  - [Notes](#notes)
    - [Soft Deletes](#soft-deletes)
    - [Timestamps](#timestamps)
    - [Custom Fields](#custom-fields)
    - [Transaction Flags](#transaction-flags)
    - [Game Types](#game-types)
    - [User Types](#user-types)

---

## users

**Description:** Stores user accounts (players and administrators)

| Column                  | Type            | Constraints                 | Description                                  |
| ----------------------- | --------------- | --------------------------- | -------------------------------------------- |
| `id`                    | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | User ID                                      |
| `name`                  | VARCHAR(255)    | NOT NULL                    | User's full name                             |
| `email`                 | VARCHAR(255)    | NOT NULL, UNIQUE            | User's email address                         |
| `email_verified_at`     | TIMESTAMP       | NULLABLE                    | Email verification timestamp                 |
| `password`              | VARCHAR(255)    | NOT NULL                    | Hashed password                              |
| `remember_token`        | VARCHAR(100)    | NULLABLE                    | Remember me token                            |
| `type`                  | ENUM('A', 'P')  | DEFAULT 'P'                 | User type: **A**=Administrator, **P**=Player |
| `nickname`              | VARCHAR(20)     | NULLABLE, UNIQUE            | Player nickname (unique)                     |
| `blocked`               | BOOLEAN         | DEFAULT false               | Whether user account is blocked              |
| `photo_avatar_filename` | VARCHAR(255)    | NULLABLE                    | Avatar image filename                        |
| `coins_balance`         | INTEGER         | DEFAULT 0                   | Current brain coin balance                   |
| `custom`                | JSON            | NULLABLE                    | Custom data field for extensions             |
| `deleted_at`            | TIMESTAMP       | NULLABLE                    | Soft delete timestamp                        |
| `created_at`            | TIMESTAMP       | NULLABLE                    | Record creation timestamp                    |
| `updated_at`            | TIMESTAMP       | NULLABLE                    | Record update timestamp                      |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `email`
- UNIQUE: `nickname`

---

## password_reset_tokens

**Description:** Stores password reset tokens for authentication

| Column       | Type         | Constraints | Description                   |
| ------------ | ------------ | ----------- | ----------------------------- |
| `email`      | VARCHAR(255) | PRIMARY KEY | User's email address          |
| `token`      | VARCHAR(255) | NOT NULL    | Password reset token (hashed) |
| `created_at` | TIMESTAMP    | NULLABLE    | Token creation timestamp      |

**Indexes:**
- PRIMARY KEY: `email`

---

## matches

**Description:** Stores multiplayer match data (best-of-4 series)

| Column              | Type            | Constraints                 | Description                                          |
| ------------------- | --------------- | --------------------------- | ---------------------------------------------------- |
| `id`                | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Match ID                                             |
| `type`              | ENUM('3', '9')  | DEFAULT '3'                 | Match type: **3**=Bisca dos 3, **9**=Bisca dos 9     |
| `player1_user_id`   | BIGINT UNSIGNED | NOT NULL, FK→users.id       | Player 1 (match creator)                             |
| `player2_user_id`   | BIGINT UNSIGNED | NOT NULL, FK→users.id       | Player 2 (match joiner)                              |
| `winner_user_id`    | BIGINT UNSIGNED | NULLABLE, FK→users.id       | Match winner user ID                                 |
| `loser_user_id`     | BIGINT UNSIGNED | NULLABLE, FK→users.id       | Match loser user ID                                  |
| `status`            | ENUM            | NOT NULL                    | **Pending**, **Playing**, **Ended**, **Interrupted** |
| `stake`             | INTEGER         | DEFAULT 3                   | Stake amount (coins per player, 3-100)               |
| `began_at`          | DATETIME        | NULLABLE                    | Match start timestamp                                |
| `ended_at`          | DATETIME        | NULLABLE                    | Match end timestamp                                  |
| `total_time`        | DECIMAL(8,2)    | NULLABLE                    | Total match duration in seconds                      |
| `player1_marks`     | INTEGER         | NULLABLE                    | Player 1 marks (games won)                           |
| `player2_marks`     | INTEGER         | NULLABLE                    | Player 2 marks (games won)                           |
| `player1_points`    | INTEGER         | NULLABLE                    | Player 1 total points (all games combined)           |
| `player2_points`    | INTEGER         | NULLABLE                    | Player 2 total points (all games combined)           |
| `player1_capotes`   | INTEGER         | DEFAULT 0                   | Player 1 capote achievement count (≥91 pts)          |
| `player1_bandeiras` | INTEGER         | DEFAULT 0                   | Player 1 bandeira achievement count (120 pts)        |
| `player2_capotes`   | INTEGER         | DEFAULT 0                   | Player 2 capote achievement count (≥91 pts)          |
| `player2_bandeiras` | INTEGER         | DEFAULT 0                   | Player 2 bandeira achievement count (120 pts)        |
| `stakes_deducted`   | BOOLEAN         | DEFAULT false               | Whether stakes have been deducted                    |
| `payout_awarded`    | BOOLEAN         | DEFAULT false               | Whether winner payout has been awarded               |
| `custom`            | JSON            | NULLABLE                    | Custom data field for extensions                     |

**Indexes:**
- PRIMARY KEY: `id`

**Foreign Keys:**
- `player1_user_id` → `users.id`
- `player2_user_id` → `users.id`
- `winner_user_id` → `users.id`
- `loser_user_id` → `users.id`

---

## games

**Description:** Stores individual game data (standalone or part of a match)

| Column            | Type                           | Constraints                 | Description                                          |
| ----------------- | ------------------------------ | --------------------------- | ---------------------------------------------------- |
| `id`              | BIGINT UNSIGNED                | PRIMARY KEY, AUTO_INCREMENT | Game ID                                              |
| `type`            | ENUM('3', '9')                 | DEFAULT '3'                 | Game type: **3**=Bisca dos 3, **9**=Bisca dos 9      |
| `player1_user_id` | BIGINT UNSIGNED                | NOT NULL, FK→users.id       | Player 1 (game creator)                              |
| `player2_user_id` | BIGINT UNSIGNED                | NOT NULL, FK→users.id       | Player 2 (game joiner)                               |
| `is_draw`         | BOOLEAN                        | DEFAULT false               | Whether game ended in a draw                         |
| `winner_user_id`  | BIGINT UNSIGNED                | NULLABLE, FK→users.id       | Game winner user ID (null if draw)                   |
| `loser_user_id`   | BIGINT UNSIGNED                | NULLABLE, FK→users.id       | Game loser user ID (null if draw)                    |
| `match_id`        | BIGINT UNSIGNED                | NULLABLE, FK→matches.id     | Parent match ID (null for standalone games)          |
| `status`          | ENUM                           | NOT NULL                    | **Pending**, **Playing**, **Ended**, **Interrupted** |
| `began_at`        | DATETIME                       | NULLABLE                    | Game start timestamp                                 |
| `ended_at`        | DATETIME                       | NULLABLE                    | Game end timestamp                                   |
| `total_time`      | DECIMAL(8,2)                   | NULLABLE                    | Total game duration in seconds                       |
| `player1_points`  | INTEGER                        | NULLABLE                    | Player 1 final points                                |
| `player2_points`  | INTEGER                        | NULLABLE                    | Player 2 final points                                |
| `is_capote`       | BOOLEAN                        | DEFAULT false               | Achievement: Winner scored ≥91 points                |
| `is_bandeira`     | BOOLEAN                        | DEFAULT false               | Achievement: Winner scored 120 points (clean sweep)  |
| `is_forfeit`      | BOOLEAN                        | DEFAULT false               | Game ended by forfeit (resignation/timeout)          |
| `forfeit_reason`  | ENUM('resignation', 'timeout') | NULLABLE                    | Reason for forfeit if applicable                     |
| `fees_deducted`   | BOOLEAN                        | DEFAULT false               | Whether game fees have been deducted                 |
| `payout_awarded`  | BOOLEAN                        | DEFAULT false               | Whether winner payout has been awarded               |
| `refund_issued`   | BOOLEAN                        | DEFAULT false               | Whether refund has been issued                       |
| `custom`          | JSON                           | NULLABLE                    | Custom data field for extensions                     |

**Indexes:**
- PRIMARY KEY: `id`

**Foreign Keys:**
- `player1_user_id` → `users.id`
- `player2_user_id` → `users.id`
- `winner_user_id` → `users.id`
- `loser_user_id` → `users.id`
- `match_id` → `matches.id`

**Game Types:**
- **Standalone:** Single game not part of a match (`match_id` is null)
- **Match Game:** Part of a best-of-4 match series (`match_id` references parent match)

**Achievements:**
- **Capote:** Winner scores 91-119 points (opponent < 30 points)
- **Bandeira:** Winner scores 120 points (clean sweep, opponent 0 points)

---

## coin_transaction_types

**Description:** Defines types of coin transactions (credit/debit)

| Column       | Type            | Constraints                 | Description                                                 |
| ------------ | --------------- | --------------------------- | ----------------------------------------------------------- |
| `id`         | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Transaction type ID                                         |
| `name`       | VARCHAR(40)     | NOT NULL                    | Transaction type name                                       |
| `type`       | ENUM('C', 'D')  | NOT NULL                    | **C**=Credit (increase coins), **D**=Debit (decrease coins) |
| `custom`     | JSON            | NULLABLE                    | Custom data field for extensions                            |
| `deleted_at` | TIMESTAMP       | NULLABLE                    | Soft delete timestamp                                       |

**Indexes:**
- PRIMARY KEY: `id`

**Default Values (Seeded):**

| ID  | Name          | Type | Description                       |
| --- | ------------- | ---- | --------------------------------- |
| 1   | Bonus         | C    | Promotional bonus credits         |
| 2   | Coin purchase | C    | Purchase of coins with real money |
| 3   | Game fee      | D    | Fee deducted for standalone games |
| 4   | Match stake   | D    | Stake deducted for match games    |
| 5   | Game payout   | C    | Payout awarded to game winner     |
| 6   | Match payout  | C    | Payout awarded to match winner    |

---

## coin_transactions

**Description:** Records all coin balance changes for users

| Column                     | Type            | Constraints                            | Description                                   |
| -------------------------- | --------------- | -------------------------------------- | --------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT            | Transaction ID                                |
| `transaction_datetime`     | DATETIME        | NOT NULL                               | Transaction timestamp                         |
| `user_id`                  | BIGINT UNSIGNED | NOT NULL, FK→users.id                  | User associated with transaction              |
| `match_id`                 | BIGINT UNSIGNED | NULLABLE, FK→matches.id                | Related match (for match stakes/payouts)      |
| `game_id`                  | BIGINT UNSIGNED | NULLABLE, FK→games.id                  | Related game (for game fees/payouts)          |
| `coin_transaction_type_id` | BIGINT UNSIGNED | NOT NULL, FK→coin_transaction_types.id | Type of transaction                           |
| `coins`                    | INTEGER         | NOT NULL                               | Coin amount (positive=credit, negative=debit) |
| `custom`                   | JSON            | NULLABLE                               | Custom data field for extensions              |

**Indexes:**
- PRIMARY KEY: `id`

**Foreign Keys:**
- `user_id` → `users.id`
- `match_id` → `matches.id`
- `game_id` → `games.id`
- `coin_transaction_type_id` → `coin_transaction_types.id`

**Transaction Flow Examples:**
- **Game Fee:** `-2` coins (debit) when game starts
- **Match Stake:** `-10` coins (debit) when match starts (per player)
- **Game Payout:** `+4` coins (credit) to winner (fee refund + opponent's fee)
- **Match Payout:** `+20` coins (credit) to winner (stake refund + opponent's stake)

---

## coin_purchases

**Description:** Records coin purchases with real money

| Column                | Type            | Constraints                               | Description                                       |
| --------------------- | --------------- | ----------------------------------------- | ------------------------------------------------- |
| `id`                  | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT               | Purchase ID                                       |
| `purchase_datetime`   | DATETIME        | NOT NULL                                  | Purchase timestamp                                |
| `user_id`             | BIGINT UNSIGNED | NOT NULL, FK→users.id                     | Purchasing user                                   |
| `coin_transaction_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK→coin_transactions.id | Related coin transaction (1:1)                    |
| `euros`               | DECIMAL(8,2)    | NOT NULL                                  | Purchase amount in euros (€)                      |
| `payment_type`        | ENUM            | NOT NULL                                  | **MBWAY**, **PAYPAL**, **IBAN**, **MB**, **VISA** |
| `payment_reference`   | VARCHAR(30)     | NOT NULL                                  | Payment identifier/reference                      |
| `custom`              | JSON            | NULLABLE                                  | Custom data field for extensions                  |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `coin_transaction_id`

**Foreign Keys:**
- `user_id` → `users.id`
- `coin_transaction_id` → `coin_transactions.id` (1:1 relationship)

**Payment Types:**
- **MBWAY:** Phone number (9 digits)
- **PAYPAL:** Email address
- **IBAN:** Bank account (2 letters + 23 digits)
- **MB:** Multibanco (Entity: 5 digits + Reference: 9 digits)
- **VISA:** Card number (16 digits)

---

## personal_access_tokens

**Description:** Laravel Sanctum authentication tokens for API access

| Column           | Type            | Constraints                 | Description                                  |
| ---------------- | --------------- | --------------------------- | -------------------------------------------- |
| `id`             | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Token ID                                     |
| `tokenable_type` | VARCHAR(255)    | NOT NULL                    | Polymorphic type (usually 'App\Models\User') |
| `tokenable_id`   | BIGINT UNSIGNED | NOT NULL                    | Polymorphic ID (user ID)                     |
| `name`           | TEXT            | NOT NULL                    | Token name/description                       |
| `token`          | VARCHAR(64)     | NOT NULL, UNIQUE            | Hashed token value                           |
| `abilities`      | TEXT            | NULLABLE                    | Token abilities/scopes (JSON)                |
| `last_used_at`   | TIMESTAMP       | NULLABLE                    | Last usage timestamp                         |
| `expires_at`     | TIMESTAMP       | NULLABLE, INDEXED           | Token expiration timestamp                   |
| `created_at`     | TIMESTAMP       | NULLABLE                    | Token creation timestamp                     |
| `updated_at`     | TIMESTAMP       | NULLABLE                    | Token update timestamp                       |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `token`
- INDEX: `expires_at`
- INDEX: `tokenable_type`, `tokenable_id`

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄─────┐
│ email (UNIQUE)  │      │
│ nickname        │      │
│ type (A/P)      │      │
│ coins_balance   │      │
│ blocked         │      │
└─────────────────┘      │
         ▲               │
         │               │
         │ player1/2     │
         │ winner/loser  │
         │               │
┌────────┴────────┐      │
│    matches      │      │
│─────────────────│      │
│ id (PK)         │      │
│ type (3/9)      │      │
│ player1_user_id │──────┤
│ player2_user_id │──────┤
│ winner_user_id  │──────┤
│ loser_user_id   │──────┤
│ status          │      │
│ stake           │      │
│ began_at        │      │
│ ended_at        │      │
└─────────────────┘      │
         ▲               │
         │ match_id      │
         │               │
┌────────┴────────┐      │
│     games       │      │
│─────────────────│      │
│ id (PK)         │      │
│ type (3/9)      │      │
│ player1_user_id │──────┤
│ player2_user_id │──────┤
│ winner_user_id  │──────┤
│ loser_user_id   │──────┤
│ match_id (FK)   │──────┘
│ status          │
│ is_draw         │
│ is_capote       │
│ is_bandeira     │
│ is_forfeit      │
└─────────────────┘
         ▲
         │ game_id
         │
┌────────┴────────────────┐
│  coin_transactions      │
│─────────────────────────│
│ id (PK)                 │
│ user_id (FK)            │────┐
│ match_id (FK)           │    │
│ game_id (FK)            │    │
│ coin_transaction_type_id│◄───┼────┐
│ coins                   │    │    │
│ transaction_datetime    │    │    │
└─────────────────────────┘    │    │
         ▲                     │    │
         │ 1:1                 │    │
         │                     │    │
┌────────┴────────────────┐    │    │
│  coin_purchases         │    │    │
│─────────────────────────│    │    │
│ id (PK)                 │    │    │
│ user_id (FK)            │────┘    │
│ coin_transaction_id(FK) │         │
│ euros                   │         │
│ payment_type            │         │
│ payment_reference       │         │
└─────────────────────────┘         │
                                    │
┌───────────────────────────────────┘
│
│  ┌─────────────────────────┐
└─►│ coin_transaction_types  │
   │─────────────────────────│
   │ id (PK)                 │
   │ name                    │
   │ type (C/D)              │
   └─────────────────────────┘
```

---

## Database Statistics

**Core Application Tables:** 8
- users
- matches
- games
- coin_transaction_types
- coin_transactions
- coin_purchases

**Laravel Framework Tables:** 8
- sessions
- password_reset_tokens
- personal_access_tokens
- cache
- cache_locks
- jobs
- job_batches
- failed_jobs

**Total Tables:** 14

---

## Notes

### Soft Deletes
The following tables support soft deletes:
- `users` (via `deleted_at`)
- `coin_transaction_types` (via `deleted_at`)

### Timestamps
Most tables include Laravel's standard timestamps:
- `created_at` - Automatically set when record is created
- `updated_at` - Automatically updated when record is modified

### Custom Fields
All core application tables include a `custom` JSON field for future extensibility without schema changes.

### Transaction Flags
Games and matches include boolean flags to prevent duplicate financial transactions:
- **Games:** `fees_deducted`, `payout_awarded`, `refund_issued`
- **Matches:** `stakes_deducted`, `payout_awarded`

### Game Types
- **Type 3:** Bisca dos 3 (3 cards per hand)
- **Type 9:** Bisca dos 9 (9 cards per hand)

### User Types
- **A:** Administrator (cannot play games)
- **P:** Player (can play games, purchase coins)
