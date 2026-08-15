import { useEffect, useState } from 'react'
import { FileText, ImagePlus, Loader2, Navigation, Star, UserRound } from 'lucide-react'
import { categoryApi, reviewApi, workerApi } from '../../services/api.js'

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

export default function WorkerProfileEditor({ user, setUser, onSuccess, onShareLocation, myLocation }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: '',
    township: '',
    hourly_rate: '',
    availability_status: 'available',
    category_ids: [],
  })
  const [categories, setCategories] = useState([])
  const [portfolioFiles, setPortfolioFiles] = useState([])
  const [existingPortfolio, setExistingPortfolio] = useState([])
  const [profileImage, setProfileImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(user?.profile_image_url || null)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ rating: '0.0', totalReviews: 0, completedJobs: 0 })
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      categoryApi.list({ per_page: 100, active_only: 1 }),
      workerApi.getProfile(),
    ])
      .then(([catRes, profileRes]) => {
        if (cancelled) return
        const cats = catRes.data?.items || []
        setCategories(cats)

        const p = profileRes.data
        const linkedIds = (p.categories || []).map((c) => c.id)
        const skillNames = (p.skills || []).map((s) => String(s).toLowerCase())
        const matchedFromSkills = cats
          .filter((cat) => skillNames.includes(String(cat.name).toLowerCase()))
          .map((cat) => cat.id)

        setForm({
          name: p.user?.name || user?.name || '',
          bio: p.bio || '',
          township: p.township || '',
          hourly_rate: p.hourly_rate || '',
          availability_status: p.availability_status || 'available',
          category_ids: linkedIds.length ? linkedIds : matchedFromSkills,
        })
        setExistingPortfolio(p.portfolio_images || [])
        setPreviewUrl(p.user?.profile_image_url || user?.profile_image_url || null)
        setStats({
          rating: Number(p.average_rating || 0).toFixed(1),
          totalReviews: Number(p.total_reviews || 0),
          completedJobs: Number(p.completed_jobs_count || 0),
        })
      })
      .catch(() => {})

    if (user?.id) {
      reviewApi
        .list({ worker_id: user.id, per_page: 20 })
        .then((res) => {
          if (!cancelled) setReviews(res.data.items || [])
        })
        .catch(() => {
          if (!cancelled) setReviews([])
        })
    }

    return () => {
      cancelled = true
    }
  }, [user])

  const toggleCategory = (categoryId) => {
    setForm((prev) => {
      const exists = prev.category_ids.includes(categoryId)
      return {
        ...prev,
        category_ids: exists
          ? prev.category_ids.filter((id) => id !== categoryId)
          : [...prev.category_ids, categoryId],
      }
    })
  }

  const save = async (e) => {
    e.preventDefault()
    if (form.category_ids.length === 0) {
      onSuccess('Choose at least one skill category.', 'error')
      return
    }
    setSaving(true)
    try {
      const selectedSkills = categories
        .filter((cat) => form.category_ids.includes(cat.id))
        .map((cat) => cat.name)

      const payload = {
        name: form.name,
        bio: form.bio,
        township: form.township,
        hourly_rate: form.hourly_rate,
        availability_status: form.availability_status,
        skills: selectedSkills,
        category_ids: form.category_ids,
        portfolio_files: portfolioFiles,
      }
      if (profileImage) payload.profile_image = profileImage

      const res = await workerApi.updateProfile(payload)
      if (res.data?.user) {
        setUser(res.data.user)
        setPreviewUrl(res.data.user.profile_image_url || previewUrl)
      } else {
        setUser({ ...user, name: form.name })
      }
      setExistingPortfolio(res.data?.portfolio_images || existingPortfolio)
      setPortfolioFiles([])
      setProfileImage(null)
      onSuccess('Profile saved successfully!')
    } catch (err) {
      onSuccess(err.message || 'Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="border border-app surface p-6 md:p-8">
        <p className="section-number">/ 03</p>
        <h2 className="heading-xl mt-2">Worker Profile</h2>
        <p className="body-muted mt-2">Update photo, name, skills, location, and portfolio (images + PDF).</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="border border-app p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">Rating</p>
            <div className="mt-2 flex items-center gap-2">
              <Stars value={stats.rating} />
              <span className="text-lg font-semibold text-app">{stats.rating}</span>
            </div>
          </div>
          <div className="border border-app p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">Reviews</p>
            <p className="mt-2 text-lg font-semibold text-app">{stats.totalReviews}</p>
          </div>
          <div className="border border-app p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">Completed Jobs</p>
            <p className="mt-2 text-lg font-semibold text-app">{stats.completedJobs}</p>
          </div>
        </div>

        <form onSubmit={save} className="mt-8 max-w-2xl space-y-5">
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-20 w-20 rounded-full object-cover border border-app" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full surface-muted text-muted">
                <UserRound size={28} />
              </div>
            )}
            <label className="btn-ghost cursor-pointer">
              Upload Profile Picture
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setProfileImage(file)
                  setPreviewUrl(URL.createObjectURL(file))
                }}
              />
            </label>
          </div>

          <label className="block text-xs font-medium uppercase tracking-widest text-muted">
            Name
            <input type="text" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-xs font-medium uppercase tracking-widest text-muted">
            Bio
            <textarea className="input-field resize-none" rows="3" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </label>
          <label className="block text-xs font-medium uppercase tracking-widest text-muted">
            Township
            <input type="text" className="input-field" value={form.township} onChange={(e) => setForm({ ...form, township: e.target.value })} />
          </label>
          <label className="block text-xs font-medium uppercase tracking-widest text-muted">
            Hourly Rate (MMK)
            <input type="number" className="input-field" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
          </label>
          <label className="block text-xs font-medium uppercase tracking-widest text-muted">
            Availability
            <select className="input-field" value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })}>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </label>

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">Skill Categories *</p>
            <p className="mt-1 text-xs text-muted">Choose from the service categories in the system.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-xs text-muted">No categories available yet.</p>
              ) : (
                categories.map((cat) => {
                  const selected = form.category_ids.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selected ? 'border-accent text-accent surface-muted' : 'border-app text-muted'
                      }`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <button type="button" onClick={onShareLocation} className="btn-ghost flex items-center gap-2">
            <Navigation size={14} />
            {myLocation ? 'Update Shared Location' : 'Share My Location on Map'}
          </button>

          <label className="flex cursor-pointer flex-col items-center border border-dashed border-app p-6 text-center">
            <ImagePlus size={20} className="text-muted" />
            <span className="mt-2 text-xs uppercase tracking-widest text-muted">Upload Portfolio (Images or PDF)</span>
            <input
              type="file"
              className="mt-3 w-full text-[10px] text-muted"
              multiple
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => setPortfolioFiles(Array.from(e.target.files || []))}
            />
          </label>

          {existingPortfolio.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">Previous Work / Portfolio</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {existingPortfolio.map((item) => (
                  <a
                    key={item.id}
                    href={item.file_url || item.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-app surface-muted p-3 text-xs text-muted"
                  >
                    {(item.file_type || 'image') === 'pdf' ? (
                      <span className="flex items-center gap-2"><FileText size={14} /> {item.original_name || 'PDF file'}</span>
                    ) : (
                      <img src={item.file_url || item.image_url} alt="" className="mb-2 h-20 w-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <button type="submit" disabled={saving} className="btn-gold flex w-full items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save Changes
          </button>
        </form>
      </div>

      <div className="border border-app surface p-6 md:p-8">
        <p className="section-number">/ Reviews</p>
        <h3 className="heading-lg mt-2">Client Reviews</h3>
        <p className="body-muted mt-2">Feedback from clients after completed jobs.</p>

        {reviews.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No reviews yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
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
                  <div className="flex items-center gap-1.5">
                    <Stars value={review.stars} size={12} />
                    <span className="text-xs font-semibold text-accent">{review.stars}</span>
                  </div>
                </div>
                {review.comment ? (
                  <p className="mt-3 text-sm text-muted">{review.comment}</p>
                ) : (
                  <p className="mt-3 text-sm italic text-muted">No written comment.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
