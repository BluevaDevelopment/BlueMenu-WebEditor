<?php

namespace Tests\Feature\Services;

use App\Services\RealtimeConfig;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RealtimeConfigTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->serveFrom('https://menu.example.net');
    }

    public function test_passes_a_public_host_through_untouched(): void
    {
        $this->withReverb('realtime.example.net', 443, 'https');

        $config = app(RealtimeConfig::class)->toArray();

        $this->assertSame('realtime.example.net', $config['host']);
        $this->assertSame(443, $config['port']);
        $this->assertSame('https', $config['scheme']);
    }

    public function test_replaces_the_bind_address_with_the_host_clients_can_reach(): void
    {
        // A browser told to dial 127.0.0.1 connects to itself, not the editor.
        $this->withReverb('127.0.0.1', 8093, 'http');

        $config = app(RealtimeConfig::class)->toArray();

        $this->assertSame('menu.example.net', $config['host']);
        $this->assertSame(443, $config['port']);
        $this->assertSame('https', $config['scheme']);
    }

    public function test_replaces_a_private_address_too(): void
    {
        $this->withReverb('192.168.1.10', 8080, 'http');

        $this->assertSame('menu.example.net', app(RealtimeConfig::class)->toArray()['host']);
    }

    public function test_falls_back_when_no_host_is_configured(): void
    {
        $this->withReverb(null, 8080, 'http');

        $this->assertSame('menu.example.net', app(RealtimeConfig::class)->toArray()['host']);
    }

    public function test_keeps_localhost_for_local_development(): void
    {
        $this->serveFrom('http://localhost:8000');
        $this->withReverb('localhost', 8080, 'http');

        $config = app(RealtimeConfig::class)->toArray();

        $this->assertSame('localhost', $config['host']);
        $this->assertSame(8000, $config['port']);
        $this->assertSame('http', $config['scheme']);
    }

    public function test_reports_the_auth_endpoint_as_an_absolute_url(): void
    {
        $this->withReverb('realtime.example.net', 443, 'https');

        $this->assertSame('https://menu.example.net/broadcasting/auth', app(RealtimeConfig::class)->toArray()['authEndpoint']);
    }

    /** The URL generator is resolved at boot, so both must move together. */
    private function serveFrom(string $url): void
    {
        config(['app.url' => $url]);
        URL::forceRootUrl($url);
        URL::forceScheme((string) parse_url($url, PHP_URL_SCHEME));
    }

    private function withReverb(?string $host, int $port, string $scheme): void
    {
        config([
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.options' => ['host' => $host, 'port' => $port, 'scheme' => $scheme],
        ]);
    }
}
