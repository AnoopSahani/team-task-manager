import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initial = (user?.name || 'U').trim().charAt(0).toUpperCase()

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/projects" className="brand">
          <span className="brand-mark">TS</span>
          <span>Tessera</span>
          <span className="brand-meta">/ field office</span>
        </Link>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="user-avatar">{initial}</span>
            <span>{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login') }}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
