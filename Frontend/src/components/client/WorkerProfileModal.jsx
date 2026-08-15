import { useEffect, useState } from 'react'
import { BriefcaseBusiness, Bookmark, FileText, Loader2, Star, UserRound, X } from 'lucide-react'
import { mapWorker, reviewApi, workerApi } from '../../services/api.js'

function Stars({ value, size = 14 }) {
  const rating = Number(value) || 0
  return (
    <span className="inline-flex items-center gap-0.5 text-accent">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(rating) ? 'currentColor' : 'none'} className={n <= Math.round(rating) ? '' : 'text-muted'} />
      ))}
    </span>
  )
}

export default function WorkerProfileModal({ worker, isSaved, onToggleFavorite, onClose, onRequestJob }) {
  const [profile, setProfile] = useState(worker)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      workerApi.show(worker.id).then((res) => mapWorker(res.data)).catch(() => worker),
      reviewApi.list({ worker_id: worker.id, per_page: 20 }).then((res) => res.data.items || []).catch(() => []),
    ]).then(([fullProfile, reviewItems]) => {
      if (cancelled) return
      setProfile({ ...worker, ...fullProfile })
      setReviews(reviewItems)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [worker.id])

  const previousJobs = reviews
    .filter((r) => r.job_request)
    .map((r) => ({
      id: r.job_request.id,
      title: r.job_request.title || 'Completed job',
      category: r.job_request.category?.name,
      date: r.job_request.requested_date || r.created_at,
      stars: r.stars,
    }))

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="" className="h-16 w-16 rounded-full object-cover border border-app" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full surface-muted text-muted">
                <UserRound size={24} />
              </div>
            )}
            <div>
              <p className="section-number">/ Profile</p>
              <h3 className="heading-lg mt-2">{profile.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted">{profile.category}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-accent">
                  <Stars value={profile.rating} />
                  <span className="font-semibold">{profile.rating}</span>
                </span>
                <span className="text-xs text-muted">
                  {profile.totalReviews || reviews.length} review{(profile.totalReviews || reviews.length) === 1 ? '' : 's'}
                </span>
                <span className="text-xs text-muted">
                  {profile.completedJobs || 0} completed job{(profile.completedJobs || 0) === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-muted transition hover:text-app"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-accent" size={28} />
          </div>
        ) : (
          <>
            <div className="divider-h my-6" />
            <p className="body-muted">{profile.bio}</p>
            {profile.skills?.length ? (
              <p className="mt-4 text-sm text-accent">Skills: {profile.skills.join(', ')}</p>
            ) : null}
            {profile.township ? (
              <p className="mt-2 text-xs text-muted">Township: {profile.township}</p>
            ) : null}
            {profile.hourlyRate ? (
              <p className="mt-1 text-xs text-muted">Rate: {Number(profile.hourlyRate).toLocaleString()} MMK / hr</p>
            ) : null}

            <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-muted">Previous Work</p>
            {profile.portfolio?.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {profile.portfolio.map((item, i) => (
                  <a key={item.id || i} href={item.url} target="_blank" rel="noreferrer" className="overflow-hidden border border-app p-2 text-xs text-muted">
                    {item.type === 'pdf' ? (
                      <span className="flex items-center gap-2 p-3"><FileText size={16} /> {item.name}</span>
                    ) : (
                      <img src={item.url} alt="" className="h-24 w-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No portfolio photos uploaded yet.</p>
            )}

            {previousJobs.length > 0 ? (
              <div className="mt-4 space-y-2">
                {previousJobs.map((job) => (
                  <div key={`${job.id}-${job.date}`} className="flex items-center justify-between gap-3 border border-app px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-app">{job.title}</p>
                      <p className="text-[11px] text-muted">
                        {[job.category, job.date ? String(job.date).slice(0, 10) : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <Stars value={job.stars} size={12} />
                  </div>
                ))}
              </div>
            ) : profile.completedJobs > 0 ? (
              <p className="mt-3 text-sm text-muted">{profile.completedJobs} completed jobs on record.</p>
            ) : null}

            <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-muted">Reviews & Rating</p>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No reviews yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="border border-app p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-app">{review.client?.name || 'Client'}</p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {review.job_request?.title || 'Completed job'}
                          {review.created_at ? ` · ${String(review.created_at).slice(0, 10)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-accent">
                        <Stars value={review.stars} size={12} />
                        <span className="text-xs font-semibold">{review.stars}</span>
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="mt-3 text-sm text-muted">{review.comment}</p>
                    ) : (
                      <p className="mt-3 text-sm text-muted italic">No written comment.</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {profile.availability === 'offline' ? (
            <p className="text-sm text-muted">Worker is offline — requests are disabled.</p>
          ) : (
            <button type="button" onClick={onRequestJob} className="btn-gold">
              <BriefcaseBusiness size={14} /> Send Job Request
            </button>
          )}
          {profile.availability === 'busy' ? (
            <p className="text-xs text-amber-400">Busy — please wait a little for acceptance after requesting.</p>
          ) : null}
          {onToggleFavorite ? (
            <button type="button" onClick={onToggleFavorite} className="btn-outline">
              <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save Worker'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
