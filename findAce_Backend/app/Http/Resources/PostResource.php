<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        $viewer = $request->user();
        $likedByViewer = false;

        if ($viewer && $this->relationLoaded('likes')) {
            $likedByViewer = $this->likes->isNotEmpty();
        } elseif ($viewer && isset($this->liked_by_viewer)) {
            $likedByViewer = (bool) $this->liked_by_viewer;
        }

        return [
            'id' => $this->id,
            'content' => $this->content,
            'image_url' => $this->image_url,
            'likes_count' => $this->likes_count,
            'comments_count' => $this->comments_count,
            'liked_by_viewer' => $likedByViewer,
            'user' => new UserResource($this->whenLoaded('user')),
            'comments' => PostCommentResource::collection($this->whenLoaded('comments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
