<?php

namespace App\Providers;

use App\Interfaces\CategoryRepositoryInterface;
use App\Interfaces\ClientProfileRepositoryInterface;
use App\Interfaces\JobRequestRepositoryInterface;
use App\Interfaces\ReviewRepositoryInterface;
use App\Interfaces\UserRepositoryInterface;
use App\Interfaces\WorkerProfileRepositoryInterface;
use App\Repositories\CategoryRepository;
use App\Repositories\ClientProfileRepository;
use App\Repositories\JobRequestRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\UserRepository;
use App\Repositories\WorkerProfileRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(WorkerProfileRepositoryInterface::class, WorkerProfileRepository::class);
        $this->app->bind(ClientProfileRepositoryInterface::class, ClientProfileRepository::class);
        $this->app->bind(JobRequestRepositoryInterface::class, JobRequestRepository::class);
        $this->app->bind(ReviewRepositoryInterface::class, ReviewRepository::class);
    }

    public function boot()
    {
        //
    }
}
