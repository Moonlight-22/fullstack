<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkerProfileResource;
use App\Services\WorkerSearchService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerSearchController extends Controller
{
    use ApiResponseTrait;

    protected WorkerSearchService $workerSearchService;

    public function __construct(WorkerSearchService $workerSearchService)
    {
        $this->workerSearchService = $workerSearchService;
    }

    public function index(Request $request): JsonResponse
    {
        $workers = $this->workerSearchService->search($request);

        return $this->successResponse('Workers fetched successfully.', [
            'items' => WorkerProfileResource::collection($workers),
            'pagination' => [
                'current_page' => $workers->currentPage(),
                'last_page' => $workers->lastPage(),
                'per_page' => $workers->perPage(),
                'total' => $workers->total(),
            ],
            'filters' => [
                'keyword' => $request->get('keyword'),
                'name' => $request->get('name'),
                'skill' => $request->get('skill'),
                'category_id' => $request->get('category_id'),
                'township' => $request->get('township'),
                'radius' => $request->get('radius'),
                'min_rating' => $request->get('min_rating'),
                'availability' => $request->get('availability'),
                'min_price' => $request->get('min_price'),
                'max_price' => $request->get('max_price'),
                'sort_by' => $request->get('sort_by', 'newest'),
            ],
        ]);
    }

    public function show(int $workerId): JsonResponse
    {
        $profile = $this->workerSearchService->show($workerId);

        if (! $profile) {
            return $this->errorResponse('Worker not found.', (object) [], 404);
        }

        return $this->successResponse('Worker profile fetched successfully.', new WorkerProfileResource($profile));
    }
}
