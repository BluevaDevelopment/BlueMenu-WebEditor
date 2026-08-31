<?php

namespace Tests\Feature;

use App\Enums\RpcAction;
use App\Models\EditorSession;
use App\Models\Server;
use App\Services\RpcBridge;
use Database\Factories\ServerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A broadcaster that cannot be reached is an infrastructure problem. It must
 * never turn an operation that already succeeded into a failure.
 */
class BroadcastFailureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Point the broadcaster at a port nothing listens on.
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'key',
            'broadcasting.connections.reverb.secret' => 'secret',
            'broadcasting.connections.reverb.app_id' => '1',
            'broadcasting.connections.reverb.options' => [
                'host' => '127.0.0.1',
                'port' => 1,
                'scheme' => 'http',
                'useTLS' => false,
            ],
        ]);
    }

    public function test_a_save_still_succeeds_when_the_change_cannot_be_announced(): void
    {
        $session = $this->readySession();
        $this->withAnsweringPlugin();

        $this->actingAs($session, 'editor')
            ->postJson(route('api.menus.store'), [
                'platform' => 'java',
                'fileName' => 'shop.yml',
                'content' => 'menu: {}',
            ])
            ->assertOk();
    }

    public function test_a_delete_still_succeeds_when_the_change_cannot_be_announced(): void
    {
        $session = $this->readySession();
        $this->withAnsweringPlugin();

        $this->actingAs($session, 'editor')
            ->deleteJson(route('api.menus.destroy'), ['platform' => 'java', 'fileName' => 'shop.yml'])
            ->assertOk();
    }

    public function test_a_heartbeat_still_succeeds_when_the_return_cannot_be_announced(): void
    {
        $server = Server::factory()->offline()->create();
        EditorSession::factory()->create(['server_id' => $server->id]);

        $this->withHeaders(['X-Server-Uuid' => $server->uuid, 'X-Server-Token' => ServerFactory::TOKEN])
            ->postJson(route('plugin.heartbeat'))
            ->assertOk();

        $this->assertTrue($server->refresh()->isOnline());
    }

    public function test_a_request_that_cannot_be_published_is_queued_for_the_next_poll(): void
    {
        config(['editor.rpc.timeout' => 0.2, 'editor.rpc.poll_interval_ms' => 20]);
        $bridge = app(RpcBridge::class);
        $server = Server::factory()->onChannel()->create();

        rescue(fn () => $bridge->call($server, RpcAction::MenuList));

        $this->assertCount(1, $bridge->collectPending($server));
    }

    private function readySession(): EditorSession
    {
        return EditorSession::factory()
            ->for(Server::factory())
            ->create(['confirmed' => true, 'consumed' => true, 'active' => false]);
    }

    /**
     * A plugin that always answers, so the test isolates what it is about: the
     * response of an operation whose broadcast could not go out.
     */
    private function withAnsweringPlugin(): void
    {
        $this->app->instance(RpcBridge::class, new class extends RpcBridge
        {
            public function call(Server $server, RpcAction $action, array $payload = []): array
            {
                return ['ok' => true, 'payload' => [], 'error' => null];
            }
        });
    }
}
