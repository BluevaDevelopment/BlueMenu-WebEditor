<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\EditorSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SessionValidationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_validates_the_window_the_player_confirmed(): void
    {
        $verificationId = (string) Str::uuid();
        $session = EditorSession::factory()->confirmed($verificationId)->create();

        $response = $this->getJson($this->url($session->session_id, $verificationId));

        $response->assertOk()->assertJson([
            'valid' => true,
            'confirmed' => true,
            'verificationMatch' => true,
            'message' => 'Session validated',
            'serverVersion' => '1.21.4',
        ]);
    }

    public function test_signs_the_window_in_so_it_can_reach_the_menu_endpoints(): void
    {
        $verificationId = (string) Str::uuid();
        $session = EditorSession::factory()->confirmed($verificationId)->create();

        $this->getJson($this->url($session->session_id, $verificationId));

        $this->assertAuthenticatedAs($session, 'editor');
    }

    public function test_opens_a_session_that_needed_no_confirmation(): void
    {
        // The plugin marks these confirmed on creation but attaches no window.
        $session = EditorSession::factory()->create(['require_confirmation' => false, 'confirmed' => true]);
        $verificationId = (string) Str::uuid();
        $session->verifications()->create(['verification_id' => $verificationId]);

        $this->getJson($this->url($session->session_id, $verificationId))
            ->assertOk()
            ->assertJson(['valid' => true, 'message' => 'Session validated']);
    }

    public function test_refuses_a_second_window_on_a_session_that_needed_no_confirmation(): void
    {
        $session = EditorSession::factory()->create(['require_confirmation' => false, 'confirmed' => true]);
        $first = (string) Str::uuid();
        $second = (string) Str::uuid();
        $session->verifications()->create(['verification_id' => $first]);
        $session->verifications()->create(['verification_id' => $second]);

        $this->getJson($this->url($session->session_id, $first))->assertJson(['valid' => true]);

        $this->getJson($this->url($session->session_id, $second))
            ->assertOk()
            ->assertJson(['valid' => false, 'message' => 'Session already validated from another window']);
    }

    public function test_reserves_the_session_so_a_second_window_is_refused(): void
    {
        $verificationId = (string) Str::uuid();
        $session = EditorSession::factory()->confirmed($verificationId)->create();

        $this->getJson($this->url($session->session_id, $verificationId))->assertJson(['valid' => true]);

        $this->getJson($this->url($session->session_id, $verificationId))
            ->assertOk()
            ->assertJson(['valid' => false, 'message' => 'Session invalid or consumed']);
    }

    public function test_refuses_a_verification_token_from_another_window(): void
    {
        $session = EditorSession::factory()->confirmed((string) Str::uuid())->create();
        $otherWindow = (string) Str::uuid();
        $session->verifications()->create(['verification_id' => $otherWindow]);

        $this->getJson($this->url($session->session_id, $otherWindow))
            ->assertOk()
            ->assertJson([
                'valid' => false,
                'confirmed' => true,
                'verificationMatch' => false,
                'message' => 'Session already validated from another window',
            ]);
    }

    public function test_reports_a_session_still_waiting_for_the_in_game_confirmation(): void
    {
        $session = EditorSession::factory()->create();
        $verificationId = (string) Str::uuid();
        $session->verifications()->create(['verification_id' => $verificationId]);

        $this->getJson($this->url($session->session_id, $verificationId))
            ->assertOk()
            ->assertJson([
                'valid' => false,
                'confirmed' => false,
                'verificationMatch' => true,
                'message' => 'Session not confirmed',
            ]);
    }

    public function test_rejects_a_verification_token_that_was_never_registered(): void
    {
        $session = EditorSession::factory()->create();

        $this->getJson($this->url($session->session_id, (string) Str::uuid()))
            ->assertOk()
            ->assertJson([
                'valid' => false,
                'verificationMatch' => false,
                'message' => 'Verification token is invalid or belongs to another window',
            ]);
    }

    public function test_reports_an_unknown_session_without_leaking_its_absence_as_an_error(): void
    {
        $this->getJson($this->url((string) Str::uuid(), (string) Str::uuid()))
            ->assertOk()
            ->assertJson(['valid' => false, 'message' => 'Session not found']);
    }

    public function test_deletes_an_expired_session_and_reports_it(): void
    {
        $session = EditorSession::factory()->expired()->create();

        $this->getJson($this->url($session->session_id, (string) Str::uuid()))
            ->assertOk()
            ->assertJson(['valid' => false, 'message' => 'Session expired']);

        $this->assertDatabaseMissing('editor_sessions', ['session_id' => $session->session_id]);
    }

    private function url(string $sessionId, string $verificationId): string
    {
        return route('api.session.show', $sessionId).'?verificationId='.$verificationId;
    }
}
