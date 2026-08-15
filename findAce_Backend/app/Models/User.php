<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_CLIENT = 'client';
    public const ROLE_WORKER = 'worker';

    public const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_CLIENT,
        self::ROLE_WORKER,
    ];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone_number',
        'profile_image',
        'is_active',
        'banned_until',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'banned_until' => 'datetime',
    ];

    protected $appends = [
        'profile_image_url',
    ];

    public function workerProfile(): HasOne
    {
        return $this->hasOne(WorkerProfile::class);
    }

    public function clientProfile(): HasOne
    {
        return $this->hasOne(ClientProfile::class);
    }

    public function workerJobRequests(): HasMany
    {
        return $this->hasMany(JobRequest::class, 'worker_id');
    }

    public function clientJobRequests(): HasMany
    {
        return $this->hasMany(JobRequest::class, 'client_id');
    }

    public function workerReviews(): HasMany
    {
        return $this->hasMany(Review::class, 'worker_id');
    }

    public function clientReviews(): HasMany
    {
        return $this->hasMany(Review::class, 'client_id');
    }

    public function favoriteWorkers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'favorite_workers',
            'client_id',
            'worker_id'
        )->withTimestamps();
    }

    public function favoritedByClients(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'favorite_workers',
            'worker_id',
            'client_id'
        )->withTimestamps();
    }

    public function jobRequestHistories(): HasMany
    {
        return $this->hasMany(JobRequestHistory::class, 'changed_by_user_id');
    }

    public function scopeRole(Builder $query, string $role): Builder
    {
        return $query->where('role', $role);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeWorkers(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_WORKER);
    }

    public function scopeClients(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_CLIENT);
    }

    public function scopeAdmins(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_ADMIN);
    }

    public function getProfileImageUrlAttribute(): ?string
    {
        if (! $this->profile_image) {
            return null;
        }

        return asset('storage/' . $this->profile_image);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isWorker(): bool
    {
        return $this->role === self::ROLE_WORKER;
    }

    public function isClient(): bool
    {
        return $this->role === self::ROLE_CLIENT;
    }
}
