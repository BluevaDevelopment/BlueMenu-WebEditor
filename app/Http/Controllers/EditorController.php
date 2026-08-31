<?php

namespace App\Http\Controllers;

use App\Services\RealtimeConfig;
use Illuminate\Http\Response;

/**
 * Renders the editor shell. The session is validated by the front end, so an
 * unknown id still gets the page and lands on the invalid-session overlay.
 */
class EditorController extends Controller
{
    public function show(string $sessionId, RealtimeConfig $realtime): Response
    {
        return response()
            ->view('editor', [
                'sessionId' => $sessionId,
                'realtime' => $realtime->toArray(),
            ])
            ->header('Cache-Control', 'no-store');
    }
}
