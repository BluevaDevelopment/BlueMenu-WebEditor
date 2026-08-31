<?php

use App\Models\EditorSession;
use App\Models\Server;
use Illuminate\Support\Facades\Broadcast;

// Each editor window listens only on the session it owns.
Broadcast::channel('session.{sessionId}', function (EditorSession $session, string $sessionId): bool {
    return $session->session_id === $sessionId;
}, ['guards' => ['editor']]);

// Each plugin listens only on its own server channel, where RPC requests arrive.
Broadcast::channel('server.{uuid}', function (Server $server, string $uuid): bool {
    return $server->uuid === $uuid;
}, ['guards' => ['server']]);
