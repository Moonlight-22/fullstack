<?php

namespace App\Http\Requests\JobRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isClient();
    }

    public function rules(): array
    {
        return [
            'worker_id' => ['required', 'integer', 'exists:users,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['required', 'string'],
            'budget' => ['required', 'numeric', 'min:0'],
            'requested_date' => ['required', 'date', 'after_or_equal:today'],
            'address' => ['required_without_all:latitude,longitude', 'nullable', 'string', 'max:255'],
            'latitude' => ['required_without:address', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_with:latitude', 'nullable', 'numeric', 'between:-180,180'],
        ];
    }

    public function messages(): array
    {
        return [
            'address.required_without_all' => 'Please enter a text address or share your location.',
            'latitude.required_without' => 'Please enter a text address or share your location.',
        ];
    }

    protected function prepareForValidation()
    {
        if (! $this->filled('address') && $this->filled('latitude') && $this->filled('longitude')) {
            $this->merge([
                'address' => 'Shared GPS location (' . round((float) $this->latitude, 5) . ', ' . round((float) $this->longitude, 5) . ')',
            ]);
        }
    }
}
