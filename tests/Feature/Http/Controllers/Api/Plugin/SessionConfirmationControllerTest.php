<?php

namespace Tests\Feature\Http\Controllers\Api\Plugin;

use App\Models\EditorSession;
use App\Models\Server;
use Database\Factories\ServerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SessionConfirmationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirms_the_window_that_owns_the_verification_token(): void
    {
        $server = Server::factory()->create();
        $session = EditorSession::factory()->create(['server_id' => $server->id]);
        $verificationId = (string) Str::uuid();
        $session->verifications()->create(['verification_id' => $verificationId]);
        $player = (string) Str::uuid();

        $this->withServer($server)->postJson(route('plugin.sessions.confirm'), [
            'verificationId' => $verificationId,
            'confirmedBy' => $player,
        ])->assertOk()->assertJson(['confirmed' => true, 'sessionId' => $session->session_id]);

        $this->assertDatabaseHas('editor_sessions', [
            'session_id' => $session->session_id,
            'confirmed' => true,
            'confirmed_by' => $player,
            'confirmed_verification_id' => $verificationId,
        ]);
    }

    public function test_reports_an_unknown_verification_token_as_not_confirmed(): void
    {
        $this->withServer(Server::factory()->create())
            ->postJson(route('plugin.sessions.confirm'), [
                'verificationId' => (string) Str::uuid(),
                'confirmedBy' => (string) Str::uuid(),
            ])
            ->assertOk()
            ->assertJson(['confirmed' => false, 'message' => 'Invalid or expired session']);
    }

    public function test_returns_422_when_the_player_uuid_is_not_a_uuid(): void
    {
        $this->withServer(Server::factory()->create())
            ->postJson(route('plugin.sessions.confirm'), [
                'verificationId' => (string) Str::uuid(),
                'confirmedBy' => 'Notch',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('confirmedBy');
    }

    private function withServer(Server $server): static
    {
        return $this->withHeaders([
            'X-Server-Uuid' => $server->uuid,
            'X-Server-Token' => ServerFactory::TOKEN,
        ]);
    }
}
