import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function ReviewModal({ job, onClose, onSubmit }) {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-md">
        <p className="section-number">/ Review</p>
        <h3 className="heading-lg mt-2">Rate {job.workerName}</h3>
        <p className="body-muted mt-2">Job #{job.id} · {job.title || job.issue}</p>
        <form
          className="mt-6 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitting(true)
            try {
              await onSubmit({ job_request_id: job.id, stars, comment: comment.trim() || null })
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Rating</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  className={`text-2xl ${n <= stars ? 'text-accent' : 'text-muted'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-muted">
            Comment (optional)
            <textarea rows="3" className="input-field resize-none" value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-gold">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
