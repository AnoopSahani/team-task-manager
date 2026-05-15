import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

function DonutChart({ todo, inProgress, done, total }) {
  const size = 180
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="14" fill="var(--ink-mute)">No tasks</text>
      </svg>
    )
  }

  const todoFrac = todo / total
  const progressFrac = inProgress / total
  const doneFrac = done / total

  const segments = [
    { len: doneFrac * circumference, color: 'var(--ok)' },
    { len: progressFrac * circumference, color: 'var(--gold)' },
    { len: todoFrac * circumference, color: 'var(--info)' },
  ]

  let offset = 0
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        if (s.len === 0) return null
        const dashArray = `${s.len} ${circumference - s.len}`
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
          />
        )
        offset += s.len
        return el
      })}
      <text x="50%" y="46%" textAnchor="middle" fontSize="36" fontWeight="700" fill="var(--ink)" fontFamily="Fraunces, serif">
        {total}
      </text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="10" fill="var(--ink-mute)" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
        TASKS
      </text>
    </svg>
  )
}

export default function DashboardPanel({ projectId }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.dashboard(projectId), api.listTasks(projectId)])
      .then(([dash, taskList]) => {
        setData(dash)
        setTasks(taskList || [])
      })
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return <div className="center-pad"><div className="spinner" /></div>
  if (!data) return null

  const total = data.totalTasks || 0
  const todo = data.tasksByStatus?.TODO || 0
  const inProgress = data.tasksByStatus?.IN_PROGRESS || 0
  const done = data.tasksByStatus?.DONE || 0
  const overdue = data.overdueTasks || 0
  const mine = data.myAssignedTasks || 0
  const pct = (n) => total ? Math.round((n / total) * 100) : 0
  const completion = total ? Math.round((done / total) * 100) : 0

  // Tasks list slices for the dashboard
  const overdueTasks = tasks
    .filter(t => t.overdue)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 5)

  const myPendingTasks = tasks
    .filter(t => t.assigneeId === user.userId && t.status !== 'DONE')
    .sort((a, b) => {
      // Overdue first, then by due date
      if (a.overdue && !b.overdue) return -1
      if (!a.overdue && b.overdue) return 1
      return (a.dueDate || 'zzz').localeCompare(b.dueDate || 'zzz')
    })
    .slice(0, 5)

  return (
    <div className="dashboard">
      {/* KPI cards */}
      <div className="metric-grid">
        <div className="metric metric-total">
          <div className="metric-label">Total tasks</div>
          <div className="metric-value">{total}</div>
          <div className="metric-sub">across this project</div>
        </div>
        <div className="metric metric-pending">
          <div className="metric-label">Pending (To do)</div>
          <div className="metric-value">{todo}</div>
          <div className="metric-sub">{pct(todo)}% of all tasks</div>
        </div>
        <div className="metric metric-progress">
          <div className="metric-label">In progress</div>
          <div className="metric-value">{inProgress}</div>
          <div className="metric-sub">{pct(inProgress)}% of all tasks</div>
        </div>
        <div className="metric metric-done">
          <div className="metric-label">Completed</div>
          <div className="metric-value">{done}</div>
          <div className="metric-sub">{pct(done)}% of all tasks</div>
        </div>
        <div className={`metric metric-overdue ${overdue > 0 ? 'metric-alert' : ''}`}>
          <div className="metric-label">Overdue</div>
          <div className="metric-value">{overdue}</div>
          <div className="metric-sub">past due, not done</div>
        </div>
        <div className="metric metric-mine">
          <div className="metric-label">Assigned to you</div>
          <div className="metric-value">{mine}</div>
          <div className="metric-sub">your current workload</div>
        </div>
      </div>

      {/* Completion banner */}
      <div className="completion-banner">
        <div className="completion-banner-head">
          <div>
            <div className="completion-eyebrow">— Project completion</div>
            <div className="completion-value">{completion}%</div>
          </div>
          <div className="completion-meta">
            <div><strong>{done}</strong> done</div>
            <div><strong>{todo + inProgress}</strong> open</div>
            {overdue > 0 && <div className="completion-warn"><strong>{overdue}</strong> overdue</div>}
          </div>
        </div>
        <div className="completion-bar">
          <div className="completion-bar-fill" style={{ width: `${completion}%` }} />
        </div>
      </div>

      {/* Status breakdown - donut + segmented bar */}
      <div className="dash-twocol">
        <div className="dash-section">
          <h3>Status breakdown</h3>
          {total === 0 ? (
            <div className="muted">No tasks yet. Create one from the Tasks tab.</div>
          ) : (
            <div className="donut-wrap">
              <DonutChart todo={todo} inProgress={inProgress} done={done} total={total} />
              <div className="donut-legend">
                <div className="legend-row">
                  <span className="legend-dot legend-info" />
                  <span className="legend-label">To do</span>
                  <span className="legend-val">{todo} · {pct(todo)}%</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot legend-gold" />
                  <span className="legend-label">In progress</span>
                  <span className="legend-val">{inProgress} · {pct(inProgress)}%</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot legend-ok" />
                  <span className="legend-label">Done</span>
                  <span className="legend-val">{done} · {pct(done)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dash-section">
          <h3>Overdue tasks</h3>
          {overdueTasks.length === 0 ? (
            <div className="empty-inline">
              <div className="empty-inline-icon">✓</div>
              <div>Nothing is overdue. Nicely done.</div>
            </div>
          ) : (
            <div className="overdue-list">
              {overdueTasks.map(t => (
                <div className="overdue-item" key={t.id}>
                  <div className="overdue-item-main">
                    <div className="overdue-item-title">{t.title}</div>
                    <div className="overdue-item-sub">
                      Due {new Date(t.dueDate).toLocaleDateString()} · {t.assigneeName || 'Unassigned'}
                    </div>
                  </div>
                  <span className={`task-priority p-${t.priority}`}>{t.priority}</span>
                </div>
              ))}
              {data.overdueTasks > 5 && (
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  + {data.overdueTasks - 5} more overdue task{data.overdueTasks - 5 === 1 ? '' : 's'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* My pending tasks */}
      <div className="dash-section">
        <h3>Your pending tasks</h3>
        {myPendingTasks.length === 0 ? (
          <div className="muted">You have no pending tasks assigned to you.</div>
        ) : (
          <div className="overdue-list">
            {myPendingTasks.map(t => (
              <div className={`overdue-item ${t.overdue ? 'overdue-item-alert' : ''}`} key={t.id}>
                <div className="overdue-item-main">
                  <div className="overdue-item-title">
                    {t.title}
                    {t.overdue && <span className="badge-overdue" style={{ marginLeft: 8 }}>OVERDUE</span>}
                  </div>
                  <div className="overdue-item-sub">
                    {t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date'} · {t.status.replace('_', ' ')}
                  </div>
                </div>
                <span className={`task-priority p-${t.priority}`}>{t.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks per member */}
      <div className="dash-section">
        <h3>Workload per member</h3>
        {!data.tasksPerUser || data.tasksPerUser.length === 0 ? (
          <div className="muted">Nobody has been assigned a task yet.</div>
        ) : (
          <div className="workload-grid">
            {data.tasksPerUser.map(u => {
              const userTotal = u.total || 0
              const donePct = userTotal ? Math.round((u.done / userTotal) * 100) : 0
              return (
                <div className="workload-card" key={u.userId}>
                  <div className="workload-head">
                    <span className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {(u.userName || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="workload-name">{u.userName}</div>
                    <div className="workload-total">{u.total}</div>
                  </div>
                  <div className="workload-bar">
                    {u.done > 0 && <span className="seg-done" style={{ width: `${(u.done / userTotal) * 100}%` }} />}
                    {u.inProgress > 0 && <span className="seg-progress" style={{ width: `${(u.inProgress / userTotal) * 100}%` }} />}
                    {u.todo > 0 && <span className="seg-todo" style={{ width: `${(u.todo / userTotal) * 100}%` }} />}
                  </div>
                  <div className="workload-stats">
                    <span><strong>{u.todo}</strong> to do</span>
                    <span><strong>{u.inProgress}</strong> in prog</span>
                    <span><strong>{u.done}</strong> done</span>
                  </div>
                  <div className="workload-foot">{donePct}% complete</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
