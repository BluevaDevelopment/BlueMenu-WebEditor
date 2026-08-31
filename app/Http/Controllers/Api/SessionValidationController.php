<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EditorSession;
use App\Services\EditorSessionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Validates the session behind an editor link for one browser window.
 *
 * The response shape is the one the Java server returned, because the editor
 * front end branches on every field to choose which overlay to show.
 */
class SessionValidationController extends Controller
{
    public function __invoke(Request $request, string $sessionId, EditorSessionManager $sessions): JsonResponse
    {
        $verificationId = $request->query('verificationId');
        $session = EditorSession::where('session_id', $sessionId)->first();

        if ($session === null) {
            return $this->refuse($sessionId, 'Session not found');
        }

        if ($session->isExpired()) {
            $sessions->invalidate($session);

            return $this->refuse($sessionId, 'Session expired');
        }

        if (! is_string($verificationId) || ! $session->hasVerification($verificationId)) {
            return $this->refuse(
                $sessionId,
                'Verification token is invalid or belongs to another window',
                confirmed: $session->confirmed,
                confirmedBy: $session->confirmed_by,
            );
        }

        if (! $session->confirmed) {
            return $this->refuse(
                $sessionId,
                'Session not confirmed',
                confirmedBy: $session->confirmed_by,
                verificationMatch: true,
            );
        }

        if (! $session->matchesConfirmedVerification($verificationId)) {
            return $this->refuse(
                $sessionId,
                'Session already validated from another window',
                confirmed: true,
                confirmedBy: $session->confirmed_by,
            );
        }

        $valid = $sessions->reserveForWeb($session);

        if ($valid) {
            Auth::guard('editor')->login($session);
            $request->session()->regenerate();
        }

        return response()->json([
            'valid' => $valid,
            'sessionId' => $sessionId,
            'confirmed' => true,
            'message' => $valid ? 'Session validated' : 'Session invalid or consumed',
            'confirmedBy' => $session->confirmed_by,
            'verificationMatch' => true,
            'serverVersion' => $session->server_version,
        ]);
    }

    private function refuse(
        string $sessionId,
        string $message,
        bool $confirmed = false,
        ?string $confirmedBy = null,
        bool $verificationMatch = false,
    ): JsonResponse {
        return response()->json([
            'valid' => false,
            'sessionId' => $sessionId,
            'confirmed' => $confirmed,
            'message' => $message,
            'confirmedBy' => $confirmedBy,
            'verificationMatch' => $verificationMatch,
            'serverVersion' => null,
        ]);
    }
}
