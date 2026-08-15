<?php

namespace App\Interfaces;

use App\Models\JobRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

interface JobRequestRepositoryInterface
{
    public function query(): Builder;

    public function findById(int $id): ?JobRequest;

    public function create(array $data): JobRequest;

    public function update(JobRequest $jobRequest, array $data): JobRequest;

    public function paginate(Builder $query, int $perPage = 15): LengthAwarePaginator;

    public function addHistory(JobRequest $jobRequest, ?int $userId, ?string $fromStatus, string $toStatus, ?string $note = null): void;
}
