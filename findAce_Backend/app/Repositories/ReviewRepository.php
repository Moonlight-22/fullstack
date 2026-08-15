<?php

namespace App\Repositories;

use App\Interfaces\ReviewRepositoryInterface;
use App\Models\Review;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ReviewRepository implements ReviewRepositoryInterface
{
    public function query(): Builder
    {
        return Review::query()->with(['worker', 'client', 'jobRequest.category']);
    }

    public function findById(int $id): ?Review
    {
        return Review::with(['worker', 'client', 'jobRequest'])->find($id);
    }

    public function create(array $data): Review
    {
        return Review::create($data);
    }

    public function paginate(Builder $query, int $perPage = 15): LengthAwarePaginator
    {
        return $query->paginate($perPage);
    }

    public function getWorkerAverageRating(int $workerId): float
    {
        return (float) Review::where('worker_id', $workerId)->avg('stars');
    }

    public function getWorkerReviewCount(int $workerId): int
    {
        return Review::where('worker_id', $workerId)->count();
    }
}
