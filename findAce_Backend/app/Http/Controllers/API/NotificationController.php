<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 100);
        $notifications = $request->user()->notifications()->paginate($perPage);

        return $this->successResponse('Notifications fetched successfully.', [
            'items' => NotificationResource::collection($notifications),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();

        if (! $notification) {
            return $this->errorResponse('Notification not found.', (object) [], 404);
        }

        $notification->markAsRead();

        return $this->successResponse('Notification marked as read.', new NotificationResource($notification));
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->successResponse('All notifications marked as read.');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return $this->successResponse('Unread count fetched successfully.', [
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }
}
