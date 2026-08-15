<?php

namespace App\Services;

use App\Interfaces\ClientProfileRepositoryInterface;
use App\Interfaces\JobRequestRepositoryInterface;
use App\Models\ClientProfile;
use App\Models\FavoriteWorker;
use App\Models\User;
use App\Traits\FilterableTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class ClientProfileService
{
    use FilterableTrait;

    protected ClientProfileRepositoryInterface $clientProfileRepository;
    protected JobRequestRepositoryInterface $jobRequestRepository;
    protected ImageUploadService $imageUploadService;

    public function __construct(
        ClientProfileRepositoryInterface $clientProfileRepository,
        JobRequestRepositoryInterface $jobRequestRepository,
        ImageUploadService $imageUploadService
    ) {
        $this->clientProfileRepository = $clientProfileRepository;
        $this->jobRequestRepository = $jobRequestRepository;
        $this->imageUploadService = $imageUploadService;
    }

    public function getProfile(User $user): ClientProfile
    {
        $profile = $this->clientProfileRepository->findByUserId($user->id);

        if (! $profile) {
            throw ValidationException::withMessages([
                'profile' => ['Client profile not found.'],
            ]);
        }

        return $profile;
    }

    public function updateProfile(User $user, array $data): ClientProfile
    {
        $profile = $this->getProfile($user);

        if (isset($data['name'])) {
            $user->update(['name' => $data['name']]);
            unset($data['name']);
        }

        return $this->clientProfileRepository->update($profile, $data);
    }

    public function uploadProfileImage(User $user, UploadedFile $file): User
    {
        $this->imageUploadService->delete($user->profile_image);
        $user->update([
            'profile_image' => $this->imageUploadService->upload($file, 'clients'),
        ]);

        return $user->fresh(['clientProfile']);
    }

    public function bookingHistory(User $user, Request $request): LengthAwarePaginator
    {
        $query = $this->jobRequestRepository->query()->forClient($user->id);

        if ($request->filled('status')) {
            $query->status($request->get('status'));
        }

        if ($request->filled('search')) {
            $keyword = $request->get('search');
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere('description', 'like', '%' . $keyword . '%');
            });
        }

        $this->applySorting($query, $request, ['created_at', 'requested_date', 'budget', 'status'], 'created_at');

        return $this->applyPagination($query, $request);
    }

    public function listFavorites(User $user, Request $request): LengthAwarePaginator
    {
        $query = $user->favoriteWorkers()->with(['workerProfile.categories']);

        if ($request->filled('search')) {
            $keyword = $request->get('search');
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', '%' . $keyword . '%')
                    ->orWhere('email', 'like', '%' . $keyword . '%');
            });
        }

        return $query->paginate(min((int) $request->get('per_page', 15), 100));
    }

    public function addFavorite(User $user, int $workerId): void
    {
        $worker = User::workers()->find($workerId);

        if (! $worker) {
            throw ValidationException::withMessages([
                'worker_id' => ['Worker not found.'],
            ]);
        }

        FavoriteWorker::firstOrCreate([
            'client_id' => $user->id,
            'worker_id' => $workerId,
        ]);
    }

    public function removeFavorite(User $user, int $workerId): void
    {
        FavoriteWorker::where('client_id', $user->id)
            ->where('worker_id', $workerId)
            ->delete();
    }

    public function isFavorited(User $user, int $workerId): bool
    {
        return FavoriteWorker::where('client_id', $user->id)
            ->where('worker_id', $workerId)
            ->exists();
    }

    public function favoriteWorkerIds(User $user): array
    {
        return FavoriteWorker::where('client_id', $user->id)
            ->pluck('worker_id')
            ->all();
    }
}
