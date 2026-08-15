<?php

namespace App\Services;

use App\Interfaces\WorkerProfileRepositoryInterface;
use App\Models\User;
use App\Traits\FilterableTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class WorkerSearchService
{
    use FilterableTrait;

    protected WorkerProfileRepositoryInterface $workerProfileRepository;

    public function __construct(WorkerProfileRepositoryInterface $workerProfileRepository)
    {
        $this->workerProfileRepository = $workerProfileRepository;
    }

    public function search(Request $request): LengthAwarePaginator
    {
        $query = $this->workerProfileRepository->query()
            ->whereHas('user', function (Builder $builder) {
                $builder->where('is_active', true)->where('role', User::ROLE_WORKER);
            });

        if ($request->filled('category_id')) {
            $query->whereHas('categories', function (Builder $builder) use ($request) {
                $builder->where('categories.id', $request->get('category_id'));
            });
        }

        if ($request->filled('township')) {
            $query->inTownship($request->get('township'));
        }

        if ($request->filled('availability')) {
            $query->where('availability_status', $request->get('availability'));
        }

        if ($request->filled('min_rating')) {
            $query->minRating((float) $request->get('min_rating'));
        }

        if ($request->filled('min_price') || $request->filled('max_price')) {
            $query->priceBetween(
                $request->filled('min_price') ? (float) $request->get('min_price') : null,
                $request->filled('max_price') ? (float) $request->get('max_price') : null
            );
        }

        if ($request->filled('name')) {
            $name = $request->get('name');
            $query->whereHas('user', function (Builder $userQuery) use ($name) {
                $userQuery->where('name', 'like', '%' . $name . '%');
            });
        }

        if ($request->filled('skill')) {
            $skill = $request->get('skill');
            $query->where(function (Builder $builder) use ($skill) {
                $builder->where('skills', 'like', '%' . $skill . '%')
                    ->orWhereJsonContains('skills', $skill);
            });
        }

        if ($request->filled('keyword')) {
            $keyword = $request->get('keyword');
            $query->where(function (Builder $builder) use ($keyword) {
                $builder->where('bio', 'like', '%' . $keyword . '%')
                    ->orWhere('township', 'like', '%' . $keyword . '%')
                    ->orWhere('skills', 'like', '%' . $keyword . '%')
                    ->orWhereJsonContains('skills', $keyword)
                    ->orWhereHas('user', function (Builder $userQuery) use ($keyword) {
                        $userQuery->where('name', 'like', '%' . $keyword . '%');
                    });
            });
        }

        $lat = $request->get('latitude');
        $lng = $request->get('longitude');
        $radius = $request->get('radius');
        $hasTextSearch = $request->filled('name') || $request->filled('skill') || $request->filled('keyword');

        if ($lat !== null && $lng !== null && $lat !== '' && $lng !== '') {
            $haversine = '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))';

            $query->select('worker_profiles.*')
                ->selectRaw("{$haversine} AS distance", [$lat, $lng, $lat])
                ->whereNotNull('latitude')
                ->whereNotNull('longitude');

            // Only apply distance radius when browsing nearby — not when searching by name/skill.
            // Otherwise workers in other cities (e.g. Mandalay) disappear for Yangon clients.
            if ($radius !== null && $radius !== '' && ! $hasTextSearch) {
                $query->havingRaw('distance <= ?', [(float) $radius]);
            }
        }

        $sortBy = $request->get('sort_by', 'newest');

        switch ($sortBy) {
            case 'nearest':
                if ($lat !== null && $lng !== null) {
                    $query->orderBy('distance');
                } else {
                    $query->orderByDesc('created_at');
                }
                break;
            case 'highest_rated':
                $query->orderByDesc('average_rating');
                break;
            case 'lowest_price':
                $query->orderBy('hourly_rate');
                break;
            case 'most_reviews':
                $query->orderByDesc('total_reviews');
                break;
            case 'newest':
            default:
                $query->orderByDesc('created_at');
                break;
        }

        return $this->applyPagination($query, $request);
    }

    public function show(int $workerUserId): ?\App\Models\WorkerProfile
    {
        return $this->workerProfileRepository->findByUserId($workerUserId);
    }
}
