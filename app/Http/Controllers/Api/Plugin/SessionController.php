<?php

namespace App\Http\Controllers\Api\Plugin;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Services\EditorSessionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Opens the session behind /bm editor and hands the plugin the link to show in chat.
 */
class SessionController extends Controller
{
    public function store(Request $request, EditorSessionManager $sessions): JsonResponse
    {
        $validated = $request->validate([
            'sessionId' => ['nullable', 'uuid'],
            'requireConfirmation' => ['nullable', 'boolean'],
        ]);

        /** @var Server $server */
        $server = $request->user('server');

        $session = $sessions->create(
            $server,
            $validated['sessionId'] ?? null,
            $validated['requireConfirmation'] ?? true,
        );

        return response()->json([
            'sessionId' => $session->session_id,
            'url' => route('editor.show', $session),
            'createdAt' => $session->created_at->getTimestampMs(),
            'expiresAt' => $session->expires_at->getTimestampMs(),
        ], Response::HTTP_CREATED);
    }
}
