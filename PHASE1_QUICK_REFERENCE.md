# Phase 1 - Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Backend (Terminal 1)
cd api
php artisan storage:link  # One-time setup for photo uploads
php artisan serve

# Frontend (Terminal 2)
cd frontend
npm run dev

# WebSocket (Terminal 3)
cd websockets
npm run dev
```

## 📍 New Routes

### Frontend
- `/register` - User registration page
- `/profile` - User profile management page

### Backend API
- `POST /api/register` - Register new user
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `PUT /api/profile/password` - Change password
- `POST /api/profile/photo` - Upload photo
- `DELETE /api/profile/photo` - Delete photo
- `DELETE /api/profile` - Delete account

## 🧪 Test Registration

1. Go to `http://localhost:5173/register`
2. Fill in:
   - Email: `test@example.com`
   - Nickname: `TestUser`
   - Name: `Test User`
   - Password: `password123`
3. Check database:
```sql
SELECT * FROM users WHERE email = 'test@example.com';
-- coins_balance should be 10

SELECT * FROM coin_transactions WHERE user_id = (
  SELECT id FROM users WHERE email = 'test@example.com'
);
-- Should have 1 welcome bonus transaction
```

## 📦 New Files Created

### Backend
- `app/Models/CoinTransaction.php`
- `app/Models/CoinTransactionType.php`
- `app/Models/CoinPurchase.php`
- `app/Services/TransactionService.php`
- `app/Http/Controllers/UserController.php`

### Frontend
- `src/pages/auth/RegisterPage.vue`
- `src/pages/profile/ProfilePage.vue`

## 🔑 Key Features

✅ User registration with welcome bonus (10 coins)  
✅ Email & nickname uniqueness validation  
✅ Photo/avatar upload (max 2MB)  
✅ Profile editing  
✅ Password changes  
✅ Account deletion (hard/soft delete)  
✅ Transaction logging  
✅ Auth guards on routes  

## 🎯 What's Next (Phase 2)

- Coin purchase page
- Payment API integration
- Transaction history page
- Game fee enforcement
- Game payouts
- Match stakes

## 🐛 Common Issues

**Photo upload not working?**
```bash
cd api
php artisan storage:link
chmod -R 775 storage
```

**Route not found?**
- Check frontend dev server is running (`npm run dev`)
- Check API server is running (`php artisan serve`)

**Registration not giving 10 coins?**
- Check TransactionService is being injected in AuthController
- Check database has coin_transaction_types seeded

**Can't login after registration?**
- Check token is being saved in sessionStorage
- Check axios Authorization header is set
- Open DevTools → Application → Session Storage

## 💡 Tips

- All profile changes are instant (no page refresh)
- Photos are stored in `storage/app/public/photos/`
- Soft delete preserves transaction history
- Hard delete only works if no activity
- Welcome bonus always creates transaction record
