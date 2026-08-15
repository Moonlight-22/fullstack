<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Interfaces\UserRepositoryInterface;
use App\Services\AdminUserService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    use ApiResponseTrait;

    protected AdminUserService $adminUserService;
    protected UserRepositoryInterface $userRepository;

    public function __construct(AdminUserService $adminUserService, UserRepositoryInterface $userRepository)
    {
        $this->adminUserService = $adminUserService;
        $this->userRepository = $userRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $users = $this->adminUserService->list($request);

        return $this->successResponse('Users fetched successfully.', [
            'items' => UserResource::collection($users),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);

        if (! $user) {
            return $this->errorResponse('User not found.', (object) [], 404);
        }

        $user->load(['workerProfile.categories', 'clientProfile']);

        return $this->successResponse('User fetched successfully.', new UserResource($user));
    }

    public function suspend(int $id): JsonResponse
    {
        $user = $this->adminUserService->suspend($id);

        return $this->successResponse('User suspended successfully.', new UserResource($user));
    }

    public function activate(int $id): JsonResponse
    {
        $user = $this->adminUserService->activate($id);

        return $this->successResponse('User activated successfully.', new UserResource($user));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->adminUserService->delete($id);

        return $this->successResponse('User deleted successfully.');
    }
}
