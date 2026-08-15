<?php

namespace App\Interfaces;

use App\Models\WorkerProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

interface WorkerProfileRepositoryInterface
{
    public function query(): Builder;

    public function findByUserId(int $userId): ?WorkerProfile;

    public function update(WorkerProfile $profile, array $data): WorkerProfile;

    public function paginate(Builder $query, int $perPage = 15): LengthAwarePaginator;

    public function syncCategories(WorkerProfile $profile, array $categoryIds): void;
}
