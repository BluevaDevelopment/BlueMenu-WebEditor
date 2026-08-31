<?php

namespace App\Providers;

use App\Models\Server;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerServerTokenGuard();
    }

    /**
     * Authenticates the plugin from the uuid and token it received when it registered.
     */
    private function registerServerTokenGuard(): void
    {
        Auth::viaRequest('server-token', function (Request $request): ?Server {
            $uuid = $request->header('X-Server-Uuid');
            $token = $request->header('X-Server-Token');

            if (! is_string($uuid) || ! is_string($token)) {
                return null;
            }

            $server = Server::where('uuid', $uuid)->first();

            if ($server === null || ! Hash::check($token, $server->token_hash)) {
                return null;
            }

            return $server;
        });
    }
}
