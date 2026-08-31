<?php

namespace Tests\Feature\Http\Controllers\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenanceControllerTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'admin-token';

    protected function setUp(): void
    {
        parent::setUp();

        config(['editor.admin.token' => self::TOKEN]);
    }

    public function test_reports_maintenance_disabled_by_default(): void
    {
        $this->getJson(route('api.admin.maintenance.show'))
            ->assertOk()
            ->assertJson(['enabled' => false, 'scheduledAt' => null]);
    }

    public function test_enables_maintenance(): void
    {
        $this->withAdminToken()
            ->postJson(route('api.admin.maintenance.update'), ['enabled' => true])
            ->assertOk()
            ->assertJson(['enabled' => true]);

        $this->getJson(route('api.admin.maintenance.show'))->assertJson(['enabled' => true]);
    }

    public function test_turns_maintenance_on_once_the_scheduled_moment_has_passed(): void
    {
        $this->withAdminToken()->postJson(route('api.admin.maintenance.update'), [
            'scheduledAt' => now()->addMinute()->getTimestampMs(),
        ])->assertJson(['enabled' => false]);

        $this->travel(2)->minutes();

        $this->getJson(route('api.admin.maintenance.show'))
            ->assertJson(['enabled' => true, 'scheduledAt' => null]);
    }

    public function test_returns_403_without_the_admin_token(): void
    {
        $this->postJson(route('api.admin.maintenance.update'), ['enabled' => true])->assertForbidden();
        $this->postJson(route('api.admin.terminal'), ['command' => 'help'])->assertForbidden();
    }

    public function test_returns_403_for_every_admin_request_while_no_token_is_configured(): void
    {
        config(['editor.admin.token' => null]);

        $this->withHeaders(['X-Admin-Token' => ''])
            ->postJson(route('api.admin.maintenance.update'), ['enabled' => true])
            ->assertForbidden();
    }

    public function test_returns_422_for_a_negative_schedule(): void
    {
        $this->withAdminToken()
            ->postJson(route('api.admin.maintenance.update'), ['scheduledAt' => 0])
            ->assertStatus(422)
            ->assertJsonValidationErrors('scheduledAt');
    }

    private function withAdminToken(): static
    {
        return $this->withHeaders(['X-Admin-Token' => self::TOKEN]);
    }
}
