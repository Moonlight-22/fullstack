<?php

use App\Http\Controllers\API\Admin\AdminDashboardController;
use App\Http\Controllers\API\Admin\AdminJobController;
use App\Http\Controllers\API\Admin\AdminReviewController;
use App\Http\Controllers\API\Admin\AdminUserController;
use App\Http\Controllers\API\Admin\AdminWorkerController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ClientProfileController;
use App\Http\Controllers\API\JobReportController;
use App\Http\Controllers\API\JobRequestController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\PostController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\Admin\AdminJobReportController;
use App\Http\Controllers\API\WorkerProfileController;
use App\Http\Controllers\API\WorkerSearchController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:10,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
});

Route::middleware(['auth:sanctum', 'checkBan'])->prefix('v1/auth')->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:10,1');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::delete('/delete-account', [AuthController::class, 'deleteAccount']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])->middleware('throttle:6,1');
});

Route::middleware(['auth:sanctum', 'signed'])->get('/v1/auth/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->name('verification.verify');

Route::prefix('v1')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    Route::get('/workers/search', [WorkerSearchController::class, 'index']);
    Route::get('/workers/{workerId}', [WorkerSearchController::class, 'show']);

    Route::get('/reviews', [ReviewController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'checkBan'])->prefix('v1')->group(function () {
    Route::middleware('role:worker')->prefix('worker')->group(function () {
        Route::get('/profile', [WorkerProfileController::class, 'show']);
        Route::match(['put', 'post'], '/profile', [WorkerProfileController::class, 'update']);
        Route::delete('/portfolio/{imageId}', [WorkerProfileController::class, 'deletePortfolioImage']);
    });

    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('/profile', [ClientProfileController::class, 'show']);
        Route::match(['put', 'post'], '/profile', [ClientProfileController::class, 'update']);
        Route::get('/bookings', [ClientProfileController::class, 'bookingHistory']);
        Route::get('/favorites', [ClientProfileController::class, 'favorites']);
        Route::get('/favorites/check/{workerId}', [ClientProfileController::class, 'checkFavorite']);
        Route::post('/favorites/{workerId}', [ClientProfileController::class, 'addFavorite']);
        Route::delete('/favorites/{workerId}', [ClientProfileController::class, 'removeFavorite']);
    });

    Route::prefix('posts')->group(function () {
        Route::get('/', [PostController::class, 'index']);
        Route::post('/', [PostController::class, 'store']);
        Route::delete('/{id}', [PostController::class, 'destroy']);
        Route::post('/{id}/like', [PostController::class, 'toggleLike']);
        Route::get('/{id}/comments', [PostController::class, 'comments']);
        Route::post('/{id}/comments', [PostController::class, 'storeComment']);
    });

    Route::get('/job-requests', [JobRequestController::class, 'index']);
    Route::get('/job-requests/{id}', [JobRequestController::class, 'show']);
    Route::middleware('role:client')->post('/job-requests', [JobRequestController::class, 'store']);
    Route::patch('/job-requests/{id}/status', [JobRequestController::class, 'updateStatus']);

    Route::middleware('role:client')->post('/reviews', [ReviewController::class, 'store']);

    Route::post('/reports', [JobReportController::class, 'store']);

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('v1/admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{id}', [AdminUserController::class, 'show']);
    Route::post('/users/{id}/suspend', [AdminUserController::class, 'suspend']);
    Route::post('/users/{id}/activate', [AdminUserController::class, 'activate']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

    Route::get('/workers', [AdminWorkerController::class, 'index']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    Route::get('/jobs', [AdminJobController::class, 'index']);
    Route::get('/jobs/{id}', [AdminJobController::class, 'show']);
    Route::delete('/jobs/{id}', [AdminJobController::class, 'destroy']);

    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy']);

    Route::get('/reports', [JobReportController::class, 'index']);
    Route::post('/reports/{id}/warranty', [AdminJobReportController::class, 'sendWarranty']);
});
