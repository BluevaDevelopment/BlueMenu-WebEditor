<?php

namespace App\Models;

use App\Enums\SettingKey;
use Illuminate\Database\Eloquent\Model;

/**
 * Persisted key/value application state that must outlive a cache flush.
 */
class Setting extends Model
{
    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'key',
        'value',
    ];

    public static function read(SettingKey $key, mixed $default = null): mixed
    {
        return static::find($key->value)?->value ?? $default;
    }

    public static function write(SettingKey $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key->value], ['value' => $value]);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }
}
