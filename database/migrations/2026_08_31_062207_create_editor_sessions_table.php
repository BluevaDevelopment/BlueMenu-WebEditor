<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('editor_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_id')->unique();
            $table->foreignId('server_id')->nullable()->constrained()->nullOnDelete();
            $table->string('server_version')->nullable();
            $table->boolean('require_confirmation')->default(true);
            $table->boolean('confirmed')->default(false);
            $table->uuid('confirmed_by')->nullable();
            $table->uuid('confirmed_verification_id')->nullable();
            $table->boolean('active')->default(true);
            $table->boolean('consumed')->default(false);
            $table->boolean('pending_web_bind')->default(false);
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('editor_sessions');
    }
};
