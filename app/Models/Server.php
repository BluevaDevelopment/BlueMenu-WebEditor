<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable as AuthenticatableTrait;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A Minecraft server running the plugin, registered the first time it connects.
 */
class Server extends Model implements Authenticatable
{
    use AuthenticatableTrait;

    /** @use HasFactory<\Database\Factories\ServerFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid',
        'token_hash',
        'name',
        'plugin_version',
        'server_version',
        'uses_polling',
        'last_seen_at',
    ];

    protected $hidden = [
        'token_hash',
    ];

    /** Until a plugin reports a live channel, its requests are queued. */
    protected $attributes = [
        'uses_polling' => true,
    ];

    /**
     * A server is considered reachable while it has sent a heartbeat inside this window.
     */
    public const HEARTBEAT_GRACE_SECONDS = 45;

    /**
     * @return HasMany<EditorSession, $this>
     */
    public function editorSessions(): HasMany
    {
        return $this->hasMany(EditorSession::class);
    }

    public function isOnline(): bool
    {
        return $this->last_seen_at !== null
            && $this->last_seen_at->gt(now()->subSeconds(self::HEARTBEAT_GRACE_SECONDS));
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
            'uses_polling' => 'boolean',
        ];
    }
}
