<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            // Set by the plugin when it cannot reach the realtime channel, so
            // requests are queued for it to collect over plain HTTP instead.
            $table->boolean('uses_polling')->default(false)->after('server_version');
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('uses_polling');
        });
    }
};
