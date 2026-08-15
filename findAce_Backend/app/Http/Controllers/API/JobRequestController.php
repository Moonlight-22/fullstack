<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\JobRequest\StoreJobRequestRequest;
use App\Http\Requests\JobRequest\UpdateJobStatusRequest;
use App\Http\Resources\JobRequestResource;
use App\Interfaces\JobRequestRepositoryInterface;
use App\Services\JobRequestService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class JobRequestController extends Controller
{
    use ApiResponseTrait;

    protected JobRequestService $jobRequestService;
    protected JobRequestRepositoryInterface $jobRequestRepository;

    public function __construct(
        JobRequestService $jobRequestService,
        JobRequestRepositoryInterface $jobRequestRepository
    ) {
        $this->jobRequestService = $jobRequestService;
        $this->jobRequestRepository = $jobRequestRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $jobs = $this->jobRequestService->list($request, $request->user());

        return $this->successResponse('Job requests fetched successfully.', [
            'items' => JobRequestResource::collection($jobs),
            'pagination' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $job = $this->jobRequestRepository->findById($id);

        if (! $job) {
            return $this->errorResponse('Job request not found.', (object) [], 404);
        }

        $this->authorize('view', $job);

        return $this->successResponse('Job request fetched successfully.', new JobRequestResource($job));
    }

    public function store(StoreJobRequestRequest $request): JsonResponse
    {
        try {
            $job = $this->jobRequestService->create($request->user(), $request->validated());

            return $this->successResponse('Job request created successfully.', new JobRequestResource($job), 201);
        } catch (ValidationException $e) {
            return $this->errorResponse('Job request validation failed.', $e->errors(), 422);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to create job request.', [
                'exception' => [config('app.debug') ? $e->getMessage() : 'Server error'],
            ], 500);
        }
    }

    public function updateStatus(UpdateJobStatusRequest $request, int $id): JsonResponse
    {
        $job = $this->jobRequestRepository->findById($id);

        if (! $job) {
            return $this->errorResponse('Job request not found.', (object) [], 404);
        }

        $this->authorize('updateStatus', $job);

        try {
            $updated = $this->jobRequestService->updateStatus(
                $job,
                $request->user(),
                $request->validated()['status'],
                $request->validated()['note'] ?? null
            );

            return $this->successResponse('Job status updated successfully.', new JobRequestResource($updated));
        } catch (ValidationException $e) {
            return $this->errorResponse('Invalid status transition.', $e->errors(), 422);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to update job status.', (object) [], 500);
        }
    }
}
