<?php

use App\Http\Controllers\Api\DemoController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\SessionValidationController;
use App\Http\Controllers\Api\SessionVerificationController;
use App\Http\Controllers\Api\TerminalController;
use App\Http\Controllers\EditorController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\HomeController;
use App\Http\Middleware\AuthenticateAdmin;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::get('/health', HealthController::class)->name('health');

Route::get('/editor/{sessionId}', [EditorController::class, 'show'])->name('editor.show');

Route::prefix('api')->name('api.')->group(function (): void {
    // Session handshake: the window asks for a token, the player confirms it in
    // game, and the window then validates to take ownership of the session.
    Route::post('/session/{sessionId}/verification', [SessionVerificationController::class, 'store'])
        ->name('session.verification.store');
    Route::get('/session/{sessionId}', SessionValidationController::class)->name('session.show');

    Route::middleware('auth:editor')->group(function (): void {
        Route::get('/menus', [MenuController::class, 'index'])->name('menus.index');
        Route::get('/menu', [MenuController::class, 'show'])->name('menus.show');
        Route::post('/menu', [MenuController::class, 'store'])->name('menus.store');
        Route::delete('/menu', [MenuController::class, 'destroy'])->name('menus.destroy');
    });

    Route::get('/demo/menus/{platform}/{fileName}', [DemoController::class, 'menu'])->name('demo.menu');
    Route::get('/demo/settings', [DemoController::class, 'settings'])->name('demo.settings');

    Route::get('/admin/maintenance', [MaintenanceController::class, 'show'])->name('admin.maintenance.show');

    Route::middleware(AuthenticateAdmin::class)->group(function (): void {
        Route::post('/admin/maintenance', [MaintenanceController::class, 'update'])->name('admin.maintenance.update');
        Route::post('/admin/terminal', TerminalController::class)->name('admin.terminal');
    });
});
