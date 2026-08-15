<?php

namespace App\Repositories;

use App\Interfaces\ClientProfileRepositoryInterface;
use App\Models\ClientProfile;
use Illuminate\Database\Eloquent\Builder;

class ClientProfileRepository implements ClientProfileRepositoryInterface
{
    public function query(): Builder
    {
        return ClientProfile::query()->with('user');
    }

    public function findByUserId(int $userId): ?ClientProfile
    {
        return ClientProfile::with('user')->where('user_id', $userId)->first();
    }

    public function update(ClientProfile $profile, array $data): ClientProfile
    {
        $profile->update($data);

        return $profile->fresh(['user']);
    }
}
