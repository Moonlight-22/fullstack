<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkerProfile;

class WorkerProfilePolicy
{
    public function view(?User $user, WorkerProfile $profile): bool
    {
        return true;
    }

    public function update(User $user, WorkerProfile $profile): bool
    {
        return $user->isAdmin() || $profile->user_id === $user->id;
    }
}
