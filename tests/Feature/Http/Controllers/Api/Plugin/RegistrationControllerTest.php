<?php

namespace Tests\Feature\Http\Controllers\Api\Plugin;

use App\Models\Server;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_registers_a_server_and_returns_201_with_usable_credentials(): void
    {
        $response = $this->postJson(route('plugin.register'), [
            'name' => 'survival',
            'pluginVersion' => '1.5.0',
            'serverVersion' => '1.21.4',
        ]);

        $response->assertCreated()->assertJsonStructure(['uuid', 'token']);

        $server = Server::firstWhere('uuid', $response->json('uuid'));
        $this->assertTrue(Hash::check($response->json('token'), $server->token_hash));
    }

    public function test_never_returns_the_token_of_an_already_registered_server(): void
    {
        $existing = Server::factory()->create();

        $response = $this->postJson(route('plugin.register'), ['name' => $existing->name]);

        $this->assertNotSame($existing->uuid, $response->json('uuid'));
    }

    public function test_returns_422_for_a_name_that_is_too_long(): void
    {
        $this->postJson(route('plugin.register'), ['name' => str_repeat('a', 256)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }
}
