<?php

namespace Database\Factories;

use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<Server>
 */
class ServerFactory extends Factory
{
    /**
     * The plaintext token of the last built server, so tests can authenticate as it.
     */
    public const TOKEN = 'server-token';

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'token_hash' => Hash::make(self::TOKEN),
            'name' => fake()->domainWord(),
            'plugin_version' => '1.5.0',
            'server_version' => '1.21.4',
            'last_seen_at' => now(),
        ];
    }

    public function offline(): static
    {
        return $this->state(['last_seen_at' => now()->subHour()]);
    }
}
