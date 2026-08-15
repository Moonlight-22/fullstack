<?php

namespace App\Notifications;

use App\Models\JobRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewJobRequestNotification extends Notification
{
    use Queueable;

    protected JobRequest $jobRequest;

    public function __construct(JobRequest $jobRequest)
    {
        $this->jobRequest = $jobRequest;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Job Request - Find Ace')
            ->line('You have received a new job request: ' . $this->jobRequest->title)
            ->line('Budget: ' . number_format($this->jobRequest->budget, 2))
            ->action('View Request', url('/job-requests/' . $this->jobRequest->id));
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'new_job_request',
            'job_request_id' => $this->jobRequest->id,
            'title' => $this->jobRequest->title,
            'client_name' => optional($this->jobRequest->client)->name,
            'budget' => $this->jobRequest->budget,
            'message' => 'New job request received: ' . $this->jobRequest->title,
        ];
    }
}
