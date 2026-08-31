<?php

namespace App\Http\Controllers\Api\Plugin;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Services\RealtimeConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * First contact from a server. Issues the credentials the plugin then stores in
 * its own configuration and presents on every later request.
 */
class RegistrationController extends Controller
{
    public function store(Request $request, RealtimeConfig $realtime): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'pluginVersion' => ['nullable', 'string', 'max:64'],
            'serverVersion' => ['nullable', 'string', 'max:128'],
        ]);

        $token = Str::random(64);

        $server = Server::create([
            'uuid' => (string) Str::uuid(),
            'token_hash' => Hash::make($token),
            'name' => $validated['name'] ?? null,
            'plugin_version' => $validated['pluginVersion'] ?? null,
            'server_version' => $validated['serverVersion'] ?? null,
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'uuid' => $server->uuid,
            'token' => $token,
            'realtime' => $realtime->toArray(),
        ], Response::HTTP_CREATED);
    }
}
