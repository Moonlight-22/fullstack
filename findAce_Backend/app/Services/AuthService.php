<?php

namespace App\Services;

use App\Interfaces\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthService
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function register(array $payload): array
    {
        $user = $this->userRepository->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'role' => $payload['role'],
            'phone_number' => $payload['phone_number'] ?? null,
            'is_active' => true,
        ]);

        if ($user->isWorker()) {
            $categoryIds = collect($payload['category_ids'] ?? [])
                ->filter(fn ($id) => is_numeric($id))
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            $skills = \App\Models\Category::query()
                ->whereIn('id', $categoryIds)
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all();

            if (empty($skills) && ! empty($payload['skills'])) {
                $skills = $payload['skills'];
            }

            $workerProfile = $user->workerProfile()->create([
                'bio' => $payload['bio'] ?? null,
                'skills' => $skills,
                'address' => $payload['address'] ?? null,
                'township' => $payload['township'] ?? null,
                'latitude' => $payload['latitude'] ?? null,
                'longitude' => $payload['longitude'] ?? null,
                'availability_status' => 'available',
            ]);

            if (! empty($categoryIds)) {
                $workerProfile->categories()->sync($categoryIds);
            } else {
                $workerProfile->syncCategoriesFromSkills($skills);
            }
        }

        if ($user->isClient()) {
            $user->clientProfile()->create([
                'address' => $payload['address'] ?? null,
                'township' => $payload['township'] ?? null,
                'latitude' => $payload['latitude'] ?? null,
                'longitude' => $payload['longitude'] ?? null,
            ]);
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            Log::warning('Email verification notification failed during registration.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);
        }

        $token = $user->createToken($payload['device_name'] ?? 'auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    public function login(array $payload): array
    {
        $user = $this->userRepository->findByEmail($payload['email']);

        if (! $user || ! Hash::check($payload['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials provided.'],
            ]);
        }

        if ($user->banned_until && $user->banned_until->isFuture()) {
            throw ValidationException::withMessages([
                'email' => ['Your account is temporarily banned until ' . $user->banned_until->toDateTimeString() . '.'],
            ]);
        }

        if ($user->banned_until && $user->banned_until->isPast()) {
            $user->banned_until = null;
            $user->save();
        }

        if ($user->is_active === false) {
            throw ValidationException::withMessages([
                'email' => ['Your account is currently suspended.'],
            ]);
        }

        $token = $user->createToken($payload['device_name'] ?? 'auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    public function sendResetLink(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }

    public function resetPassword(array $payload): string
    {
        return Password::reset(
            $payload,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );
    }

    public function updateProfile(User $user, array $payload): User
    {
        if (array_key_exists('email', $payload) && $payload['email'] !== $user->email) {
            $payload['email_verified_at'] = null;
        }

        return $this->userRepository->update($user, $payload);
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $this->userRepository->update($user, [
            'password' => Hash::make($newPassword),
            'remember_token' => Str::random(60),
        ]);
    }

    public function deleteAccount(User $user): bool
    {
        $user->tokens()->delete();

        return $this->userRepository->delete($user);
    }
}
