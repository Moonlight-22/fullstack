<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerPortfolioImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'worker_profile_id',
        'image_path',
        'file_type',
        'original_name',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'file_url',
        'image_url',
    ];

    public function workerProfile(): BelongsTo
    {
        return $this->belongsTo(WorkerProfile::class);
    }

    public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->image_path);
    }

    public function getImageUrlAttribute(): string
    {
        return $this->file_url;
    }

    public function isPdf(): bool
    {
        return $this->file_type === 'pdf';
    }
}
