<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostLike;
use App\Models\User;
use App\Traits\FilterableTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PostService
{
    use FilterableTrait;

    protected ImageUploadService $imageUploadService;

    public function __construct(ImageUploadService $imageUploadService)
    {
        $this->imageUploadService = $imageUploadService;
    }

    public function list(Request $request): LengthAwarePaginator
    {
        $viewer = $request->user();

        $query = Post::query()
            ->with(['user'])
            ->withCount(['likes', 'comments']);

        if ($viewer) {
            $query->with(['likes' => fn ($q) => $q->where('user_id', $viewer->id)]);
        }

        $this->applySorting($query, $request, ['created_at', 'likes_count', 'comments_count'], 'created_at');

        return $this->applyPagination($query, $request);
    }

    public function create(User $user, array $data, ?UploadedFile $image = null): Post
    {
        $payload = [
            'user_id' => $user->id,
            'content' => $data['content'],
        ];

        if ($image) {
            $payload['image'] = $this->imageUploadService->upload($image, 'posts');
        }

        return Post::create($payload)->load('user');
    }

    public function toggleLike(User $user, int $postId): array
    {
        $post = Post::find($postId);

        if (! $post) {
            throw ValidationException::withMessages([
                'post_id' => ['Post not found.'],
            ]);
        }

        return DB::transaction(function () use ($user, $post) {
            $existing = PostLike::where('post_id', $post->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                $existing->delete();
                $post->decrement('likes_count');
                $liked = false;
            } else {
                PostLike::create([
                    'post_id' => $post->id,
                    'user_id' => $user->id,
                ]);
                $post->increment('likes_count');
                $liked = true;
            }

            return [
                'liked' => $liked,
                'likes_count' => $post->fresh()->likes_count,
            ];
        });
    }

    public function addComment(User $user, int $postId, string $content): PostComment
    {
        $post = Post::find($postId);

        if (! $post) {
            throw ValidationException::withMessages([
                'post_id' => ['Post not found.'],
            ]);
        }

        return DB::transaction(function () use ($user, $post, $content) {
            $comment = PostComment::create([
                'post_id' => $post->id,
                'user_id' => $user->id,
                'content' => $content,
            ]);

            $post->increment('comments_count');

            return $comment->load('user');
        });
    }

    public function listComments(int $postId, Request $request): LengthAwarePaginator
    {
        $post = Post::find($postId);

        if (! $post) {
            throw ValidationException::withMessages([
                'post_id' => ['Post not found.'],
            ]);
        }

        return PostComment::query()
            ->where('post_id', $postId)
            ->with('user')
            ->orderBy('created_at')
            ->paginate(min((int) $request->get('per_page', 20), 100));
    }

    public function delete(User $user, int $postId): void
    {
        $post = Post::find($postId);

        if (! $post) {
            throw ValidationException::withMessages([
                'post_id' => ['Post not found.'],
            ]);
        }

        if ($post->user_id !== $user->id && ! $user->isAdmin()) {
            throw ValidationException::withMessages([
                'post_id' => ['You are not allowed to delete this post.'],
            ]);
        }

        if ($post->image) {
            $this->imageUploadService->delete($post->image);
        }

        $post->delete();
    }
}
