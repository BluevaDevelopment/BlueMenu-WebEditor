<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One browser window that asked to be verified against an editor session.
 */
class SessionVerification extends Model
{
    /** @use HasFactory<\Database\Factories\SessionVerificationFactory> */
    use HasFactory;

    protected $fillable = [
        'editor_session_id',
        'verification_id',
    ];

    /**
     * @return BelongsTo<EditorSession, $this>
     */
    public function editorSession(): BelongsTo
    {
        return $this->belongsTo(EditorSession::class);
    }
}
