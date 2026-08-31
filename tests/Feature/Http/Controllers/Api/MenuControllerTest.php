<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Events\MenuChanged;
use App\Events\RpcRequested;
use App\Models\EditorSession;
use App\Services\RpcBridge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class MenuControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_the_menu_list_the_plugin_answers_with(): void
    {
        $this->answerRpcWith(['menus' => ['java' => ['shop.yml']]]);

        $this->actingAs($this->editorSession(), 'editor')
            ->getJson(route('api.menus.index'))
            ->assertOk()
            ->assertJson(['ok' => true, 'payload' => ['menus' => ['java' => ['shop.yml']]]]);
    }

    public function test_sends_the_session_id_to_the_plugin_so_it_can_scope_the_answer(): void
    {
        $session = $this->editorSession();
        $captured = $this->answerRpcWith([]);

        $this->actingAs($session, 'editor')->getJson(route('api.menus.index'));

        $this->assertSame($session->session_id, $captured->payload['sessionId']);
    }

    public function test_saving_a_menu_announces_the_change_to_the_other_windows(): void
    {
        $this->answerRpcWith([]);
        Event::fake([MenuChanged::class]);

        $this->actingAs($this->editorSession(), 'editor')->postJson(route('api.menus.store'), [
            'platform' => 'java',
            'fileName' => 'shop.yml',
            'content' => 'menu: {}',
        ])->assertOk();

        Event::assertDispatched(
            MenuChanged::class,
            fn (MenuChanged $event) => $event->fileName === 'shop.yml' && $event->change === 'saved'
        );
    }

    public function test_returns_503_when_the_plugin_does_not_answer(): void
    {
        config(['editor.rpc.timeout' => 0.2, 'editor.rpc.poll_interval_ms' => 20]);

        $this->actingAs($this->editorSession(), 'editor')
            ->getJson(route('api.menus.index'))
            ->assertStatus(503)
            ->assertJson(['error' => 'server_offline']);
    }

    public function test_returns_401_for_a_window_that_never_validated_its_session(): void
    {
        $this->getJson(route('api.menus.index'))->assertUnauthorized();
    }

    public function test_returns_422_for_a_file_name_that_escapes_the_menu_directory(): void
    {
        $this->actingAs($this->editorSession(), 'editor')
            ->getJson(route('api.menus.show', ['platform' => 'java', 'fileName' => '../../settings.yml']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('fileName');
    }

    public function test_accepts_the_config_platform_so_settings_can_be_edited(): void
    {
        $this->answerRpcWith([]);

        $this->actingAs($this->editorSession(), 'editor')
            ->getJson(route('api.menus.show', ['platform' => 'config', 'fileName' => 'settings.yml']))
            ->assertOk();
    }

    public function test_returns_422_for_an_unknown_platform(): void
    {
        $this->actingAs($this->editorSession(), 'editor')
            ->getJson(route('api.menus.show', ['platform' => 'switch', 'fileName' => 'shop.yml']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('platform');
    }

    private function editorSession(): EditorSession
    {
        return EditorSession::factory()->create(['confirmed' => true, 'consumed' => true, 'active' => false]);
    }

    /**
     * Stands in for the plugin, which normally answers on its own HTTP request.
     *
     * @param  array<string, mixed>  $payload
     */
    private function answerRpcWith(array $payload): object
    {
        $bridge = app(RpcBridge::class);
        $captured = new class
        {
            /** @var array<string, mixed> */
            public array $payload = [];
        };

        Event::listen(RpcRequested::class, function (RpcRequested $event) use ($bridge, $payload, $captured): void {
            $captured->payload = $event->payload;
            $bridge->resolve($event->requestId, ['ok' => true, 'payload' => $payload, 'error' => null]);
        });

        return $captured;
    }
}
