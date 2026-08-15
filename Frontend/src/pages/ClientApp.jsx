import { useCallback, useEffect, useRef, useState } from 'react'
import CommunityFeed from '../components/CommunityFeed.jsx'
import ClientExperience from '../components/client/ClientExperience.jsx'
import ClientHistory from '../components/client/ClientHistory.jsx'
import ClientProfileEditor from '../components/client/ClientProfileEditor.jsx'
import ClientRequests from '../components/client/ClientRequests.jsx'
import JobRequestModal from '../components/client/JobRequestModal.jsx'
import ReviewModal from '../components/client/ReviewModal.jsx'
import SavedWorkers from '../components/client/SavedWorkers.jsx'
import WorkerProfileModal from '../components/client/WorkerProfileModal.jsx'
import ClientNavBar from '../components/layout/ClientNavBar.jsx'
import AppFooter from '../components/shared/AppFooter.jsx'
import ReportModal from '../components/shared/ReportModal.jsx'
import Toast from '../components/shared/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  categoryApi,
  clientApi,
  getCurrentPosition,
  jobApi,
  mapJob,
  mapWorker,
  notificationApi,
  reportApi,
  reviewApi,
  workerApi,
} from '../services/api.js'

export default function ClientApp({ onSignOut }) {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState('workers')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [jobModalWorker, setJobModalWorker] = useState(null)
  const [categories, setCategories] = useState([])
  const [workers, setWorkers] = useState([])
  const [clientRequests, setClientRequests] = useState([])
  const [searchName, setSearchName] = useState('')
  const [searchSkill, setSearchSkill] = useState('')
  const [myLocation, setMyLocation] = useState(null)
  const [searchRadius, setSearchRadius] = useState(25)
  const [mapStyle, setMapStyle] = useState('street')
  const [dataLoading, setDataLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [filterOpen, setFilterOpen] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [savedWorkers, setSavedWorkers] = useState([])
  const [reviewJob, setReviewJob] = useState(null)
  const [reportJob, setReportJob] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const lastWarrantyToastIdRef = useRef(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoryApi.list({ active_only: true, per_page: 50 })
      setCategories(res.data.items || [])
    } catch {
      setCategories([])
    }
  }, [])

  const loadWorkers = useCallback(async (overrides = {}) => {
    setDataLoading(true)
    try {
      const nameValue = overrides.name !== undefined ? overrides.name : searchName
      const skillValue = overrides.skill !== undefined ? overrides.skill : searchSkill
      const categoryValue = overrides.category !== undefined ? overrides.category : selectedCategory
      const radiusValue = overrides.radius !== undefined ? overrides.radius : searchRadius

      const hasTextSearch = Boolean(String(nameValue || '').trim() || String(skillValue || '').trim())
      const params = {
        sort_by: myLocation && !hasTextSearch ? 'nearest' : 'newest',
        per_page: 100,
      }
      if (categoryValue !== 'All') {
        const cat = categories.find((c) => c.name === categoryValue)
        if (cat) params.category_id = cat.id
      }
      if (String(nameValue || '').trim()) params.name = String(nameValue).trim()
      if (String(skillValue || '').trim()) params.skill = String(skillValue).trim()

      if (myLocation) {
        params.latitude = myLocation.latitude
        params.longitude = myLocation.longitude
        if (!hasTextSearch) params.radius = radiusValue
      }

      const res = await workerApi.search(params)
      setWorkers((res.data.items || []).map(mapWorker))
    } catch (err) {
      showToast(err.message || 'Failed to load workers', 'error')
    } finally {
      setDataLoading(false)
    }
  }, [selectedCategory, searchName, searchSkill, categories, myLocation, searchRadius])

  const loadClientRequests = useCallback(async () => {
    try {
      const res = await clientApi.bookings({ per_page: 50 })
      setClientRequests((res.data.items || []).map(mapJob))
    } catch (err) {
      showToast(err.message || 'Failed to load requests', 'error')
    }
  }, [])

  const cancelRequest = async (job) => {
    if (!window.confirm(`Cancel request #${job.id}?`)) return
    setCancellingId(job.id)
    try {
      await jobApi.updateStatus(job.id, 'cancelled', 'Cancelled by client')
      showToast('Request cancelled')
      await loadClientRequests()
    } catch (err) {
      showToast(err.message || 'Failed to cancel request', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  const shareMyLocation = async () => {
    try {
      const coords = await getCurrentPosition()
      setMyLocation(coords)
      await clientApi.updateProfile({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      showToast(`Location shared. Showing workers within ${searchRadius} km.`)
    } catch (err) {
      showToast(err.message || 'Could not get location', 'error')
    }
  }

  const toggleFavorite = async (workerId) => {
    try {
      if (favoriteIds.has(workerId)) {
        await clientApi.removeFavorite(workerId)
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(workerId)
          return next
        })
        setSavedWorkers((prev) => prev.filter((w) => w.id !== workerId))
        showToast('Removed from saved workers')
      } else {
        await clientApi.addFavorite(workerId)
        setFavoriteIds((prev) => new Set(prev).add(workerId))
        const worker = workers.find((w) => w.id === workerId)
        if (worker) {
          setSavedWorkers((prev) => [...prev, { id: worker.id, name: worker.name, profile_image_url: worker.profileImage }])
        }
        showToast('Worker saved!')
      }
    } catch (err) {
      showToast(err.message || 'Failed to update saved worker', 'error')
    }
  }

  useEffect(() => {
    clientApi
      .getProfile()
      .then((res) => {
        const lat = res.data?.latitude
        const lng = res.data?.longitude
        if (lat != null && lng != null) {
          setMyLocation({ latitude: Number(lat), longitude: Number(lng) })
        }
      })
      .catch(() => {})
  }, [user?.id, loadClientRequests])

  useEffect(() => {
    clientApi
      .favorites({ per_page: 100 })
      .then((res) => {
        const items = res.data.items || []
        setSavedWorkers(items)
        setFavoriteIds(new Set(items.map((w) => w.id)))
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    let isChecking = false
    const intervalMs = 15000

    const checkNotifications = async () => {
      if (cancelled || isChecking) return
      isChecking = true

      try {
        const countRes = await notificationApi.unreadCount()
        const unreadCount = countRes?.data?.count ?? 0
        if (unreadCount <= 0) return

        const res = await notificationApi.list({ per_page: 25 })
        const items = res?.data?.items || res?.data?.data || []

        const unread = items.filter((n) => !n?.read_at)
        if (unread.length === 0) return

        const latest = unread[0]
        const data = latest?.data || {}

        if (latest?.id && latest.id === lastWarrantyToastIdRef.current) return
        lastWarrantyToastIdRef.current = latest?.id ?? null

        let toastMessage = data?.message || 'You have a new notification.'
        if (data?.type === 'job_warranty_sent') {
          const start = data.warranty_started_at ? String(data.warranty_started_at).slice(0, 10) : ''
          const end = data.warranty_ended_at ? String(data.warranty_ended_at).slice(0, 10) : ''
          const range = start || end ? ` (${start || '—'} → ${end || '—'})` : ''
          const messageText = data?.message ? String(data.message) : ''
          toastMessage = `Admin sent a warranty${range}${messageText ? ` · ${messageText}` : ''}`
        } else if (String(data?.type || '').startsWith('job_status_')) {
          toastMessage = data?.message || `Job status updated: ${data?.status || ''}`.trim()
        } else if (data?.type === 'new_job_request') {
          toastMessage = data?.message || 'You received a new job request.'
        }

        showToast(toastMessage, data?.type === 'job_warranty_sent' ? 'success' : 'info')

        try {
          await notificationApi.markAsRead(latest.id)
        } catch {
          // ignore mark-as-read failures
        }

        try {
          await loadClientRequests()
        } catch {
          // ignore refresh failures
        }
      } catch {
        // ignore notification fetch failures
      } finally {
        isChecking = false
      }
    }

    checkNotifications()
    const intervalId = setInterval(checkNotifications, intervalMs)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [user?.id, loadClientRequests])

  useEffect(() => {
    if (tab === 'workers') loadWorkers()
  }, [tab, loadWorkers])

  useEffect(() => {
    if (tab === 'requests' || tab === 'history') loadClientRequests()
  }, [tab, loadClientRequests])

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <ClientNavBar
        userName={user.name}
        userRole={user.role}
        userImage={user.profile_image_url}
        activeTab={tab}
        setActiveTab={setTab}
        onSignOut={onSignOut}
      />

      <main className="flex-1 p-4 md:p-10">
        {tab === 'workers' ? (
          <ClientExperience
            workers={workers}
            categories={categories}
            dataLoading={dataLoading}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchName={searchName}
            setSearchName={setSearchName}
            searchSkill={searchSkill}
            setSearchSkill={setSearchSkill}
            searchRadius={searchRadius}
            setSearchRadius={setSearchRadius}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            onSearch={loadWorkers}
            myLocation={myLocation}
            onShareLocation={shareMyLocation}
            setSelectedWorker={setSelectedWorker}
            setJobModalWorker={setJobModalWorker}
            filterOpen={filterOpen}
            onToggleFilter={() => setFilterOpen((v) => !v)}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        ) : tab === 'feed' ? (
          <CommunityFeed user={user} onSuccess={(msg) => showToast(msg)} onError={(msg) => showToast(msg, 'error')} />
        ) : tab === 'saved' ? (
          <SavedWorkers
            workers={savedWorkers}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onRequest={(worker) => setJobModalWorker(worker)}
            onView={(worker) => setSelectedWorker(worker)}
          />
        ) : tab === 'profile' ? (
          <ClientProfileEditor
            user={user}
            setUser={setUser}
            onSuccess={showToast}
            onShareLocation={shareMyLocation}
            myLocation={myLocation}
          />
        ) : tab === 'history' ? (
          <ClientHistory
            requests={clientRequests}
            onRefresh={loadClientRequests}
            onReview={(job) => setReviewJob(job)}
            onReport={(job) => setReportJob(job)}
          />
        ) : (
          <ClientRequests
            requests={clientRequests}
            onRefresh={loadClientRequests}
            onReview={(job) => setReviewJob(job)}
            onCancel={cancelRequest}
            cancellingId={cancellingId}
          />
        )}
      </main>

      <AppFooter />
      <Toast toast={toast} />

      {selectedWorker ? (
        <WorkerProfileModal
          worker={selectedWorker}
          isSaved={favoriteIds.has(selectedWorker.id)}
          onToggleFavorite={() => toggleFavorite(selectedWorker.id)}
          onClose={() => setSelectedWorker(null)}
          onRequestJob={() => {
            setJobModalWorker(selectedWorker)
            setSelectedWorker(null)
          }}
        />
      ) : null}

      {reviewJob ? (
        <ReviewModal
          job={reviewJob}
          onClose={() => setReviewJob(null)}
          onSubmit={async (payload) => {
            try {
              await reviewApi.create(payload)
              showToast('Review submitted!')
              setReviewJob(null)
              loadClientRequests()
            } catch (err) {
              showToast(err.message || 'Failed to submit review', 'error')
            }
          }}
        />
      ) : null}

      {reportJob ? (
        <ReportModal
          job={reportJob}
          viewerRole="client"
          onClose={() => setReportJob(null)}
          onSubmit={async (payload) => {
            await reportApi.create(payload)
            showToast('Report submitted. Our team will review it.')
            setReportJob(null)
            loadClientRequests()
          }}
        />
      ) : null}

      {jobModalWorker ? (
        <JobRequestModal
          worker={jobModalWorker}
          onClose={() => setJobModalWorker(null)}
          onSend={async (payload) => {
            try {
              const cat =
                categories.find((c) => c.name === jobModalWorker.category) ||
                jobModalWorker.categories?.[0]
              const body = {
                worker_id: jobModalWorker.id,
                category_id: cat?.id || null,
                title: payload.title || `Job for ${jobModalWorker.name}`,
                description: payload.description,
                budget: parseFloat(payload.budget) || 0,
                requested_date: payload.preferredDate,
              }
              if (payload.address?.trim()) body.address = payload.address.trim()
              if (payload.latitude != null && payload.longitude != null) {
                body.latitude = payload.latitude
                body.longitude = payload.longitude
              }
              await jobApi.create(body)
              showToast('Job request sent! Worker phone will appear in Requests.')
              setTab('requests')
              loadClientRequests()
              setJobModalWorker(null)
            } catch (err) {
              const details = err.errors ? Object.values(err.errors).flat().join(' ') : ''
              showToast(details || err.message || 'Failed to send request', 'error')
            }
          }}
        />
      ) : null}
    </div>
  )
}
