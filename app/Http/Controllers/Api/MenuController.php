<?php

namespace App\Http\Controllers\Api;

use App\Enums\RpcAction;
use App\Events\MenuChanged;
use App\Http\Controllers\Controller;
use App\Models\EditorSession;
use App\Services\RpcBridge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

/**
 * Menu operations, each one forwarded to the plugin that owns the session.
 */
class MenuController extends Controller
{
    /** The plugin also serves settings.yml, under the config platform. */
    private const PLATFORMS = ['java', 'bedrock', 'config'];

    public function index(Request $request, RpcBridge $rpc): JsonResponse
    {
        return $this->forward($request, $rpc, RpcAction::MenuList);
    }

    public function show(Request $request, RpcBridge $rpc): JsonResponse
    {
        $request->validate($this->menuRules());

        return $this->forward($request, $rpc, RpcAction::MenuGet, $request->only(['platform', 'fileName']));
    }

    public function store(Request $request, RpcBridge $rpc): JsonResponse
    {
        $validated = $request->validate($this->menuRules() + [
            'content' => ['required', 'string'],
        ]);

        $response = $this->forward($request, $rpc, RpcAction::MenuSave, $validated);
        $this->announce($request, $validated['platform'], $validated['fileName'], 'saved');

        return $response;
    }

    public function destroy(Request $request, RpcBridge $rpc): JsonResponse
    {
        $validated = $request->validate($this->menuRules());

        $response = $this->forward($request, $rpc, RpcAction::MenuDelete, $validated);
        $this->announce($request, $validated['platform'], $validated['fileName'], 'deleted');

        return $response;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function forward(Request $request, RpcBridge $rpc, RpcAction $action, array $payload = []): JsonResponse
    {
        $session = $this->session($request);
        $payload['sessionId'] = $session->session_id;

        return response()->json($rpc->call($session->server, $action, $payload));
    }

    /**
     * Lets the other windows know a menu changed.
     *
     * Broadcasting is a courtesy: the file is already written, so a broadcaster
     * that is down or misrouted must not turn a successful save into a 500.
     */
    private function announce(Request $request, string $platform, string $fileName, string $change): void
    {
        try {
            MenuChanged::dispatch($this->session($request), $platform, $fileName, $change);
        } catch (Throwable $failure) {
            Log::warning('Could not announce a menu change', [
                'fileName' => $fileName,
                'reason' => $failure->getMessage(),
            ]);
        }
    }

    private function session(Request $request): EditorSession
    {
        /** @var EditorSession $session */
        $session = $request->user('editor');

        return $session->loadMissing('server');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function menuRules(): array
    {
        return [
            'platform' => ['required', Rule::in(self::PLATFORMS)],
            'fileName' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z0-9_\-.]+\.ya?ml$/'],
        ];
    }
}
