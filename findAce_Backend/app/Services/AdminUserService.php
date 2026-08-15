<?php

namespace App\Services;

use App\Interfaces\UserRepositoryInterface;
use App\Traits\FilterableTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminUserService
{
    use FilterableTrait;

    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function list(Request $request): LengthAwarePaginator
    {
        $query = $this->userRepository->query()->with(['workerProfile', 'clientProfile']);

        if ($request->filled('role')) {
            $query->role($request->get('role'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->get('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $this->applyDateRange($query, $request);
        $this->applySearch($query, $request, ['name', 'email', 'phone_number']);
        $this->applySorting($query, $request, ['name', 'created_at', 'role'], 'created_at');

        return $this->applyPagination($query, $request);
    }

    public function suspend(int $userId)
    {
        $user = $this->userRepository->findById($userId);

        if (! $user) {
            throw ValidationException::withMessages(['user' => ['User not found.']]);
        }

        return $this->userRepository->update($user, ['is_active' => false]);
    }

    public function activate(int $userId)
    {
        $user = $this->userRepository->findById($userId);

        if (! $user) {
            throw ValidationException::withMessages(['user' => ['User not found.']]);
        }

        return $this->userRepository->update($user, ['is_active' => true]);
    }

    public function delete(int $userId): bool
    {
        $user = $this->userRepository->findById($userId);

        if (! $user) {
            throw ValidationException::withMessages(['user' => ['User not found.']]);
        }
        $user->tokens()->delete();

        return $this->userRepository->delete($user);
    }
}
