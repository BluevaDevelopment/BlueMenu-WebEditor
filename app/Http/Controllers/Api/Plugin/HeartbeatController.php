<?php

namespace App\Http\Controllers\Api\Plugin;

use App\Events\PluginStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\EditorSession;
use App\Models\Server;
use App\Services\RealtimeConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Keeps the server marked as reachable and tells open windows when it comes back.
 */
class HeartbeatController extends Controller
{
    public function __invoke(Request $request, RealtimeConfig $realtime): JsonResponse
    {
        /** @var Server $server */
        $server = $request->user('server');

        $validated = $request->validate([
            'polling' => ['nullable', 'boolean'],
        ]);

        $wasOnline = $server->isOnline();
        $server->update([
            'last_seen_at' => now(),
            'uses_polling' => $validated['polling'] ?? $server->uses_polling,
        ]);

        if (! $wasOnline) {
            $this->announceReturn($server);
        }

        return response()->json([
            'ok' => true,
            'realtime' => $realtime->toArray(),
        ]);
    }

    private function announceReturn(Server $server): void
    {
        $server->editorSessions()
            ->alive()
            ->each(fn (EditorSession $session) => PluginStatusChanged::dispatch($session, true));
    }
}
