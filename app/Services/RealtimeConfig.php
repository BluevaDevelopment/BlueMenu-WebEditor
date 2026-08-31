<?php

namespace App\Services;

/**
 * The Reverb connection details the browser and the plugin need.
 *
 * The app key is public in the Pusher protocol, so handing it to a registered
 * plugin adds no exposure; the private channel is still gated by the auth
 * endpoint, which checks the server token.
 */
class RealtimeConfig
{
    /** Hosts only reachable from the machine Reverb runs on. */
    private const UNREACHABLE_HOSTS = ['127.0.0.1', '::1', 'localhost', '0.0.0.0'];

    /**
     * @return array{key: string|null, host: string|null, port: int, scheme: string, authEndpoint: string}
     */
    public function toArray(): array
    {
        $options = config('broadcasting.connections.reverb.options', []);
        $configured = $options['host'] ?? null;

        // REVERB_HOST is where clients connect, but it is easy to set to the
        // address Reverb binds to. Handing a browser or a Minecraft server
        // "127.0.0.1" points it at itself, so fall back to the public host the
        // page is already served from, which is what a proxied deploy wants.
        $reachable = $this->isReachable($configured);

        return [
            'key' => config('broadcasting.connections.reverb.key'),
            'host' => $reachable ? $configured : $this->publicHost(),
            'port' => $reachable ? (int) ($options['port'] ?? 443) : $this->publicPort(),
            'scheme' => $reachable ? ($options['scheme'] ?? 'https') : $this->publicScheme(),
            'authEndpoint' => url('/broadcasting/auth'),
        ];
    }

    /**
     * True when the configured host is one a client elsewhere can dial.
     */
    private function isReachable(?string $host): bool
    {
        if ($host === null || $host === '') {
            return false;
        }

        if (in_array($host, self::UNREACHABLE_HOSTS, true)) {
            return false;
        }

        // A private address is fine on a LAN but never for a public editor.
        return filter_var($host, FILTER_VALIDATE_IP) === false
            || filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    }

    private function publicHost(): string
    {
        return (string) (parse_url((string) config('app.url'), PHP_URL_HOST) ?: 'localhost');
    }

    private function publicScheme(): string
    {
        return parse_url((string) config('app.url'), PHP_URL_SCHEME) === 'http' ? 'http' : 'https';
    }

    private function publicPort(): int
    {
        $port = parse_url((string) config('app.url'), PHP_URL_PORT);

        return is_int($port) ? $port : ($this->publicScheme() === 'https' ? 443 : 80);
    }
}
