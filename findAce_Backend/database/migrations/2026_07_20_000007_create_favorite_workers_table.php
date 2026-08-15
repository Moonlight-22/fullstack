<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFavoriteWorkersTable extends Migration
{
    public function up()
    {
        Schema::create('favorite_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('worker_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['client_id', 'worker_id']);
            $table->index('worker_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('favorite_workers');
    }
}
