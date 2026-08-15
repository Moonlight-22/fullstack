<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isWorker = $this->input('role') === 'worker';

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'in:client,worker'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'township' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:100'],
            'category_ids' => [$isWorker ? 'required' : 'nullable', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_ids.required' => 'Workers must choose at least one skill category.',
            'category_ids.min' => 'Workers must choose at least one skill category.',
        ];
    }
}
