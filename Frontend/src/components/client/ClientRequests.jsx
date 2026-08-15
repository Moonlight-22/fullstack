import { MapPin, Star, XCircle } from 'lucide-react'
import JobContactInfo from '../shared/JobContactInfo.jsx'
import JobRouteMap from '../shared/JobRouteMap.jsx'

const ACTIVE_STATUSES = ['pending', 'accepted', 'in_progress']

export default function ClientRequests({ requests, onRefresh, onReview, onCancel, cancellingId }) {
  const active = requests.filter((req) => ACTIVE_STATUSES.includes(req.statusRaw))

  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-number">/ 01</p>
          <h2 className="heading-xl mt-2">Your Job Requests</h2>
          <p className="body-muted mt-2">Active and pending requests. Past jobs are in History.</p>
        </div>
        <button type="button" onClick={onRefresh} className="btn-ghost">Refresh</button>
      </div>
      {active.length === 0 ? (
        <div className="card-editorial"><p className="text-sm text-muted">No active requests.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((req) => (
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
                <span
                  className={
                    req.statusRaw === 'accepted' || req.statusRaw === 'in_progress'
                      ? 'status-accepted'
                      : req.statusRaw === 'completed'
                        ? 'status-completed'
                        : 'status-progress'
                  }
                >
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
              {['pending', 'accepted'].includes(req.statusRaw) ? (
                <button
                  type="button"
                  onClick={() => onCancel(req)}
                  disabled={cancellingId === req.id}
                  className="btn-decline mt-4 w-full"
                >
                  <XCircle size={14} />
                  {cancellingId === req.id ? 'Cancelling…' : 'Cancel Request'}
                </button>
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
              {['accepted', 'in_progress'].includes(req.statusRaw) ? (
                <JobRouteMap
                  clientLat={req.clientLat}
                  clientLng={req.clientLng}
                  workerLat={req.workerLat}
                  workerLng={req.workerLng}
                  clientLabel="You (job site)"
                  workerLabel={req.workerName}
                />
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
