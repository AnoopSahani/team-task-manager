import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import Modal from '../components/Modal'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.listProjects()
      setProjects(data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const onCreate = async (e) => {
    e.preventDefault()
    setError(''); setSubmitting(true)
    try {
      await api.createProject({ name, description })
      setShowModal(false); setName(''); setDescription('')
      await load()
    } catch (err) {
      setError(err.message || 'Failed to create project')
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">— Workspace / Projects</div>
        <h1 className="page-title">Your <em>projects.</em></h1>
        <p className="page-subtitle">
          Every project is a small ledger of plans, people, and progress. Create one, invite the team, get to work.
        </p>
      </div>

      <div className="row-between">
        <div className="muted">{projects.length} project{projects.length === 1 ? '' : 's'} on file</div>
        <button className="btn btn-accent" onClick={() => setShowModal(true)}>+ New project</button>
      </div>

      {loading ? (
        <div className="center-pad"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="empty">
          <h3>Empty file.</h3>
          <p>No projects yet. Start one to begin.</p>
          <button className="btn btn-accent" onClick={() => setShowModal(true)}>Create your first project</button>
        </div>
      ) : (
        <div className="cards-grid">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id} style={{ display: 'block' }}>
              <div className="card-project">
                <div className="card-project-tag">
                  <span>№ {String(p.id).padStart(3, '0')}</span>
                  <span className={`role-pill ${p.currentUserRole === 'ADMIN' ? 'role-admin' : 'role-member'}`}>
                    {p.currentUserRole}
                  </span>
                </div>
                <h3>{p.name}</h3>
                <p>{p.description || <em style={{ color: 'var(--ink-mute)' }}>No description provided.</em>}</p>
                <div className="card-project-foot">
                  <span>{p.memberCount} member{p.memberCount === 1 ? '' : 's'}</span>
                  <span>by {p.creatorName}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title="New project"
          onClose={() => { setShowModal(false); setError('') }}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="new-project-form" className="btn btn-accent" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create project'}
              </button>
            </>
          }
        >
          <form id="new-project-form" onSubmit={onCreate}>
            {error && <div className="auth-error">{error}</div>}
            <div className="field-row">
              <label>Project name</label>
              <input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q3 Marketing Site" />
            </div>
            <div className="field-row">
              <label>Description (optional)</label>
              <textarea maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this project about?" />
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
              You'll become the admin of this project automatically.
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
