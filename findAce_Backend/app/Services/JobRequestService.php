<?php

namespace App\Services;

use App\Interfaces\JobRequestRepositoryInterface;
use App\Models\JobRequest;
use App\Models\User;
use App\Notifications\JobStatusNotification;
use App\Notifications\NewJobRequestNotification;
use App\Traits\FilterableTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JobRequestService
{
    use FilterableTrait;

    protected JobRequestRepositoryInterface $jobRequestRepository;

    public function __construct(JobRequestRepositoryInterface $jobRequestRepository)
    {
        $this->jobRequestRepository = $jobRequestRepository;
    }

    public function list(Request $request, User $user): LengthAwarePaginator
    {
        $query = $this->jobRequestRepository->query();

        if ($user->isWorker()) {
            $query->forWorker($user->id);
        } elseif ($user->isClient()) {
            $query->forClient($user->id);
        }

        if ($request->filled('status')) {
            $query->status($request->get('status'));
        }

        if ($request->filled('search')) {
            $keyword = $request->get('search');
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere('description', 'like', '%' . $keyword . '%');
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        $this->applySorting($query, $request, ['created_at', 'requested_date', 'budget', 'status'], 'created_at');

        return $this->applyPagination($query, $request);
    }

    public function create(User $client, array $data): JobRequest
    {
        $worker = User::workers()->with('workerProfile')->find($data['worker_id']);

        if (! $worker) {
            throw ValidationException::withMessages([
                'worker_id' => ['Selected user is not a valid worker.'],
            ]);
        }

        $availability = $worker->workerProfile->availability_status ?? 'available';

        if ($availability === 'offline') {
            throw ValidationException::withMessages([
                'worker_id' => ['This worker is offline and cannot receive job requests right now.'],
            ]);
        }

        return DB::transaction(function () use ($client, $data, $availability) {
            $note = $availability === 'busy'
                ? 'Job request created. Worker is currently busy — acceptance may take a little longer.'
                : 'Job request created.';

            $jobRequest = $this->jobRequestRepository->create(array_merge($data, [
                'client_id' => $client->id,
                'status' => JobRequest::STATUS_PENDING,
            ]));

            $this->jobRequestRepository->addHistory(
                $jobRequest,
                $client->id,
                null,
                JobRequest::STATUS_PENDING,
                $note
            );

            $worker = User::find($data['worker_id']);
            if ($worker) {
                try {
                    $worker->notify(new NewJobRequestNotification($jobRequest->load(['client', 'category'])));
                } catch (\Throwable $exception) {
                    // Never block job creation if notification fails.
                }
            }

            return $jobRequest->load(['worker.workerProfile', 'client.clientProfile', 'category']);
        });
    }

    public function updateStatus(JobRequest $jobRequest, User $user, string $newStatus, ?string $note = null): JobRequest
    {
        $allowed = $this->allowedTransitions($jobRequest, $user);

        if (! in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => ['Invalid status transition.'],
            ]);
        }

        return DB::transaction(function () use ($jobRequest, $user, $newStatus, $note) {
            $oldStatus = $jobRequest->status;

            $jobRequest = $this->jobRequestRepository->update($jobRequest, ['status' => $newStatus]);

            $this->jobRequestRepository->addHistory(
                $jobRequest,
                $user->id,
                $oldStatus,
                $newStatus,
                $note
            );

            $this->notifyStatusChange($jobRequest, $newStatus);

            if ($newStatus === JobRequest::STATUS_COMPLETED) {
                $workerProfile = $jobRequest->worker->workerProfile;
                if ($workerProfile) {
                    $workerProfile->increment('completed_jobs_count');
                }
            }

            return $jobRequest->load(['worker.workerProfile', 'client.clientProfile', 'category', 'histories.changedBy']);
        });
    }

    protected function allowedTransitions(JobRequest $jobRequest, User $user): array
    {
        if ($user->isWorker() && $jobRequest->worker_id === $user->id) {
            return match ($jobRequest->status) {
                JobRequest::STATUS_PENDING => [JobRequest::STATUS_ACCEPTED, JobRequest::STATUS_REJECTED],
                JobRequest::STATUS_ACCEPTED => [JobRequest::STATUS_IN_PROGRESS],
                JobRequest::STATUS_IN_PROGRESS => [JobRequest::STATUS_COMPLETED],
                default => [],
            };
        }

        if ($user->isClient() && $jobRequest->client_id === $user->id) {
            return match ($jobRequest->status) {
                JobRequest::STATUS_PENDING, JobRequest::STATUS_ACCEPTED => [JobRequest::STATUS_CANCELLED],
                default => [],
            };
        }

        if ($user->isAdmin()) {
            return JobRequest::STATUSES;
        }

        return [];
    }

    protected function notifyStatusChange(JobRequest $jobRequest, string $status): void
    {
        $jobRequest->load(['worker', 'client']);
        $messages = [
            JobRequest::STATUS_ACCEPTED => 'Your job request has been accepted.',
            JobRequest::STATUS_REJECTED => 'Your job request has been rejected.',
            JobRequest::STATUS_IN_PROGRESS => 'Your job is now in progress.',
            JobRequest::STATUS_COMPLETED => 'Your job has been completed.',
            JobRequest::STATUS_CANCELLED => 'Your job request has been cancelled.',
        ];

        if (! isset($messages[$status])) {
            return;
        }

        $recipient = in_array($status, [JobRequest::STATUS_ACCEPTED, JobRequest::STATUS_REJECTED, JobRequest::STATUS_COMPLETED, JobRequest::STATUS_IN_PROGRESS])
            ? $jobRequest->client
            : $jobRequest->worker;

        if ($recipient) {
            try {
                $recipient->notify(new JobStatusNotification($jobRequest, $status, $messages[$status]));
            } catch (\Throwable $exception) {
                // Ignore notification failures.
            }
        }
    }
}
