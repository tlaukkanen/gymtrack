import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProgramBuilderPage from './pages/programs/ProgramBuilderPage'
import SessionRunnerPage from './pages/sessions/SessionRunnerPage'
import TrainingDiaryPage from './pages/sessions/TrainingDiaryPage'
import AnalysisPage from './pages/analysis/AnalysisPage'
import ProfilePage from './pages/profile/ProfilePage'
import AppLayout from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { PublicRoute } from './components/layout/PublicRoute'

const App = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="programs">
          <Route path="new" element={<ProgramBuilderPage />} />
          <Route path=":programId/edit" element={<ProgramBuilderPage />} />
        </Route>
        <Route path="sessions">
          <Route index element={<TrainingDiaryPage />} />
          <Route path=":sessionId" element={<SessionRunnerPage />} />
        </Route>
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
