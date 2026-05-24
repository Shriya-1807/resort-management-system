import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' })
  const { login } = useAuth()
  const navigate = useNavigate()

  const submitLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', loginData)
      login(data.user, data.token)
      toast.success(`Welcome back, ${data.user.first_name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const submitSignup = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', signupData)
      toast.success('Account created. Please sign in.')
      setMode('login')
      setLoginData({ email: signupData.email, password: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.visual}>
          <p className="label">Gulmohar Resort</p>
          <h1 className="display-lg">Your stay begins here</h1>
          <p>Sign in to reserve rooms, order food during active stays, raise tickets, and manage cancellations.</p>
        </div>

        <div className={styles.formSide}>
          <div className={styles.tabs}>
            <button className={mode === 'login' ? styles.active : ''} onClick={() => setMode('login')}>Sign In</button>
            <button className={mode === 'signup' ? styles.active : ''} onClick={() => setMode('signup')}>Sign Up</button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={submitLogin} className={styles.form}>
              <div>
                <p className="label" style={{ color: 'var(--amber-deep)' }}>Guest Login</p>
                <h2 className="display-md">Welcome back</h2>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" required value={loginData.email} onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password</label>
                <input type={showPassword ? 'text' : 'password'} required value={loginData.password} onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))} />
                <button type="button" className={styles.eye} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button className="btn btn-primary" disabled={loading}>
                <LogIn size={15} /> {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className={styles.help}>Forgot password needs a reset-email backend endpoint. For now, use change password after login.</p>
            </form>
          ) : (
            <form onSubmit={submitSignup} className={styles.form}>
              <div>
                <p className="label" style={{ color: 'var(--amber-deep)' }}>New Guest</p>
                <h2 className="display-md">Create account</h2>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>First Name</label>
                  <input required value={signupData.first_name} onChange={(event) => setSignupData((prev) => ({ ...prev, first_name: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input required value={signupData.last_name} onChange={(event) => setSignupData((prev) => ({ ...prev, last_name: event.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" required value={signupData.email} onChange={(event) => setSignupData((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input value={signupData.phone} onChange={(event) => setSignupData((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password</label>
                <input type={showPassword ? 'text' : 'password'} required value={signupData.password} onChange={(event) => setSignupData((prev) => ({ ...prev, password: event.target.value }))} />
                <button type="button" className={styles.eye} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button className="btn btn-primary" disabled={loading}>
                <UserPlus size={15} /> {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
