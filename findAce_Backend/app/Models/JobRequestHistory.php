<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobRequestHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_request_id',
        'changed_by_user_id',
        'from_status',
        'to_status',
        'note',
    ];

    public function jobRequest()
    {
        return $this->belongsTo(JobRequest::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
