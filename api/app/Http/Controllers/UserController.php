<?php

namespace App\Http\Controllers;

use App\Models\User;
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
}
