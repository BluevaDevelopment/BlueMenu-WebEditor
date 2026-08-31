<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * Serves the sample menus that power the editor's demo mode, taken from the
 * files the plugin ships with.
 */
class DemoController extends Controller
{
    private const PLATFORMS = ['java', 'bedrock'];

    public function menu(string $platform, string $fileName): Response
    {
        if (! in_array($platform, self::PLATFORMS, true)) {
            return response('Invalid platform', HttpResponse::HTTP_BAD_REQUEST);
        }

        return $this->yaml(resource_path("demo/menus/{$platform}/".basename($fileName)), 'Menu file not found');
    }

    public function settings(): Response
    {
        return $this->yaml(resource_path('demo/settings.yml'), 'Settings file not found');
    }

    private function yaml(string $path, string $missingMessage): Response
    {
        if (! File::exists($path)) {
            return response($missingMessage, HttpResponse::HTTP_NOT_FOUND);
        }

        return response(File::get($path))->header('Content-Type', 'text/yaml');
    }
}
