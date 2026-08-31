<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Auth\Authenticatable as AuthenticatableTrait;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An editing session opened from the game with /bm editor.
 *
 * The lifecycle mirrors the one the Java web server used: the plugin creates the
 * session, each browser window registers its own verification id, the player
 * confirms one of them in game, and the first window to validate reserves the
 * session and consumes it.
 */
class EditorSession extends Model implements Authenticatable
{
    use AuthenticatableTrait;

    /** @use HasFactory<\Database\Factories\EditorSessionFactory> */
    use HasFactory;

    protected $fillable = [
        'session_id',
        'server_id',
        'server_version',
        'require_confirmation',
        'confirmed',
        'confirmed_by',
        'confirmed_verification_id',
        'active',
        'consumed',
        'pending_web_bind',
        'expires_at',
    ];

    /**
     * @return BelongsTo<Server, $this>
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * @return HasMany<SessionVerification, $this>
     */
    public function verifications(): HasMany
    {
        return $this->hasMany(SessionVerification::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function hasVerification(string $verificationId): bool
    {
        return $this->verifications()->where('verification_id', $verificationId)->exists();
    }

    public function matchesConfirmedVerification(string $verificationId): bool
    {
        return $this->confirmed_verification_id === $verificationId;
    }

    /**
     * @param  Builder<EditorSession>  $query
     */
    public function scopeExpired(Builder $query): void
    {
        $query->where('expires_at', '<=', now());
    }

    /**
     * @param  Builder<EditorSession>  $query
     */
    public function scopeAlive(Builder $query): void
    {
        $query->where('expires_at', '>', now());
    }

    public function getRouteKeyName(): string
    {
        return 'session_id';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'require_confirmation' => 'boolean',
            'confirmed' => 'boolean',
            'active' => 'boolean',
            'consumed' => 'boolean',
            'pending_web_bind' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }
}
