<?php

use App\Http\Controllers\Api\Plugin\HeartbeatController;
use App\Http\Controllers\Api\Plugin\RegistrationController;
use App\Http\Controllers\Api\Plugin\RpcPollController;
use App\Http\Controllers\Api\Plugin\RpcResponseController;
use App\Http\Controllers\Api\Plugin\SessionConfirmationController;
use App\Http\Controllers\Api\Plugin\SessionController;
use Illuminate\Support\Facades\Route;

/*
 * Routes the Minecraft plugin calls. Stateless: the plugin authenticates with
 * the uuid and token it received when it registered, never with a cookie.
 */

Route::prefix('api/plugin')->name('plugin.')->group(function (): void {
    Route::post('/register', [RegistrationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('register');

    Route::middleware('auth:server')->group(function (): void {
        Route::post('/heartbeat', HeartbeatController::class)->name('heartbeat');
        Route::post('/sessions', [SessionController::class, 'store'])->name('sessions.store');
        Route::post('/sessions/confirm', [SessionConfirmationController::class, 'store'])->name('sessions.confirm');
        Route::post('/rpc-poll', RpcPollController::class)->name('rpc-poll');
        Route::post('/rpc-response', RpcResponseController::class)->name('rpc-response');
    });
});
