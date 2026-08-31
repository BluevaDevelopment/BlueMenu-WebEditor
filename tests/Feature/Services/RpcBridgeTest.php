<?php

namespace Tests\Feature\Services;

use App\Enums\RpcAction;
use App\Events\RpcRequested;
use App\Exceptions\ServerOfflineException;
use App\Models\Server;
use App\Services\RpcBridge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RpcBridgeTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_the_payload_the_plugin_posts_back(): void
    {
        $bridge = app(RpcBridge::class);
        $server = Server::factory()->onChannel()->create();

        // The plugin answers on a separate request; a listener stands in for it.
        Event::listen(RpcRequested::class, fn (RpcRequested $event) => $bridge->resolve($event->requestId, [
            'ok' => true,
            'payload' => ['menus' => ['menu.yml']],
            'error' => null,
        ]));

        $response = $bridge->call($server, RpcAction::MenuList);

        $this->assertTrue($response['ok']);
        $this->assertSame(['menus' => ['menu.yml']], $response['payload']);
    }

    public function test_broadcasts_the_request_on_the_private_channel_of_the_server(): void
    {
        $bridge = app(RpcBridge::class);
        $server = Server::factory()->onChannel()->create();
        $captured = null;

        Event::listen(RpcRequested::class, function (RpcRequested $event) use ($bridge, &$captured): void {
            $captured = $event;
            $bridge->resolve($event->requestId, ['ok' => true, 'payload' => [], 'error' => null]);
        });

        $bridge->call($server, RpcAction::MenuGet, ['fileName' => 'shop.yml']);

        $this->assertSame(RpcAction::MenuGet, $captured->action);
        $this->assertSame(['fileName' => 'shop.yml'], $captured->payload);
        $this->assertSame("private-server.{$server->uuid}", $captured->broadcastOn()[0]->name);
        $this->assertSame('rpc.request', $captured->broadcastAs());
    }

    public function test_throws_server_offline_when_the_plugin_never_answers(): void
    {
        config(['editor.rpc.timeout' => 0.2, 'editor.rpc.poll_interval_ms' => 20]);

        $this->expectException(ServerOfflineException::class);

        app(RpcBridge::class)->call(Server::factory()->create(), RpcAction::MenuList);
    }
}
