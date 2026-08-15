<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'job_request_id' => $this->job_request_id,
            'worker_id' => $this->worker_id,
            'client_id' => $this->client_id,
            'stars' => $this->stars,
            'comment' => $this->comment,
            'worker' => new UserResource($this->whenLoaded('worker')),
            'client' => new UserResource($this->whenLoaded('client')),
            'job_request' => new JobRequestResource($this->whenLoaded('jobRequest')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
