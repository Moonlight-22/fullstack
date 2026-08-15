<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait FilterableTrait
{
    protected function applyPagination(Builder $query, Request $request, int $defaultPerPage = 15): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $perPage = min((int) $request->get('per_page', $defaultPerPage), 100);

        return $query->paginate($perPage)->appends($request->query());
    }

    protected function applySorting(Builder $query, Request $request, array $allowed = ['created_at'], string $default = 'created_at'): Builder
    {
        $sortBy = $request->get('sort_by', $default);
        $sortOrder = strtolower($request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sortBy, $allowed, true)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy($default, 'desc');
        }

        return $query;
    }

    protected function applySearch(Builder $query, Request $request, array $columns): Builder
    {
        $keyword = trim((string) $request->get('search', ''));

        if ($keyword === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($keyword, $columns) {
            foreach ($columns as $column) {
                $builder->orWhere($column, 'like', '%' . $keyword . '%');
            }
        });
    }

    protected function applyDateRange(Builder $query, Request $request, string $column = 'created_at'): Builder
    {
        $startDate = $request->filled('start_date') ? $request->get('start_date') : null;
        $endDate = $request->filled('end_date') ? $request->get('end_date') : null;

        if ($startDate && $endDate && $startDate > $endDate) {
            [$startDate, $endDate] = [$endDate, $startDate];
        }

        if ($startDate) {
            $query->whereDate($column, '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate($column, '<=', $endDate);
        }

        return $query;
    }
}
