<?php

namespace App\Policies;

use App\Models\JobRequest;
use App\Models\User;

class JobRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isWorker() || $user->isClient();
    }

    public function view(User $user, JobRequest $jobRequest): bool
    {
        return $user->isAdmin()
            || $jobRequest->worker_id === $user->id
            || $jobRequest->client_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isClient();
    }

    public function updateStatus(User $user, JobRequest $jobRequest): bool
    {
        return $user->isAdmin()
            || ($user->isWorker() && $jobRequest->worker_id === $user->id)
            || ($user->isClient() && $jobRequest->client_id === $user->id);
    }
}
