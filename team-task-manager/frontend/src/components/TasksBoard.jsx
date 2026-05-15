import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from './Modal'

const STATUSES = [
  { key: 'TODO', label: 'To Do', dot: 'todo' },
  { key: 'IN_PROGRESS', label: 'In Progress', dot: 'progress' },
  { key: 'DONE', label: 'Done', dot: 'done' },
]

function initialOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

export default function TasksBoard({ project, isAdmin }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [filter, setFilter] = useState('ALL') // ALL | MINE | OVERDUE
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.listTasks(project.id)
      setTasks(data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [project.id])

  const canEditTask = (t) => isAdmin || (t.assigneeId && t.assigneeId === user.userId)

  const cycleStatus = async (task) => {
    if (!canEditTask(task)) return
    const order = ['TODO', 'IN_PROGRESS', 'DONE']
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    try {
      const updated = await api.updateTaskStatus(task.id, next)
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch (err) { alert(err.message || 'Failed to update status') }
  }

  const filtered = useMemo(() => {
    let list = tasks
    if (filter === 'MINE') list = list.filter(t => t.assigneeId === user.userId)
    if (filter === 'OVERDUE') list = list.filter(t => t.overdue)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.assigneeName || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [tasks, filter, search, user.userId])

  const overdueCount = tasks.filter(t => t.overdue).length
  const mineCount = tasks.filter(t => t.assigneeId === user.userId).length

  return (
    <>
      <div className="board-toolbar">
        <div className="board-stats">
          <span className="board-count">{tasks.length} task{tasks.length === 1 ? '' : 's'}</span>
          {overdueCount > 0 && (
            <span className="pill pill-danger">{overdueCount} overdue</span>
          )}
          {mineCount > 0 && (
            <span className="pill pill-info">{mineCount} assigned to me</span>
          )}
        </div>
        <div className="board-actions">
          <input
            className="search-input"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-group">
            <button className={`chip ${filter === 'ALL' ? 'chip-active' : ''}`} onClick={() => setFilter('ALL')}>All</button>
            <button className={`chip ${filter === 'MINE' ? 'chip-active' : ''}`} onClick={() => setFilter('MINE')}>Mine</button>
            <button className={`chip ${filter === 'OVERDUE' ? 'chip-active' : ''}`} onClick={() => setFilter('OVERDUE')}>Overdue</button>
          </div>
          {isAdmin && (
            <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Add Task</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="center-pad"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <h3>{tasks.length === 0 ? 'No tasks yet.' : 'No tasks match these filters.'}</h3>
          <p>
            {tasks.length === 0
              ? (isAdmin ? 'Create your first task to get started.' : 'The admin hasn\'t added any tasks yet.')
              : 'Try clearing the search or switching filters.'}
          </p>
          {tasks.length === 0 && isAdmin && (
            <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Add your first task</button>
          )}
        </div>
      ) : (
        <div className="kanban">
          {STATUSES.map(s => {
            const colTasks = filtered.filter(t => t.status === s.key)
            return (
              <div className="column" key={s.key}>
                <div className="column-head">
                  <div className="column-title">
                    <span className={`dot ${s.dot}`}></span>
                    {s.label}
                  </div>
                  <span className="column-count">{colTasks.length}</span>
                </div>
                <div className="column-body">
                  {colTasks.map(t => (
                    <div className={`task-card ${t.overdue ? 'task-card-overdue' : ''}`} key={t.id} onClick={() => setEditTask(t)}>
                      <div className="task-card-top">
                        <span className={`task-priority p-${t.priority}`}>{t.priority}</span>
                        {t.overdue && <span className="badge-overdue">OVERDUE</span>}
                      </div>
                      <div className="task-title">{t.title}</div>
                      {t.description && (
                        <div className="task-desc">
                          {t.description.length > 100 ? t.description.slice(0, 100) + '…' : t.description}
                        </div>
                      )}
                      <div className="task-foot">
                        <span className={`task-due ${t.overdue ? 'overdue' : ''}`}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}
                        </span>
                        {t.assigneeName ? (
                          <span className="task-assignee" title={t.assigneeName}>
                            <span className="mini-avatar">{initialOf(t.assigneeName)}</span>
                            {t.assigneeName}
                          </span>
                        ) : <span className="muted">Unassigned</span>}
                      </div>
                      {canEditTask(t) && (
                        <button
                          className="btn btn-ghost btn-sm task-move-btn"
                          onClick={(e) => { e.stopPropagation(); cycleStatus(t) }}
                        >
                          → Move to {STATUSES[(STATUSES.findIndex(x => x.key === t.status) + 1) % 3].label}
                        </button>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="empty-col">— nothing here —</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <TaskFormModal
          project={project}
          isAdmin={isAdmin}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load() }}
        />
      )}
      {editTask && (
        <TaskFormModal
          project={project}
          task={editTask}
          isAdmin={isAdmin}
          isAssignee={editTask.assigneeId === user.userId}
          onClose={() => setEditTask(null)}
          onSaved={() => { setEditTask(null); load() }}
          onDeleted={() => { setEditTask(null); load() }}
        />
      )}
    </>
  )
}

function TaskFormModal({ project, task, isAdmin, isAssignee, onClose, onSaved, onDeleted }) {
  const isEdit = !!task
  // For new task creation, only admins are allowed (the + Add Task button is admin-only).
  // For editing: admins can edit anything; assignees can only change status.
  const readonly = isEdit && !isAdmin && !isAssignee
  const memberCanEditStatusOnly = isEdit && !isAdmin && isAssignee

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [dueDate, setDueDate] = useState(task?.dueDate || '')
  const [priority, setPriority] = useState(task?.priority || 'MEDIUM')
  const [status, setStatus] = useState(task?.status || 'TODO')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Show the Save/Create button when:
  //  - creating a new task as admin, OR
  //  - editing as admin, OR
  //  - editing as the assignee (status-only update)
  const canSubmit = (!isEdit && isAdmin) || (isEdit && isAdmin) || (isEdit && isAssignee)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(''); setSubmitting(true)
    try {
      if (!isEdit) {
        await api.createTask(project.id, {
          title,
          description,
          dueDate: dueDate || null,
          priority,
          assigneeId: assigneeId ? Number(assigneeId) : null,
        })
      } else if (isAdmin) {
        await api.updateTask(task.id, {
          title,
          description,
          dueDate: dueDate || null,
          priority,
          status,
          assigneeId: assigneeId === '' ? 0 : Number(assigneeId), // 0 = unassign
        })
      } else if (isAssignee) {
        await api.updateTaskStatus(task.id, status)
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save task')
    } finally { setSubmitting(false) }
  }

  const onDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return
    try {
      await api.deleteTask(task.id)
      onDeleted()
    } catch (err) { alert(err.message || 'Failed to delete') }
  }

  const submitLabel = submitting
    ? 'Saving…'
    : (isEdit ? 'Save changes' : 'Create task')

  return (
    <Modal
      title={isEdit ? (isAdmin ? 'Edit task' : 'Task detail') : 'New task'}
      onClose={onClose}
      footer={
        <>
          {isEdit && isAdmin && (
            <button type="button" className="btn btn-danger btn-sm" onClick={onDelete} style={{ marginRight: 'auto' }}>
              Delete
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {canSubmit && (
            <button type="submit" form="task-form" className="btn btn-accent" disabled={submitting}>
              {submitLabel}
            </button>
          )}
        </>
      }
    >
      <form id="task-form" onSubmit={onSubmit}>
        {error && <div className="auth-error">{error}</div>}

        {readonly && (
          <div className="info-banner">
            View-only — only the assignee or a project admin can edit this task.
          </div>
        )}
        {memberCanEditStatusOnly && (
          <div className="info-banner">
            You can change this task's <strong>status</strong>. Other fields can only be edited by an admin.
          </div>
        )}

        <div className="field-row">
          <label>Title</label>
          <input
            required
            minLength={1}
            maxLength={200}
            disabled={readonly || memberCanEditStatusOnly}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to get done?"
          />
        </div>

        <div className="field-row">
          <label>Description</label>
          <textarea
            maxLength={2000}
            disabled={readonly || memberCanEditStatusOnly}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional details, links, notes…"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field-row">
            <label>Due date</label>
            <input
              type="date"
              disabled={readonly || memberCanEditStatusOnly}
              value={dueDate || ''}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className="field-row">
            <label>Priority</label>
            <select
              disabled={readonly || memberCanEditStatusOnly}
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field-row">
            <label>Assignee</label>
            <select
              disabled={readonly || memberCanEditStatusOnly}
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {project.members.map(m => (
                <option key={m.userId} value={m.userId}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
          {isEdit && (
            <div className="field-row">
              <label>Status</label>
              <select
                disabled={readonly}
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
