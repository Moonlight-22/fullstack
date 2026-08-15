<?php

namespace App\Services;

use App\Models\Category;
use App\Models\JobRequest;
use App\Models\User;
use App\Models\WorkerProfile;
use Illuminate\Http\Request;

class AdminDashboardService
{
    public function statistics(?Request $request = null): array
    {
        // User totals stay overall so Overview does not show 0 users when
        // filtering by a date range that only covers recent job activity.
        $userTotalsQuery = User::query();
        $userChartQuery = User::query();
        $jobQuery = JobRequest::query();
        $categoryJobQuery = JobRequest::query();
        $workerQuery = WorkerProfile::query();

        $startDate = $request?->filled('start_date') ? $request->get('start_date') : null;
        $endDate = $request?->filled('end_date') ? $request->get('end_date') : null;

        if ($startDate && $endDate && $startDate > $endDate) {
            [$startDate, $endDate] = [$endDate, $startDate];
        }

        if ($startDate) {
            $userChartQuery->whereDate('created_at', '>=', $startDate);
            $jobQuery->whereDate('created_at', '>=', $startDate);
            $categoryJobQuery->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $userChartQuery->whereDate('created_at', '<=', $endDate);
            $jobQuery->whereDate('created_at', '<=', $endDate);
            $categoryJobQuery->whereDate('created_at', '<=', $endDate);
        }

        $monthlyRegistrations = (clone $userChartQuery)->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        $monthlyJobs = (clone $jobQuery)->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        $topCategories = Category::select('categories.id', 'categories.name')
            ->leftJoinSub(
                (clone $categoryJobQuery)->select(['id', 'category_id']),
                'filtered_job_requests',
                'categories.id',
                '=',
                'filtered_job_requests.category_id'
            )
            ->selectRaw('COUNT(filtered_job_requests.id) as jobs_count')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('jobs_count')
            ->limit(5)
            ->get();

        $topRatedWorkers = (clone $workerQuery)->with('user:id,name,email,profile_image')
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->limit(5)
            ->get();

        return [
            'total_users' => (clone $userTotalsQuery)->count(),
            'total_workers' => (clone $userTotalsQuery)->workers()->count(),
            'total_clients' => (clone $userTotalsQuery)->clients()->count(),
            'completed_jobs' => (clone $jobQuery)->status(JobRequest::STATUS_COMPLETED)->count(),
            'pending_jobs' => (clone $jobQuery)->status(JobRequest::STATUS_PENDING)->count(),
            'cancelled_jobs' => (clone $jobQuery)->status(JobRequest::STATUS_CANCELLED)->count(),
            'revenue_placeholder' => (float) (clone $jobQuery)->status(JobRequest::STATUS_COMPLETED)->sum('budget'),
            'top_categories' => $topCategories,
            'monthly_registrations' => $monthlyRegistrations,
            'monthly_jobs' => $monthlyJobs,
            'top_rated_workers' => $topRatedWorkers,
        ];
    }
}
