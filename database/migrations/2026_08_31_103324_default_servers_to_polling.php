<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A server is assumed to be collecting requests over HTTP until it proves
     * it holds a live channel. A queued request can always be picked up later,
     * while one broadcast to an empty channel is simply lost.
     */
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->boolean('uses_polling')->default(true)->change();
        });

        DB::table('servers')->update(['uses_polling' => true]);
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->boolean('uses_polling')->default(false)->change();
        });
    }
};
