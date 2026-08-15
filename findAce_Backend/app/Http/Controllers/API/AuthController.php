<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Traits\ApiResponseTrait;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Throwable;

class AuthController extends Controller
{
    use ApiResponseTrait;

    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        DB::beginTransaction();

        try {
            $result = $this->authService->register($request->validated());
            DB::commit();

            return $this->successResponse('Registration successful.', [
                'token' => $result['token'],
                'token_type' => 'Bearer',
                'user' => new UserResource($result['user']),
            ], 201);
        } catch (Throwable $exception) {
            DB::rollBack();

            return $this->errorResponse('Registration failed.', (object) [], 500);
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login($request->validated());

            return $this->successResponse('Login successful.', [
                'token' => $result['token'],
                'token_type' => 'Bearer',
                'user' => new UserResource($result['user']),
            ]);
        } catch (Throwable $exception) {
            if ($exception instanceof ValidationException) {
                return $this->errorResponse('Login failed.', $exception->errors(), 422);
            }

            return $this->errorResponse('Login failed.', (object) [], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse('Logout successful.');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            $status = $this->authService->sendResetLink($request->validated()['email']);

            if ($status !== Password::RESET_LINK_SENT) {
                return $this->errorResponse('Unable to send reset link.', ['email' => [__($status)]], 422);
            }

            return $this->successResponse('Password reset link sent successfully.');
        } catch (Throwable $exception) {
            return $this->errorResponse('Failed to process forgot password request.', (object) [], 500);
        }
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $status = $this->authService->resetPassword($request->validated());

            if ($status !== Password::PASSWORD_RESET) {
                return $this->errorResponse('Password reset failed.', ['token' => [__($status)]], 422);
            }

            return $this->successResponse('Password reset successful.');
        } catch (Throwable $exception) {
            return $this->errorResponse('Failed to reset password.', (object) [], 500);
        }
    }

    public function verifyEmail(EmailVerificationRequest $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->successResponse('Email is already verified.');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        return $this->successResponse('Email verified successfully.');
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->successResponse('Email is already verified.');
        }

        $request->user()->sendEmailVerificationNotification();

        return $this->successResponse('Verification email sent successfully.');
    }

    public function profile(Request $request): JsonResponse
    {
        return $this->successResponse('Profile fetched successfully.', new UserResource($request->user()));
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $this->authorize('update', $user);

            $payload = $request->validated();

            if ($request->hasFile('profile_image')) {
                $payload['profile_image'] = $request->file('profile_image')->store('users', 'public');
            }

            $updatedUser = $this->authService->updateProfile($user, $payload);

            return $this->successResponse('Profile updated successfully.', new UserResource($updatedUser));
        } catch (AuthorizationException $exception) {
            return $this->errorResponse('Unauthorized.', ['authorization' => [$exception->getMessage()]], 403);
        } catch (Throwable $exception) {
            return $this->errorResponse('Failed to update profile.', (object) [], 500);
        }
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $this->authService->changePassword(
                $request->user(),
                $request->validated()['current_password'],
                $request->validated()['new_password']
            );

            return $this->successResponse('Password changed successfully.');
        } catch (Throwable $exception) {
            if ($exception instanceof ValidationException) {
                return $this->errorResponse('Failed to change password.', $exception->errors(), 422);
            }

            return $this->errorResponse('Failed to change password.', (object) [], 500);
        }
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        try {
            $this->authorize('delete', $request->user());
            $this->authService->deleteAccount($request->user());

            return $this->successResponse('Account deleted successfully.');
        } catch (AuthorizationException $exception) {
            return $this->errorResponse('Unauthorized.', ['authorization' => [$exception->getMessage()]], 403);
        } catch (Throwable $exception) {
            return $this->errorResponse('Failed to delete account.', (object) [], 500);
        }
    }
}
