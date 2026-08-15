<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function update(User $authUser, User $targetUser): bool
    {
        return $authUser->id === $targetUser->id || $authUser->role === 'admin';
    }

    public function delete(User $authUser, User $targetUser): bool
    {
        return $authUser->id === $targetUser->id || $authUser->role === 'admin';
    }
}
