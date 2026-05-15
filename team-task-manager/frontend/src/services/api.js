const API_BASE = import.meta.env.VITE_API_BASE || '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 204) return null

  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }

  if (!res.ok) {
    const msg = (data && data.message) || res.statusText || 'Request failed'
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  // auth
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  // projects
  listProjects: () => request('/projects'),
  createProject: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  getProject: (id) => request(`/projects/${id}`),
  addMember: (id, body) => request(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
  removeMember: (id, userId) => request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),

  // tasks
  listTasks: (projectId) => request(`/projects/${projectId}/tasks`),
  createTask: (projectId, body) => request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (taskId, body) => request(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateTaskStatus: (taskId, status) => request(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: 'DELETE' }),

  // dashboard
  dashboard: (projectId) => request(`/projects/${projectId}/dashboard`),
}
