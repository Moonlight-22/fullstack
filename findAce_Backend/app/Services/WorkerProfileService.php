<?php

namespace App\Services;

use App\Interfaces\WorkerProfileRepositoryInterface;
use App\Models\User;
use App\Models\WorkerPortfolioImage;
use App\Models\WorkerProfile;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class WorkerProfileService
{
    protected WorkerProfileRepositoryInterface $workerProfileRepository;
    protected ImageUploadService $imageUploadService;

    public function __construct(
        WorkerProfileRepositoryInterface $workerProfileRepository,
        ImageUploadService $imageUploadService
    ) {
        $this->workerProfileRepository = $workerProfileRepository;
        $this->imageUploadService = $imageUploadService;
    }

    public function getProfile(User $user): WorkerProfile
    {
        $profile = $this->workerProfileRepository->findByUserId($user->id);

        if (! $profile) {
            throw ValidationException::withMessages([
                'profile' => ['Worker profile not found.'],
            ]);
        }

        return $profile;
    }

    public function updateProfile(User $user, array $data): WorkerProfile
    {
        $profile = $this->getProfile($user);

        if (isset($data['name'])) {
            $user->update(['name' => $data['name']]);
            unset($data['name']);
        }

        $hasExplicitCategories = array_key_exists('category_ids', $data);
        $categoryIds = [];

        if ($hasExplicitCategories) {
            $categoryIds = collect($data['category_ids'] ?? [])
                ->filter(fn ($id) => is_numeric($id))
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            $data['skills'] = \App\Models\Category::query()
                ->whereIn('id', $categoryIds)
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all();

            $this->workerProfileRepository->syncCategories($profile, $categoryIds);
            unset($data['category_ids']);
        }

        $shouldSyncFromSkills = array_key_exists('skills', $data);
        $skillsForSync = $data['skills'] ?? null;

        $profile = $this->workerProfileRepository->update($profile, $data);

        if ($shouldSyncFromSkills && ! $hasExplicitCategories) {
            $profile->syncCategoriesFromSkills(is_array($skillsForSync) ? $skillsForSync : []);
            $profile = $profile->fresh(['user', 'categories', 'portfolioImages']);
        } elseif ($hasExplicitCategories) {
            $profile = $profile->fresh(['user', 'categories', 'portfolioImages']);
        }

        return $profile;
    }

    public function uploadProfileImage(User $user, UploadedFile $file): User
    {
        $this->imageUploadService->delete($user->profile_image);
        $user->update([
            'profile_image' => $this->imageUploadService->upload($file, 'workers'),
        ]);

        return $user->fresh(['workerProfile.categories', 'workerProfile.portfolioImages']);
    }

    public function uploadPortfolioFiles(User $user, array $files): WorkerProfile
    {
        $profile = $this->getProfile($user);
        $sortOrder = $profile->portfolioImages()->max('sort_order') ?? 0;

        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $sortOrder++;
                $extension = strtolower($file->getClientOriginalExtension());
                $fileType = $extension === 'pdf' ? 'pdf' : 'image';

                WorkerPortfolioImage::create([
                    'worker_profile_id' => $profile->id,
                    'image_path' => $this->imageUploadService->upload($file, 'portfolio'),
                    'file_type' => $fileType,
                    'original_name' => $file->getClientOriginalName(),
                    'sort_order' => $sortOrder,
                ]);
            }
        }

        return $profile->fresh(['user', 'categories', 'portfolioImages']);
    }

    public function deletePortfolioImage(User $user, int $imageId): WorkerProfile
    {
        $profile = $this->getProfile($user);
        $image = $profile->portfolioImages()->where('id', $imageId)->first();

        if (! $image) {
            throw ValidationException::withMessages([
                'image' => ['Portfolio file not found.'],
            ]);
        }

        $this->imageUploadService->delete($image->image_path);
        $image->delete();

        return $profile->fresh(['user', 'categories', 'portfolioImages']);
    }
}
