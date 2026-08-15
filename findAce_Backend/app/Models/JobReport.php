<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobReport extends Model
{
    use HasFactory;

    public const REASON_POOR_QUALITY = 'poor_quality';
    public const REASON_UNPROFESSIONAL = 'unprofessional';
    public const REASON_LATE_OR_NO_SHOW = 'late_or_no_show';
    public const REASON_RUDE_BEHAVIOR = 'rude_behavior';
    public const REASON_INCOMPLETE_WORK = 'incomplete_work';
    public const REASON_PRICING_DISPUTE = 'pricing_dispute';
    public const REASON_OTHER = 'other';

    public const REASONS = [
        self::REASON_POOR_QUALITY,
        self::REASON_UNPROFESSIONAL,
        self::REASON_LATE_OR_NO_SHOW,
        self::REASON_RUDE_BEHAVIOR,
        self::REASON_INCOMPLETE_WORK,
        self::REASON_PRICING_DISPUTE,
        self::REASON_OTHER,
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWED = 'reviewed';

    protected $fillable = [
        'job_request_id',
        'reporter_id',
        'reported_user_id',
        'reason',
        'custom_reason',
        'status',
        'warranty_target',
        'warranty_started_at',
        'warranty_ended_at',
        'warranty_message',
        'warranty_sent_at',
    ];

    protected $casts = [
        'warranty_started_at' => 'date',
        'warranty_ended_at' => 'date',
        'warranty_sent_at' => 'datetime',
    ];

    public function jobRequest()
    {
        return $this->belongsTo(JobRequest::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }
}
