<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EditorSession;
use App\Services\EditorSessionManager;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Issues the per-window token that the player then confirms in game.
 */
class SessionVerificationController extends Controller
{
    public function store(string $sessionId, EditorSessionManager $sessions): JsonResponse
    {
        $session = EditorSession::where('session_id', $sessionId)->first();
        $verificationId = $session === null ? null : $sessions->createVerification($session);

        if ($verificationId === null) {
            return response()->json([
                'success' => false,
                'verificationId' => null,
                'message' => 'Session is invalid, expired or already consumed',
            ], Response::HTTP_BAD_REQUEST);
        }

        return response()->json([
            'success' => true,
            'verificationId' => $verificationId,
            'message' => 'Verification token created',
        ]);
    }
}
