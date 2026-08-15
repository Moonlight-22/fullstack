<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\JobRequestResource;
use App\Interfaces\JobRequestRepositoryInterface;
use App\Traits\ApiResponseTrait;
use App\Traits\FilterableTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminJobController extends Controller
{
    use ApiResponseTrait, FilterableTrait;

    protected JobRequestRepositoryInterface $jobRequestRepository;

    public function __construct(JobRequestRepositoryInterface $jobRequestRepository)
    {
        $this->jobRequestRepository = $jobRequestRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->jobRequestRepository->query();

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $this->applyDateRange($query, $request);
        $this->applySearch($query, $request, ['title', 'description']);
        $this->applySorting($query, $request, ['created_at', 'budget', 'status'], 'created_at');

        $jobs = $this->applyPagination($query, $request);

        return $this->successResponse('Jobs fetched successfully.', [
            'items' => JobRequestResource::collection($jobs),
            'pagination' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $job = $this->jobRequestRepository->findById($id);

        if (! $job) {
            return $this->errorResponse('Job not found.', (object) [], 404);
        }

        return $this->successResponse('Job fetched successfully.', new JobRequestResource($job));
    }

    public function destroy(int $id): JsonResponse
    {
        $job = $this->jobRequestRepository->findById($id);

        if (! $job) {
            return $this->errorResponse('Job not found.', (object) [], 404);
        }

        $job->delete();

        return $this->successResponse('Job deleted successfully.');
    }
}
