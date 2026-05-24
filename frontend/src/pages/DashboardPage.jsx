import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Download, ReceiptText, Ticket, UtensilsCrossed, XCircle } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './DashboardPage.module.css'

const isActiveStay = (booking) => ['CONFIRMED', 'CHECKED_IN'].includes(booking.status)
const isCancellable = (booking) => booking.status === 'CONFIRMED' && new Date(booking.check_in) > new Date(new Date().toISOString().split('T')[0])
const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export default function DashboardPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/bookings/my')
      .then(({ data }) => setBookings(data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const active = bookings.filter(isActiveStay).length
    const upcoming = bookings.filter((booking) => booking.status === 'CONFIRMED').length
    const spent = bookings.reduce((sum, booking) => sum + Number(booking.amount_paid || booking.total_room_cost || 0), 0)
    return { active, upcoming, spent }
  }, [bookings])

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className="label">Guest Dashboard</p>
          <h1 className="display-lg">Your Gulmohar Stays</h1>
          <p>Manage bookings, download receipts, order food during active stays, raise tickets, and cancel eligible reservations.</p>
        </div>
      </section>

      <section className="container">
        <div className={styles.metrics}>
          <article><span>Active stays</span><strong>{stats.active}</strong></article>
          <article><span>Upcoming bookings</span><strong>{stats.upcoming}</strong></article>
          <article><span>Total paid</span><strong>{money(stats.spent)}</strong></article>
        </div>

        <div className={styles.toolbar}>
          <div>
            <p className="label">Booking Desk</p>
            <h2 className="display-md">My bookings</h2>
          </div>
          <Link to="/rooms" className="btn btn-primary">Book another stay</Link>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div className={styles.empty}>
            <h3 className="display-md">No bookings yet</h3>
            <p>Choose your dates and reserve a Gulmohar room to begin.</p>
            <Link to="/rooms" className="btn btn-primary">Browse rooms</Link>
          </div>
        ) : (
          <div className={styles.bookingList}>
            {bookings.map((booking) => (
              <article key={booking.booking_id} className={styles.bookingCard}>
                <div className={styles.bookingMain}>
                  <div>
                    <span className={`badge status-${booking.status}`}>{booking.status}</span>
                    <h3>{booking.room_type}</h3>
                    <p>Booking #{booking.booking_id} - Room {booking.room_number}</p>
                  </div>
                  <div className={styles.dateGrid}>
                    <span><CalendarDays size={14} /> {booking.check_in}</span>
                    <span><CalendarDays size={14} /> {booking.check_out}</span>
                    <span>{booking.nights} night(s)</span>
                    <strong>{money(booking.total_room_cost)}</strong>
                  </div>
                </div>

                <div className={styles.actions}>
                  {booking.amount_paid && (
                    <Link to={`/receipt/${booking.booking_id}`} className="btn btn-outline btn-sm">
                      <Download size={14} /> Receipt
                    </Link>
                  )}
                  {isActiveStay(booking) && (
                    <>
                      <Link to={`/restaurant/${booking.booking_id}`} className="btn btn-outline btn-sm">
                        <UtensilsCrossed size={14} /> Food Time
                      </Link>
                      <Link to={`/tickets/${booking.booking_id}`} className="btn btn-outline btn-sm">
                        <Ticket size={14} /> Ticket
                      </Link>
                    </>
                  )}
                  {isCancellable(booking) && (
                    <Link to="/cancellations" className="btn btn-danger btn-sm">
                      <XCircle size={14} /> Cancel
                    </Link>
                  )}
                  {!booking.amount_paid && booking.status !== 'CANCELLED' && (
                    <Link to={`/payment/${booking.booking_id}`} className="btn btn-primary btn-sm">
                      <ReceiptText size={14} /> Pay
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
