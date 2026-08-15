<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkerProfileResource;
use App\Models\WorkerProfile;
use App\Traits\ApiResponseTrait;
use App\Traits\FilterableTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWorkerController extends Controller
{
    use ApiResponseTrait, FilterableTrait;

    public function index(Request $request): JsonResponse
    {
        $query = WorkerProfile::with(['user', 'categories']);

        if ($request->filled('township')) {
            $query->where('township', $request->get('township'));
        }

        $this->applyDateRange($query, $request);
        $this->applySorting($query, $request, ['average_rating', 'hourly_rate', 'created_at'], 'created_at');
        $workers = $this->applyPagination($query, $request);

        return $this->successResponse('Workers fetched successfully.', [
            'items' => WorkerProfileResource::collection($workers),
            'pagination' => [
                'current_page' => $workers->currentPage(),
                'last_page' => $workers->lastPage(),
                'per_page' => $workers->perPage(),
                'total' => $workers->total(),
            ],
        ]);
    }
}
