import { useEffect, useState } from 'react'
import { BriefcaseBusiness, Bookmark, FileText, Loader2, Navigation, Search, Star, UserRound, X } from 'lucide-react'
import { getCurrentPosition } from '../../services/api.js'

export default function JobRequestModal({ worker, onClose, onSend }) {
  const [description, setDescription] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [budget, setBudget] = useState('')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const shareLocation = async () => {
    setFormError('')
    setLocating(true)
    try {
      const position = await getCurrentPosition()
      setCoords(position)
      if (!address.trim()) {
        setAddress(`Shared GPS (${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)})`)
      }
    } catch (err) {
      setFormError(err.message || 'Could not get location')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-lg">
        <p className="section-number">/ Request</p>
        <h3 className="heading-lg mt-2">Job for {worker.name}</h3>
        <p className="body-muted mt-2">Enter a text address or share your GPS location (or both).</p>
        {worker.availability === 'busy' ? (
          <p className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in srgb, #f59e0b 14%, transparent)', color: '#f59e0b' }}>
            This worker is busy. You can still send a request — please wait a little for them to accept.
          </p>
        ) : null}
        {worker.availability === 'offline' ? (
          <p className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
            This worker is offline and cannot receive requests right now.
          </p>
        ) : null}
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            setFormError('')
            if (worker.availability === 'offline') {
              setFormError('This worker is offline and cannot receive requests.')
              return
            }
            if (!address.trim() && !coords) {
              setFormError('Please enter a text address or share your location.')
              return
            }
            setSubmitting(true)
            try {
              await onSend({
                description,
                preferredDate,
                budget,
                address: address.trim(),
                latitude: coords?.latitude ?? null,
                longitude: coords?.longitude ?? null,
                title: `Service request - ${worker.category}`,
              })
            } finally {
              setSubmitting(false)
            }
          }}
          className="mt-8 space-y-5"
        >
          {formError ? (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
              {formError}
            </p>
          ) : null}
          <label className="block text-xs font-medium uppercase tracking-widest text-muted">
            Job Description
            <textarea rows="4" required className="input-field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium uppercase tracking-widest text-muted">
              Preferred Date
              <input type="date" required min={today} className="input-field" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
            </label>
            <label className="block text-xs font-medium uppercase tracking-widest text-muted">
              Budget (MMK)
              <input type="number" required min="0" className="input-field" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </label>
          </div>
          <label className="block text-xs font-medium uppercase tracking-widest text-muted">
            Text Address
            <input
              type="text"
              className="input-field"
              placeholder="e.g. No.12, Pyay Road, Yangon"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <div className="surface-muted rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Or share location</p>
                <p className="mt-1 text-xs text-muted">
                  {coords
                    ? `Lat ${coords.latitude.toFixed(5)}, Lng ${coords.longitude.toFixed(5)}`
                    : 'Use GPS so the worker can navigate to you.'}
                </p>
              </div>
              <button type="button" onClick={shareLocation} disabled={locating} className="btn-outline">
                {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                {coords ? 'Update GPS' : 'Share Location'}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting || worker.availability === 'offline'} className="btn-gold flex items-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
