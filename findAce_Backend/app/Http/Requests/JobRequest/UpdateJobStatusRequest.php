<?php

namespace App\Http\Requests\JobRequest;

use App\Models\JobRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(JobRequest::STATUSES)],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
