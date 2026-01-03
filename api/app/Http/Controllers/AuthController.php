<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        // Avoid logging raw request bodies (contains sensitive data like passwords).
        \Log::info('Registration request received', [
            'has_photo' => $request->hasFile('photo'),
            'photo_info' => $request->hasFile('photo') ? [
                'size' => $request->file('photo')->getSize(),
                'mime' => $request->file('photo')->getMimeType(),
                'extension' => $request->file('photo')->getClientOriginalExtension(),
            ] : null,
        ]);

        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'nickname' => 'required|string|min:3|max:20|unique:users,nickname',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:3',
            'photo' => 'nullable|image|max:2048', // 2MB max
        ]);

        \Log::info('Registration validation passed', ['validated' => array_keys($validated)]);

        // Handle photo upload if provided
        $photoFilename = null;
        if ($request->hasFile('photo')) {
            $photo = $request->file('photo');
            $photoFilename = time() . '_' . uniqid() . '.' . $photo->getClientOriginalExtension();
            $photo->storeAs('public/photos_avatars', $photoFilename);
        }

        // Create the user
        $user = User::create([
            'email' => $validated['email'],
            'nickname' => $validated['nickname'],
            'name' => $validated['name'],
            'password' => Hash::make($validated['password']),
            'type' => 'P', // Player by default
            'photo_avatar_filename' => $photoFilename,
            'coins_balance' => 0, // Will be updated by welcome bonus
            'blocked' => false,
        ]);

        // Give welcome bonus (10 coins)
        $this->transactionService->giveWelcomeBonus($user, 10);

        // Refresh user to get updated coins_balance
        $user->refresh();

        // Create auth token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful! You received 10 welcome coins.',
        ], 201);
    }

    /**
     * Login
     */
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

        // Check if user is blocked
        if ($user->blocked) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been blocked. Please contact support.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}

