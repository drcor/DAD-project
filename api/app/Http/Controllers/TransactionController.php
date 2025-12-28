<?php

namespace App\Http\Controllers;

use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class TransactionController extends Controller
{
    // URL do gateway de pagamentos simulado
    private $paymentGatewayUrl;

    public function __construct()
    {
        // Prefer config/services.php entry, fall back to env, then to the original URL
        $this->paymentGatewayUrl = config('services.payments.gateway')
            ?? env('PAYMENT_GATEWAY_URL', '');
    }

    public function store(Request $request)
    {
        // 1. Validation
        $validated = $request->validate([
            'type' => 'required|in:MBWAY,PAYPAL,IBAN,MB,VISA',
            'value' => 'required|integer|min:1|max:99',
            'reference' => ['required', function ($attribute, $value, $fail) use ($request) {
                $type = $request->input('type');
                
                $isValid = match($type) {
                    'MBWAY' => preg_match('/^9\d{8}$/', $value),
                    'PAYPAL' => filter_var($value, FILTER_VALIDATE_EMAIL),
                    'IBAN' => preg_match('/^[A-Z]{2}\d{23}$/', $value),
                    'MB' => preg_match('/^\d{5}-\d{9}$/', $value),
                    'VISA' => preg_match('/^4\d{15}$/', $value),
                    default => false
                };
                
                if (!$isValid) {
                    $fail("Referência inválida para pagamento via $type.");
                }
            }],
        ]);

        // 2. Comunicate with external API
        $response = Http::post('https://dad-payments-api.vercel.app/api/debit', [
            'type' => $validated['type'],
            'reference' => $validated['reference'],
            'value' => (float) $validated['value']
        ]);

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Pagamento recusado pela entidade bancária.',
                'errors' => $response->json()
            ], 422);
        }

        // 3. Store in DB
        try {
            DB::beginTransaction();

            $user = $request->user();
            $coinsEarned = $validated['value'] * config('coins.purchase_rate', 10);

            // Validate against integer overflow for financial security
            $maxBalance = PHP_INT_MAX;
            if ($coinsEarned < 0 || $user->coins_balance > $maxBalance - $coinsEarned) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Coin balance limit exceeded.',
                ], 400);
            }

            $transaction = CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_type_id' => CoinTransactionType::COIN_PURCHASE, 
                'coins' => $coinsEarned,
            ]);

            // Store purchase record (payment_reference is automatically encrypted via model cast)
            CoinPurchase::create([
                'purchase_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_id' => $transaction->id,
                'euros' => $validated['value'],
                'payment_type' => $validated['type'],
                'payment_reference' => $validated['reference'],  // Encrypted in database
            ]);

            $user->coins_balance += $coinsEarned;
            $user->save();

            DB::commit();

            return response()->json([
                'message' => 'Compra efetuada!',
                'balance' => $user->coins_balance,
                'coins_added' => $coinsEarned
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            // Retorna o erro real para o Bruno (Só para debug!)
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        $transactions = $request->user()
            ->transactions()
            ->with('type')
            ->orderBy('transaction_datetime', 'desc')
            ->get();

        return response()->json(['data' => $transactions]);
    }
}