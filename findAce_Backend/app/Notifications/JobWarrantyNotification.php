<?php

namespace App\Notifications;

use App\Models\JobReport;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobWarrantyNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    protected JobReport $jobReport;
    protected string $sentToRole;
    protected ?string $messageText;

    public function __construct(JobReport $jobReport, string $sentToRole, ?string $messageText = null)
    {
        $this->jobReport = $jobReport;
        $this->sentToRole = $sentToRole;
        $this->messageText = $messageText;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Job warranty sent - Find Ace')
            ->line('An admin sent a warranty for a job report.')
            ->line('Job report ID: ' . $this->jobReport->id)
            ->line('Target: ' . $this->sentToRole)
            ->line($this->messageText ? ('Message: ' . $this->messageText) : '');
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'job_warranty_sent',
            'job_report_id' => $this->jobReport->id,
            'job_request_id' => $this->jobReport->job_request_id,
            'warranty_target' => $this->sentToRole,
            'warranty_started_at' => $this->jobReport->warranty_started_at,
            'warranty_ended_at' => $this->jobReport->warranty_ended_at,
            'message' => $this->messageText,
        ];
    }
}
