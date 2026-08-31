<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#1e1e1e">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'BlueMenu') }} Web Editor</title>

        <link rel="icon" href="{{ asset('editor/img/favicon.png') }}">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body>
        <div
            id="app"
            data-reverb-key="{{ $realtime['key'] }}"
            data-reverb-host="{{ $realtime['host'] }}"
            data-reverb-port="{{ $realtime['port'] }}"
            data-reverb-scheme="{{ $realtime['scheme'] }}"
        ></div>
    </body>
</html>
