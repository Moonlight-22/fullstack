import { useCallback, useEffect, useRef, useState } from 'react'
import CommunityFeed from '../components/CommunityFeed.jsx'
import WorkerNavBar from '../components/layout/WorkerNavBar.jsx'
import AppFooter from '../components/shared/AppFooter.jsx'
import ReportModal from '../components/shared/ReportModal.jsx'
import Toast from '../components/shared/Toast.jsx'
import WorkerExperience from '../components/worker/WorkerExperience.jsx'
import WorkerHistory from '../components/worker/WorkerHistory.jsx'
import WorkerProfileEditor from '../components/worker/WorkerProfileEditor.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getCurrentPosition, jobApi, mapJob, notificationApi, reportApi, workerApi } from '../services/api.js'

export default function WorkerApp({ onSignOut }) {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState('jobs')
  const [workerJobs, setWorkerJobs] = useState([])
  const [myLocation, setMyLocation] = useState(null)
  const [toast, setToast] = useState(null)
  const [reportJob, setReportJob] = useState(null)
  const lastWarrantyToastIdRef = useRef(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadWorkerJobs = useCallback(async () => {
    try {
      const res = await jobApi.list({ per_page: 50 })
      setWorkerJobs((res.data.items || []).map(mapJob))
    } catch (err) {
      showToast(err.message || 'Failed to load jobs', 'error')
    }
  }, [])

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
          await loadWorkerJobs()
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
  }, [user?.id, loadWorkerJobs])

  const shareMyLocation = async () => {
    try {
      const coords = await getCurrentPosition()
      setMyLocation(coords)
      await workerApi.updateProfile({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      showToast('Your work location was shared on the map.')
    } catch (err) {
      showToast(err.message || 'Could not get location', 'error')
    }
  }

  useEffect(() => {
    if (tab === 'jobs' || tab === 'history') loadWorkerJobs()
  }, [tab, loadWorkerJobs])

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <WorkerNavBar
        userName={user.name}
        userRole={user.role}
        userImage={user.profile_image_url}
        activeTab={tab}
        setActiveTab={setTab}
        onSignOut={onSignOut}
      />

      <main className="flex-1 p-4 md:p-10">
        {tab === 'jobs' ? (
          <WorkerExperience
            jobs={workerJobs}
            onRefresh={loadWorkerJobs}
            onUpdateStatus={async (jobId, status) => {
              try {
                await jobApi.updateStatus(jobId, status)
                showToast(status === 'completed' ? 'Job completed. You can report from History if needed.' : 'Job status updated')
                loadWorkerJobs()
                if (status === 'completed') setTab('history')
              } catch (err) {
                showToast(err.message || 'Failed to update status', 'error')
              }
            }}
          />
        ) : tab === 'feed' ? (
          <CommunityFeed user={user} onSuccess={(msg) => showToast(msg)} onError={(msg) => showToast(msg, 'error')} />
        ) : tab === 'history' ? (
          <WorkerHistory
            jobs={workerJobs}
            onRefresh={loadWorkerJobs}
            onReport={(job) => setReportJob(job)}
          />
        ) : (
          <WorkerProfileEditor
            user={user}
            setUser={setUser}
            onSuccess={showToast}
            onShareLocation={shareMyLocation}
            myLocation={myLocation}
          />
        )}
      </main>

      <AppFooter />
      <Toast toast={toast} />

      {reportJob ? (
        <ReportModal
          job={reportJob}
          viewerRole="worker"
          onClose={() => setReportJob(null)}
          onSubmit={async (payload) => {
            await reportApi.create(payload)
            showToast('Report submitted. Our team will review it.')
            setReportJob(null)
            loadWorkerJobs()
          }}
        />
      ) : null}
    </div>
  )
}
