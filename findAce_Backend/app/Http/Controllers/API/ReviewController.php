<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Interfaces\ReviewRepositoryInterface;
use App\Services\ReviewService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ReviewController extends Controller
{
    use ApiResponseTrait;

    protected ReviewService $reviewService;
    protected ReviewRepositoryInterface $reviewRepository;

    public function __construct(ReviewService $reviewService, ReviewRepositoryInterface $reviewRepository)
    {
        $this->reviewService = $reviewService;
        $this->reviewRepository = $reviewRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $reviews = $this->reviewService->list($request);

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

    public function store(StoreReviewRequest $request): JsonResponse
    {
        try {
            $review = $this->reviewService->create($request->user(), $request->validated());

            return $this->successResponse('Review submitted successfully.', new ReviewResource($review), 201);
        } catch (ValidationException $e) {
            return $this->errorResponse('Review validation failed.', $e->errors(), 422);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to submit review.', (object) [], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $review = $this->reviewRepository->findById($id);

        if (! $review) {
            return $this->errorResponse('Review not found.', (object) [], 404);
        }

        $this->authorize('delete', $review);

        $review->delete();

        return $this->successResponse('Review deleted successfully.');
    }
}
