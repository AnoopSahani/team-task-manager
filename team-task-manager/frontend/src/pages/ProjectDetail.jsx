import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import Modal from '../components/Modal'
import TasksBoard from '../components/TasksBoard'
import MembersPanel from '../components/MembersPanel'
import DashboardPanel from '../components/DashboardPanel'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [tab, setTab] = useState('tasks')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProject = async () => {
    setLoading(true); setError('')
    try {
      const data = await api.getProject(id)
      setProject(data)
    } catch (err) {
      setError(err.message || 'Failed to load project')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadProject() }, [id])

  if (loading) return <div className="center-pad"><div className="spinner" /></div>
  if (error) return (
    <div style={{ padding: '60px 0' }}>
      <div className="auth-error">{error}</div>
      <Link to="/projects" className="btn btn-ghost" style={{ marginTop: 20 }}>← Back to projects</Link>
    </div>
  )
  if (!project) return null

  const isAdmin = project.currentUserRole === 'ADMIN'

  return (
    <>
      <div className="page-head">
        <div className="crumb">
          <Link to="/projects">Projects</Link>
          <span className="crumb-sep">/</span>
          <span>№ {String(project.id).padStart(3, '0')}</span>
        </div>
        <div className="project-eyebrow-row">
          <span className="page-eyebrow">— Project file</span>
          <span className={`role-pill ${project.currentUserRole === 'ADMIN' ? 'role-admin' : 'role-member'}`}>
            {project.currentUserRole === 'ADMIN' ? 'ADMIN' : 'MEMBER'} ACCESS
          </span>
        </div>
        <h1 className="page-title">{project.name}</h1>
        {project.description && <p className="page-subtitle">{project.description}</p>}
        <div className="project-meta">
          <span>Created by <strong>{project.creatorName}</strong></span>
          <span><strong>{project.members.length}</strong> members</span>
          <span>Filed <strong>{new Date(project.createdAt).toLocaleDateString()}</strong></span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Tasks</button>
        <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
        <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Members</button>
      </div>

      {tab === 'tasks' && (
        <TasksBoard project={project} isAdmin={isAdmin} />
      )}
      {tab === 'dashboard' && (
        <DashboardPanel projectId={project.id} />
      )}
      {tab === 'members' && (
        <MembersPanel project={project} isAdmin={isAdmin} onChange={loadProject} />
      )}
    </>
  )
}
