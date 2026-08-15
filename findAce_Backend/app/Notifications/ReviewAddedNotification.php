<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReviewAddedNotification extends Notification
{
    use Queueable;

    protected Review $review;

    public function __construct(Review $review)
    {
        $this->review = $review;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Review Received - Find Ace')
            ->line('You received a ' . $this->review->stars . '-star review.')
            ->line($this->review->comment ?? 'No comment provided.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'review_added',
            'review_id' => $this->review->id,
            'job_request_id' => $this->review->job_request_id,
            'stars' => $this->review->stars,
            'client_name' => optional($this->review->client)->name,
            'message' => 'You received a new ' . $this->review->stars . '-star review.',
        ];
    }
}
