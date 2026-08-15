<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostCommentResource;
use App\Http\Resources\PostResource;
use App\Services\PostService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class PostController extends Controller
{
    use ApiResponseTrait;

    protected PostService $postService;

    public function __construct(PostService $postService)
    {
        $this->postService = $postService;
    }

    public function index(Request $request): JsonResponse
    {
        $posts = $this->postService->list($request);

        return $this->successResponse('Posts fetched successfully.', [
            'items' => PostResource::collection($posts),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        try {
            $post = $this->postService->create(
                $request->user(),
                $data,
                $request->file('image')
            );

            return $this->successResponse('Post created successfully.', new PostResource($post), 201);
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to create post.', (object) [], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->postService->delete($request->user(), $id);

            return $this->successResponse('Post deleted successfully.');
        } catch (ValidationException $e) {
            return $this->errorResponse('Unable to delete post.', $e->errors(), 422);
        }
    }

    public function toggleLike(Request $request, int $id): JsonResponse
    {
        try {
            $result = $this->postService->toggleLike($request->user(), $id);

            return $this->successResponse('Like updated.', $result);
        } catch (ValidationException $e) {
            return $this->errorResponse('Unable to like post.', $e->errors(), 422);
        }
    }

    public function comments(Request $request, int $id): JsonResponse
    {
        try {
            $comments = $this->postService->listComments($id, $request);

            return $this->successResponse('Comments fetched successfully.', [
                'items' => PostCommentResource::collection($comments),
                'pagination' => [
                    'current_page' => $comments->currentPage(),
                    'last_page' => $comments->lastPage(),
                    'per_page' => $comments->perPage(),
                    'total' => $comments->total(),
                ],
            ]);
        } catch (ValidationException $e) {
            return $this->errorResponse('Post not found.', $e->errors(), 404);
        }
    }

    public function storeComment(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $comment = $this->postService->addComment($request->user(), $id, $data['content']);

            return $this->successResponse('Comment added.', new PostCommentResource($comment), 201);
        } catch (ValidationException $e) {
            return $this->errorResponse('Unable to add comment.', $e->errors(), 422);
        }
    }
}
