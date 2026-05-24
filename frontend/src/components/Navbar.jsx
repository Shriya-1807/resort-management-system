import React from 'react'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, LogOut, User, UtensilsCrossed, Ticket, CalendarCheck, Menu, X } from 'lucide-react'
import styles from './Navbar.module.css'
import logoImg from './logo.jpg'

export default function Navbar({ onOpenAuth }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [dropOpen, setDropOpen]   = useState(false)

  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const transparent = false

  return (
    <nav className={`${styles.nav} ${transparent ? styles.transparent : styles.solid}`}>
      <div className={styles.inner}>

        {/* ── Left: nav links ── */}
        <div className={styles.links}>
          <Link to="/"      className={styles.link}>Home</Link>
          <Link to="/rooms" className={styles.link}>Rooms</Link>
          <a href="#amenities" className={styles.link}>Amenities</a>
          <a href="#contact"   className={styles.link}>Contact</a>
        </div>

        {/* ── Center: Logo slot ── */}
        <Link to="/" className={styles.logoWrap}>
          <img src={logoImg} alt="Gulmohar Resort" className={styles.logoImg} />
        </Link>

        {/* ── Right: Auth actions ── */}
        <div className={styles.actions}>
          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.userBtn} onClick={() => setDropOpen(d => !d)}>
                <User size={16} />
                <span>{user.first_name || user.name}</span>
              </button>
              {dropOpen && (
                <div className={styles.dropdown} onMouseLeave={() => setDropOpen(false)}>
                  <Link to="/dashboard" className={styles.dropItem}><CalendarCheck size={14} /> My Bookings</Link>
                  <button className={styles.dropItem} onClick={handleLogout}><LogOut size={14} /> Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <button className={`btn btn-ghost btn-sm ${transparent ? '' : styles.btnSolid}`} onClick={onOpenAuth}>
              <LogIn size={14} /> Sign In
            </button>
          )}
          <Link to="/rooms" className={`btn btn-primary btn-sm`}>Book Now</Link>
        </div>

        {/* ── Mobile hamburger ── */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(m => !m)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/"         className={styles.mobileLink}>Home</Link>
          <Link to="/rooms"    className={styles.mobileLink}>Rooms</Link>
          <a href="#amenities" className={styles.mobileLink}>Amenities</a>
          <a href="#contact"   className={styles.mobileLink}>Contact</a>
          {user ? (
            <>
              <Link to="/dashboard" className={styles.mobileLink}>My Bookings</Link>
              <button className={styles.mobileLink} onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <button className={`btn btn-primary`} onClick={() => { setMenuOpen(false); onOpenAuth() }}>
              Sign In / Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  )
}