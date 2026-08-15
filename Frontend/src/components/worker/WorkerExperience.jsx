import { CalendarDays, CircleDollarSign, MapPin, UserRound } from 'lucide-react'
import JobContactInfo from '../shared/JobContactInfo.jsx'
import JobRouteMap from '../shared/JobRouteMap.jsx'

export default function WorkerExperience({ jobs, onRefresh, onUpdateStatus }) {
  const pendingJobs = jobs.filter((j) => j.statusRaw === 'pending')
  const activeJobs = jobs.filter((j) => ['accepted', 'in_progress'].includes(j.statusRaw))

  return (
    <section className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-number">/ 01</p>
          <h2 className="heading-xl mt-2">Incoming Requests</h2>
          <p className="body-muted mt-2">Past jobs are in History.</p>
        </div>
        <button type="button" onClick={onRefresh} className="btn-ghost">Refresh</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pendingJobs.length === 0 ? (
          <div className="card-editorial col-span-full"><p className="text-sm text-muted">No pending requests.</p></div>
        ) : (
          pendingJobs.map((request) => (
            <article key={request.id} className="card-editorial flex flex-col">
              <p className="text-[10px] uppercase tracking-widest text-muted">#{request.id}</p>
              <p className="mt-2 font-semibold text-app">{request.issue}</p>
              <div className="divider-h my-4" />
              <p className="flex items-center gap-2 text-xs text-muted"><UserRound size={12} /> {request.client}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted"><CalendarDays size={12} /> {request.date}</p>
              {request.address ? <p className="mt-2 flex items-start gap-2 text-xs text-muted"><MapPin size={12} className="mt-0.5 shrink-0" /> {request.address}</p> : null}
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-accent"><CircleDollarSign size={14} /> {request.budget}</p>
              <JobContactInfo job={request} viewerRole="worker" />
              <div className="mt-auto flex gap-3 pt-6">
                <button type="button" onClick={() => onUpdateStatus(request.id, 'accepted')} className="btn-gold flex-1">Accept</button>
                <button type="button" onClick={() => onUpdateStatus(request.id, 'rejected')} className="btn-decline flex-1">Decline</button>
              </div>
            </article>
          ))
        )}
      </div>

      <div>
        <p className="section-number">/ 02</p>
        <h2 className="heading-lg mt-2">Active Jobs</h2>
        <div className="mt-6 space-y-4">
          {activeJobs.length === 0 ? (
            <div className="card-editorial text-sm text-muted">No active jobs yet.</div>
          ) : (
            activeJobs.map((job) => (
              <article key={job.id} className="card-editorial">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted">#{job.id}</p>
                    <p className="mt-1 font-semibold text-app">{job.title}</p>
                    <p className="mt-1 text-xs text-muted">{job.client} · {job.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="status-progress">{job.status}</span>
                    {job.statusRaw === 'accepted' ? (
                      <button type="button" onClick={() => onUpdateStatus(job.id, 'in_progress')} className="link-gold">Start →</button>
                    ) : job.statusRaw === 'in_progress' ? (
                      <button type="button" onClick={() => onUpdateStatus(job.id, 'completed')} className="link-gold">Complete →</button>
                    ) : null}
                  </div>
                </div>
                {job.warranties?.length ? (
                  <div className="mt-3 space-y-1 rounded-lg px-3 py-2" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
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
                <JobContactInfo job={job} viewerRole="worker" />
                {['accepted', 'in_progress'].includes(job.statusRaw) ? (
                  <JobRouteMap
                    clientLat={job.clientLat}
                    clientLng={job.clientLng}
                    workerLat={job.workerLat}
                    workerLng={job.workerLng}
                    clientLabel={job.client}
                    workerLabel="You"
                  />
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
