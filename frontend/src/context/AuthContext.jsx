import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('gulmohar_token') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('gulmohar_user')
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, jwt) => {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('gulmohar_token', jwt)
    localStorage.setItem('gulmohar_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('gulmohar_token')
    localStorage.removeItem('gulmohar_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
