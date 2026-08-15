<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class JobReportResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'job_request_id' => $this->job_request_id,
            'reporter_id' => $this->reporter_id,
            'reported_user_id' => $this->reported_user_id,
            'reason' => $this->reason,
            'custom_reason' => $this->custom_reason,
            'status' => $this->status,
            'warranty_target' => $this->warranty_target,
            'warranty_started_at' => $this->warranty_started_at,
            'warranty_ended_at' => $this->warranty_ended_at,
            'warranty_message' => $this->warranty_message,
            'warranty_sent_at' => $this->warranty_sent_at,
            'reporter' => new UserResource($this->whenLoaded('reporter')),
            'reported_user' => new UserResource($this->whenLoaded('reportedUser')),
            'created_at' => $this->created_at,
        ];
    }
}
