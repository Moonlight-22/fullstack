<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\JobRequest;
use App\Models\Review;
use App\Models\User;
use App\Models\WorkerProfile;
use App\Policies\CategoryPolicy;
use App\Policies\JobRequestPolicy;
use App\Policies\ReviewPolicy;
use App\Policies\UserPolicy;
use App\Policies\WorkerProfilePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
        Category::class => CategoryPolicy::class,
        JobRequest::class => JobRequestPolicy::class,
        Review::class => ReviewPolicy::class,
        WorkerProfile::class => WorkerProfilePolicy::class,
    ];

    public function boot()
    {
        $this->registerPolicies();
    }
}
