import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, getStoredUser, getToken, setStoredUser, setToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser())
  const [loading, setLoading] = useState(!!getToken())
  const [sessionNotice, setSessionNotice] = useState(null)

  const clearSession = (notice = null) => {
    setToken(null)
    setStoredUser(null)
    setUser(null)
    if (notice) setSessionNotice(notice)
  }

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    authApi
      .getProfile()
      .then((res) => {
        setUser(res.data)
        setStoredUser(res.data)
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = (event) => {
      const detail = event?.detail || {}
      let notice = detail.message || 'Your session ended. Please sign in again.'
      if (detail.banUntil) {
        notice = `Your account is temporarily banned until ${detail.banUntil}.`
      } else if (detail.suspended) {
        notice = 'Your account has been suspended by an admin.'
      }
      clearSession(notice)
    }

    window.addEventListener('findace:session-expired', onExpired)
    return () => window.removeEventListener('findace:session-expired', onExpired)
  }, [])

  const login = async (email, password) => {
    setSessionNotice(null)
    const data = await authApi.login(email, password)
    setUser(data.user)
    return data
  }

  const register = async (payload) => {
    setSessionNotice(null)
    const data = await authApi.register(payload)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Local logout still proceeds if API rejects (e.g. banned).
    }
    clearSession()
  }

  const updateUser = (nextUser) => {
    setUser(nextUser)
    setStoredUser(nextUser)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser: updateUser, sessionNotice, clearSessionNotice: () => setSessionNotice(null) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
