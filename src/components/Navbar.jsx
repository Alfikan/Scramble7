import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function closeMobile() { setMobileOpen(false) }

  async function handleLogout() {
    closeMobile()
    await logout()
    navigate('/')
  }

  // Show first name or truncated email as the greeting
  const displayName = currentUser?.displayName
    ? currentUser.displayName.split(' ')[0]
    : null

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.navInner}>

          {/* Wordmark */}
          <Link
            to={currentUser ? '/dashboard' : '/'}
            className={styles.wordmark}
            onClick={closeMobile}
          >
            Scramble
          </Link>

          {/* Desktop links */}
          <div className={styles.desktopLinks}>
            {currentUser ? (
              <>
                {displayName && (
                  <span className={styles.greeting}>Hi, {displayName}</span>
                )}
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
                  }
                >
                  Dashboard
                </NavLink>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.navLink}>
                  Sign in
                </Link>
                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={styles.mobileToggle}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className={styles.mobileMenu}>
            {currentUser ? (
              <>
                <NavLink to="/dashboard" className={styles.mobileLink} onClick={closeMobile}>
                  Dashboard
                </NavLink>
                <button className={styles.mobileLink} onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.mobileLink} onClick={closeMobile}>
                  Sign in
                </Link>
                <Link to="/signup" className={styles.mobileLinkPrimary} onClick={closeMobile}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
