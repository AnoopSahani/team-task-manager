import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSubmitting(true)
    try {
      await signup(name, email, password)
      navigate('/projects', { replace: true })
    } catch (err) {
      setError(err.message || 'Signup failed')
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
          <h1>Start a new<br/><em>chapter.</em></h1>
          <p>Spin up a project, invite the team, and watch the work move. No setup wizards, no onboarding videos.</p>
        </div>
        <div className="auth-aside-foot">
          <div>— Open beta</div>
          <div>No card required</div>
        </div>
      </aside>
      <main className="auth-main">
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-eyebrow">— New file</div>
          <h2>Create account.</h2>
          {error && <div className="auth-error">{error}</div>}
          <div className="field-row">
            <label>Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" minLength={2} />
          </div>
          <div className="field-row">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.co" />
          </div>
          <div className="field-row">
            <label>Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-accent" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Creating account…' : 'Create account →'}
          </button>
          <div className="auth-foot">
            Have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </main>
    </div>
  )
}
