<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class WorkerProfileResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'bio' => $this->bio,
            'experience_years' => $this->experience_years,
            'skills' => $this->skills ?? [],
            'hourly_rate' => $this->hourly_rate,
            'address' => $this->address,
            'township' => $this->township,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'availability_status' => $this->availability_status,
            'average_rating' => $this->average_rating,
            'completed_jobs_count' => $this->completed_jobs_count,
            'total_reviews' => $this->total_reviews,
            'distance' => $this->when(isset($this->distance), round($this->distance, 2)),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'portfolio_images' => WorkerPortfolioImageResource::collection($this->whenLoaded('portfolioImages')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
