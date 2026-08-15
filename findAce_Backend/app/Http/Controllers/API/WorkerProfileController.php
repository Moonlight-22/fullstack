<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Worker\UpdateWorkerProfileRequest;
use App\Http\Resources\WorkerProfileResource;
use App\Services\WorkerProfileService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class WorkerProfileController extends Controller
{
    use ApiResponseTrait;

    protected WorkerProfileService $workerProfileService;

    public function __construct(WorkerProfileService $workerProfileService)
    {
        $this->workerProfileService = $workerProfileService;
    }

    public function show(Request $request): JsonResponse
    {
        try {
            $profile = $this->workerProfileService->getProfile($request->user());

            return $this->successResponse('Worker profile fetched successfully.', new WorkerProfileResource($profile));
        } catch (ValidationException $e) {
            return $this->errorResponse('Worker profile not found.', $e->errors(), 404);
        }
    }

    public function update(UpdateWorkerProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $data = $request->validated();

            if ($request->hasFile('profile_image')) {
                $user = $this->workerProfileService->uploadProfileImage($user, $request->file('profile_image'));
            }

            if ($request->hasFile('portfolio_files')) {
                $this->workerProfileService->uploadPortfolioFiles($user, $request->file('portfolio_files'));
            }

            if ($request->hasFile('portfolio_images')) {
                $this->workerProfileService->uploadPortfolioFiles($user, $request->file('portfolio_images'));
            }

            unset($data['profile_image'], $data['portfolio_images'], $data['portfolio_files']);
            $profile = $this->workerProfileService->updateProfile($user, $data);

            return $this->successResponse('Worker profile updated successfully.', new WorkerProfileResource($profile));
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to update worker profile.', (object) [], 500);
        }
    }

    public function deletePortfolioImage(Request $request, int $imageId): JsonResponse
    {
        try {
            $profile = $this->workerProfileService->deletePortfolioImage($request->user(), $imageId);

            return $this->successResponse('Portfolio image deleted successfully.', new WorkerProfileResource($profile));
        } catch (ValidationException $e) {
            return $this->errorResponse('Portfolio image not found.', $e->errors(), 404);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to delete portfolio image.', (object) [], 500);
        }
    }
}
