<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminConsole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs one admin command from the editor's terminal panel.
 */
class TerminalController extends Controller
{
    public function __invoke(Request $request, AdminConsole $console): JsonResponse
    {
        $validated = $request->validate([
            'command' => ['required', 'string', 'max:255'],
        ]);

        $result = $console->run($validated['command']);

        return response()->json($result, $result['success'] ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }
}
