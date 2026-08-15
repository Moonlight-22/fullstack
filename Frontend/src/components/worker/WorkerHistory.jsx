import { Flag, MapPin, UserRound } from 'lucide-react'
import JobContactInfo from '../shared/JobContactInfo.jsx'

const PAST_STATUSES = ['completed', 'cancelled', 'rejected']

export default function WorkerHistory({ jobs, onRefresh, onReport }) {
  const history = jobs.filter((job) => PAST_STATUSES.includes(job.statusRaw))

  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-number">/ History</p>
          <h2 className="heading-xl mt-2">Job History</h2>
          <p className="body-muted mt-2">Completed, cancelled, and rejected jobs.</p>
        </div>
        <button type="button" onClick={onRefresh} className="btn-ghost">Refresh</button>
      </div>

      {history.length === 0 ? (
        <div className="card-editorial">
          <p className="text-sm text-muted">No past jobs yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.map((job) => (
            <article key={job.id} className="card-editorial flex flex-col">
              <p className="text-[10px] uppercase tracking-widest text-muted">#{job.id}</p>
              <p className="mt-2 font-semibold text-app">{job.title || job.issue}</p>
              <p className="mt-2 text-sm text-muted line-clamp-2">{job.issue}</p>
              <div className="divider-h my-4" />
              <p className="flex items-center gap-2 text-xs text-muted">
                <UserRound size={12} /> {job.client}
              </p>
              <p className="mt-2 text-xs text-muted">{job.category} · {job.date}</p>
              {job.address ? (
                <p className="mt-2 flex items-start gap-1 text-xs text-muted">
                  <MapPin size={12} className="mt-0.5 shrink-0" /> {job.address}
                </p>
              ) : null}
              <p className="mt-2 text-sm font-medium text-accent">{job.budget}</p>
              <JobContactInfo job={job} viewerRole="worker" />
              <div className="mt-4">
                <span className={job.statusRaw === 'completed' ? 'status-completed' : 'status-progress'}>
                  {job.status}
                </span>
              </div>

              {job.warranties?.length ? (
                <div className="mt-2 space-y-1 rounded-lg px-3 py-2" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                  {job.warranties.map((w) => (
                    <p key={w.id} className="text-xs text-app">
                      Warranty: {w.started_at ? String(w.started_at).slice(0, 10) : '—'}
                      {' → '}
                      {w.ended_at ? String(w.ended_at).slice(0, 10) : '—'}
                      {w.message ? ` · ${w.message}` : ''}
                    </p>
                  ))}
                </div>
              ) : null}
              {job.statusRaw === 'completed' ? (
                job.hasReported ? (
                  <p className="mt-4 text-xs text-muted">You already reported this job.</p>
                ) : (
                  <button type="button" onClick={() => onReport(job)} className="btn-decline mt-4 w-full">
                    <Flag size={14} /> Report Client
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
