<?php

namespace App\Services;

use App\Models\JobReport;
use App\Models\JobRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JobReportService
{
    public function create(User $reporter, array $data): JobReport
    {
        $job = JobRequest::with(['worker', 'client'])->find($data['job_request_id']);

        if (! $job) {
            throw ValidationException::withMessages([
                'job_request_id' => ['Job request not found.'],
            ]);
        }

        if (! $job->isCompleted()) {
            throw ValidationException::withMessages([
                'job_request_id' => ['Reports are only allowed after a job is completed.'],
            ]);
        }

        $isClient = $job->client_id === $reporter->id;
        $isWorker = $job->worker_id === $reporter->id;

        if (! $isClient && ! $isWorker) {
            throw ValidationException::withMessages([
                'job_request_id' => ['You can only report on your own jobs.'],
            ]);
        }

        $alreadyReported = JobReport::where('job_request_id', $job->id)
            ->where('reporter_id', $reporter->id)
            ->exists();

        if ($alreadyReported) {
            throw ValidationException::withMessages([
                'job_request_id' => ['You have already reported this job.'],
            ]);
        }

        $reason = $data['reason'];
        $customReason = $data['custom_reason'] ?? null;

        if ($reason === JobReport::REASON_OTHER && blank($customReason)) {
            throw ValidationException::withMessages([
                'custom_reason' => ['Please write your reason.'],
            ]);
        }

        $reportedUserId = $isClient ? $job->worker_id : $job->client_id;

        return DB::transaction(function () use ($job, $reporter, $reportedUserId, $reason, $customReason) {
            return JobReport::create([
                'job_request_id' => $job->id,
                'reporter_id' => $reporter->id,
                'reported_user_id' => $reportedUserId,
                'reason' => $reason,
                'custom_reason' => $customReason,
                'status' => JobReport::STATUS_PENDING,
            ])->load(['reporter', 'reportedUser']);
        });
    }
}
