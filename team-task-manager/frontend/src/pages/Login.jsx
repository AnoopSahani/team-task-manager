import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSubmitting(true)
    try {
      await login(email, password)
      const to = location.state?.from?.pathname || '/projects'
      navigate(to, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <div className="auth-aside-content">
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 36, color: '#d97345' }}>
            ✦ Tessera, Vol. 01
          </div>
          <h1>The team's<br/><em>quiet ledger</em><br/>of what's next.</h1>
          <p>Field-tested project management for small teams. Plan, assign, ship — without the noise of enterprise software.</p>
          <div className="auth-roles">
            <div className="auth-role-row">
              <span className="role-pill role-admin">ADMIN</span>
              <span>creates projects, adds members, assigns tasks</span>
            </div>
            <div className="auth-role-row">
              <span className="role-pill role-member">USER</span>
              <span>views tasks, updates the status of work assigned to them</span>
            </div>
          </div>
        </div>
        <div className="auth-aside-foot">
          <div>— Index № 001 / 014</div>
          <div>Edition: May 2026</div>
        </div>
      </aside>
      <main className="auth-main">
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-eyebrow">— Sign in required</div>
          <h2>Welcome back.</h2>
          <p className="auth-lede">
            Admin and user login required to view tasks, status, pending and overdue items.
          </p>
          {error && <div className="auth-error">{error}</div>}
          <div className="field-row">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.co" />
          </div>
          <div className="field-row">
            <label>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-accent" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Signing in…' : 'Sign in →'}
          </button>
          <div className="auth-foot">
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </form>
      </main>
    </div>
  )
}
