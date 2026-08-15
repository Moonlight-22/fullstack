<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class WorkerPortfolioImageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'image_path' => $this->image_path,
            'file_url' => $this->file_url,
            'image_url' => $this->image_url,
            'file_type' => $this->file_type ?? 'image',
            'original_name' => $this->original_name,
            'sort_order' => $this->sort_order,
        ];
    }
}
