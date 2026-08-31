<?php

namespace App\Events;

use App\Models\EditorSession;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Announces that a menu changed on disk, so other windows can offer to reload it.
 */
class MenuChanged implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public EditorSession $session,
        public string $platform,
        public string $fileName,
        public string $change,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("session.{$this->session->session_id}")];
    }

    public function broadcastAs(): string
    {
        return 'menu.changed';
    }

    /**
     * @return array{platform: string, fileName: string, change: string}
     */
    public function broadcastWith(): array
    {
        return [
            'platform' => $this->platform,
            'fileName' => $this->fileName,
            'change' => $this->change,
        ];
    }
}
