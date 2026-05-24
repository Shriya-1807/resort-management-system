import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function AuthModal({ onClose, required }) {
  const [tab, setTab]         = useState('login')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  // Signup form
  const [signupData, setSignupData] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', loginData)
      login(data.user, data.token)
      toast.success(`Welcome back, ${data.user.first_name}!`)
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', signupData)
      toast.success('Account created! Please sign in.')
      setTab('login')
      setLoginData({ email: signupData.email, password: '' })
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget && !required) onClose() }}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            <p className="label" style={{ color: 'var(--amber-deep)', marginBottom: '0.3rem' }}>Gulmohar Resort</p>
            <h2 className="display-md">
              {tab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1.5px solid var(--sand)' }}>
            {['login','signup'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '0.75rem', background: 'none', border: 'none',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: tab === t ? 'var(--amber-deep)' : 'var(--taupe)',
                borderBottom: tab === t ? '2px solid var(--amber)' : '2px solid transparent',
                marginBottom: '-1.5px', cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          {!required && (
            <button onClick={onClose} style={{
              position: 'absolute', top: '1.2rem', right: '1.5rem',
              background: 'none', border: 'none', color: 'var(--taupe)', cursor: 'pointer',
            }}><X size={20} /></button>
          )}
        </div>

        <div className="modal-body">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="your@email.com" required
                  value={loginData.email}
                  onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password</label>
                <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" required
                  value={loginData.password}
                  onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                  position: 'absolute', right: '0.75rem', bottom: '0.75rem',
                  background: 'none', border: 'none', color: 'var(--taupe)', cursor: 'pointer',
                }}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--taupe)' }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => setTab('signup')} style={{ background: 'none', border: 'none', color: 'var(--amber-deep)', fontWeight: 600, cursor: 'pointer' }}>
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" placeholder="Priya" required
                    value={signupData.first_name}
                    onChange={e => setSignupData(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" placeholder="Sharma" required
                    value={signupData.last_name}
                    onChange={e => setSignupData(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="your@email.com" required
                  value={signupData.email}
                  onChange={e => setSignupData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="+91 9000000000"
                  value={signupData.phone}
                  onChange={e => setSignupData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password</label>
                <input type={showPwd ? 'text' : 'password'} placeholder="Min. 8 chars, 1 uppercase, 1 number" required
                  value={signupData.password}
                  onChange={e => setSignupData(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                  position: 'absolute', right: '0.75rem', bottom: '0.75rem',
                  background: 'none', border: 'none', color: 'var(--taupe)', cursor: 'pointer',
                }}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}