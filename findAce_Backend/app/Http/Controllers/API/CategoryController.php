<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Interfaces\CategoryRepositoryInterface;
use App\Services\CategoryService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class CategoryController extends Controller
{
    use ApiResponseTrait;

    protected CategoryService $categoryService;
    protected CategoryRepositoryInterface $categoryRepository;

    public function __construct(CategoryService $categoryService, CategoryRepositoryInterface $categoryRepository)
    {
        $this->categoryService = $categoryService;
        $this->categoryRepository = $categoryRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $categories = $this->categoryService->list($request);

        return $this->successResponse('Categories fetched successfully.', [
            'items' => CategoryResource::collection($categories),
            'pagination' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $category = $this->categoryRepository->findById($id);

        if (! $category) {
            return $this->errorResponse('Category not found.', (object) [], 404);
        }

        return $this->successResponse('Category fetched successfully.', new CategoryResource($category));
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        try {
            $category = $this->categoryService->create($request->validated());

            return $this->successResponse('Category created successfully.', new CategoryResource($category), 201);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to create category.', (object) [], 500);
        }
    }

    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = $this->categoryRepository->findById($id);

        if (! $category) {
            return $this->errorResponse('Category not found.', (object) [], 404);
        }

        $this->authorize('update', $category);

        try {
            $updated = $this->categoryService->update($category, $request->validated());

            return $this->successResponse('Category updated successfully.', new CategoryResource($updated));
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to update category.', (object) [], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $category = $this->categoryRepository->findById($id);

        if (! $category) {
            return $this->errorResponse('Category not found.', (object) [], 404);
        }

        $this->authorize('delete', $category);

        try {
            $this->categoryService->delete($category);

            return $this->successResponse('Category deleted successfully.');
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to delete category.', (object) [], 500);
        }
    }
}
