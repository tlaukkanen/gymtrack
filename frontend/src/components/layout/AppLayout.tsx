import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Button } from '../ui/Button'
import { useAuthStore, selectAuthControls } from '../../store/auth-store'
import { Icon, type IconName } from '../icons/Icon'

const navItems: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/app/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/app/programs/new', label: 'New Program', icon: 'programs' },
  { to: '/app/sessions', label: 'Training Diary', icon: 'diary' },
  { to: '/app/profile', label: 'Profile', icon: 'profile' },
]

const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearAuth } = useAuthStore(selectAuthControls)
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-shell bg-surface-darkest text-text-primary">
      <aside
        id="app-sidebar"
        className={clsx(
          'sidebar border border-white/10 bg-surface/90 shadow-card backdrop-blur',
          isSidebarOpen && 'sidebar-open'
        )}
      >
        <h1>GymTrack</h1>
        <p>Train intentionally, capture every rep.</p>
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'nav-link transition-colors duration-150',
                  isActive
                    ? 'bg-brand/20 text-text-primary border-brand/40'
                    : 'hover:bg-brand/10 hover:text-text-primary border-transparent'
                )
              }
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Signed in as</p>
          <strong>{user?.displayName ?? 'Athlete'}</strong>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={handleLogout}
            startIcon={<Icon name="logout" size={18} />}
          >
            Log out
          </Button>
        </div>
      </aside>
      <main className="main-content bg-gradient-to-b from-surface-darkest via-surface to-surface-darkest/80">
        <div className="mobile-top-bar">
          <button
            type="button"
            className="mobile-nav-trigger"
            onClick={toggleSidebar}
            aria-controls="app-sidebar"
            aria-expanded={isSidebarOpen}
          >
            <Icon name={isSidebarOpen ? 'close' : 'menu'} size={20} />
            <span>{isSidebarOpen ? 'Close' : 'Menu'}</span>
          </button>
          <p className="mobile-top-bar__user">{user?.displayName ?? 'Athlete'}</p>
        </div>
        <Outlet />
      </main>
      <div
        className={clsx('sidebar-overlay', isSidebarOpen && 'visible')}
        role="presentation"
        onClick={closeSidebar}
      />
    </div>
  )
}

export default AppLayout
