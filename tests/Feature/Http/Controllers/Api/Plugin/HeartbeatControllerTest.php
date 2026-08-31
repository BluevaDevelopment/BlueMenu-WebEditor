<?php

namespace Tests\Feature\Http\Controllers\Api\Plugin;

use App\Events\PluginStatusChanged;
use App\Models\EditorSession;
use App\Models\Server;
use Database\Factories\ServerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class HeartbeatControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_marks_the_server_as_recently_seen(): void
    {
        $server = Server::factory()->offline()->create();

        $this->withServer($server)->postJson(route('plugin.heartbeat'))->assertOk();

        $this->assertTrue($server->refresh()->isOnline());
    }

    public function test_tells_open_windows_that_a_server_that_was_offline_is_back(): void
    {
        Event::fake([PluginStatusChanged::class]);
        $server = Server::factory()->offline()->create();
        $session = EditorSession::factory()->create(['server_id' => $server->id]);

        $this->withServer($server)->postJson(route('plugin.heartbeat'));

        Event::assertDispatched(
            PluginStatusChanged::class,
            fn (PluginStatusChanged $event) => $event->connected && $event->session->is($session)
        );
    }

    public function test_does_not_repeat_the_announcement_while_the_server_stays_online(): void
    {
        Event::fake([PluginStatusChanged::class]);
        $server = Server::factory()->create();
        EditorSession::factory()->create(['server_id' => $server->id]);

        $this->withServer($server)->postJson(route('plugin.heartbeat'));

        Event::assertNotDispatched(PluginStatusChanged::class);
    }

    public function test_returns_401_without_server_credentials(): void
    {
        $this->postJson(route('plugin.heartbeat'))->assertUnauthorized();
    }

    private function withServer(Server $server): static
    {
        return $this->withHeaders([
            'X-Server-Uuid' => $server->uuid,
            'X-Server-Token' => ServerFactory::TOKEN,
        ]);
    }
}
