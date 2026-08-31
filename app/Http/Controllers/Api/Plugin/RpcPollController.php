<?php

namespace App\Http\Controllers\Api\Plugin;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Services\RpcBridge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Hands the plugin the requests waiting for it.
 *
 * Used by servers that cannot reach the realtime channel, so the editor keeps
 * working on a deployment where Reverb is unavailable or unconfigured.
 */
class RpcPollController extends Controller
{
    public function __invoke(Request $request, RpcBridge $rpc): JsonResponse
    {
        /** @var Server $server */
        $server = $request->user('server');

        return response()->json(['requests' => $rpc->collectPending($server)]);
    }
}
