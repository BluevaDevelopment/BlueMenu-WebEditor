<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Raised when the plugin did not answer an RPC call inside the configured timeout.
 */
class ServerOfflineException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'error' => 'server_offline',
            'message' => 'The Minecraft server did not answer. Check that it is online and the plugin is connected.',
        ], Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
