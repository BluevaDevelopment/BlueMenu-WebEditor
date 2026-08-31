<?php

namespace Tests\Feature\Http\Controllers\Api\Plugin;

use App\Models\Server;
use Database\Factories\ServerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_opens_a_session_and_returns_the_link_for_the_player(): void
    {
        $server = Server::factory()->create();

        $response = $this->withServer($server)->postJson(route('plugin.sessions.store'));

        $response->assertCreated()->assertJsonStructure(['sessionId', 'url', 'createdAt', 'expiresAt']);
        $this->assertSame(route('editor.show', $response->json('sessionId')), $response->json('url'));
        $this->assertDatabaseHas('editor_sessions', [
            'session_id' => $response->json('sessionId'),
            'server_id' => $server->id,
            'require_confirmation' => true,
            'confirmed' => false,
        ]);
    }

    public function test_marks_the_session_confirmed_when_the_server_does_not_require_confirmation(): void
    {
        $server = Server::factory()->create();

        $response = $this->withServer($server)
            ->postJson(route('plugin.sessions.store'), ['requireConfirmation' => false]);

        $this->assertDatabaseHas('editor_sessions', [
            'session_id' => $response->json('sessionId'),
            'confirmed' => true,
        ]);
    }

    public function test_returns_401_without_server_credentials(): void
    {
        $this->postJson(route('plugin.sessions.store'))->assertUnauthorized();
    }

    public function test_returns_401_with_a_wrong_token(): void
    {
        $server = Server::factory()->create();

        $this->withHeaders(['X-Server-Uuid' => $server->uuid, 'X-Server-Token' => 'wrong'])
            ->postJson(route('plugin.sessions.store'))
            ->assertUnauthorized();
    }

    private function withServer(Server $server): static
    {
        return $this->withHeaders([
            'X-Server-Uuid' => $server->uuid,
            'X-Server-Token' => ServerFactory::TOKEN,
        ]);
    }
}
