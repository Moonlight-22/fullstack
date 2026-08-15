<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ClientProfile;
use App\Models\FavoriteWorker;
use App\Models\JobRequest;
use App\Models\JobRequestHistory;
use App\Models\Review;
use App\Models\User;
use App\Models\WorkerProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    protected array $townships = [
        ['name' => 'Kamayut', 'lat' => 16.8260, 'lng' => 96.1340],
        ['name' => 'Bahan', 'lat' => 16.8140, 'lng' => 96.1560],
        ['name' => 'Sanchaung', 'lat' => 16.8050, 'lng' => 96.1320],
        ['name' => 'Hlaing', 'lat' => 16.8510, 'lng' => 96.1260],
        ['name' => 'Mayangone', 'lat' => 16.8680, 'lng' => 96.1180],
        ['name' => 'Tamwe', 'lat' => 16.7820, 'lng' => 96.1720],
        ['name' => 'Thingangyun', 'lat' => 16.7760, 'lng' => 96.1860],
        ['name' => 'Dagon', 'lat' => 16.7960, 'lng' => 96.1480],
    ];

    protected array $skillsPool = [
        'Wiring', 'Plumbing', 'Painting', 'Tutoring', 'IT Support',
        'Mechanic', 'Cleaning', 'Photography', 'Carpentry', 'AC Repair',
    ];

    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Review::truncate();
        JobRequestHistory::truncate();
        JobRequest::truncate();
        FavoriteWorker::truncate();
        DB::table('category_worker')->truncate();
        WorkerProfile::truncate();
        ClientProfile::truncate();
        User::truncate();
        Category::truncate();
        DB::table('notifications')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $admin = User::create([
            'name' => 'Find Ace Admin',
            'email' => 'admin@findace.com',
            'password' => Hash::make('admin'),
            'role' => User::ROLE_ADMIN,
            'phone_number' => '09110000000',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $categories = $this->seedCategories();
        $workers = $this->seedWorkers(50, $categories);
        $clients = $this->seedClients(100);
        $this->seedFavorites($clients, $workers);
        $jobs = $this->seedJobRequests(600, $workers, $clients, $categories);
        $this->seedReviews($jobs, 500);

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin: admin@findace.com / admin');
        $this->command->info('Workers: workerN@findace.com / WorkerN#Ace');
        $this->command->info('Clients: clientN@findace.com / ClientN#Ace');
    }

    protected function seedCategories(): array
    {
        $names = [
            'Electrician', 'Plumber', 'Painter', 'Tutor', 'IT Support',
            'Mechanic', 'Cleaner', 'Photographer', 'Carpenter', 'AC Repair',
            'Mason', 'Gardener', 'Tailor', 'Driver', 'Cook',
            'Welder', 'Interior Designer', 'Pest Control', 'Mover', 'Security Guard',
        ];

        $categories = [];

        foreach ($names as $name) {
            $categories[] = Category::create([
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => 'Professional ' . strtolower($name) . ' services in your area.',
                'icon' => Str::slug($name),
                'is_active' => true,
            ]);
        }

        return $categories;
    }

    protected function seedWorkers(int $count, array $categories): array
    {
        $workers = [];

        for ($i = 1; $i <= $count; $i++) {
            $township = $this->townships[array_rand($this->townships)];
            $user = User::create([
                'name' => 'Worker ' . $i,
                'email' => 'worker' . $i . '@findace.com',
                'password' => Hash::make('Worker' . $i . '#Ace'),
                'role' => User::ROLE_WORKER,
                'phone_number' => '092' . str_pad($i, 8, '0', STR_PAD_LEFT),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $profile = WorkerProfile::create([
                'user_id' => $user->id,
                'bio' => 'Experienced professional worker #' . $i . ' ready to help with your tasks.',
                'experience_years' => rand(1, 15),
                'skills' => collect($this->skillsPool)->random(rand(2, 5))->values()->all(),
                'hourly_rate' => rand(5000, 50000),
                'address' => 'No.' . rand(1, 200) . ', ' . $township['name'] . ' Township',
                'township' => $township['name'],
                'latitude' => $township['lat'] + (rand(-100, 100) / 10000),
                'longitude' => $township['lng'] + (rand(-100, 100) / 10000),
                'availability_status' => collect(['available', 'busy', 'offline'])->random(),
                'average_rating' => 0,
                'completed_jobs_count' => 0,
                'total_reviews' => 0,
            ]);

            $profile->categories()->attach(
                collect($categories)->random(rand(1, 3))->pluck('id')->all()
            );

            $workers[] = $user;
        }

        return $workers;
    }

    protected function seedClients(int $count): array
    {
        $clients = [];

        for ($i = 1; $i <= $count; $i++) {
            $township = $this->townships[array_rand($this->townships)];
            $user = User::create([
                'name' => 'Client ' . $i,
                'email' => 'client' . $i . '@findace.com',
                'password' => Hash::make('Client' . $i . '#Ace'),
                'role' => User::ROLE_CLIENT,
                'phone_number' => '093' . str_pad($i, 8, '0', STR_PAD_LEFT),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            ClientProfile::create([
                'user_id' => $user->id,
                'address' => 'No.' . rand(1, 200) . ', ' . $township['name'] . ' Township',
                'township' => $township['name'],
                'latitude' => $township['lat'] + (rand(-100, 100) / 10000),
                'longitude' => $township['lng'] + (rand(-100, 100) / 10000),
            ]);

            $clients[] = $user;
        }

        return $clients;
    }

    protected function seedFavorites(array $clients, array $workers): void
    {
        foreach (array_slice($clients, 0, 30) as $client) {
            $favoriteWorkers = collect($workers)->random(rand(1, 5));
            foreach ($favoriteWorkers as $worker) {
                FavoriteWorker::firstOrCreate([
                    'client_id' => $client->id,
                    'worker_id' => $worker->id,
                ]);
            }
        }
    }

    protected function seedJobRequests(int $count, array $workers, array $clients, array $categories): array
    {
        $jobs = [];

        for ($i = 1; $i <= $count; $i++) {
            $worker = $workers[array_rand($workers)];
            $client = $clients[array_rand($clients)];
            $township = $this->townships[array_rand($this->townships)];

            if ($i <= 500) {
                $status = JobRequest::STATUS_COMPLETED;
            } else {
                $statuses = [
                    JobRequest::STATUS_PENDING,
                    JobRequest::STATUS_ACCEPTED,
                    JobRequest::STATUS_REJECTED,
                    JobRequest::STATUS_IN_PROGRESS,
                    JobRequest::STATUS_CANCELLED,
                ];
                $status = $statuses[array_rand($statuses)];
            }

            $job = JobRequest::create([
                'worker_id' => $worker->id,
                'client_id' => $client->id,
                'category_id' => $categories[array_rand($categories)]->id,
                'title' => 'Job Request #' . $i,
                'description' => 'Need professional help for job request number ' . $i . '.',
                'budget' => rand(10000, 200000),
                'requested_date' => now()->addDays(rand(1, 30))->toDateString(),
                'address' => 'No.' . rand(1, 200) . ', ' . $township['name'],
                'latitude' => $township['lat'],
                'longitude' => $township['lng'],
                'status' => $status,
                'created_at' => now()->subDays(rand(0, 180)),
            ]);

            JobRequestHistory::create([
                'job_request_id' => $job->id,
                'changed_by_user_id' => $client->id,
                'from_status' => null,
                'to_status' => JobRequest::STATUS_PENDING,
                'note' => 'Job request created.',
                'created_at' => $job->created_at,
            ]);

            if ($status !== JobRequest::STATUS_PENDING) {
                JobRequestHistory::create([
                    'job_request_id' => $job->id,
                    'changed_by_user_id' => $worker->id,
                    'from_status' => JobRequest::STATUS_PENDING,
                    'to_status' => $status,
                    'note' => 'Status updated to ' . $status,
                    'created_at' => $job->created_at->copy()->addHours(rand(1, 48)),
                ]);
            }

            if ($status === JobRequest::STATUS_COMPLETED) {
                $worker->workerProfile->increment('completed_jobs_count');
            }

            $jobs[] = $job;
        }

        return $jobs;
    }

    protected function seedReviews(array $jobs, int $target = 500): void
    {
        $completedJobs = collect($jobs)->where('status', JobRequest::STATUS_COMPLETED);
        $reviewCount = 0;

        foreach ($completedJobs->shuffle()->take($target) as $job) {
            Review::create([
                'job_request_id' => $job->id,
                'worker_id' => $job->worker_id,
                'client_id' => $job->client_id,
                'stars' => rand(3, 5),
                'comment' => 'Great service for ' . $job->title . '. Highly recommended!',
                'created_at' => $job->created_at->copy()->addDays(rand(1, 7)),
            ]);
            $reviewCount++;
        }

        foreach (User::workers()->with('workerProfile')->get() as $worker) {
            if ($worker->workerProfile) {
                $avg = Review::where('worker_id', $worker->id)->avg('stars') ?? 0;
                $count = Review::where('worker_id', $worker->id)->count();
                $worker->workerProfile->update([
                    'average_rating' => round($avg, 2),
                    'total_reviews' => $count,
                ]);
            }
        }

        $this->command->info("Created {$reviewCount} reviews.");
    }
}
