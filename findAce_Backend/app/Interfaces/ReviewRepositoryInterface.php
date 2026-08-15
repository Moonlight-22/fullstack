<?php

namespace App\Interfaces;

use App\Models\Review;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

interface ReviewRepositoryInterface
{
    public function query(): Builder;

    public function findById(int $id): ?Review;

    public function create(array $data): Review;

    public function paginate(Builder $query, int $perPage = 15): LengthAwarePaginator;

    public function getWorkerAverageRating(int $workerId): float;

    public function getWorkerReviewCount(int $workerId): int;
}
