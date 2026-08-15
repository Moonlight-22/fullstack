<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCategoryWorkerTable extends Migration
{
    public function up()
    {
        Schema::create('category_worker', function (Blueprint $table) {
            $table->id();
            $table->foreignId('worker_profile_id')->constrained('worker_profiles')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['worker_profile_id', 'category_id']);
            $table->index('category_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('category_worker');
    }
}
