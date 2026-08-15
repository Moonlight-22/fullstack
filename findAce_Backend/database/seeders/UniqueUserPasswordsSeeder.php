<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UniqueUserPasswordsSeeder extends Seeder
{
    public function run()
    {
        $lines = [];

        foreach (User::query()->orderBy('role')->orderBy('email')->get() as $user) {
            $password = $this->passwordFor($user);
            $user->password = Hash::make($password);
            $user->save();
            $lines[] = "{$user->role}\t{$user->email}\t{$password}\t{$user->name}";
        }

        $this->command?->info('Updated unique passwords:');
        foreach ($lines as $line) {
            $this->command?->line($line);
        }
    }

    protected function passwordFor(User $user): string
    {
        $email = strtolower((string) $user->email);

        $known = [
            'admin@findace.com' => 'admin',
            'hiro@gmail.com' => 'password123',
            'aung@gmail.com' => 'password124',
            'min@gmail.com' => 'Min#Client',
        ];

        if (isset($known[$email])) {
            return $known[$email];
        }

        if (preg_match('/^client(\d+)@findace\.com$/', $email, $m)) {
            return 'Client' . $m[1] . '#Ace';
        }

        if (preg_match('/^worker(\d+)@findace\.com$/', $email, $m)) {
            return 'Worker' . $m[1] . '#Ace';
        }

        $local = preg_replace('/[^a-z0-9]/', '', explode('@', $email)[0] ?? 'user');

        return ucfirst($local) . '#Ace' . $user->id;
    }
}
