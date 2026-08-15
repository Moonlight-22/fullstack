<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateUsersTableForFindAceAuth extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('client')->index()->after('password');
            $table->string('phone_number', 30)->nullable()->index()->after('role');
            $table->string('profile_image')->nullable()->after('phone_number');
            $table->boolean('is_active')->default(true)->index()->after('profile_image');
            $table->softDeletes()->after('remember_token');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['phone_number']);
            $table->dropIndex(['is_active']);
            $table->dropColumn(['role', 'phone_number', 'profile_image', 'is_active', 'deleted_at']);
        });
    }
}
