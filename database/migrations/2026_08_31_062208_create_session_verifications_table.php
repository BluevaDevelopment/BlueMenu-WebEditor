<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('editor_session_id')->constrained()->cascadeOnDelete();
            $table->uuid('verification_id')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_verifications');
    }
};
