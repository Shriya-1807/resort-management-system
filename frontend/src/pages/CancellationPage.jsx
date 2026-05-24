import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './CancellationPage.module.css'

const today = new Date().toISOString().split('T')[0]
const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export default function CancellationPage() {
  const [bookings, setBookings] = useState([])
  const [cancellations, setCancellations] = useState([])
  const [bookingId, setBookingId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [bookingRes, cancellationRes] = await Promise.all([
      api.get('/bookings/my'),
      api.get('/cancellations/my'),
    ])
    setBookings(bookingRes.data)
    setCancellations(cancellationRes.data)
  }

  useEffect(() => {
    load()
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const eligible = useMemo(() => bookings.filter((booking) => booking.status === 'CONFIRMED' && booking.check_in > today), [bookings])

  const cancelBooking = async (event) => {
    event.preventDefault()
    if (!bookingId) {
      toast.error('Choose a cancellable booking')
      return
    }
    try {
      await api.post('/cancellations', {
        booking_id: Number(bookingId),
        reason: reason || 'Guest requested cancellation',
      })
      toast.success('Booking cancelled successfully')
      setBookingId('')
      setReason('')
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className="label">Cancellation Desk</p>
          <h1 className="display-lg">Cancel Eligible Booking</h1>
          <p>Cancellation is allowed only for genuine active bookings before the check-in date. The backend verifies ownership and booking status again.</p>
        </div>
      </section>

      <section className={`container ${styles.layout}`}>
        <form className={styles.formCard} onSubmit={cancelBooking}>
          <div className={styles.notice}>
            <AlertTriangle size={18} />
            <p>Only confirmed bookings with a future check-in date appear here. Refund records are created by the backend when payment exists.</p>
          </div>

          <div className="form-group">
            <label>Booking</label>
            <select value={bookingId} onChange={(event) => setBookingId(event.target.value)} required>
              <option value="">Select booking</option>
              {eligible.map((booking) => (
                <option key={booking.booking_id} value={booking.booking_id}>
                  #{booking.booking_id} - {booking.room_type} - {booking.check_in} to {booking.check_out}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Reason</label>
            <textarea
              rows="5"
              maxLength="255"
              placeholder="Optional reason for cancellation"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          <button className="btn btn-danger" disabled={loading}>
            <RotateCcw size={15} /> Cancel Booking
          </button>
          <Link to="/dashboard" className="btn btn-outline">Back to dashboard</Link>
        </form>

        <aside className={styles.historyCard}>
          <p className="label">Cancellation History</p>
          <h2 className="display-md">Refund trail</h2>
          {loading ? (
            <p className={styles.muted}>Loading cancellations...</p>
          ) : cancellations.length === 0 ? (
            <p className={styles.muted}>No cancellations yet.</p>
          ) : (
            <div className={styles.historyList}>
              {cancellations.map((item) => (
                <article key={item.cancellation_id}>
                  <div>
                    <strong>Booking #{item.booking_id}</strong>
                    <span>{item.room_type} - Room {item.room_number}</span>
                    <p>{item.reason}</p>
                  </div>
                  <div>
                    <span className="badge status-CANCELLED">CANCELLED</span>
                    {item.refund_amount && <strong>{money(item.refund_amount)}</strong>}
                    {item.refund_status && <span className={`badge status-${item.refund_status}`}>{item.refund_status}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
