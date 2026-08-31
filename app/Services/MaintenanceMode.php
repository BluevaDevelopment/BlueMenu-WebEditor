<?php

namespace App\Services;

use App\Enums\SettingKey;
use App\Models\Setting;
use Carbon\CarbonImmutable;

/**
 * Maintenance flag for the editor, with an optional scheduled start.
 *
 * Unlike the Java server, which kept both values in memory, the state is
 * persisted so a restart or a deploy does not silently lift a maintenance window.
 */
class MaintenanceMode
{
    /**
     * @return array{enabled: bool, scheduledAt: int|null}
     */
    public function status(): array
    {
        $this->enforceSchedule();

        return [
            'enabled' => (bool) Setting::read(SettingKey::MaintenanceEnabled, false),
            'scheduledAt' => $this->scheduledAt()?->getTimestampMs(),
        ];
    }

    public function enable(): void
    {
        Setting::write(SettingKey::MaintenanceEnabled, true);
        Setting::write(SettingKey::MaintenanceScheduledAt, null);
    }

    public function disable(): void
    {
        Setting::write(SettingKey::MaintenanceEnabled, false);
    }

    public function schedule(CarbonImmutable $at): void
    {
        Setting::write(SettingKey::MaintenanceScheduledAt, $at->getTimestampMs());
        $this->enforceSchedule();
    }

    public function clearSchedule(): void
    {
        Setting::write(SettingKey::MaintenanceScheduledAt, null);
    }

    public function isEnabled(): bool
    {
        return $this->status()['enabled'];
    }

    /**
     * Flips the flag once the scheduled moment has passed, then drops the schedule.
     */
    private function enforceSchedule(): void
    {
        $scheduledAt = $this->scheduledAt();

        if ($scheduledAt === null || (bool) Setting::read(SettingKey::MaintenanceEnabled, false)) {
            return;
        }

        if ($scheduledAt->isFuture()) {
            return;
        }

        Setting::write(SettingKey::MaintenanceEnabled, true);
        Setting::write(SettingKey::MaintenanceScheduledAt, null);
    }

    private function scheduledAt(): ?CarbonImmutable
    {
        $timestamp = Setting::read(SettingKey::MaintenanceScheduledAt);

        return $timestamp === null ? null : CarbonImmutable::createFromTimestampMs($timestamp);
    }
}
