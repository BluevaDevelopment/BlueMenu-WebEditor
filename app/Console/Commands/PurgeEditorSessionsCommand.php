<?php

namespace App\Console\Commands;

use App\Services\EditorSessionManager;
use Illuminate\Console\Command;

class PurgeEditorSessionsCommand extends Command
{
    protected $signature = 'editor:purge-sessions';

    protected $description = 'Delete editor sessions that have expired';

    public function handle(EditorSessionManager $sessions): int
    {
        $this->info("Deleted {$sessions->purgeExpired()} expired sessions");

        return self::SUCCESS;
    }
}
