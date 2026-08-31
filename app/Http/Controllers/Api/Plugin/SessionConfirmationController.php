<?php

namespace App\Http\Controllers\Api\Plugin;

use App\Http\Controllers\Controller;
use App\Services\EditorSessionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Confirms a pending window from in game with /bm confirm.
 */
class SessionConfirmationController extends Controller
{
    public function store(Request $request, EditorSessionManager $sessions): JsonResponse
    {
        $validated = $request->validate([
            'verificationId' => ['required', 'uuid'],
            'confirmedBy' => ['required', 'uuid'],
        ]);

        $session = $sessions->confirm($validated['verificationId'], $validated['confirmedBy']);

        if ($session === null) {
            return response()->json([
                'confirmed' => false,
                'message' => 'Invalid or expired session',
            ]);
        }

        return response()->json([
            'confirmed' => true,
            'sessionId' => $session->session_id,
            'verificationId' => $validated['verificationId'],
            'confirmedBy' => $validated['confirmedBy'],
        ]);
    }
}
