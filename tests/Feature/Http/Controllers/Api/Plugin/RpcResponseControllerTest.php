<?php

namespace Tests\Feature\Http\Controllers\Api\Plugin;

use App\Models\Server;
use Database\Factories\ServerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

class RpcResponseControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_stores_the_answer_where_the_waiting_request_looks_for_it(): void
    {
        $requestId = (string) Str::uuid();

        $this->withServer()->postJson(route('plugin.rpc-response'), [
            'id' => $requestId,
            'ok' => true,
            'payload' => ['menus' => []],
        ])->assertNoContent();

        $this->assertSame(
            ['ok' => true, 'payload' => ['menus' => []], 'error' => null],
            Cache::get("rpc:{$requestId}")
        );
    }

    public function test_carries_the_plugin_error_back_to_the_browser(): void
    {
        $requestId = (string) Str::uuid();

        $this->withServer()->postJson(route('plugin.rpc-response'), [
            'id' => $requestId,
            'ok' => false,
            'error' => 'Menu file not found',
        ])->assertNoContent();

        $this->assertSame('Menu file not found', Cache::get("rpc:{$requestId}")['error']);
    }

    public function test_returns_401_without_server_credentials(): void
    {
        $this->postJson(route('plugin.rpc-response'), ['id' => (string) Str::uuid(), 'ok' => true])
            ->assertUnauthorized();
    }

    public function test_returns_422_for_a_request_id_that_is_not_a_uuid(): void
    {
        $this->withServer()
            ->postJson(route('plugin.rpc-response'), ['id' => 'not-a-uuid', 'ok' => true])
            ->assertStatus(422)
            ->assertJsonValidationErrors('id');
    }

    private function withServer(): static
    {
        $server = Server::factory()->create();

        return $this->withHeaders([
            'X-Server-Uuid' => $server->uuid,
            'X-Server-Token' => ServerFactory::TOKEN,
        ]);
    }
}
