<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponseTrait;
use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    use ApiResponseTrait;

    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (! $user) {
            return $this->errorResponse('Unauthenticated.', (object) [], 401);
        }

        if (! in_array($user->role, $roles, true)) {
            return $this->errorResponse('Unauthorized. Insufficient role permissions.', (object) [], 403);
        }

        return $next($request);
    }
}
