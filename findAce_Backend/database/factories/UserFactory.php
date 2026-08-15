<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition()
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            'remember_token' => Str::random(10),
            'role' => User::ROLE_CLIENT,
            'phone_number' => '09' . $this->faker->numerify('#########'),
            'is_active' => true,
        ];
    }

    public function admin()
    {
        return $this->state(['role' => User::ROLE_ADMIN]);
    }

    public function worker()
    {
        return $this->state(['role' => User::ROLE_WORKER]);
    }

    public function client()
    {
        return $this->state(['role' => User::ROLE_CLIENT]);
    }
}
