import { useState } from 'react'
import { api } from '../services/api'
import Modal from './Modal'

function initialOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

export default function MembersPanel({ project, isAdmin, onChange }) {
  const [showAdd, setShowAdd] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onAdd = async (e) => {
    e.preventDefault()
    setError(''); setSubmitting(true)
    try {
      await api.addMember(project.id, { email, role })
      setShowAdd(false); setEmail(''); setRole('MEMBER')
      onChange()
    } catch (err) {
      setError(err.message || 'Failed to add member')
    } finally { setSubmitting(false) }
  }

  const onRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from this project?`)) return
    try {
      await api.removeMember(project.id, userId)
      onChange()
    } catch (err) { alert(err.message || 'Failed to remove member') }
  }

  return (
    <>
      <div className="row-between">
        <div className="muted">{project.members.length} member{project.members.length === 1 ? '' : 's'}</div>
        {isAdmin && <button className="btn btn-accent" onClick={() => setShowAdd(true)}>+ Add member</button>}
      </div>

      <div className="dash-section">
        {project.members.map(m => (
          <div className="member-row" key={m.userId}>
            <div className="member-info">
              <span className="user-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{initialOf(m.name)}</span>
              <div>
                <strong>{m.name}</strong>
                <div><small>{m.email}</small></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className={`role-pill ${m.role === 'ADMIN' ? 'role-admin' : 'role-member'}`}>{m.role}</span>
              {isAdmin && m.userId !== project.creatorId && (
                <button className="btn btn-danger btn-sm" onClick={() => onRemove(m.userId, m.name)}>Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal
          title="Add member"
          onClose={() => { setShowAdd(false); setError('') }}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" form="add-member-form" className="btn btn-accent" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add member'}
              </button>
            </>
          }
        >
          <form id="add-member-form" onSubmit={onAdd}>
            {error && <div className="auth-error">{error}</div>}
            <div className="field-row">
              <label>Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@studio.co" />
              <div className="muted" style={{ marginTop: 6 }}>
                They must already have an account.
              </div>
            </div>
            <div className="field-row">
              <label>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
