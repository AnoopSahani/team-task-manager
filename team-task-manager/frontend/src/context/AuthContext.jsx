import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api.me()
      .then((u) => {
        const merged = { userId: u.userId, name: u.name, email: u.email }
        setUser(merged)
        localStorage.setItem('user', JSON.stringify(merged))
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const persistAuth = ({ token, userId, name, email }) => {
    localStorage.setItem('token', token)
    const u = { userId, name, email }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const login = async (email, password) => {
    const res = await api.login({ email, password })
    persistAuth(res)
    return res
  }

  const signup = async (name, email, password) => {
    const res = await api.signup({ name, email, password })
    persistAuth(res)
    return res
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
