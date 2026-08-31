<?php

namespace Database\Factories;

use App\Models\EditorSession;
use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<EditorSession>
 */
class EditorSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'session_id' => (string) Str::uuid(),
            'server_id' => Server::factory(),
            'server_version' => '1.21.4',
            'require_confirmation' => true,
            'confirmed' => false,
            'active' => true,
            'consumed' => false,
            'pending_web_bind' => false,
            'expires_at' => now()->addHour(),
        ];
    }

    public function confirmed(string $verificationId): static
    {
        return $this->state([
            'confirmed' => true,
            'confirmed_by' => (string) Str::uuid(),
            'confirmed_verification_id' => $verificationId,
        ])->afterCreating(
            fn (EditorSession $session) => $session->verifications()->create(['verification_id' => $verificationId])
        );
    }

    public function expired(): static
    {
        return $this->state(['expires_at' => now()->subMinute()]);
    }
}
