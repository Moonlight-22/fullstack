import { useEffect, useState } from 'react'
import L from 'leaflet'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Bookmark, Loader2, MapPin, Navigation, PanelLeftClose, PanelLeftOpen, Search, Star, UserRound, X } from 'lucide-react'
import { RecenterMap } from '../shared/JobRouteMap.jsx'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

export default function ClientExperience({
  workers,
  categories,
  dataLoading,
  selectedCategory,
  setSelectedCategory,
  searchName,
  setSearchName,
  searchSkill,
  setSearchSkill,
  searchRadius,
  setSearchRadius,
  mapStyle,
  setMapStyle,
  onSearch,
  myLocation,
  onShareLocation,
  setSelectedWorker,
  setJobModalWorker,
  filterOpen,
  onToggleFilter,
  favoriteIds,
  onToggleFavorite,
}) {
  const [nameDraft, setNameDraft] = useState(searchName)
  const [skillDraft, setSkillDraft] = useState(searchSkill)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setNameDraft(searchName)
  }, [searchName])

  useEffect(() => {
    setSkillDraft(searchSkill)
  }, [searchSkill])

  // Live search while typing (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameDraft !== searchName) setSearchName(nameDraft)
      if (skillDraft !== searchSkill) setSearchSkill(skillDraft)
    }, 400)
    return () => clearTimeout(timer)
  }, [nameDraft, skillDraft, searchName, searchSkill, setSearchName, setSearchSkill])

  const runSearch = async () => {
    const name = nameDraft.trim()
    const skill = skillDraft.trim()
    setSearching(true)
    setSearchName(name)
    setSearchSkill(skill)
    try {
      await onSearch({ name, skill })
    } finally {
      setSearching(false)
    }
  }

  const clearFilters = () => {
    setNameDraft('')
    setSkillDraft('')
    setSearchName('')
    setSearchSkill('')
    setSelectedCategory('All')
    setSearchRadius(25)
  }

  const activeFilters = [
    selectedCategory !== 'All' ? selectedCategory : null,
    nameDraft.trim() ? `Name: ${nameDraft.trim()}` : null,
    skillDraft.trim() ? `Skill: ${skillDraft.trim()}` : null,
    myLocation ? `${searchRadius} km` : null,
  ].filter(Boolean)

  const mapCenter = myLocation
    ? [myLocation.latitude, myLocation.longitude]
    : [16.81, 96.15]

  const streetUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-number">/ 01</p>
          <h2 className="heading-xl mt-2">Nearby Professionals</h2>
          <p className="body-muted mt-2">
            {dataLoading
              ? 'Updating results…'
              : myLocation
                ? `${workers.length} worker${workers.length === 1 ? '' : 's'} within ${searchRadius} km`
                : `${workers.length} worker${workers.length === 1 ? '' : 's'} found — share location for nearby results`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <span key={f} className="filter-chip" style={{ cursor: 'default' }}>{f}</span>
            ))}
            <button type="button" onClick={clearFilters} className="btn-ghost">Clear</button>
            <button
              type="button"
              onClick={onToggleFilter}
              className="btn-ghost inline-flex items-center gap-1.5"
            >
              {filterOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              {filterOpen ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-app">
            <button
              type="button"
              onClick={() => setMapStyle('street')}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${mapStyle === 'street' ? 'text-app' : 'text-muted'}`}
              style={mapStyle === 'street' ? { background: 'var(--accent-soft)' } : undefined}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${mapStyle === 'satellite' ? 'text-app' : 'text-muted'}`}
              style={mapStyle === 'satellite' ? { background: 'var(--accent-soft)' } : undefined}
            >
              Satellite
            </button>
          </div>
          <button type="button" onClick={onShareLocation} className="btn-ghost flex items-center gap-2">
            <Navigation size={14} /> Share My Location
          </button>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">{workers.length} found</span>
        </div>
      </div>

      <div className={`grid gap-0 ${filterOpen ? 'lg:grid-cols-[280px_1fr]' : 'grid-cols-1'}`}>
        {filterOpen ? (
          <aside className="filter-panel border border-app surface p-5 lg:border-r-0 slide-fade">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="section-tag">Filters</p>
                <p className="mt-1 text-sm font-semibold text-app">Find workers</p>
              </div>
              <button type="button" onClick={onToggleFilter} className="btn-ghost p-1" aria-label="Close filters">
                <X size={16} />
              </button>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted">Nearby Radius</p>
            <select
              className="input-field mt-2"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={300}>300 km</option>
            </select>

            <div className="divider-h my-5" />

            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Categories</p>
            <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`filter-chip ${selectedCategory === 'All' ? 'filter-chip-active' : ''}`}
              >
                All Services
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`filter-chip ${selectedCategory === cat.name ? 'filter-chip-active' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="divider-h my-5" />

            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Find by Name</p>
            <label className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="text"
                className="input-field !mt-0 pl-9"
                placeholder="Worker name..."
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
              />
            </label>

            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted">Find by Skill</p>
            <label className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="text"
                className="input-field !mt-0 pl-9"
                placeholder="e.g., Wiring..."
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
              />
            </label>

            <button type="button" onClick={runSearch} disabled={searching || dataLoading} className="btn-gold mt-5 w-full">
              {(searching || dataLoading) ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search Workers
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Results update as you type. Categories and radius apply instantly.
            </p>
            {!myLocation ? (
              <button type="button" onClick={onShareLocation} className="btn-outline mt-3 w-full">
                <Navigation size={14} /> Share location
              </button>
            ) : null}
          </aside>
        ) : null}

        <div className="border border-app surface">
          {dataLoading && workers.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center"><Loader2 className="animate-spin text-accent" size={28} /></div>
          ) : (
            <div className="grid xl:grid-cols-[1fr_300px]">
              <div className="relative h-[420px] border-b border-app xl:border-r xl:border-b-0">
                {dataLoading ? (
                  <div className="absolute right-3 top-3 z-[1000] rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    Updating…
                  </div>
                ) : null}
                <MapContainer center={mapCenter} zoom={myLocation ? 13 : 12} className="h-full w-full">
                  <TileLayer
                    key={mapStyle}
                    attribution={
                      mapStyle === 'satellite'
                        ? 'Tiles &copy; Esri'
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    }
                    url={mapStyle === 'satellite' ? satelliteUrl : streetUrl}
                  />
                  <RecenterMap lat={myLocation?.latitude} lng={myLocation?.longitude} />
                  {myLocation ? (
                    <CircleMarker center={[myLocation.latitude, myLocation.longitude]} radius={10} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.8 }}>
                      <Popup>Your location</Popup>
                    </CircleMarker>
                  ) : null}
                  {workers.map((worker) => (
                    <Marker key={worker.id} position={[worker.lat, worker.lng]}>
                      <Popup>
                        <div className="min-w-[140px]">
                          {worker.profileImage ? (
                            <img src={worker.profileImage} alt="" className="mb-2 h-12 w-12 rounded-full object-cover" />
                          ) : null}
                          <p className="font-semibold">{worker.name}</p>
                          <p>{worker.category}</p>
                          {worker.distance != null ? <p className="text-xs">{worker.distance.toFixed(1)} km away</p> : null}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-4">
                {workers.length === 0 ? (
                  <p className="text-sm text-muted">
                    {myLocation
                      ? 'No workers found nearby. Try a larger radius or search by name.'
                      : 'No workers found. Share your location or search by name/skill.'}
                  </p>
                ) : (
                  workers.map((worker) => (
                    <article key={worker.id} className="card-editorial mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          {worker.profileImage ? (
                            <img src={worker.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="grid h-10 w-10 place-items-center rounded-full surface-muted text-muted">
                              <UserRound size={16} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-app">{worker.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-xs text-muted">{worker.category}</p>
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                              style={{
                                background: worker.availability === 'available'
                                  ? 'color-mix(in srgb, #22c55e 18%, transparent)'
                                  : worker.availability === 'busy'
                                    ? 'color-mix(in srgb, #f59e0b 18%, transparent)'
                                    : 'color-mix(in srgb, var(--text-muted) 18%, transparent)',
                                color: worker.availability === 'available'
                                  ? '#22c55e'
                                  : worker.availability === 'busy'
                                    ? '#f59e0b'
                                    : 'var(--text-muted)',
                              }}
                            >
                              {worker.availability || 'available'}
                            </span>
                          </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-accent">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-medium">{worker.rating}</span>
                        </div>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                        <MapPin size={12} /> {worker.township}
                        {worker.distance != null ? ` · ${worker.distance.toFixed(1)} km` : ''}
                      </p>
                      {worker.skills?.length ? (
                        <p className="mt-2 text-[11px] text-accent">{worker.skills.slice(0, 4).join(' · ')}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => setSelectedWorker(worker)} className="link-gold">View Profile</button>
                        {worker.availability === 'offline' ? (
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">Offline — can't request</span>
                        ) : (
                          <button type="button" onClick={() => setJobModalWorker(worker)} className="btn-ghost">Request</button>
                        )}
                        <button type="button" onClick={() => onToggleFavorite(worker.id)} className={`btn-ghost flex items-center gap-1 ${favoriteIds.has(worker.id) ? 'text-accent' : ''}`}>
                          <Bookmark size={14} fill={favoriteIds.has(worker.id) ? 'currentColor' : 'none'} />
                          {favoriteIds.has(worker.id) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                      {worker.availability === 'busy' ? (
                        <p className="mt-2 text-[11px] text-amber-400">Worker is busy — expect a short wait for acceptance.</p>
                      ) : null}
                      <p className="mt-2 text-[11px] text-muted">
                        ★ {worker.rating} · {worker.totalReviews || 0} reviews · {worker.completedJobs || 0} jobs
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
