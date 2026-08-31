<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Editor sessions
    |--------------------------------------------------------------------------
    |
    | How long a session opened with /bm editor stays usable, in seconds.
    | The Java web server used one hour and the plugin assumes the same window.
    |
    */

    'session' => [
        'timeout' => (int) env('EDITOR_SESSION_TIMEOUT', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Plugin RPC
    |--------------------------------------------------------------------------
    |
    | A browser request that needs plugin data blocks until the plugin answers
    | on a separate HTTP request, so the web process MUST serve more than one
    | request at a time. With a single worker the waiting request blocks the one
    | that would release it. See the readme for the artisan serve flags.
    |
    */

    'rpc' => [
        'timeout' => (int) env('EDITOR_RPC_TIMEOUT', 8),
        'poll_interval_ms' => (int) env('EDITOR_RPC_POLL_INTERVAL', 150),
        'response_ttl' => (int) env('EDITOR_RPC_RESPONSE_TTL', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin endpoints
    |--------------------------------------------------------------------------
    |
    | Shared token for /api/admin/*. Those routes are refused entirely while it
    | is unset, so an unconfigured deployment fails closed.
    |
    */

    'admin' => [
        'token' => env('EDITOR_ADMIN_TOKEN'),
    ],

];
