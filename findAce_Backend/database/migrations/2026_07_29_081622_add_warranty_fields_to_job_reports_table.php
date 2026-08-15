<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddWarrantyFieldsToJobReportsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('job_reports', function (Blueprint $table) {
            $table->date('warranty_started_at')->nullable()->after('created_at');
            $table->date('warranty_ended_at')->nullable()->after('warranty_started_at');
            $table->string('warranty_target', 20)->nullable()->after('warranty_ended_at');
            $table->text('warranty_message')->nullable()->after('warranty_target');
            $table->timestamp('warranty_sent_at')->nullable()->after('warranty_message');

            $table->index('warranty_target');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('job_reports', function (Blueprint $table) {
            $table->dropColumn([
                'warranty_started_at',
                'warranty_ended_at',
                'warranty_target',
                'warranty_message',
                'warranty_sent_at',
            ]);
        });
    }
}
