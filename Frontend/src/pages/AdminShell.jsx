import { useEffect, useState } from 'react'
import { Loader2, Moon, Sun } from 'lucide-react'
import AppFooter from '../components/shared/AppFooter.jsx'
import Toast from '../components/shared/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { adminApi } from '../services/api.js'

const TABS = [
  ['dashboard', 'Dashboard'],
  ['users', 'Users'],
  ['workers', 'Workers'],
  ['jobs', 'Jobs'],
  ['reviews', 'Reviews'],
  ['reports', 'Reports'],
  ['categories', 'Categories'],
]

const REASON_LABELS = {
  poor_quality: 'Poor quality',
  incomplete_work: 'Incomplete work',
  unprofessional: 'Unprofessional',
  rude_behavior: 'Rude behavior',
  late_or_no_show: 'Late / no-show',
  pricing_dispute: 'Pricing dispute',
  other: 'Other',
}

export default function AdminShell({ onSignOut }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [tab, setTab] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [workers, setWorkers] = useState([])
  const [jobs, setJobs] = useState([])
  const [reviews, setReviews] = useState([])
  const [reports, setReports] = useState([])
  const [categories, setCategories] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  const [jobStatusFilter, setJobStatusFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

  const [warrantyReport, setWarrantyReport] = useState(null)
  const [warrantyTarget, setWarrantyTarget] = useState('reported')
  const [warrantyStartDate, setWarrantyStartDate] = useState('')
  const [warrantyEndDate, setWarrantyEndDate] = useState('')
  const [warrantyMessage, setWarrantyMessage] = useState('')
  const [warrantySubmitting, setWarrantySubmitting] = useState(false)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const buildDateParams = () => {
    const params = {}
    let start = startDateFilter
    let end = endDateFilter
    if (start && end && start > end) {
      ;[start, end] = [end, start]
    }
    if (start) params.start_date = start
    if (end) params.end_date = end
    return params
  }

  const renderDateFilters = () => (
    <div
      className="inline-flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2"
      style={{
        borderColor: 'var(--border)',
        background: 'color-mix(in srgb, var(--bg-elevated) 88%, transparent)',
        boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--text) 4%, transparent)',
      }}
    >
      <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        Date Range
      </span>
      <div className="h-5 w-px" style={{ background: 'var(--border)' }} />
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="whitespace-nowrap">From</span>
        <input
          type="date"
          className="rounded-lg border px-2.5 py-1.5 text-sm text-app outline-none transition focus:border-accent"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg)',
            minWidth: '148px',
          }}
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
        />
      </label>
      <span className="text-muted">—</span>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="whitespace-nowrap">To</span>
        <input
          type="date"
          className="rounded-lg border px-2.5 py-1.5 text-sm text-app outline-none transition focus:border-accent"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg)',
            minWidth: '148px',
          }}
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
        />
      </label>
      {(startDateFilter || endDateFilter) ? (
        <button
          type="button"
          className="ml-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-app"
          style={{ background: 'color-mix(in srgb, var(--text) 6%, transparent)' }}
          onClick={() => {
            setStartDateFilter('')
            setEndDateFilter('')
          }}
        >
          Clear
        </button>
      ) : null}
    </div>
  )

  const loadTab = async (active = tab) => {
    setLoading(true)
    try {
      if (active === 'dashboard') {
        const res = await adminApi.dashboard(buildDateParams())
        setStats(res.data)
      } else if (active === 'users') {
        const params = { per_page: 50, ...buildDateParams() }
        if (roleFilter) params.role = roleFilter
        const res = await adminApi.users(params)
        setUsers(res.data.items || [])
      } else if (active === 'workers') {
        const res = await adminApi.workers({ per_page: 50, ...buildDateParams() })
        setWorkers(res.data.items || [])
      } else if (active === 'jobs') {
        const params = { per_page: 50, ...buildDateParams() }
        if (jobStatusFilter) params.status = jobStatusFilter
        const res = await adminApi.jobs(params)
        setJobs(res.data.items || [])
      } else if (active === 'reviews') {
        const res = await adminApi.reviews({ per_page: 50, ...buildDateParams() })
        setReviews(res.data.items || [])
      } else if (active === 'reports') {
        const res = await adminApi.reports({ per_page: 50, ...buildDateParams() })
        setReports(res.data.items || [])
      } else if (active === 'categories') {
        const res = await adminApi.categories({ per_page: 100, ...buildDateParams() })
        setCategories(res.data.items || [])
      }
    } catch (err) {
      showToast(err.message || 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTab(tab)
  }, [tab, roleFilter, jobStatusFilter, startDateFilter, endDateFilter])

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <header className="surface sticky top-0 z-40 flex items-center justify-between border-b px-4 py-4 md:px-10" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="section-tag">Find Ace</p>
          <h1 className="mt-1 text-lg font-bold text-app md:text-xl">Admin Dashboard</h1>
          <p className="text-xs text-muted">
            {user?.name || 'Admin'}
            {user?.role ? <span className="capitalize"> · {user.role}</span> : <span> · admin</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleTheme} className="btn-outline" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <button type="button" onClick={onSignOut} className="btn-ghost">Sign Out</button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col gap-2 border-r px-4 py-6 lg:flex" style={{ borderColor: 'var(--border)' }}>
          <p className="section-tag mb-2">Admin</p>
          <nav className="space-y-1">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`w-full rounded-lg px-3 py-2 text-left ${tab === id ? 'side-nav-active' : 'side-nav-idle'}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex flex-wrap gap-1 border-b px-4 py-3 md:px-10 lg:hidden" style={{ borderColor: 'var(--border)' }}>
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`nav-item ${tab === id ? 'nav-item-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <main className="flex-1 p-4 md:p-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-accent" size={28} />
          </div>
        ) : null}

        {!loading && tab === 'dashboard' && stats ? (
          <section className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-number">/ Admin</p>
                <h2 className="heading-xl mt-2">Overview</h2>
              </div>
              {renderDateFilters()}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Total Users', stats.total_users],
                ['Workers', stats.total_workers],
                ['Clients', stats.total_clients],
                ['Completed Jobs', stats.completed_jobs],
                ['Pending Jobs', stats.pending_jobs],
                ['Cancelled Jobs', stats.cancelled_jobs],
                // ['Revenue (MMK)', Number(stats.revenue_placeholder || 0).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="card-editorial">
                  <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-app">{value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'users' ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-number">/ Users</p>
                <h2 className="heading-xl mt-2">Manage Users</h2>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                {renderDateFilters()}
                <select className="input-field !mt-0 max-w-[160px]" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All roles</option>
                  <option value="client">Clients</option>
                  <option value="worker">Workers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-sm text-muted">No users found.</p>
              ) : users.map((user) => (
                <article key={user.id} className="card-editorial flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-app">{user.name}</p>
                    <p className="text-xs text-muted">{user.email} · {user.role}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {user.banned_until && new Date(user.banned_until) > new Date()
                        ? `Banned until ${String(user.banned_until).slice(0, 19).replace('T', ' ')}`
                        : user.is_active
                          ? 'Active'
                          : 'Suspended'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.role !== 'admin' ? (
                      user.is_active ? (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={async () => {
                            try {
                              await adminApi.suspendUser(user.id)
                              showToast('User suspended')
                              loadTab('users')
                            } catch (err) {
                              showToast(err.message || 'Failed', 'error')
                            }
                          }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={async () => {
                            try {
                              await adminApi.activateUser(user.id)
                              showToast('User activated')
                              loadTab('users')
                            } catch (err) {
                              showToast(err.message || 'Failed', 'error')
                            }
                          }}
                        >
                          Activate
                        </button>
                      )
                    ) : null}
                    {user.role !== 'admin' ? (
                      <button
                        type="button"
                        className="btn-decline"
                        onClick={async () => {
                          if (!window.confirm(`Delete ${user.name}?`)) return
                          try {
                            await adminApi.deleteUser(user.id)
                            showToast('User deleted')
                            loadTab('users')
                          } catch (err) {
                            showToast(err.message || 'Failed', 'error')
                          }
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'workers' ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-number">/ Workers</p>
                <h2 className="heading-xl mt-2">Worker Profiles</h2>
              </div>
              {renderDateFilters()}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {workers.length === 0 ? (
                <p className="text-sm text-muted">No workers found.</p>
              ) : workers.map((w) => (
                <article key={w.id} className="card-editorial">
                  <p className="font-semibold text-app">{w.user?.name || 'Worker'}</p>
                  <p className="mt-1 text-xs text-muted">{w.township || '—'} · {w.availability_status}</p>
                  <p className="mt-2 text-sm text-accent">★ {Number(w.average_rating || 0).toFixed(1)} · {w.total_reviews || 0} reviews</p>
                  <p className="mt-1 text-xs text-muted">{w.completed_jobs_count || 0} completed jobs</p>
                  <p className="mt-2 text-xs text-muted line-clamp-2">{w.bio || 'No bio'}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'jobs' ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-number">/ Jobs</p>
                <h2 className="heading-xl mt-2">Job Requests</h2>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                {renderDateFilters()}
                <select className="input-field !mt-0 max-w-[180px]" value={jobStatusFilter} onChange={(e) => setJobStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {jobs.length === 0 ? (
                <p className="text-sm text-muted">No jobs found.</p>
              ) : jobs.map((job) => (
                <article key={job.id} className="card-editorial flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted">#{job.id} · {job.status}</p>
                    <p className="mt-1 font-semibold text-app">{job.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {job.client?.name} → {job.worker?.name} · {Number(job.budget || 0).toLocaleString()} MMK
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-decline"
                    onClick={async () => {
                      if (!window.confirm(`Delete job #${job.id}?`)) return
                      try {
                        await adminApi.deleteJob(job.id)
                        showToast('Job deleted')
                        loadTab('jobs')
                      } catch (err) {
                        showToast(err.message || 'Failed', 'error')
                      }
                    }}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'reviews' ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-number">/ Reviews</p>
                <h2 className="heading-xl mt-2">Client Reviews</h2>
              </div>
              {renderDateFilters()}
            </div>
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted">No reviews found.</p>
              ) : reviews.map((review) => (
                <article key={review.id} className="card-editorial flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-app">
                      {review.client?.name} → {review.worker?.name}
                    </p>
                    <p className="mt-1 text-sm text-accent">{'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}</p>
                    <p className="mt-2 text-sm text-muted">{review.comment || 'No comment'}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-decline"
                    onClick={async () => {
                      if (!window.confirm('Delete this review?')) return
                      try {
                        await adminApi.deleteReview(review.id)
                        showToast('Review deleted')
                        loadTab('reviews')
                      } catch (err) {
                        showToast(err.message || 'Failed', 'error')
                      }
                    }}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'reports' ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-number">/ Reports</p>
                <h2 className="heading-xl mt-2">User Reports</h2>
                <p className="body-muted mt-2">Reports filed after completed jobs when someone was not satisfied.</p>
              </div>
              {renderDateFilters()}
            </div>
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-sm text-muted">No reports yet.</p>
              ) : reports.map((report) => (
                <article key={report.id} className="card-editorial">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Job #{report.job_request_id} · {report.status}
                  </p>
                  <p className="mt-2 font-semibold text-app">
                    {report.reporter?.name} reported {report.reported_user?.name}
                  </p>
                  <p className="mt-1 text-sm text-accent">
                    {REASON_LABELS[report.reason] || report.reason}
                  </p>
                  {report.custom_reason ? (
                    <p className="mt-2 text-sm text-muted">{report.custom_reason}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-muted">
                    {report.created_at ? String(report.created_at).slice(0, 19).replace('T', ' ') : ''}
                  </p>

                  {report.warranty_target ? (
                    <div className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                      <p className="font-semibold text-app">
                        Warranty sent to: {report.warranty_target}
                      </p>
                      <p className="mt-1 text-muted">
                        {report.warranty_started_at || report.warranty_ended_at
                          ? `${report.warranty_started_at ? String(report.warranty_started_at).slice(0, 10) : '—'} → ${
                              report.warranty_ended_at ? String(report.warranty_ended_at).slice(0, 10) : '—'
                            }`
                          : '—'}
                      </p>
                      {report.warranty_message ? (
                        <p className="mt-1 text-app">{report.warranty_message}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn-gold"
                      onClick={() => {
                        setWarrantyReport(report)
                        setWarrantyTarget(report.warranty_target || 'reported')
                        setWarrantyStartDate(
                          report.warranty_started_at
                            ? String(report.warranty_started_at).slice(0, 10)
                            : new Date().toISOString().slice(0, 10),
                        )
                        setWarrantyEndDate(
                          report.warranty_ended_at
                            ? String(report.warranty_ended_at).slice(0, 10)
                            : new Date().toISOString().slice(0, 10),
                        )
                        setWarrantyMessage(report.warranty_message || '')
                      }}
                    >
                      {report.warranty_target ? 'Update Warranty' : 'Send Warranty'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'categories' ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-number">/ Categories</p>
                <h2 className="heading-xl mt-2">Service Categories</h2>
              </div>
              {renderDateFilters()}
            </div>
            <form
              className="card-editorial grid gap-4 md:grid-cols-[1fr_1fr_auto]"
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  await adminApi.createCategory({
                    name: categoryForm.name.trim(),
                    description: categoryForm.description.trim() || null,
                    is_active: true,
                  })
                  setCategoryForm({ name: '', description: '' })
                  showToast('Category created')
                  loadTab('categories')
                } catch (err) {
                  const details = err.errors ? Object.values(err.errors).flat().join(' ') : ''
                  showToast(details || err.message || 'Failed', 'error')
                }
              }}
            >
              <input
                className="input-field !mt-0"
                placeholder="Category name"
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <input
                className="input-field !mt-0"
                placeholder="Description (optional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
              <button type="submit" className="btn-gold">Add</button>
            </form>
            <div className="space-y-3">
              {categories.map((cat) => (
                <article key={cat.id} className="card-editorial flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-app">{cat.name}</p>
                    <p className="text-xs text-muted">{cat.description || 'No description'} · {cat.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-decline"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${cat.name}?`)) return
                      try {
                        await adminApi.deleteCategory(cat.id)
                        showToast('Category deleted')
                        loadTab('categories')
                      } catch (err) {
                        showToast(err.message || 'Failed', 'error')
                      }
                    }}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
        </div>
      </div>

      {warrantyReport ? (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg">
            <p className="section-number">/ Warranty</p>
            <h3 className="heading-lg mt-2">
              Send warranty · Report #{warrantyReport.id}
            </h3>
            <p className="body-muted mt-2">
              Choose who to send to, then set the warranty start and end dates.
            </p>

            <form
              className="mt-6 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!warrantyStartDate || !warrantyEndDate) return
                if (warrantyEndDate < warrantyStartDate) {
                  showToast('End date must be on or after start date', 'error')
                  return
                }
                setWarrantySubmitting(true)
                try {
                  await adminApi.sendReportWarranty(warrantyReport.id, {
                    target: warrantyTarget,
                    start_date: warrantyStartDate,
                    end_date: warrantyEndDate,
                    message: warrantyMessage.trim() || null,
                  })
                  showToast('Warranty sent successfully!')
                  setWarrantyReport(null)
                  loadTab('reports')
                } catch (err) {
                  const details = err.errors ? Object.values(err.errors).flat().join(' ') : ''
                  showToast(details || err.message || 'Failed to send warranty', 'error')
                } finally {
                  setWarrantySubmitting(false)
                }
              }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Send to</p>
                <div className="mt-3 space-y-2">
                  {[
                    ['reporter', 'Reporter'],
                    ['reported', 'Reported user'],
                    ['both', 'Both'],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
                        warrantyTarget === value ? 'border-accent' : 'border-app'
                      }`}
                    >
                      <input
                        type="radio"
                        name="warranty-target"
                        value={value}
                        checked={warrantyTarget === value}
                        onChange={() => setWarrantyTarget(value)}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div
                className="inline-flex w-full flex-wrap items-center gap-2 rounded-xl border px-3 py-2"
                style={{
                  borderColor: 'var(--border)',
                  background: 'color-mix(in srgb, var(--bg-elevated) 88%, transparent)',
                }}
              >
                <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Date Range
                </span>
                <div className="h-5 w-px" style={{ background: 'var(--border)' }} />
                <label className="flex items-center gap-2 text-xs text-muted">
                  <span className="whitespace-nowrap">From</span>
                  <input
                    type="date"
                    required
                    className="rounded-lg border px-2.5 py-1.5 text-sm text-app outline-none transition focus:border-accent"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', minWidth: '148px' }}
                    value={warrantyStartDate}
                    onChange={(e) => setWarrantyStartDate(e.target.value)}
                  />
                </label>
                <span className="text-muted">—</span>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <span className="whitespace-nowrap">To</span>
                  <input
                    type="date"
                    required
                    className="rounded-lg border px-2.5 py-1.5 text-sm text-app outline-none transition focus:border-accent"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', minWidth: '148px' }}
                    value={warrantyEndDate}
                    min={warrantyStartDate || undefined}
                    onChange={(e) => setWarrantyEndDate(e.target.value)}
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-widest text-muted">
                Message (optional)
                <textarea
                  rows="3"
                  className="input-field resize-none mt-2"
                  value={warrantyMessage}
                  onChange={(e) => setWarrantyMessage(e.target.value)}
                  placeholder="Write what the warranty covers..."
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setWarrantyReport(null)}
                  disabled={warrantySubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-decline" disabled={warrantySubmitting}>
                  {warrantySubmitting ? 'Sending…' : 'Send Warranty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AppFooter />
      <Toast toast={toast} />
    </div>
  )
}
