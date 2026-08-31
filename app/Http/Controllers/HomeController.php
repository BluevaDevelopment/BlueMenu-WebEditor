<?php

namespace App\Http\Controllers;

use App\Services\RealtimeConfig;
use Illuminate\Contracts\View\View;

/**
 * The landing page runs the editor in demo mode, on the sample menus.
 */
class HomeController extends Controller
{
    public function __invoke(RealtimeConfig $realtime): View
    {
        return view('welcome', ['realtime' => $realtime->toArray()]);
    }
}
