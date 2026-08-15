<?php

namespace App\Http\Resources;

use App\Models\JobRequest;
use Illuminate\Http\Resources\Json\JsonResource;

class JobRequestResource extends JsonResource
{
    public function toArray($request): array
    {
        $showContact = $this->shouldShowContact($request);

        return [
            'id' => $this->id,
            'worker_id' => $this->worker_id,
            'client_id' => $this->client_id,
            'category_id' => $this->category_id,
            'title' => $this->title,
            'description' => $this->description,
            'budget' => $this->budget,
            'requested_date' => $this->requested_date,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'status' => $this->status,
            'show_contact' => $showContact,
            'worker' => $this->whenLoaded('worker', function () use ($request, $showContact) {
                return (new UserResource($this->worker))
                    ->showPhone($showContact)
                    ->toArray($request);
            }),
            'client' => $this->whenLoaded('client', function () use ($request, $showContact) {
                return (new UserResource($this->client))
                    ->showPhone($showContact)
                    ->toArray($request);
            }),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'review' => new ReviewResource($this->whenLoaded('review')),
            'has_reported' => $this->hasReportedBy($request),
            'warranties' => $this->warrantiesForViewer($request),
            'histories' => JobRequestHistoryResource::collection($this->whenLoaded('histories')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function shouldShowContact($request): bool
    {
        $viewer = $request->user();

        if (! $viewer) {
            return false;
        }

        if (! in_array($this->status, [
            JobRequest::STATUS_PENDING,
            JobRequest::STATUS_ACCEPTED,
            JobRequest::STATUS_IN_PROGRESS,
            JobRequest::STATUS_COMPLETED,
        ], true)) {
            return false;
        }

        return in_array($viewer->id, [$this->client_id, $this->worker_id], true) || $viewer->isAdmin();
    }

    protected function hasReportedBy($request): bool
    {
        $viewer = $request->user();

        if (! $viewer || ! $this->relationLoaded('reports')) {
            return false;
        }

        return $this->reports->contains('reporter_id', $viewer->id);
    }

    protected function warrantiesForViewer($request): array
    {
        $viewer = $request->user();

        if (! $viewer || ! $this->relationLoaded('reports')) {
            return [];
        }

        return $this->reports
            ->filter(function ($report) use ($viewer) {
                if (! $report->warranty_target) {
                    return false;
                }

                if ($report->warranty_target === 'both') {
                    return in_array($viewer->id, [$report->reporter_id, $report->reported_user_id], true);
                }

                if ($report->warranty_target === 'reporter') {
                    return (int) $viewer->id === (int) $report->reporter_id;
                }

                if ($report->warranty_target === 'reported') {
                    return (int) $viewer->id === (int) $report->reported_user_id;
                }

                return false;
            })
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'target' => $report->warranty_target,
                    'message' => $report->warranty_message,
                    'started_at' => $report->warranty_started_at,
                    'ended_at' => $report->warranty_ended_at,
                    'sent_at' => $report->warranty_sent_at,
                    'reporter_id' => $report->reporter_id,
                    'reported_user_id' => $report->reported_user_id,
                ];
            })
            ->values()
            ->toArray();
    }
}
