<?php

namespace App\Services;

use App\Enums\RpcAction;
use App\Events\RpcRequested;
use App\Exceptions\ServerOfflineException;
use App\Models\Server;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Request/response bridge between a browser request and the plugin.
 *
 * The request reaches the plugin one of two ways: pushed on its private channel
 * when realtime is available, or left in a queue it collects over plain HTTP
 * when it is not. Either way the call then blocks, polling the cache for the
 * answer the plugin posts back on its own HTTP request. That means the web
 * process must handle concurrent requests; with a single worker the waiting
 * request starves the one that would free it.
 */
class RpcBridge
{
    /** How long a queued request waits to be collected before it is stale. */
    private const QUEUE_TTL_SECONDS = 30;

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     *
     * @throws ServerOfflineException when the plugin does not answer in time
     */
    public function call(Server $server, RpcAction $action, array $payload = []): array
    {
        $requestId = (string) Str::uuid();

        if ($server->uses_polling) {
            $this->enqueue($server, $requestId, $action, $payload);
        } else {
            try {
                RpcRequested::dispatch($server, $requestId, $action, $payload);
            } catch (Throwable $failure) {
                // The channel is the fast path, not the only one. Queue the
                // request so the plugin still finds it on its next poll.
                Log::warning('Could not publish an RPC request, queueing it', ['reason' => $failure->getMessage()]);
                $this->enqueue($server, $requestId, $action, $payload);
            }
        }

        return $this->awaitResponse($requestId);
    }

    /**
     * Stores an answer coming back from the plugin so the waiting request finds it.
     *
     * @param  array<string, mixed>  $response
     */
    public function resolve(string $requestId, array $response): void
    {
        Cache::put(
            $this->cacheKey($requestId),
            $response,
            config('editor.rpc.response_ttl')
        );
    }

    /**
     * Hands over everything queued for a server, clearing the queue.
     *
     * @return array<int, array<string, mixed>>
     */
    public function collectPending(Server $server): array
    {
        $key = $this->queueKey($server);
        $pending = Cache::get($key, []);

        if ($pending !== []) {
            Cache::forget($key);
        }

        return $pending;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function enqueue(Server $server, string $requestId, RpcAction $action, array $payload): void
    {
        $key = $this->queueKey($server);
        $pending = Cache::get($key, []);
        $pending[] = ['id' => $requestId, 'action' => $action->value, 'payload' => $payload];

        Cache::put($key, $pending, self::QUEUE_TTL_SECONDS);
    }

    private function queueKey(Server $server): string
    {
        return "rpc:pending:{$server->uuid}";
    }

    /**
     * @return array<string, mixed>
     *
     * @throws ServerOfflineException
     */
    private function awaitResponse(string $requestId): array
    {
        $key = $this->cacheKey($requestId);
        $deadline = microtime(true) + config('editor.rpc.timeout');
        $intervalMicroseconds = config('editor.rpc.poll_interval_ms') * 1000;

        while (microtime(true) < $deadline) {
            $response = Cache::pull($key);

            if ($response !== null) {
                return $response;
            }

            usleep($intervalMicroseconds);
        }

        throw new ServerOfflineException("The plugin did not answer RPC request {$requestId} in time");
    }

    private function cacheKey(string $requestId): string
    {
        return "rpc:{$requestId}";
    }
}
