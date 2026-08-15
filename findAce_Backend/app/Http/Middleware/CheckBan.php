<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckBan
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->banned_until) {
            if ($user->banned_until->isFuture()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is temporarily banned.',
                    'errors' => [
                        'ban' => [$user->banned_until->toDateTimeString()],
                    ],
                ], 403);
            }

            // Ban expired: clear the timestamp (keep is_active as-is).
            if ($user->banned_until->isPast()) {
                $user->banned_until = null;
                $user->save();
            }
        }

        if ($user && $user->is_active === false) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is currently suspended.',
                'errors' => [
                    'suspend' => ['Your account has been suspended by an admin.'],
                ],
            ], 403);
        }

        return $next($request);
    }
}
