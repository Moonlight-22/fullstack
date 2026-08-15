<?php

namespace App\Repositories;

use App\Interfaces\WorkerProfileRepositoryInterface;
use App\Models\WorkerProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class WorkerProfileRepository implements WorkerProfileRepositoryInterface
{
    public function query(): Builder
    {
        return WorkerProfile::query()->with(['user', 'categories', 'portfolioImages']);
    }

    public function findByUserId(int $userId): ?WorkerProfile
    {
        return WorkerProfile::with(['user', 'categories', 'portfolioImages'])
            ->where('user_id', $userId)
            ->first();
    }

    public function update(WorkerProfile $profile, array $data): WorkerProfile
    {
        $profile->update($data);

        return $profile->fresh(['user', 'categories', 'portfolioImages']);
    }

    public function paginate(Builder $query, int $perPage = 15): LengthAwarePaginator
    {
        return $query->paginate($perPage);
    }

    public function syncCategories(WorkerProfile $profile, array $categoryIds): void
    {
        $profile->categories()->sync($categoryIds);
    }
}
