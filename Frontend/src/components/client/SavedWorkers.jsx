import { Bookmark, UserRound } from 'lucide-react'
import { mapWorker, workerApi } from '../../services/api.js'

export default function SavedWorkers({ workers, favoriteIds, onToggleFavorite, onRequest, onView }) {
  return (
    <section className="space-y-8">
      <div>
        <p className="section-number">/ Saved</p>
        <h2 className="heading-xl mt-2">Saved Workers</h2>
        <p className="body-muted mt-2">Workers you bookmarked for quick access.</p>
      </div>
      {workers.length === 0 ? (
        <div className="card-editorial text-sm text-muted">No saved workers yet. Tap Save on a worker profile.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workers.map((worker) => (
            <article key={worker.id} className="card-editorial">
              <div className="flex items-center gap-3">
                {worker.profile_image_url ? (
                  <img src={worker.profile_image_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-full surface-muted text-muted">
                    <UserRound size={18} />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-app">{worker.name}</p>
                  <p className="text-xs text-muted capitalize">{worker.role || 'worker'}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await workerApi.show(worker.id)
                      onView(mapWorker(res.data))
                    } catch {
                      onView({
                        id: worker.id,
                        name: worker.name,
                        profileImage: worker.profile_image_url,
                        category: 'Saved',
                        rating: '0.0',
                        totalReviews: 0,
                        completedJobs: 0,
                        bio: '',
                        skills: [],
                        portfolio: [],
                        categories: [],
                      })
                    }
                  }}
                  className="link-gold"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await workerApi.show(worker.id)
                      onRequest(mapWorker(res.data))
                    } catch {
                      onRequest({ id: worker.id, name: worker.name, category: 'General', categories: [] })
                    }
                  }}
                  className="btn-ghost"
                >
                  Request
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(worker.id)}
                  className="btn-ghost inline-flex items-center gap-1.5 text-accent"
                >
                  <Bookmark size={14} fill={favoriteIds.has(worker.id) ? 'currentColor' : 'none'} />
                  <span>Remove</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
