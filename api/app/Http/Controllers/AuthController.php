<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'nickname' => 'required|string|unique:users,nickname',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:3',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'nickname' => $validated['nickname'],
            'email' => $validated['email'],
            'type' => 'P', // Player
            'password' => Hash::make($validated['password']),
            'coins_balance' => 10 // Welcome bonus
        ]);

        // Criar registo da transação BONUS
        CoinTransaction::create([
            'user_id' => $user->id,
            'coin_transaction_type_id' => 1, // "Bonus" ID
            'coins' => 10,
            'transaction_datetime' => now()
        ]);

        return response()->json($user, 201);
    }

}
