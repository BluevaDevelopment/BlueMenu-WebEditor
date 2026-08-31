<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('editor:purge-sessions')->everyFifteenMinutes();
