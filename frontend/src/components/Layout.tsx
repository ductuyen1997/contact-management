import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { user, isAdmin, logout } = useAuth()
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/contacts" className="brand">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
            </svg>
            Contact Manager
          </Link>
          <nav className="nav">
            <NavLink to="/contacts" end>Contacts</NavLink>
            <NavLink to="/activity">Activity</NavLink>
          </nav>
          <Link to="/contacts/new" className="btn btn-primary" aria-label="New contact">
            +<span className="hide-sm"> New contact</span>
          </Link>
          {user && (
            <div className="user-menu">
              <span className="user-name" title={user.roles.join(', ')}>
                {user.username}
                {isAdmin && <span className="role-badge">Admin</span>}
              </span>
              <button className="btn btn-ghost" type="button" onClick={logout}>Sign out</button>
            </div>
          )}
        </div>
      </header>
      <main className="container page">
        <Outlet />
      </main>
    </>
  )
}
