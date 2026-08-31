<?php

namespace App\Events;

use App\Models\EditorSession;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Tells an open editor window whether its server is still reachable.
 */
class PluginStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public EditorSession $session,
        public bool $connected,
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
        return 'plugin.status';
    }

    /**
     * @return array{connected: bool}
     */
    public function broadcastWith(): array
    {
        return ['connected' => $this->connected];
    }
}
