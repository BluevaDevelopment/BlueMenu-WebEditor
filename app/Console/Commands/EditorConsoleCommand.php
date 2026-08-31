<?php

namespace App\Console\Commands;

use App\Services\AdminConsole;
use Illuminate\Console\Command;

/**
 * Interactive replacement for the stdin listener of the Java web server.
 */
class EditorConsoleCommand extends Command
{
    protected $signature = 'editor:console {command?* : Run one command and exit}';

    protected $description = 'Run editor admin commands (help, list, maintenance)';

    public function handle(AdminConsole $console): int
    {
        $arguments = $this->argument('command');

        if ($arguments !== []) {
            return $this->report($console->run(implode(' ', $arguments)));
        }

        while (true) {
            $input = $this->ask('editor');

            if ($input === null || in_array(mb_strtolower(trim($input)), ['exit', 'quit'], true)) {
                return self::SUCCESS;
            }

            $this->report($console->run($input));
        }
    }

    /**
     * @param  array{success: bool, message: string, data: array<string, mixed>|null}  $result
     */
    private function report(array $result): int
    {
        $result['success'] ? $this->info($result['message']) : $this->error($result['message']);

        $data = $result['data'] ?? [];

        if (isset($data['commands'])) {
            $this->line(implode(PHP_EOL, $data['commands']));
        }

        if (isset($data['sessions'])) {
            $this->table(['Session', 'Server', 'Status', 'Expires'], array_map(
                fn (array $session) => [
                    $session['sessionId'],
                    $session['server'] ?? '-',
                    $session['status'],
                    date('d/m/Y H:i:s', (int) ($session['expiresAt'] / 1000)),
                ],
                $data['sessions'],
            ));
        }

        if (array_key_exists('enabled', $data)) {
            $this->line('Maintenance mode is now '.($data['enabled'] ? 'enabled' : 'disabled'));
        }

        return $result['success'] ? self::SUCCESS : self::FAILURE;
    }
}
