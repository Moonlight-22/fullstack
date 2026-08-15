<?php

namespace App\Repositories;

use App\Interfaces\JobRequestRepositoryInterface;
use App\Models\JobRequest;
use App\Models\JobRequestHistory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class JobRequestRepository implements JobRequestRepositoryInterface
{
    public function query(): Builder
    {
        return JobRequest::query()->with([
            'worker.workerProfile',
            'client.clientProfile',
            'category',
            'review',
            'reports',
        ]);
    }

    public function findById(int $id): ?JobRequest
    {
        return JobRequest::with([
            'worker.workerProfile',
            'client.clientProfile',
            'category',
            'review',
            'reports',
            'histories.changedBy',
        ])->find($id);
    }

    public function create(array $data): JobRequest
    {
        return JobRequest::create($data);
    }

    public function update(JobRequest $jobRequest, array $data): JobRequest
    {
        $jobRequest->update($data);

        return $jobRequest->fresh(['worker', 'client', 'category', 'review', 'histories.changedBy']);
    }

    public function paginate(Builder $query, int $perPage = 15): LengthAwarePaginator
    {
        return $query->paginate($perPage);
    }

    public function addHistory(JobRequest $jobRequest, ?int $userId, ?string $fromStatus, string $toStatus, ?string $note = null): void
    {
        JobRequestHistory::create([
            'job_request_id' => $jobRequest->id,
            'changed_by_user_id' => $userId,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'note' => $note,
        ]);
    }
}
