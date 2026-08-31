<?php

namespace App\Services;

use App\Models\EditorSession;
use Carbon\CarbonImmutable;
use Exception;

/**
 * The admin command vocabulary the Java server exposed on stdin and on
 * /api/admin/terminal, so the editor's terminal panel keeps working unchanged.
 */
class AdminConsole
{
    /** @var array<int, string> */
    public const COMMANDS = [
        'help - Show available admin commands',
        'list - List active sessions',
        'maintenance on|off - Enable or disable maintenance mode',
        'maintenance schedule <ISO-8601|clear> - Schedule or clear maintenance',
    ];

    public function __construct(
        private EditorSessionManager $sessions,
        private MaintenanceMode $maintenance,
    ) {}

    /**
     * @return array{success: bool, message: string, data: array<string, mixed>|null}
     */
    public function run(string $rawCommand): array
    {
        $trimmed = trim($rawCommand);

        if ($trimmed === '') {
            return $this->fail('A command is required');
        }

        // Split the original-case string: an ISO-8601 timestamp must keep its T and Z.
        $parts = preg_split('/\s+/', $trimmed) ?: [];
        $command = mb_strtolower($parts[0]);

        return match ($command) {
            'help' => $this->ok('Available commands', ['commands' => self::COMMANDS]),
            'list' => $this->listSessions(),
            'maintenance' => $this->maintenance($parts),
            'stop' => $this->fail('The web editor is managed by its process supervisor, not from here'),
            default => $this->fail("Unknown command. Type 'help' to see available commands.", ['commands' => self::COMMANDS]),
        };
    }

    /**
     * @return array{success: bool, message: string, data: array<string, mixed>|null}
     */
    private function listSessions(): array
    {
        $sessions = $this->sessions->overview()->map(fn (EditorSession $session) => [
            'sessionId' => $session->session_id,
            'server' => $session->server?->name,
            'status' => $this->describe($session),
            'expiresAt' => $session->expires_at->getTimestampMs(),
        ])->all();

        return $this->ok('Listing active sessions', [
            'count' => count($sessions),
            'sessions' => $sessions,
        ]);
    }

    /**
     * @param  array<int, string>  $parts
     * @return array{success: bool, message: string, data: array<string, mixed>|null}
     */
    private function maintenance(array $parts): array
    {
        $usage = 'Usage: maintenance on|off|schedule <ISO-8601|clear>';

        if (count($parts) < 2) {
            return $this->fail($usage);
        }

        $toggle = mb_strtolower($parts[1]);

        if ($toggle === 'on' || $toggle === 'off') {
            $toggle === 'on' ? $this->maintenance->enable() : $this->maintenance->disable();

            return $this->ok('Maintenance mode updated', $this->maintenance->status());
        }

        if ($toggle !== 'schedule') {
            return $this->fail("Maintenance value must be 'on', 'off', or 'schedule'");
        }

        if (count($parts) < 3) {
            return $this->fail('Usage: maintenance schedule <ISO-8601|clear>');
        }

        if (mb_strtolower($parts[2]) === 'clear') {
            $this->maintenance->clearSchedule();

            return $this->ok('Scheduled maintenance cleared', $this->maintenance->status());
        }

        try {
            $this->maintenance->schedule(CarbonImmutable::parse($parts[2]));
        } catch (Exception) {
            return $this->fail('Invalid date format. Use ISO-8601 (e.g., 2025-01-01T12:00:00Z)');
        }

        return $this->ok('Maintenance schedule updated', $this->maintenance->status());
    }

    private function describe(EditorSession $session): string
    {
        return match (true) {
            $session->active => 'active',
            $session->pending_web_bind => 'pending web bind',
            $session->consumed => 'consumed',
            default => 'inactive',
        };
    }

    /**
     * @param  array<string, mixed>|null  $data
     * @return array{success: bool, message: string, data: array<string, mixed>|null}
     */
    private function ok(string $message, ?array $data = null): array
    {
        return ['success' => true, 'message' => $message, 'data' => $data];
    }

    /**
     * @param  array<string, mixed>|null  $data
     * @return array{success: bool, message: string, data: array<string, mixed>|null}
     */
    private function fail(string $message, ?array $data = null): array
    {
        return ['success' => false, 'message' => $message, 'data' => $data];
    }
}
