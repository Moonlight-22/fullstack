<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\JobReportResource;
use App\Models\JobReport;
use App\Services\JobReportService;
use App\Traits\ApiResponseTrait;
use App\Traits\FilterableTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class JobReportController extends Controller
{
    use ApiResponseTrait, FilterableTrait;

    protected JobReportService $jobReportService;

    public function __construct(JobReportService $jobReportService)
    {
        $this->jobReportService = $jobReportService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = JobReport::query()->with(['reporter', 'reportedUser', 'jobRequest']);

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $this->applyDateRange($query, $request);
        $this->applySorting($query, $request, ['created_at', 'status'], 'created_at');
        $reports = $this->applyPagination($query, $request);

        return $this->successResponse('Reports fetched successfully.', [
            'items' => JobReportResource::collection($reports),
            'pagination' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_request_id' => ['required', 'integer', 'exists:job_requests,id'],
            'reason' => ['required', 'string', Rule::in(JobReport::REASONS)],
            'custom_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $report = $this->jobReportService->create($request->user(), $data);

            return $this->successResponse('Report submitted successfully.', new JobReportResource($report), 201);
        } catch (ValidationException $e) {
            return $this->errorResponse('Report validation failed.', $e->errors(), 422);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to submit report.', [
                'exception' => [config('app.debug') ? $e->getMessage() : 'Server error'],
            ], 500);
        }
    }
}
