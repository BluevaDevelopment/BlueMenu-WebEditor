<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MaintenanceMode;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Reads and updates the editor maintenance flag.
 */
class MaintenanceController extends Controller
{
    public function show(MaintenanceMode $maintenance): JsonResponse
    {
        return response()->json($maintenance->status());
    }

    public function update(Request $request, MaintenanceMode $maintenance): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['nullable', 'boolean'],
            'scheduledAt' => ['nullable', 'integer', 'min:1'],
        ]);

        if (array_key_exists('enabled', $validated) && $validated['enabled'] !== null) {
            $validated['enabled'] ? $maintenance->enable() : $maintenance->disable();
        }

        if (($validated['scheduledAt'] ?? null) !== null) {
            $maintenance->schedule(CarbonImmutable::createFromTimestampMs($validated['scheduledAt']));
        }

        return response()->json($maintenance->status());
    }
}
