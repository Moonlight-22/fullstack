<?php

namespace App\Services;

use App\Interfaces\JobRequestRepositoryInterface;
use App\Interfaces\ReviewRepositoryInterface;
use App\Models\JobRequest;
use App\Models\Review;
use App\Models\User;
use App\Notifications\ReviewAddedNotification;
use App\Traits\FilterableTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    use FilterableTrait;

    protected ReviewRepositoryInterface $reviewRepository;
    protected JobRequestRepositoryInterface $jobRequestRepository;

    public function __construct(
        ReviewRepositoryInterface $reviewRepository,
        JobRequestRepositoryInterface $jobRequestRepository
    ) {
        $this->reviewRepository = $reviewRepository;
        $this->jobRequestRepository = $jobRequestRepository;
    }

    public function list(Request $request): LengthAwarePaginator
    {
        $query = $this->reviewRepository->query();

        if ($request->filled('worker_id')) {
            $query->forWorker((int) $request->get('worker_id'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        if ($request->filled('min_stars')) {
            $query->minStars((int) $request->get('min_stars'));
        }

        if ($request->filled('search')) {
            $keyword = $request->get('search');
            $query->where('comment', 'like', '%' . $keyword . '%');
        }

        $this->applySorting($query, $request, ['created_at', 'stars'], 'created_at');

        return $this->applyPagination($query, $request);
    }

    public function create(User $client, array $data): Review
    {
        $jobRequest = $this->jobRequestRepository->findById($data['job_request_id']);

        if (! $jobRequest || $jobRequest->client_id !== $client->id) {
            throw ValidationException::withMessages([
                'job_request_id' => ['Job request not found.'],
            ]);
        }

        if (! $jobRequest->isCompleted()) {
            throw ValidationException::withMessages([
                'job_request_id' => ['Reviews are only allowed for completed jobs.'],
            ]);
        }

        if ($jobRequest->review) {
            throw ValidationException::withMessages([
                'job_request_id' => ['This job has already been reviewed.'],
            ]);
        }

        return DB::transaction(function () use ($client, $data, $jobRequest) {
            $review = $this->reviewRepository->create([
                'job_request_id' => $jobRequest->id,
                'worker_id' => $jobRequest->worker_id,
                'client_id' => $client->id,
                'stars' => $data['stars'],
                'comment' => $data['comment'] ?? null,
            ]);

            $this->updateWorkerRating($jobRequest->worker_id);

            $worker = User::find($jobRequest->worker_id);
            if ($worker) {
                try {
                    $worker->notify(new ReviewAddedNotification($review->load(['client', 'jobRequest'])));
                } catch (\Throwable $exception) {
                    // Ignore notification failures.
                }
            }

            return $review->load(['worker', 'client', 'jobRequest']);
        });
    }

    protected function updateWorkerRating(int $workerId): void
    {
        $worker = User::with('workerProfile')->find($workerId);

        if ($worker && $worker->workerProfile) {
            $avg = $this->reviewRepository->getWorkerAverageRating($workerId);
            $count = $this->reviewRepository->getWorkerReviewCount($workerId);

            $worker->workerProfile->update([
                'average_rating' => round($avg, 2),
                'total_reviews' => $count,
            ]);
        }
    }
}
