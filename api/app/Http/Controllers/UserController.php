<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Game;
use App\Models\GameMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users')->ignore($user->id),
            ],
            'nickname' => [
                'sometimes',
                'required',
                'string',
                'min:3',
                'max:20',
                Rule::unique('users')->ignore($user->id),
            ],
            'name' => 'sometimes|required|string|max:255',
        ]);

        $user->update($validated);

        return response()->json([
            'user' => $user,
            'message' => 'Profile updated successfully',
        ]);
    }

    /**
     * Update the authenticated user's password
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:3|different:current_password',
        ]);

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }

    /**
     * Upload or update the authenticated user's photo
     */
    public function uploadPhoto(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'photo' => 'required|image|max:2048', // 2MB max
        ]);

        // Delete old photo if exists
        if ($user->photo_avatar_filename) {
            Storage::delete('public/photos_avatars/' . $user->photo_avatar_filename);
        }

        // Store new photo
        $photo = $request->file('photo');
        $photoFilename = time() . '_' . uniqid() . '.' . $photo->getClientOriginalExtension();
        $photo->storeAs('public/photos_avatars', $photoFilename);

        $user->update([
            'photo_avatar_filename' => $photoFilename,
        ]);

        return response()->json([
            'user' => $user,
            'message' => 'Photo uploaded successfully',
        ]);
    }

    /**
     * Delete photo
     */
    public function deletePhoto(Request $request)
    {
        $user = $request->user();

        if ($user->photo_avatar_filename) {
            Storage::delete('public/photos_avatars/' . $user->photo_avatar_filename);
            $user->update(['photo_avatar_filename' => null]);
        }

        return response()->json([
            'user' => $user,
            'message' => 'Photo deleted successfully',
        ]);
    }

    /**
     * Delete the authenticated user's account
     * Requires confirmation (nickname or password)
     * Administrators cannot delete their own accounts
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        // Prevent administrators from deleting their own accounts
        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Administrators cannot delete their own accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'confirmation' => 'required|string',
        ]);

        // Verify confirmation (can be nickname or password)
        $isValidNickname = $validated['confirmation'] === $user->nickname;
        $isValidPassword = Hash::check($validated['confirmation'], $user->password);

        if (!$isValidNickname && !$isValidPassword) {
            return response()->json([
                'message' => 'Invalid confirmation. Please enter your nickname or password.',
            ], 422);
        }

        // Check if user can be hard deleted
        if ($user->canBeHardDeleted()) {
            // Hard delete: remove photo and user record
            if ($user->photo_avatar_filename) {
                Storage::delete('public/photos_avatars/' . $user->photo_avatar_filename);
            }
            
            // Delete all tokens
            $user->tokens()->delete();
            
            // Hard delete
            $user->forceDelete();

            return response()->json([
                'message' => 'Account deleted successfully. All coins have been forfeited.',
            ]);
        } else {
            // Soft delete: keep record for transaction/game history
            // Forfeit all coins
            $user->update(['coins_balance' => 0]);
            
            // Delete all tokens
            $user->tokens()->delete();
            
            // Soft delete
            $user->delete();

            return response()->json([
                'message' => 'Account deactivated successfully. All coins have been forfeited.',
            ]);
        }
    }

    /**
     * Get personal statistics for the authenticated user
     */
    public function statistics(Request $request)
    {
        $user = $request->user();

        // Games statistics
        $totalGamesPlayed = Game::where('player1_user_id', $user->id)
            ->orWhere('player2_user_id', $user->id)
            ->count();

        $totalGamesWon = Game::where('winner_user_id', $user->id)->count();
        
        $totalGamesLost = Game::where('loser_user_id', $user->id)->count();

        $totalDraws = Game::where('is_draw', true)
            ->where(function($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            })
            ->count();

        // Achievement statistics
        $totalCapotes = Game::where('winner_user_id', $user->id)
            ->where('is_capote', true)
            ->count();

        $totalBandeiras = Game::where('winner_user_id', $user->id)
            ->where('is_bandeira', true)
            ->count();

        // Forfeit statistics
        $forfeitsReceived = Game::where('winner_user_id', $user->id)
            ->where('is_forfeit', true)
            ->count();

        $forfeitsGiven = Game::where('loser_user_id', $user->id)
            ->where('is_forfeit', true)
            ->count();

        // Match statistics
        $totalMatchesPlayed = GameMatch::where('player1_user_id', $user->id)
            ->orWhere('player2_user_id', $user->id)
            ->count();

        $totalMatchesWon = GameMatch::where('winner_user_id', $user->id)->count();
        
        $totalMatchesLost = GameMatch::where('loser_user_id', $user->id)->count();

        // Variant-specific statistics
        $bisca3Stats = [
            'games_played' => Game::where('type', '3')
                ->where(function($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                      ->orWhere('player2_user_id', $user->id);
                })
                ->count(),
            'games_won' => Game::where('type', '3')
                ->where('winner_user_id', $user->id)
                ->count(),
            'capotes' => Game::where('type', '3')
                ->where('winner_user_id', $user->id)
                ->where('is_capote', true)
                ->count(),
            'bandeiras' => Game::where('type', '3')
                ->where('winner_user_id', $user->id)
                ->where('is_bandeira', true)
                ->count(),
            'matches_played' => GameMatch::where('type', '3')
                ->where(function($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                      ->orWhere('player2_user_id', $user->id);
                })
                ->count(),
            'matches_won' => GameMatch::where('type', '3')
                ->where('winner_user_id', $user->id)
                ->count(),
        ];

        $bisca9Stats = [
            'games_played' => Game::where('type', '9')
                ->where(function($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                      ->orWhere('player2_user_id', $user->id);
                })
                ->count(),
            'games_won' => Game::where('type', '9')
                ->where('winner_user_id', $user->id)
                ->count(),
            'capotes' => Game::where('type', '9')
                ->where('winner_user_id', $user->id)
                ->where('is_capote', true)
                ->count(),
            'bandeiras' => Game::where('type', '9')
                ->where('winner_user_id', $user->id)
                ->where('is_bandeira', true)
                ->count(),
            'matches_played' => GameMatch::where('type', '9')
                ->where(function($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                      ->orWhere('player2_user_id', $user->id);
                })
                ->count(),
            'matches_won' => GameMatch::where('type', '9')
                ->where('winner_user_id', $user->id)
                ->count(),
        ];

        return response()->json([
            'games' => [
                'total_played' => $totalGamesPlayed,
                'total_won' => $totalGamesWon,
                'total_lost' => $totalGamesLost,
                'total_draws' => $totalDraws,
                'win_rate' => $totalGamesPlayed > 0 
                    ? round(($totalGamesWon / $totalGamesPlayed) * 100, 1) 
                    : 0,
            ],
            'matches' => [
                'total_played' => $totalMatchesPlayed,
                'total_won' => $totalMatchesWon,
                'total_lost' => $totalMatchesLost,
                'win_rate' => $totalMatchesPlayed > 0 
                    ? round(($totalMatchesWon / $totalMatchesPlayed) * 100, 1) 
                    : 0,
            ],
            'achievements' => [
                'total_capotes' => $totalCapotes,
                'total_bandeiras' => $totalBandeiras,
                'forfeits_received' => $forfeitsReceived,
                'forfeits_given' => $forfeitsGiven,
            ],
            'by_variant' => [
                'bisca_3' => $bisca3Stats,
                'bisca_9' => $bisca9Stats,
            ],
        ]);
    }
}
