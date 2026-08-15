<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWorkerProfilesTable extends Migration
{
    public function up()
    {
        Schema::create('worker_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->unsignedSmallInteger('experience_years')->default(0);
            $table->json('skills')->nullable();
            $table->decimal('hourly_rate', 10, 2)->default(0)->index();
            $table->string('address')->nullable();
            $table->string('township')->nullable()->index();
            $table->decimal('latitude', 10, 7)->nullable()->index();
            $table->decimal('longitude', 10, 7)->nullable()->index();
            $table->enum('availability_status', ['available', 'busy', 'offline'])->default('available')->index();
            $table->decimal('average_rating', 3, 2)->default(0)->index();
            $table->unsignedInteger('completed_jobs_count')->default(0);
            $table->unsignedInteger('total_reviews')->default(0)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['latitude', 'longitude']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('worker_profiles');
    }
}
