<?php

namespace App\Notifications;

use App\Models\JobRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobStatusNotification extends Notification
{
    use Queueable;

    protected JobRequest $jobRequest;
    protected string $status;
    protected string $message;

    public function __construct(JobRequest $jobRequest, string $status, string $message)
    {
        $this->jobRequest = $jobRequest;
        $this->status = $status;
        $this->message = $message;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Job Request ' . ucfirst(str_replace('_', ' ', $this->status)) . ' - Find Ace')
            ->line($this->message)
            ->action('View Job', url('/job-requests/' . $this->jobRequest->id));
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'job_status_' . $this->status,
            'job_request_id' => $this->jobRequest->id,
            'status' => $this->status,
            'title' => $this->jobRequest->title,
            'message' => $this->message,
        ];
    }
}
