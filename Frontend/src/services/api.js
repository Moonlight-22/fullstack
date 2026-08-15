const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

function getToken() {
  return localStorage.getItem('findace_token')
}

function setToken(token) {
  if (token) localStorage.setItem('findace_token', token)
  else localStorage.removeItem('findace_token')
}

function getStoredUser() {
  const raw = localStorage.getItem('findace_user')
  return raw ? JSON.parse(raw) : null
}

function setStoredUser(user) {
  if (user) localStorage.setItem('findace_user', JSON.stringify(user))
  else localStorage.removeItem('findace_user')
}

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err?.name === 'AbortError') {
      throw new Error('Cannot connect to the server. Make sure the backend is running on http://127.0.0.1:8000')
    }
    throw new Error('Cannot connect to the server. Make sure the backend is running on http://127.0.0.1:8000')
  }
  clearTimeout(timeoutId)

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data.message || 'Request failed'
    const errors = data.errors || {}
    const error = new Error(message)
    error.status = response.status
    error.errors = errors

    const isAuthPath = String(path).includes('/auth/login') || String(path).includes('/auth/register')
    if (!isAuthPath && (response.status === 401 || response.status === 403)) {
      const banUntil = Array.isArray(errors?.ban) ? errors.ban[0] : null
      window.dispatchEvent(
        new CustomEvent('findace:session-expired', {
          detail: {
            status: response.status,
            message,
            banUntil,
            suspended: Boolean(errors?.suspend),
          },
        }),
      )
    }

    throw error
  }

  return data
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(new Error(err.message || 'Unable to get location.')),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  })
}

export const authApi = {
  login: async (email, password) => {
    const res = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, device_name: 'web' }),
    })
    setToken(res.data.token)
    setStoredUser(res.data.user)
    return res.data
  },

  register: async (payload) => {
    const res = await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, device_name: 'web' }),
    })
    setToken(res.data.token)
    setStoredUser(res.data.user)
    return res.data
  },

  logout: async () => {
    try {
      await request('/v1/auth/logout', { method: 'POST' })
    } finally {
      setToken(null)
      setStoredUser(null)
    }
  },

  getProfile: () => request('/v1/auth/profile'),

  updateProfile: (payload) =>
    request('/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
}

export const categoryApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/v1/categories?${query}`)
  },
}

export const workerApi = {
  search: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/workers/search?${query}`)
  },

  show: (workerId) => request(`/v1/workers/${workerId}`),

  getProfile: () => request('/v1/worker/profile'),

  updateProfile: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value == null || value === '') return
      if (key === 'skills' && Array.isArray(value)) {
        value.forEach((skill) => formData.append('skills[]', skill))
      } else if (key === 'category_ids' && Array.isArray(value)) {
        value.forEach((id) => formData.append('category_ids[]', id))
      } else if ((key === 'portfolio_files' || key === 'portfolio_images') && Array.isArray(value)) {
        value.forEach((file) => formData.append('portfolio_files[]', file))
      } else if (key === 'profile_image' && value instanceof File) {
        formData.append('profile_image', value)
      } else if (!(value instanceof File) || key === 'profile_image') {
        formData.append(key, value)
      }
    })
    formData.append('_method', 'PUT')
    return request('/v1/worker/profile', { method: 'POST', body: formData })
  },
}

export const clientApi = {
  getProfile: () => request('/v1/client/profile'),

  updateProfile: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value == null || value === '') return
      formData.append(key, value)
    })
    formData.append('_method', 'PUT')
    return request('/v1/client/profile', { method: 'POST', body: formData })
  },

  bookings: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/v1/client/bookings?${query}`)
  },

  favorites: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/v1/client/favorites?${query}`)
  },

  checkFavorite: (workerId) => request(`/v1/client/favorites/check/${workerId}`),

  addFavorite: (workerId) =>
    request(`/v1/client/favorites/${workerId}`, { method: 'POST' }),

  removeFavorite: (workerId) =>
    request(`/v1/client/favorites/${workerId}`, { method: 'DELETE' }),
}

export const jobApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/v1/job-requests?${query}`)
  },

  create: (payload) =>
    request('/v1/job-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStatus: (id, status, note = '') =>
    request(`/v1/job-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
}

export const reviewApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/v1/reviews?${query}`)
  },

  create: (payload) =>
    request('/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

export const reportApi = {
  create: (payload) =>
    request('/v1/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

export const postApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/v1/posts?${query}`)
  },

  create: ({ content, image }) => {
    const formData = new FormData()
    formData.append('content', content)
    if (image) formData.append('image', image)
    return request('/v1/posts', { method: 'POST', body: formData })
  },

  remove: (id) => request(`/v1/posts/${id}`, { method: 'DELETE' }),

  toggleLike: (id) => request(`/v1/posts/${id}/like`, { method: 'POST' }),

  comments: (id, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/v1/posts/${id}/comments?${query}`)
  },

  addComment: (id, content) =>
    request(`/v1/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
}

export function mapWorker(profile) {
  return {
    id: profile.user_id,
    profileId: profile.id,
    name: profile.user?.name || 'Worker',
    profileImage: profile.user?.profile_image_url || null,
    category: profile.categories?.[0]?.name || 'General',
    categories: profile.categories || [],
    rating: Number(profile.average_rating || 0).toFixed(1),
    totalReviews: Number(profile.total_reviews || 0),
    completedJobs: Number(profile.completed_jobs_count || 0),
    township: profile.township || '—',
    bio: profile.bio || 'No bio provided yet.',
    lat: Number(profile.latitude || 16.81),
    lng: Number(profile.longitude || 96.15),
    hasLocation: profile.latitude != null && profile.longitude != null,
    hourlyRate: profile.hourly_rate,
    availability: profile.availability_status,
    distance: profile.distance != null ? Number(profile.distance) : null,
    portfolio: (profile.portfolio_images || []).map((item) => ({
      id: item.id,
      url: item.file_url || item.image_url || item.image_path,
      type: item.file_type || 'image',
      name: item.original_name || 'Portfolio file',
    })),
    skills: profile.skills || [],
  }
}

export function mapJob(job) {
  const statusMap = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const workerProfile = job.worker?.worker_profile
  const clientProfile = job.client?.client_profile
  const showContact = Boolean(job.show_contact)

  return {
    id: job.id,
    title: job.title,
    issue: job.description,
    address: job.address || '',
    client: job.client?.name || 'Client',
    workerName: job.worker?.name || 'Worker',
    clientPhone: showContact ? job.client?.phone_number || null : null,
    workerPhone: showContact ? job.worker?.phone_number || null : null,
    showContact,
    category: job.category?.name || 'General',
    date: job.requested_date,
    budget: Number(job.budget).toLocaleString() + ' MMK',
    budgetRaw: job.budget,
    status: statusMap[job.status] || job.status,
    statusRaw: job.status,
    workerId: job.worker_id,
    clientId: job.client_id,
    hasReview: Boolean(job.review),
    hasReported: Boolean(job.has_reported),
    review: job.review
      ? {
          stars: job.review.stars,
          comment: job.review.comment,
        }
      : null,
    jobLat: job.latitude != null ? Number(job.latitude) : null,
    jobLng: job.longitude != null ? Number(job.longitude) : null,
    workerLat: workerProfile?.latitude != null ? Number(workerProfile.latitude) : null,
    workerLng: workerProfile?.longitude != null ? Number(workerProfile.longitude) : null,
    clientLat:
      job.latitude != null
        ? Number(job.latitude)
        : clientProfile?.latitude != null
          ? Number(clientProfile.latitude)
          : null,
    clientLng:
      job.longitude != null
        ? Number(job.longitude)
        : clientProfile?.longitude != null
          ? Number(clientProfile.longitude)
          : null,
    warranties: job.warranties || [],
  }
}

export { getToken, setToken, getStoredUser, setStoredUser, API_URL, request }

export const adminApi = {
  dashboard: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/admin/dashboard?${query}`)
  },

  users: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/admin/users?${query}`)
  },

  suspendUser: (id) => request(`/v1/admin/users/${id}/suspend`, { method: 'POST' }),
  activateUser: (id) => request(`/v1/admin/users/${id}/activate`, { method: 'POST' }),
  deleteUser: (id) => request(`/v1/admin/users/${id}`, { method: 'DELETE' }),

  workers: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/admin/workers?${query}`)
  },

  jobs: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/admin/jobs?${query}`)
  },

  deleteJob: (id) => request(`/v1/admin/jobs/${id}`, { method: 'DELETE' }),

  reviews: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/admin/reviews?${query}`)
  },

  deleteReview: (id) => request(`/v1/admin/reviews/${id}`, { method: 'DELETE' }),

  reports: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/admin/reports?${query}`)
  },

  sendReportWarranty: (id, payload) =>
    request(`/v1/admin/reports/${id}/warranty`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  categories: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/categories?${query}`)
  },

  createCategory: (payload) =>
    request('/v1/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),

  updateCategory: (id, payload) =>
    request(`/v1/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteCategory: (id) => request(`/v1/admin/categories/${id}`, { method: 'DELETE' }),
}

export const notificationApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString()
    return request(`/v1/notifications?${query}`)
  },

  unreadCount: () => request('/v1/notifications/unread-count'),

  markAsRead: (id) =>
    request(`/v1/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllAsRead: () =>
    request('/v1/notifications/read-all', {
      method: 'POST',
    }),
}
