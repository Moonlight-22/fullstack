import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'

export const REPORT_REASONS = [
  { value: 'poor_quality', label: 'Poor quality work' },
  { value: 'incomplete_work', label: 'Incomplete work' },
  { value: 'unprofessional', label: 'Unprofessional behavior' },
  { value: 'rude_behavior', label: 'Rude or disrespectful' },
  { value: 'late_or_no_show', label: 'Late or no-show' },
  { value: 'pricing_dispute', label: 'Pricing / payment dispute' },
  { value: 'other', label: 'Other (write your own)' },
]

export default function ReportModal({ job, viewerRole, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const reportedName = viewerRole === 'client' ? job.workerName : job.client

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-md">
        <p className="section-number">/ Report</p>
        <h3 className="heading-lg mt-2">Report {reportedName}</h3>
        <p className="body-muted mt-2">
          Job #{job.id} · Not satisfied with this completed job? Tell us why.
        </p>

        <form
          className="mt-6 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            if (!reason) {
              setError('Please select a reason.')
              return
            }
            if (reason === 'other' && !customReason.trim()) {
              setError('Please write your reason.')
              return
            }
            setSubmitting(true)
            try {
              await onSubmit({
                job_request_id: job.id,
                reason,
                custom_reason: reason === 'other' ? customReason.trim() : customReason.trim() || null,
              })
            } catch (err) {
              setError(err.message || 'Failed to submit report')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Reason</p>
            <div className="mt-3 space-y-2">
              {REPORT_REASONS.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    reason === item.value ? 'border-accent text-app' : 'border-app text-muted'
                  }`}
                  style={reason === item.value ? { background: 'var(--accent-soft)' } : undefined}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                    className="accent-[var(--accent)]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {reason ? (
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted">
              {reason === 'other' ? 'Write your reason' : 'Extra details (optional)'}
              <textarea
                rows="3"
                className="input-field resize-none"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={reason === 'other' ? 'Describe what went wrong…' : 'Add more context…'}
                required={reason === 'other'}
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-decline">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
