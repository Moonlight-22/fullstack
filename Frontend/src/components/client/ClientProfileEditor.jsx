import { useEffect, useState } from 'react'
import { Loader2, Navigation, UserRound } from 'lucide-react'
import { clientApi } from '../../services/api.js'

export default function ClientProfileEditor({ user, setUser, onSuccess, onShareLocation, myLocation }) {
  const [form, setForm] = useState({ name: user?.name || '', township: '', address: '', latitude: '', longitude: '' })
  const [profileImage, setProfileImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(user?.profile_image_url || null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    clientApi.getProfile().then((res) => {
      const p = res.data
      setForm({
        name: p.user?.name || user?.name || '',
        township: p.township || '',
        address: p.address || '',
        latitude: p.latitude || '',
        longitude: p.longitude || '',
      })
      setPreviewUrl(p.user?.profile_image_url || user?.profile_image_url || null)
    }).catch(() => {})
  }, [user])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (profileImage) payload.profile_image = profileImage
      const res = await clientApi.updateProfile(payload)
      if (res.data?.user) {
        setUser(res.data.user)
        setPreviewUrl(res.data.user.profile_image_url || previewUrl)
      } else {
        setUser({ ...user, name: form.name })
      }
      setProfileImage(null)
      onSuccess('Client profile saved!')
    } catch (err) {
      onSuccess(err.message || 'Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-app surface p-6 md:p-8">
      <p className="section-number">/ Profile</p>
      <h2 className="heading-xl mt-2">Client Profile</h2>
      <p className="body-muted mt-2">Update your photo, name, and share your location.</p>

      <form onSubmit={save} className="mt-8 max-w-xl space-y-5">
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
          Township
          <input type="text" className="input-field" value={form.township} onChange={(e) => setForm({ ...form, township: e.target.value })} />
        </label>
        <label className="block text-xs font-medium uppercase tracking-widest text-muted">
          Address
          <input type="text" className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>

        <button type="button" onClick={onShareLocation} className="btn-ghost flex items-center gap-2">
          <Navigation size={14} />
          {myLocation || form.latitude ? 'Update Shared Location' : 'Share My Location'}
        </button>
        {(myLocation || form.latitude) ? (
          <p className="text-xs text-emerald-300">
            Lat: {Number(myLocation?.latitude || form.latitude).toFixed(5)}, Lng: {Number(myLocation?.longitude || form.longitude).toFixed(5)}
          </p>
        ) : null}

        <button type="submit" disabled={saving} className="btn-gold flex items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Save Profile
        </button>
      </form>
    </div>
  )
}
