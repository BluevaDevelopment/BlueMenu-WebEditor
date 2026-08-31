<?php

namespace App\Enums;

/**
 * Keys of the persisted key/value settings table.
 */
enum SettingKey: string
{
    case MaintenanceEnabled = 'maintenance.enabled';
    case MaintenanceScheduledAt = 'maintenance.scheduled_at';
}
