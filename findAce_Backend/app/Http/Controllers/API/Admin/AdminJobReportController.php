<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\JobReportResource;
use App\Models\JobReport;
use App\Notifications\JobWarrantyNotification;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class AdminJobReportController extends Controller
{
    use ApiResponseTrait;

    public function sendWarranty(Request $request, int $id)
    {
        $data = $request->validate([
            'target' => ['required', Rule::in(['reporter', 'reported', 'both'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $report = JobReport::with(['reporter', 'reportedUser', 'jobRequest'])->find($id);

        if (! $report) {
            return $this->errorResponse('Report not found.', (object) [], 404);
        }

        try {
            $report->update([
                'warranty_target' => $data['target'],
                'warranty_started_at' => $data['start_date'],
                'warranty_ended_at' => $data['end_date'],
                'warranty_message' => $data['message'] ?? null,
                'warranty_sent_at' => now(),
                'status' => JobReport::STATUS_REVIEWED,
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to send warranty.', (object) [], 500);
        }

        $messageText = $data['message'] ?? null;
        $target = $data['target'];

        $recipients = [];
        if (in_array($target, ['reporter', 'both'], true) && $report->reporter) {
            $recipients[] = ['user' => $report->reporter, 'sentToRole' => 'reporter'];
        }
        if (in_array($target, ['reported', 'both'], true) && $report->reportedUser) {
            $recipients[] = ['user' => $report->reportedUser, 'sentToRole' => 'reported'];
        }

        foreach ($recipients as $recipient) {
            try {
                $recipient['user']->notify(new JobWarrantyNotification($report, $recipient['sentToRole'], $messageText));
            } catch (Throwable $e) {
                // Don't block warranty storage if notification fails.
            }
        }

        // Temporary ban rule:
        // If a user receives 5+ warranties within the last 1 day, ban them for 1 day.
        // "Receives" depends on the warranty_target:
        // - reporter => reporter_id receives
        // - reported => reported_user_id receives
        // - both => both reporter_id and reported_user_id receive
        $usersById = [];
        foreach ($recipients as $r) {
            $usersById[$r['user']->id] = $r['user'];
        }
        $recipientUserIds = array_keys($usersById);

        foreach ($recipientUserIds as $recipientUserId) {
            $banCount = JobReport::query()
                ->whereNotNull('warranty_sent_at')
                ->where('warranty_sent_at', '>=', now()->subDay())
                ->where(function ($q) use ($recipientUserId) {
                    $q->where(function ($q2) use ($recipientUserId) {
                        $q2->where('reporter_id', $recipientUserId)
                            ->whereIn('warranty_target', ['reporter', 'both']);
                    })->orWhere(function ($q2) use ($recipientUserId) {
                        $q2->where('reported_user_id', $recipientUserId)
                            ->whereIn('warranty_target', ['reported', 'both']);
                    });
                })
                ->count();

            if ($banCount >= 5) {
                $user = $usersById[$recipientUserId] ?? null;
                if ($user) {
                    $user->banned_until = now()->addDay();
                    $user->save();
                }
            }
        }

        return $this->successResponse('Warranty sent successfully.', new JobReportResource($report->fresh(['reporter', 'reportedUser', 'jobRequest'])));
    }
}
