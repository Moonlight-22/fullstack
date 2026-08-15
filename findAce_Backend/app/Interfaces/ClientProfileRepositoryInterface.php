<?php

namespace App\Interfaces;

use App\Models\ClientProfile;
use Illuminate\Database\Eloquent\Builder;

interface ClientProfileRepositoryInterface
{
    public function query(): Builder;

    public function findByUserId(int $userId): ?ClientProfile;

    public function update(ClientProfile $profile, array $data): ClientProfile;
}
