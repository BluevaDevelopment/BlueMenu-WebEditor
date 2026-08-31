<?php

namespace App\Events;

use App\Enums\RpcAction;
use App\Models\Server;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Asks one server's plugin to perform an operation and answer over HTTP.
 *
 * Broadcast synchronously: the request that raised it is already blocking on
 * the correlated answer, so queueing it would guarantee a timeout.
 */
class RpcRequested implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public Server $server,
        public string $requestId,
        public RpcAction $action,
        public array $payload,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("server.{$this->server->uuid}")];
    }

    public function broadcastAs(): string
    {
        return 'rpc.request';
    }

    /**
     * @return array{id: string, action: string, payload: array<string, mixed>}
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->requestId,
            'action' => $this->action->value,
            'payload' => $this->payload,
        ];
    }
}
