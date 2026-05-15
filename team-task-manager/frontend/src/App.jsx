import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProjectsList from './pages/ProjectsList'
import ProjectDetail from './pages/ProjectDetail'
import TopBar from './components/TopBar'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="center-pad"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function Shell({ children }) {
  return (
    <div className="app-shell">
      <TopBar />
      <main style={{ flex: 1 }}>
        <div className="container">{children}</div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/projects"
          element={<PrivateRoute><Shell><ProjectsList /></Shell></PrivateRoute>}
        />
        <Route
          path="/projects/:id"
          element={<PrivateRoute><Shell><ProjectDetail /></Shell></PrivateRoute>}
        />
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </AuthProvider>
  )
}
