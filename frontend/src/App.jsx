import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

import Navbar       from './components/Navbar'
import Footer       from './components/Footer'
import AuthModal    from './components/AuthModal'
import { useState } from 'react'

import HomePage       from './pages/HomePage'
import RoomsPage      from './pages/RoomsPage'
import BookingPage    from './pages/BookingPage'
import PaymentPage    from './pages/PaymentPage'
import ReceiptPage    from './pages/ReceiptPage'
import DashboardPage  from './pages/DashboardPage'
import RestaurantPage from './pages/RestaurantPage'
import TicketsPage    from './pages/TicketsPage'
import CancellationPage from './pages/CancellationPage'
import AuthPage from './pages/AuthPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(true)

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span className="label" style={{ color: 'var(--taupe)' }}>Loading…</span>
  </div>

  if (!user) return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} required />}
      <Navigate to="/" replace />
    </>
  )
  return children
}

function AppInner() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <CartProvider>
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <Routes>
        <Route path="/"         element={<HomePage onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/auth"     element={<AuthPage />} />
        <Route path="/rooms"    element={<RoomsPage />} />
        <Route path="/booking"  element={
          <ProtectedRoute><BookingPage /></ProtectedRoute>
        } />
        <Route path="/payment/:bookingId" element={
          <ProtectedRoute><PaymentPage /></ProtectedRoute>
        } />
        <Route path="/receipt/:bookingId" element={
          <ProtectedRoute><ReceiptPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/food/:bookingId" element={
          <ProtectedRoute><RestaurantPage /></ProtectedRoute>
        } />
        <Route path="/restaurant/:bookingId" element={
          <ProtectedRoute><RestaurantPage /></ProtectedRoute>
        } />
        <Route path="/tickets/:bookingId" element={
          <ProtectedRoute><TicketsPage /></ProtectedRoute>
        } />
        <Route path="/cancellations" element={
          <ProtectedRoute><CancellationPage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </CartProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
