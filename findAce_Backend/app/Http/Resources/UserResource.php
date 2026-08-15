<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    protected bool $showPhone = false;

    public function showPhone(bool $show = true): self
    {
        $this->showPhone = $show;

        return $this;
    }

    public function toArray($request): array
    {
        $viewer = $request->user();
        $canSeePhone = $this->showPhone || ($viewer && $viewer->id === $this->id);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone_number' => $this->when($canSeePhone, $this->phone_number),
            'profile_image_url' => $this->profile_image_url,
            'email_verified_at' => $this->email_verified_at,
            'is_active' => $this->is_active,
            'banned_until' => $this->banned_until,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'worker_profile' => $this->whenLoaded('workerProfile', function () {
                return [
                    'latitude' => $this->workerProfile->latitude,
                    'longitude' => $this->workerProfile->longitude,
                    'township' => $this->workerProfile->township,
                    'address' => $this->workerProfile->address,
                    'average_rating' => $this->workerProfile->average_rating,
                    'total_reviews' => $this->workerProfile->total_reviews,
                ];
            }),
            'client_profile' => $this->whenLoaded('clientProfile', function () {
                return [
                    'latitude' => $this->clientProfile->latitude,
                    'longitude' => $this->clientProfile->longitude,
                    'township' => $this->clientProfile->township,
                    'address' => $this->clientProfile->address,
                ];
            }),
        ];
    }
}
