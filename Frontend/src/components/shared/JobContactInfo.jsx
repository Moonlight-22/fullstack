import { Phone } from 'lucide-react'

export default function JobContactInfo({ job, viewerRole }) {
  if (!job.showContact) return null

  return (
    <div className="mt-3 space-y-2 rounded-xl surface-muted p-3 text-xs">
      <p className="font-semibold uppercase tracking-widest text-muted">Contact</p>
      {viewerRole === 'client' && job.workerPhone ? (
        <p className="flex items-center gap-2 text-app">
          <Phone size={12} />
          Worker: <a href={`tel:${job.workerPhone}`} className="text-accent">{job.workerPhone}</a>
        </p>
      ) : null}
      {viewerRole === 'worker' && job.clientPhone ? (
        <p className="flex items-center gap-2 text-app">
          <Phone size={12} />
          Client: <a href={`tel:${job.clientPhone}`} className="text-accent">{job.clientPhone}</a>
        </p>
      ) : null}
      {viewerRole === 'client' && job.clientPhone ? (
        <p className="flex items-center gap-2 text-muted">
          <Phone size={12} />
          Your phone: {job.clientPhone}
        </p>
      ) : null}
      {viewerRole === 'worker' && job.workerPhone ? (
        <p className="flex items-center gap-2 text-muted">
          <Phone size={12} />
          Your phone: {job.workerPhone}
        </p>
      ) : null}
    </div>
  )
}
