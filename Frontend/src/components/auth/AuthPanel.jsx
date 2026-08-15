import { useEffect, useState } from 'react'
import { Loader2, Moon, Navigation, Sun } from 'lucide-react'
import AppFooter from '../shared/AppFooter.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { categoryApi, getCurrentPosition } from '../../services/api.js'

export default function AuthPanel({ onSuccess }) {
  const { login, register, sessionNotice, clearSessionNotice } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [authRole, setAuthRole] = useState('client')
  const [authMode, setAuthMode] = useState('signin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    township: '',
    category_ids: [],
    latitude: null,
    longitude: null,
  })

  useEffect(() => {
    if (sessionNotice) {
      setError(sessionNotice)
      clearSessionNotice?.()
    }
  }, [sessionNotice, clearSessionNotice])

  useEffect(() => {
    if (authMode !== 'register' || authRole !== 'worker') return
    categoryApi
      .list({ per_page: 100, active_only: 1 })
      .then((res) => setCategories(res.data?.items || []))
      .catch(() => setCategories([]))
  }, [authMode, authRole])

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

  const shareLocation = async () => {
    try {
      const coords = await getCurrentPosition()
      setForm((prev) => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (authMode === 'signin') {
        await login(form.email, form.password)
        onSuccess?.('Welcome back!')
      } else {
        if (authRole === 'worker' && form.category_ids.length === 0) {
          setError('Workers must choose at least one skill category.')
          setSubmitting(false)
          return
        }

        const selectedSkills = categories
          .filter((cat) => form.category_ids.includes(cat.id))
          .map((cat) => cat.name)

        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          role: authRole,
          phone_number: form.phone || null,
          township: form.township || null,
          category_ids: authRole === 'worker' ? form.category_ids : undefined,
          skills: authRole === 'worker' ? selectedSkills : undefined,
          latitude: form.latitude,
          longitude: form.longitude,
        })
        onSuccess?.('Account created successfully!')
      }
    } catch (err) {
      const msg = err.errors ? Object.values(err.errors).flat().join(' ') : err.message
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="surface flex items-center justify-between border-b px-8 py-6 md:px-16" style={{ borderColor: 'var(--border)' }}>
        <p className="section-tag">Find Ace</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} className="btn-outline" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <nav className="hidden items-center gap-2 sm:flex">
            <button type="button" onClick={() => setAuthMode('signin')} className={`nav-item ${authMode === 'signin' ? 'nav-item-active' : ''}`}>Sign In</button>
            <button type="button" onClick={() => setAuthMode('register')} className={`nav-item ${authMode === 'register' ? 'nav-item-active' : ''}`}>Register</button>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <section className="surface w-full max-w-4xl overflow-hidden rounded-2xl">
          <div className="grid md:grid-cols-2">
            <div className="border-b p-8 md:border-r md:border-b-0 md:p-12" style={{ borderColor: 'var(--border)' }}>
              <p className="section-number">/ 01</p>
              <h2 className="heading-xl mt-3">Welcome</h2>
              <p className="body-muted mt-4 max-w-sm">Find trusted local pros, request jobs, and track routes on the map.</p>
              {authMode === 'register' ? (
                <div className="role-toggle mt-10">
                  <button type="button" onClick={() => setAuthRole('client')} className={`role-option ${authRole === 'client' ? 'role-option-active' : ''}`}>Client</button>
                  <button type="button" onClick={() => setAuthRole('worker')} className={`role-option ${authRole === 'worker' ? 'role-option-active' : ''}`}>Worker</button>
                </div>
              ) : (
                <p className="mt-10 text-sm text-muted">Sign in with your account. Your role is detected automatically.</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-12">
              <p className="section-number">/ 02</p>
              <h3 className="heading-lg mt-3">{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h3>
              {error ? (
                <p className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
                  {error}
                </p>
              ) : null}

              <div className="mt-8 space-y-5">
                {authMode === 'register' ? (
                  <label className="block text-xs font-medium uppercase tracking-widest text-muted">
                    Full Name
                    <input className="input-field" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </label>
                ) : null}

                <label className="block text-xs font-medium uppercase tracking-widest text-muted">
                  Email
                  <input className="input-field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>

                {authMode === 'register' ? (
                  <label className="block text-xs font-medium uppercase tracking-widest text-muted">
                    Phone Number
                    <input className="input-field" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </label>
                ) : null}

                <label className="block text-xs font-medium uppercase tracking-widest text-muted">
                  Password
                  <input className="input-field" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </label>

                {authMode === 'register' ? (
                  <>
                    <label className="block text-xs font-medium uppercase tracking-widest text-muted">
                      Confirm Password
                      <input className="input-field" type="password" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                    </label>

                    <label className="block text-xs font-medium uppercase tracking-widest text-muted">
                      Township
                      <input className="input-field" type="text" placeholder="e.g., Kamayut" value={form.township} onChange={(e) => setForm({ ...form, township: e.target.value })} />
                    </label>

                    {authRole === 'worker' ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-muted">Skill Categories *</p>
                        <p className="mt-1 text-xs text-muted">Choose from available service categories.</p>
                        <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
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
                    ) : null}

                    <button type="button" onClick={shareLocation} className="btn-ghost flex w-full items-center justify-center gap-2">
                      <Navigation size={14} />
                      {form.latitude ? `Location set (${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)})` : 'Share my location (OpenStreetMap)'}
                    </button>
                  </>
                ) : null}
              </div>

              <button type="submit" disabled={submitting} className="btn-gold mt-10 flex w-full items-center justify-center gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {authMode === 'signin' ? 'Sign In' : 'Register'}
              </button>
              <p className="mt-6 text-center text-xs text-muted">
                {authMode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
                <button type="button" className="link-gold" onClick={() => { setAuthMode(authMode === 'signin' ? 'register' : 'signin'); setError('') }}>
                  {authMode === 'signin' ? 'Create Account' : 'Sign In'}
                </button>
              </p>
            </form>
          </div>
        </section>
      </div>
      <AppFooter />
    </div>
  )
}
