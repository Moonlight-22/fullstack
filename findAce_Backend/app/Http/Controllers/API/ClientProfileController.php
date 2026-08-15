<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\UpdateClientProfileRequest;
use App\Http\Resources\ClientProfileResource;
use App\Http\Resources\JobRequestResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\WorkerProfileResource;
use App\Services\ClientProfileService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ClientProfileController extends Controller
{
    use ApiResponseTrait;

    protected ClientProfileService $clientProfileService;

    public function __construct(ClientProfileService $clientProfileService)
    {
        $this->clientProfileService = $clientProfileService;
    }

    public function show(Request $request): JsonResponse
    {
        try {
            $profile = $this->clientProfileService->getProfile($request->user());

            return $this->successResponse('Client profile fetched successfully.', new ClientProfileResource($profile));
        } catch (ValidationException $e) {
            return $this->errorResponse('Client profile not found.', $e->errors(), 404);
        }
    }

    public function update(UpdateClientProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $data = $request->validated();

            if ($request->hasFile('profile_image')) {
                $user = $this->clientProfileService->uploadProfileImage($user, $request->file('profile_image'));
            }

            unset($data['profile_image']);
            $profile = $this->clientProfileService->updateProfile($user, $data);

            return $this->successResponse('Client profile updated successfully.', new ClientProfileResource($profile->load('user')));
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to update client profile.', (object) [], 500);
        }
    }

    public function bookingHistory(Request $request): JsonResponse
    {
        $bookings = $this->clientProfileService->bookingHistory($request->user(), $request);

        return $this->successResponse('Booking history fetched successfully.', [
            'items' => JobRequestResource::collection($bookings),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function favorites(Request $request): JsonResponse
    {
        $favorites = $this->clientProfileService->listFavorites($request->user(), $request);

        return $this->successResponse('Favorite workers fetched successfully.', [
            'items' => UserResource::collection($favorites),
            'pagination' => [
                'current_page' => $favorites->currentPage(),
                'last_page' => $favorites->lastPage(),
                'per_page' => $favorites->perPage(),
                'total' => $favorites->total(),
            ],
        ]);
    }

    public function checkFavorite(Request $request, int $workerId): JsonResponse
    {
        return $this->successResponse('Favorite status fetched.', [
            'is_favorited' => $this->clientProfileService->isFavorited($request->user(), $workerId),
        ]);
    }

    public function addFavorite(Request $request, int $workerId): JsonResponse
    {
        try {
            $this->clientProfileService->addFavorite($request->user(), $workerId);

            return $this->successResponse('Worker added to favorites.', (object) [], 201);
        } catch (ValidationException $e) {
            return $this->errorResponse('Invalid worker.', $e->errors(), 422);
        }
    }

    public function removeFavorite(Request $request, int $workerId): JsonResponse
    {
        $this->clientProfileService->removeFavorite($request->user(), $workerId);

        return $this->successResponse('Worker removed from favorites.');
    }
}
