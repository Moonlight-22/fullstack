<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ClientProfile;
use App\Models\JobRequest;
use App\Models\JobRequestHistory;
use App\Models\Review;
use App\Models\User;
use App\Models\WorkerProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoAccountsSeeder extends Seeder
{
    protected array $yangon = [
        ['name' => 'Kamayut', 'lat' => 16.8260, 'lng' => 96.1340],
        ['name' => 'Bahan', 'lat' => 16.8140, 'lng' => 96.1560],
        ['name' => 'Sanchaung', 'lat' => 16.8050, 'lng' => 96.1320],
        ['name' => 'Hlaing', 'lat' => 16.8510, 'lng' => 96.1260],
        ['name' => 'Mayangone', 'lat' => 16.8680, 'lng' => 96.1180],
        ['name' => 'Tamwe', 'lat' => 16.7820, 'lng' => 96.1720],
        ['name' => 'Dagon', 'lat' => 16.7960, 'lng' => 96.1480],
        ['name' => 'Thingangyun', 'lat' => 16.7760, 'lng' => 96.1860],
    ];

    protected array $mandalay = [
        ['name' => 'Chanayethazan', 'lat' => 21.9750, 'lng' => 96.0830],
        ['name' => 'Maha Aungmye', 'lat' => 21.9580, 'lng' => 96.0890],
        ['name' => 'Aungmyaythazan', 'lat' => 21.9920, 'lng' => 96.1060],
        ['name' => 'Chanmyathazi', 'lat' => 21.9350, 'lng' => 96.0900],
        ['name' => 'Pyigyidagun', 'lat' => 21.9100, 'lng' => 96.1000],
        ['name' => 'Amarapura', 'lat' => 21.9030, 'lng' => 96.0470],
    ];

    protected array $clientNames = [
        'Aye Chan', 'Su Su Hlaing', 'Ko Ko Win', 'May Thu', 'Zin Min Oo',
    ];

    protected array $workerNames = [
        'Kyaw Zin', 'Htet Aung', 'Nay Lin', 'Phyo Min', 'Thura Soe',
        'Aung Kyaw', 'Myo Win', 'Sai Sai', 'Ye Yint', 'Hnin Wai',
        'Moe Moe', 'Tun Tun',
    ];

    protected array $jobTitles = [
        'Fix electrical outlet',
        'Install ceiling fan',
        'Repair leaking pipe',
        'Paint living room',
        'Home tutoring session',
        'Laptop troubleshooting',
        'Car engine checkup',
        'Deep house cleaning',
        'Event photography',
        'Build wooden shelf',
        'AC service and cleaning',
        'Garden maintenance',
        'Furniture moving help',
        'Kitchen plumbing repair',
        'Network setup at home',
        'Wall painting touch-up',
    ];

    public function run()
    {
        $categories = Category::query()->where('is_active', true)->get();

        if ($categories->isEmpty()) {
            $this->command?->error('No categories found. Seed categories first.');
            return;
        }

        $clients = $this->seedClients();
        $workers = $this->seedWorkers($categories);
        $jobs = $this->seedJobs($clients, $workers, $categories);

        $this->command?->info('Demo accounts seeded:');
        $this->command?->info('  5 clients (client1@findace.com ... client5@findace.com)');
        $this->command?->info('  12 workers (worker1@findace.com ... worker12@findace.com)');
        $this->command?->info('  ' . count($jobs) . ' random jobs');
        $this->command?->info('Each account has a unique password (Client1#Ace, Worker1#Ace, ...).');
    }

    protected function places(): array
    {
        return array_merge(
            array_map(fn ($p) => $p + ['city' => 'Yangon'], $this->yangon),
            array_map(fn ($p) => $p + ['city' => 'Mandalay'], $this->mandalay)
        );
    }

    protected function randomPlace(): array
    {
        $place = $this->places()[array_rand($this->places())];
        $place['lat'] += (rand(-120, 120) / 10000);
        $place['lng'] += (rand(-120, 120) / 10000);

        return $place;
    }

    protected function seedClients(): array
    {
        $clients = [];

        foreach ($this->clientNames as $i => $name) {
            $n = $i + 1;
            $email = "client{$n}@findace.com";
            $place = $this->randomPlace();

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make("Client{$n}#Ace"),
                    'role' => User::ROLE_CLIENT,
                    'phone_number' => '093' . str_pad((string) $n, 8, '0', STR_PAD_LEFT),
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'banned_until' => null,
                ]
            );

            ClientProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'address' => 'No.' . rand(1, 250) . ', ' . $place['name'] . ', ' . $place['city'],
                    'township' => $place['name'] . ' (' . $place['city'] . ')',
                    'latitude' => $place['lat'],
                    'longitude' => $place['lng'],
                ]
            );

            $clients[] = $user->fresh('clientProfile');
        }

        return $clients;
    }

    protected function seedWorkers($categories): array
    {
        $workers = [];
        $availability = ['available', 'available', 'available', 'busy', 'offline'];

        foreach ($this->workerNames as $i => $name) {
            $n = $i + 1;
            $email = "worker{$n}@findace.com";
            $place = $this->randomPlace();
            $pickedCategories = $categories->random(min(2, $categories->count()));
            $skills = $pickedCategories->pluck('name')->values()->all();

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make("Worker{$n}#Ace"),
                    'role' => User::ROLE_WORKER,
                    'phone_number' => '092' . str_pad((string) $n, 8, '0', STR_PAD_LEFT),
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'banned_until' => null,
                ]
            );

            $profile = WorkerProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'bio' => $name . ' provides professional services around ' . $place['city'] . '.',
                    'experience_years' => rand(1, 12),
                    'skills' => $skills,
                    'hourly_rate' => rand(8000, 45000),
                    'address' => 'No.' . rand(1, 250) . ', ' . $place['name'] . ', ' . $place['city'],
                    'township' => $place['name'] . ' (' . $place['city'] . ')',
                    'latitude' => $place['lat'],
                    'longitude' => $place['lng'],
                    'availability_status' => $availability[array_rand($availability)],
                    'average_rating' => 0,
                    'completed_jobs_count' => 0,
                    'total_reviews' => 0,
                ]
            );

            $profile->categories()->sync($pickedCategories->pluck('id')->all());
            $workers[] = $user->fresh('workerProfile');
        }

        return $workers;
    }

    protected function seedJobs(array $clients, array $workers, $categories): array
    {
        $jobs = [];
        $statuses = [
            JobRequest::STATUS_PENDING,
            JobRequest::STATUS_ACCEPTED,
            JobRequest::STATUS_IN_PROGRESS,
            JobRequest::STATUS_COMPLETED,
            JobRequest::STATUS_COMPLETED,
            JobRequest::STATUS_REJECTED,
            JobRequest::STATUS_CANCELLED,
        ];

        // About 24 random jobs across demo clients/workers
        for ($i = 1; $i <= 24; $i++) {
            $client = $clients[array_rand($clients)];
            $worker = $workers[array_rand($workers)];
            $category = $categories->random();
            $place = $this->randomPlace();
            $status = $statuses[array_rand($statuses)];
            $title = $this->jobTitles[array_rand($this->jobTitles)];

            $job = JobRequest::create([
                'worker_id' => $worker->id,
                'client_id' => $client->id,
                'category_id' => $category->id,
                'title' => $title,
                'description' => $title . ' needed in ' . $place['name'] . ', ' . $place['city'] . '.',
                'budget' => rand(15000, 180000),
                'requested_date' => now()->addDays(rand(-10, 20))->toDateString(),
                'address' => 'No.' . rand(1, 250) . ', ' . $place['name'] . ', ' . $place['city'],
                'latitude' => $place['lat'],
                'longitude' => $place['lng'],
                'status' => $status,
                'created_at' => now()->subDays(rand(0, 45)),
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
                    'created_at' => $job->created_at->copy()->addHours(rand(2, 36)),
                ]);
            }

            if ($status === JobRequest::STATUS_COMPLETED) {
                $worker->workerProfile?->increment('completed_jobs_count');

                if (rand(0, 1) === 1) {
                    Review::create([
                        'job_request_id' => $job->id,
                        'worker_id' => $worker->id,
                        'client_id' => $client->id,
                        'stars' => rand(3, 5),
                        'comment' => 'Good work on ' . $title . '.',
                        'created_at' => $job->created_at->copy()->addDays(rand(1, 5)),
                    ]);
                }
            }

            $jobs[] = $job;
        }

        foreach (User::workers()->with('workerProfile')->whereIn('id', collect($workers)->pluck('id'))->get() as $worker) {
            if (! $worker->workerProfile) {
                continue;
            }

            $avg = Review::where('worker_id', $worker->id)->avg('stars') ?? 0;
            $count = Review::where('worker_id', $worker->id)->count();
            $worker->workerProfile->update([
                'average_rating' => round((float) $avg, 2),
                'total_reviews' => $count,
            ]);
        }

        return $jobs;
    }
}
