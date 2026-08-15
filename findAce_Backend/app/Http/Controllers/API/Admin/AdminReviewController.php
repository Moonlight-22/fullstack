<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Interfaces\ReviewRepositoryInterface;
use App\Traits\ApiResponseTrait;
use App\Traits\FilterableTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    use ApiResponseTrait, FilterableTrait;

    protected ReviewRepositoryInterface $reviewRepository;

    public function __construct(ReviewRepositoryInterface $reviewRepository)
    {
        $this->reviewRepository = $reviewRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->reviewRepository->query();
        $this->applyDateRange($query, $request);
        $this->applySorting($query, $request, ['created_at', 'stars'], 'created_at');
        $reviews = $this->applyPagination($query, $request);

        return $this->successResponse('Reviews fetched successfully.', [
            'items' => ReviewResource::collection($reviews),
            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $review = $this->reviewRepository->findById($id);

        if (! $review) {
            return $this->errorResponse('Review not found.', (object) [], 404);
        }

        $review->delete();

        return $this->successResponse('Review deleted successfully.');
    }
}
