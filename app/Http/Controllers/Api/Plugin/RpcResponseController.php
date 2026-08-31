<?php

namespace App\Http\Controllers\Api\Plugin;

use App\Http\Controllers\Controller;
use App\Services\RpcBridge;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Receives the answer to an RPC request, releasing the browser request waiting on it.
 */
class RpcResponseController extends Controller
{
    public function __invoke(Request $request, RpcBridge $rpc): Response
    {
        $validated = $request->validate([
            'id' => ['required', 'uuid'],
            'ok' => ['required', 'boolean'],
            'payload' => ['nullable', 'array'],
            'error' => ['nullable', 'string', 'max:1000'],
        ]);

        $rpc->resolve($validated['id'], [
            'ok' => $validated['ok'],
            'payload' => $validated['payload'] ?? [],
            'error' => $validated['error'] ?? null,
        ]);

        return response()->noContent();
    }
}
