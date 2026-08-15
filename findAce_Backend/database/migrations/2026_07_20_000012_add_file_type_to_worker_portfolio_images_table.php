<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFileTypeToWorkerPortfolioImagesTable extends Migration
{
    public function up()
    {
        Schema::table('worker_portfolio_images', function (Blueprint $table) {
            $table->string('file_type', 20)->default('image')->after('image_path');
            $table->string('original_name')->nullable()->after('file_type');
        });
    }

    public function down()
    {
        Schema::table('worker_portfolio_images', function (Blueprint $table) {
            $table->dropColumn(['file_type', 'original_name']);
        });
    }
}
