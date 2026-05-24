import React from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Send, Ticket } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './TicketsPage.module.css'

const todayISO = () => new Date().toISOString().split('T')[0]
const isInStayWindow = (booking) => {
  if (!booking) return false
  const today = todayISO()
  return ['CONFIRMED', 'CHECKED_IN'].includes(booking.status) && today >= booking.check_in && today < booking.check_out
}

export default function TicketsPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState({ category: 'CLEANING', description: '' })
  const [loading, setLoading] = useState(true)
  const canCreateTicket = isInStayWindow(booking)

  const load = async () => {
    const [bookingRes, ticketsRes] = await Promise.all([
      api.get(`/bookings/${bookingId}`),
      api.get(`/tickets/${bookingId}`),
    ])
    setBooking(bookingRes.data)
    setTickets(ticketsRes.data)
  }

  useEffect(() => {
    load()
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [bookingId])

  const submitTicket = async (event) => {
    event.preventDefault()
    if (!booking?.room_id) {
      toast.error('Room details are missing for this booking. Refresh after backend update.')
      return
    }
    if (!canCreateTicket) {
      toast.error('Service tickets open only during your stay, from check-in date until before check-out')
      return
    }
    try {
      await api.post('/tickets', {
        booking_id: Number(bookingId),
        room_id: booking.room_id,
        category: form.category,
        description: form.description,
      })
      toast.success('Service ticket generated')
      setForm({ category: 'CLEANING', description: '' })
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className="label">Service Desk</p>
          <h1 className="display-lg">Generate Ticket</h1>
          <p>Request cleaning, extras, repairs, or any other support for your active Gulmohar stay.</p>
        </div>
      </section>

      <section className={`container ${styles.layout}`}>
        <form className={styles.formCard} onSubmit={submitTicket}>
          <div className="section-eyebrow">
            <span className="label" style={{ color: 'var(--amber-deep)' }}>Ticket form</span>
          </div>
          <h2 className="display-md">How can we help?</h2>
          <p className={styles.muted}>
            {booking ? `Booking #${booking.booking_id} - Room ${booking.room_number}` : 'Loading booking details...'}
          </p>
          {!canCreateTicket && booking && (
            <div className={styles.stayNotice}>
              Service tickets can be generated only during your stay. This booking runs from {booking.check_in} to {booking.check_out}.
            </div>
          )}

          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
              <option value="CLEANING">Cleaning</option>
              <option value="EXTRAS">Extras</option>
              <option value="REPAIR">Repair</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="6"
              maxLength="500"
              required
              placeholder="Write a short description for our staff..."
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <button className="btn btn-primary" disabled={loading || !canCreateTicket}>
            <Send size={15} /> Generate Ticket
          </button>
          <Link to="/dashboard" className="btn btn-outline">Back to dashboard</Link>
        </form>

        <aside className={styles.historyCard}>
          <div className={styles.historyHead}>
            <Ticket size={18} />
            <div>
              <p className="label">Ticket Status</p>
              <h2>Requests</h2>
            </div>
          </div>

          {loading ? (
            <p className={styles.muted}>Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p className={styles.muted}>No tickets have been generated for this booking yet.</p>
          ) : (
            <div className={styles.ticketList}>
              {tickets.map((ticket) => (
                <article key={ticket.ticket_id}>
                  <div>
                    <strong>#{ticket.ticket_id} - {ticket.category}</strong>
                    <p>{ticket.description}</p>
                    {ticket.assigned_to && <span>Assigned to {ticket.assigned_to}</span>}
                  </div>
                  <span className={`badge status-${ticket.status}`}>{ticket.status}</span>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
