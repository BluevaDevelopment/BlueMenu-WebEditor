<?php

namespace App\Services;

use App\Models\EditorSession;
use App\Models\Server;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Owns the editor session lifecycle.
 *
 * Every state transition runs inside a transaction that locks the row, because
 * the browser, the plugin and the console can all touch the same session at the
 * same time. The Java implementation relied on a synchronized block over an
 * in-memory object; the lock here plays that role across processes.
 */
class EditorSessionManager
{
    public function create(Server $server, ?string $sessionId, bool $requireConfirmation): EditorSession
    {
        return EditorSession::create([
            'session_id' => $sessionId ?: (string) Str::uuid(),
            'server_id' => $server->id,
            'server_version' => $server->server_version,
            'require_confirmation' => $requireConfirmation,
            'confirmed' => ! $requireConfirmation,
            'active' => true,
            'expires_at' => now()->addSeconds(config('editor.session.timeout')),
        ]);
    }

    /**
     * Registers a verification id for one browser window.
     *
     * @return string|null the new verification id, or null when the session can no longer accept windows
     */
    public function createVerification(EditorSession $session): ?string
    {
        return DB::transaction(function () use ($session): ?string {
            $locked = EditorSession::whereKey($session->getKey())->lockForUpdate()->first();

            if ($locked === null || $locked->isExpired() || $locked->consumed) {
                return null;
            }

            $verificationId = (string) Str::uuid();
            $locked->verifications()->create(['verification_id' => $verificationId]);

            return $verificationId;
        });
    }

    /**
     * Confirms the window that owns the given verification id, from in game.
     */
    public function confirm(string $verificationId, string $confirmedBy): ?EditorSession
    {
        return DB::transaction(function () use ($verificationId, $confirmedBy): ?EditorSession {
            $session = EditorSession::whereHas(
                'verifications',
                fn ($query) => $query->where('verification_id', $verificationId)
            )->lockForUpdate()->first();

            if ($session === null) {
                return null;
            }

            if ($session->isExpired()) {
                $session->delete();

                return null;
            }

            if ($session->consumed) {
                return null;
            }

            $session->update([
                'confirmed' => true,
                'confirmed_by' => $confirmedBy,
                'confirmed_verification_id' => $verificationId,
            ]);

            return $session;
        });
    }

    /**
     * Adopts a window as the confirmed one when no confirmation was required.
     *
     * Such a session is created already confirmed but with no window attached,
     * so without this the first window to validate is turned away as if another
     * had got there first.
     */
    public function adoptWindow(EditorSession $session, string $verificationId): bool
    {
        if ($session->require_confirmation || $session->confirmed_verification_id !== null) {
            return false;
        }

        return DB::transaction(function () use ($session, $verificationId): bool {
            $locked = EditorSession::whereKey($session->getKey())->lockForUpdate()->first();

            if ($locked === null || $locked->confirmed_verification_id !== null || $locked->require_confirmation) {
                return false;
            }

            $locked->update(['confirmed_verification_id' => $verificationId]);
            $session->setAttribute('confirmed_verification_id', $verificationId);

            return true;
        });
    }

    /**
     * Claims the session for the first browser window that validates it.
     */
    public function reserveForWeb(EditorSession $session): bool
    {
        return DB::transaction(function () use ($session): bool {
            $locked = EditorSession::whereKey($session->getKey())->lockForUpdate()->first();

            if ($locked === null) {
                return false;
            }

            if ($locked->isExpired()) {
                $locked->delete();

                return false;
            }

            if (! $locked->confirmed || $locked->pending_web_bind || $locked->consumed || ! $locked->active) {
                return false;
            }

            $locked->update([
                'consumed' => true,
                'active' => false,
                'pending_web_bind' => true,
            ]);

            return true;
        });
    }

    /**
     * Binds a reserved session to the live browser connection.
     */
    public function claim(EditorSession $session): bool
    {
        return DB::transaction(function () use ($session): bool {
            $locked = EditorSession::whereKey($session->getKey())->lockForUpdate()->first();

            if ($locked === null) {
                return false;
            }

            if ($locked->isExpired()) {
                $locked->delete();

                return false;
            }

            if ($locked->pending_web_bind) {
                $locked->update(['pending_web_bind' => false, 'consumed' => true, 'active' => false]);

                return true;
            }

            if (! $locked->confirmed || $locked->consumed || ! $locked->active) {
                return false;
            }

            $locked->update(['consumed' => true, 'active' => false]);

            return true;
        });
    }

    public function consume(EditorSession $session): void
    {
        $session->update(['consumed' => true, 'active' => false, 'pending_web_bind' => false]);
    }

    public function invalidate(EditorSession $session): void
    {
        $session->delete();
    }

    public function purgeExpired(): int
    {
        return EditorSession::expired()->delete();
    }

    /**
     * @return \Illuminate\Support\Collection<int, EditorSession>
     */
    public function overview(): \Illuminate\Support\Collection
    {
        $this->purgeExpired();

        return EditorSession::alive()->with('server')->latest()->get();
    }
}
