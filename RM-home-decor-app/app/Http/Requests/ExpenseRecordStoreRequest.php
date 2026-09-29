<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ExpenseRecordStoreRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:255'],
            'product_quantity' => ['required', 'integer', 'min:1'],
            'fixed_expenses' => ['required', 'numeric', 'min:0'],
            'gasoline' => ['required', 'numeric', 'min:0'],
            'vehicle_maintenance' => ['required', 'numeric', 'min:0'],
            'tolls' => ['required', 'numeric', 'min:0'],
            'other_variable_expenses' => ['required', 'numeric', 'min:0'],
        ];
    }
}
