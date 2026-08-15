<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkerProfile extends Model
{
    use HasFactory, SoftDeletes;

    public const AVAILABILITY_AVAILABLE = 'available';
    public const AVAILABILITY_BUSY = 'busy';
    public const AVAILABILITY_OFFLINE = 'offline';

    public const AVAILABILITY_STATUSES = [
        self::AVAILABILITY_AVAILABLE,
        self::AVAILABILITY_BUSY,
        self::AVAILABILITY_OFFLINE,
    ];

    protected $fillable = [
        'user_id',
        'bio',
        'experience_years',
        'skills',
        'hourly_rate',
        'address',
        'township',
        'latitude',
        'longitude',
        'availability_status',
        'average_rating',
        'completed_jobs_count',
        'total_reviews',
    ];

    protected $casts = [
        'skills' => 'array',
        'experience_years' => 'integer',
        'hourly_rate' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'average_rating' => 'decimal:2',
        'completed_jobs_count' => 'integer',
        'total_reviews' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function portfolioImages(): HasMany
    {
        return $this->hasMany(WorkerPortfolioImage::class)->orderBy('sort_order');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_worker')->withTimestamps();
    }

    /**
     * Link worker skills to category_worker by matching category names.
     */
    public function syncCategoriesFromSkills(?array $skills = null): void
    {
        $skills = collect($skills ?? $this->skills ?? [])
            ->filter(fn ($skill) => is_string($skill) && trim($skill) !== '')
            ->map(fn ($skill) => trim($skill))
            ->unique(fn ($skill) => mb_strtolower($skill))
            ->values();

        if ($skills->isEmpty()) {
            $this->categories()->sync([]);
            return;
        }

        $categoryIds = Category::query()
            ->where(function (Builder $query) use ($skills) {
                foreach ($skills as $skill) {
                    $query->orWhereRaw('LOWER(name) = ?', [mb_strtolower($skill)]);
                }
            })
            ->pluck('id')
            ->all();

        $this->categories()->sync($categoryIds);
    }

    public function jobRequests(): HasMany
    {
        return $this->hasMany(JobRequest::class, 'worker_id', 'user_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'worker_id', 'user_id');
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('availability_status', self::AVAILABILITY_AVAILABLE);
    }

    public function scopeInTownship(Builder $query, string $township): Builder
    {
        return $query->where('township', $township);
    }

    public function scopeMinRating(Builder $query, float $rating): Builder
    {
        return $query->where('average_rating', '>=', $rating);
    }

    public function scopePriceBetween(Builder $query, ?float $min, ?float $max): Builder
    {
        if ($min !== null) {
            $query->where('hourly_rate', '>=', $min);
        }

        if ($max !== null) {
            $query->where('hourly_rate', '<=', $max);
        }

        return $query;
    }

    public function scopeWithCoordinates(Builder $query): Builder
    {
        return $query->whereNotNull('latitude')->whereNotNull('longitude');
    }

    public function isAvailable(): bool
    {
        return $this->availability_status === self::AVAILABILITY_AVAILABLE;
    }
}
