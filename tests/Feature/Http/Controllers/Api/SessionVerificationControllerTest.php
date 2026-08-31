<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\EditorSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionVerificationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_issues_a_verification_token_for_an_open_session(): void
    {
        $session = EditorSession::factory()->create();

        $response = $this->postJson(route('api.session.verification.store', $session->session_id));

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertTrue($session->hasVerification($response->json('verificationId')));
    }

    public function test_issues_a_separate_token_to_each_window(): void
    {
        $session = EditorSession::factory()->create();
        $route = route('api.session.verification.store', $session->session_id);

        $first = $this->postJson($route)->json('verificationId');
        $second = $this->postJson($route)->json('verificationId');

        $this->assertNotSame($first, $second);
        $this->assertSame(2, $session->verifications()->count());
    }

    public function test_returns_400_for_an_unknown_session(): void
    {
        $this->postJson(route('api.session.verification.store', '00000000-0000-4000-8000-000000000000'))
            ->assertStatus(400)
            ->assertJson(['success' => false, 'verificationId' => null]);
    }

    public function test_returns_400_for_an_expired_session(): void
    {
        $session = EditorSession::factory()->expired()->create();

        $this->postJson(route('api.session.verification.store', $session->session_id))
            ->assertStatus(400)
            ->assertJson(['success' => false]);
    }

    public function test_returns_400_once_the_session_is_consumed(): void
    {
        $session = EditorSession::factory()->create(['consumed' => true]);

        $this->postJson(route('api.session.verification.store', $session->session_id))
            ->assertStatus(400)
            ->assertJson(['success' => false]);
    }
}
