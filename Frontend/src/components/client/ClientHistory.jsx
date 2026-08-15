import { Flag, MapPin, Star } from 'lucide-react'
import JobContactInfo from '../shared/JobContactInfo.jsx'

const PAST_STATUSES = ['completed', 'cancelled', 'rejected']

export default function ClientHistory({ requests, onRefresh, onReview, onReport }) {
  const history = requests.filter((req) => PAST_STATUSES.includes(req.statusRaw))

  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-number">/ History</p>
          <h2 className="heading-xl mt-2">Job History</h2>
          <p className="body-muted mt-2">Completed, cancelled, and rejected requests.</p>
        </div>
        <button type="button" onClick={onRefresh} className="btn-ghost">Refresh</button>
      </div>

      {history.length === 0 ? (
        <div className="card-editorial">
          <p className="text-sm text-muted">No past jobs yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.map((req) => (
            <article key={req.id} className="card-editorial flex flex-col">
              <p className="text-[10px] uppercase tracking-widest text-muted">#{req.id}</p>
              <p className="mt-2 font-semibold text-app">{req.title || req.issue}</p>
              <p className="mt-2 text-sm text-muted line-clamp-2">{req.issue}</p>
              <div className="divider-h my-4" />
              <p className="text-xs text-muted">{req.workerName}</p>
              <p className="mt-2 text-xs text-muted">{req.category} · {req.date}</p>
              {req.address ? (
                <p className="mt-2 flex items-start gap-1 text-xs text-muted">
                  <MapPin size={12} className="mt-0.5 shrink-0" /> {req.address}
                </p>
              ) : null}
              <p className="mt-2 text-sm font-medium text-accent">{req.budget}</p>
              <JobContactInfo job={req} viewerRole="client" />
              <div className="mt-4">
                <span className={req.statusRaw === 'completed' ? 'status-completed' : 'status-progress'}>
                  {req.status}
                </span>
              </div>

              {req.warranties?.length ? (
                <div className="mt-2 space-y-1 rounded-lg px-3 py-2" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                  {req.warranties.map((w) => (
                    <p key={w.id} className="text-xs text-app">
                      Warranty: {w.started_at ? String(w.started_at).slice(0, 10) : '—'}
                      {' → '}
                      {w.ended_at ? String(w.ended_at).slice(0, 10) : '—'}
                      {w.message ? ` · ${w.message}` : ''}
                    </p>
                  ))}
                </div>
              ) : null}
              {req.statusRaw === 'completed' && !req.hasReview ? (
                <button type="button" onClick={() => onReview(req)} className="btn-gold mt-4 w-full">
                  <Star size={14} /> Rate Worker
                </button>
              ) : null}
              {req.hasReview ? (
                <p className="mt-4 text-xs text-muted">
                  Your review: {'★'.repeat(req.review.stars)}{'☆'.repeat(5 - req.review.stars)}
                </p>
              ) : null}
              {req.statusRaw === 'completed' ? (
                req.hasReported ? (
                  <p className="mt-3 text-xs text-muted">You already reported this job.</p>
                ) : (
                  <button type="button" onClick={() => onReport(req)} className="btn-decline mt-3 w-full">
                    <Flag size={14} /> Report Worker
                  </button>
                )
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
