<p align="center">
  <img src="docs/assets/bluemenu-logo.png" alt="BlueMenu Web Editor" width="760">
</p>

<h1 align="center">BlueMenu Web Editor</h1>

<p align="center">
  <strong>Browser based editor for BlueMenu menus, served at <a href="https://menu.blueva.net">menu.blueva.net</a>.</strong>
</p>

<p align="center">
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white">
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8.3+-777BB4?logo=php&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-GPL--3.0-green">
</p>

## Overview

This is the web frontend behind `/bm editor` in [BlueMenu](https://github.com/BluevaDevelopment/BlueMenu). Server owners edit their Java chest menus and their Bedrock forms from the browser instead of hand writing YAML, and the plugin applies the result on the live server.

The plugin is the source of truth. Menu files stay under `plugins/BlueMenu/menus/`, and the editor talks to the server over a WebSocket connection, so nothing is copied into a separate account or database that could drift from what the server actually loads.

## How a session works

1. A player runs `/bm editor` in game. The plugin asks the editor to open a session and hands the player a link.
2. Opening the link registers that browser window and gives it its own verification id, so a leaked link does not grant access on its own.
3. If `require-confirmation` is on in `settings.yml`, the plugin waits for `/bm confirm <id>` in game before the session becomes editable.
4. From then on the browser edits over plain HTTP. Every operation that needs the server is forwarded to the plugin and answered by it.

Sessions expire on their own, and the editor rejects any request whose session is unknown, consumed or unconfirmed.

## How the plugin is reached

The plugin is not a client the editor can call directly, so requests travel to it over a broadcast channel and come back over HTTP:

- The server registers once and stores its credentials in `webeditor-credentials.yml`.
- It subscribes to its own private Reverb channel and keeps itself marked as reachable with a heartbeat.
- A browser request that needs the server publishes an RPC request on that channel and waits; the plugin performs the operation and posts the answer back to `/api/plugin/rpc-response`.

If Reverb is unreachable or unconfigured, the plugin says so on its heartbeat and collects the same requests from `/api/plugin/rpc-poll` once a second instead. The editor keeps working either way; the channel only makes it immediate.

That wait happens **inside** the browser's request while the answer arrives on a **different** request, so the web process must serve more than one request at a time. With a single worker the waiting request starves the one that would release it:

```bash
PHP_CLI_SERVER_WORKERS=6 php artisan serve --host=0.0.0.0 --port=8000 --no-reload
```

`artisan serve` only honours `PHP_CLI_SERVER_WORKERS` together with `--no-reload`.

## Configuring Reverb

The plugin is handed these values at runtime, so they must be set on the server rather than at build time:

```
REVERB_APP_ID, REVERB_APP_KEY, REVERB_APP_SECRET
REVERB_HOST=menu.example.net      # the public hostname, not localhost
REVERB_PORT=443
REVERB_SCHEME=https
```

`REVERB_HOST` is the host the **plugin and the browser** connect to, so `localhost` only ever works for local development. Leave the values empty and both fall back to polling, which works but adds up to a second of latency to every operation.

Start the server with `php artisan reverb:start` and give it a route from the public host. Behind Cloudflare, WebSockets must be enabled for the zone.

## Demo mode

Opening the site without a session shows the editor running on the example menus the plugin ships. Everything renders and every editor works; only saving is unavailable, because there is no server behind it.

## Stack

- Laravel 13 on PHP 8.3+, with Laravel Reverb for the channel the plugin listens on
- React 19 with TypeScript 7, mounted from a Blade shell
- CodeMirror 6 for the YAML editor, `yaml` for the document model
- Vite 8 with the Laravel plugin, Tailwind 4 and Bunny Fonts
- SQLite by default, MySQL in production
- PHPUnit for the backend, Vitest for the editor

## Project Layout

```
app/
├── Enums/                    domain vocabularies
├── Events/                   broadcast events, including the plugin RPC request
├── Http/Controllers/Api/     browser endpoints
├── Http/Controllers/Api/Plugin/  endpoints the plugin calls
├── Models/                   servers, sessions, verifications, settings
└── Services/                 session lifecycle, RPC bridge, maintenance, admin console
resources/
├── demo/                     the sample menus the plugin ships
├── js/editor/                menu model, yaml codec, validator, materials
├── js/components/            editor chassis
├── js/components/visual/     canvas, item editor, form builder, animator
└── views/                    Blade shells that mount React
routes/web.php                browser routes
routes/plugin.php             plugin routes
routes/channels.php           private channel authorisation
public/editor/items/          item sprites, one folder per Minecraft version
```

## Requirements

| Component | Version |
|---|---|
| PHP | 8.3+ |
| Composer | 2+ |
| Node | 20+ |
| Database | SQLite for local work, MySQL 8+ in production |
| Reverb | Started with `php artisan reverb:start` |

## Getting Started

```bash
composer setup
```

That single command installs dependencies, creates `.env`, generates the app key, migrates and builds the assets. To run it by hand:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

Then start the dev server:

```bash
composer dev
```

`composer dev` runs `php artisan dev`, which brings up the PHP server, the queue worker, the log tailer and Vite together. If a frontend change does not show up, the Vite process is probably not running.

## Development

```bash
npm run dev          # Vite dev server with hot reload
npm run typecheck    # tsc --noEmit
npm test             # Vitest, covering the yaml codec and the editor logic
npm run build        # production assets
composer test        # clears config, then runs PHPUnit
php artisan reverb:start
```

Run the narrowest test set that covers a change, for example `php artisan test --compact --filter=SomeTest`.

## Deployment

`.github/workflows/deploy.yml` typechecks, builds and runs both test suites on every push and pull request. On `main` it then pulls, installs production dependencies, rebuilds the assets, migrates and warms the caches on the host.

## Authors

- Blueva
- Whiron
- Arthuurrr

Website: [blueva.net](https://blueva.net)

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
