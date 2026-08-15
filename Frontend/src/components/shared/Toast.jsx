export default function Toast({ toast }) {
  if (!toast) return null

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${
        toast.type === 'error'
          ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/90 dark:text-red-200'
          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
      }`}
      style={
        toast.type !== 'error'
          ? {
              borderColor: 'color-mix(in srgb, var(--success) 35%, var(--border))',
              background: 'color-mix(in srgb, var(--success) 10%, var(--bg-elevated))',
              color: 'var(--success)',
              whiteSpace: 'pre-line',
            }
          : {
              borderColor: 'color-mix(in srgb, var(--danger) 35%, var(--border))',
              background: 'color-mix(in srgb, var(--danger) 10%, var(--bg-elevated))',
              color: 'var(--danger)',
              whiteSpace: 'pre-line',
            }
      }
    >
      {toast.message}
    </div>
  )
}
