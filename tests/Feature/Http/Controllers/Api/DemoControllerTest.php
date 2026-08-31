<?php

namespace Tests\Feature\Http\Controllers\Api;

use Tests\TestCase;

class DemoControllerTest extends TestCase
{
    public function test_serves_a_sample_java_menu_as_yaml(): void
    {
        $this->get(route('api.demo.menu', ['platform' => 'java', 'fileName' => 'chest_example.yml']))
            ->assertOk()
            ->assertHeader('Content-Type', 'text/yaml; charset=UTF-8');
    }

    public function test_serves_the_sample_settings(): void
    {
        $this->get(route('api.demo.settings'))->assertOk()->assertSee('webeditor');
    }

    public function test_returns_400_for_an_unknown_platform(): void
    {
        $this->get(route('api.demo.menu', ['platform' => 'switch', 'fileName' => 'chest_example.yml']))
            ->assertStatus(400);
    }

    public function test_returns_404_and_does_not_escape_the_demo_directory(): void
    {
        $this->get(route('api.demo.menu', ['platform' => 'java', 'fileName' => '../../settings.yml']))
            ->assertNotFound();
    }
}
