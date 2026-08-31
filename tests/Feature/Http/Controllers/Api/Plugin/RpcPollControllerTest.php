<?php

namespace Tests\Feature\Http\Controllers\Api\Plugin;

use App\Enums\RpcAction;
use App\Events\RpcRequested;
use App\Models\Server;
use App\Services\RpcBridge;
use Database\Factories\ServerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RpcPollControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_hands_over_the_requests_queued_for_a_polling_server(): void
    {
        $server = Server::factory()->create(['uses_polling' => true]);
        $bridge = app(RpcBridge::class);
        config(['editor.rpc.timeout' => 0.1, 'editor.rpc.poll_interval_ms' => 20]);

        // The call times out because nothing answers, but the request is queued.
        rescue(fn () => $bridge->call($server, RpcAction::MenuList));

        $response = $this->withServer($server)->postJson(route('plugin.rpc-poll'));

        $response->assertOk();
        $this->assertCount(1, $response->json('requests'));
        $this->assertSame('MENU_LIST_REQUEST', $response->json('requests.0.action'));
    }

    public function test_clears_the_queue_so_a_request_is_never_run_twice(): void
    {
        $server = Server::factory()->create(['uses_polling' => true]);
        config(['editor.rpc.timeout' => 0.1, 'editor.rpc.poll_interval_ms' => 20]);
        rescue(fn () => app(RpcBridge::class)->call($server, RpcAction::MenuList));

        $this->withServer($server)->postJson(route('plugin.rpc-poll'))->assertJsonCount(1, 'requests');
        $this->withServer($server)->postJson(route('plugin.rpc-poll'))->assertJsonCount(0, 'requests');
    }

    public function test_broadcasts_instead_of_queueing_for_a_server_on_the_channel(): void
    {
        Event::fake([RpcRequested::class]);
        $server = Server::factory()->create(['uses_polling' => false]);
        config(['editor.rpc.timeout' => 0.1, 'editor.rpc.poll_interval_ms' => 20]);

        rescue(fn () => app(RpcBridge::class)->call($server, RpcAction::MenuList));

        Event::assertDispatched(RpcRequested::class);
        $this->withServer($server)->postJson(route('plugin.rpc-poll'))->assertJsonCount(0, 'requests');
    }

    public function test_never_hands_a_server_the_queue_of_another(): void
    {
        $mine = Server::factory()->create(['uses_polling' => true]);
        $other = Server::factory()->create(['uses_polling' => true]);
        config(['editor.rpc.timeout' => 0.1, 'editor.rpc.poll_interval_ms' => 20]);
        rescue(fn () => app(RpcBridge::class)->call($other, RpcAction::MenuList));

        $this->withServer($mine)->postJson(route('plugin.rpc-poll'))->assertJsonCount(0, 'requests');
    }

    public function test_returns_401_without_server_credentials(): void
    {
        $this->postJson(route('plugin.rpc-poll'))->assertUnauthorized();
    }

    public function test_heartbeat_records_that_the_server_is_polling(): void
    {
        $server = Server::factory()->create(['uses_polling' => false]);

        $this->withServer($server)->postJson(route('plugin.heartbeat'), ['polling' => true])->assertOk();

        $this->assertTrue($server->refresh()->uses_polling);
    }

    private function withServer(Server $server): static
    {
        return $this->withHeaders([
            'X-Server-Uuid' => $server->uuid,
            'X-Server-Token' => ServerFactory::TOKEN,
        ]);
    }
}
