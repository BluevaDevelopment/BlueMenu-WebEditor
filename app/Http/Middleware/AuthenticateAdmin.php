<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the admin endpoints with a shared token.
 *
 * The Java server left these routes open, which let anyone toggle maintenance
 * or stop the process. They now require EDITOR_ADMIN_TOKEN, and refuse every
 * request while that token is unset rather than falling back to open access.
 */
class AuthenticateAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = config('editor.admin.token');
        $provided = $request->header('X-Admin-Token');

        if (! is_string($expected) || $expected === '' || ! is_string($provided) || ! hash_equals($expected, $provided)) {
            abort(Response::HTTP_FORBIDDEN, 'Admin token missing or invalid');
        }

        return $next($request);
    }
}
