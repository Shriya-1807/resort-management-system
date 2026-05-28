import React from 'react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Info, Users } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './FlowPages.module.css'

import roomAmber from '../assets/images/room-amber.jpg'
import roomFlame from '../assets/images/room-flame.jpg'
import roomPenthouse from '../assets/images/room-penthouse.jpg'
import hero1 from '../assets/images/hero-1.jpg'

const getRoomImage = (name = '') => {
  if (!name) return hero1;
  const n = name.toLowerCase();
  if (n.includes('flame')) return roomFlame;
  if (n.includes('poinciana')) return roomPenthouse;
  if (n.includes('amber')) return roomAmber;
  return hero1;
}

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
const nightsBetween = (start, end) => Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000))

export default function BookingPage() {
  const navigate = useNavigate()
  const { state = {} } = useLocation()
  const room = state.room
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    check_in: state.check_in || today,
    check_out: state.check_out || tomorrow,
    num_guests: state.num_guests || 1,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })

  const nights = nightsBetween(form.check_in, form.check_out)
  const total = Number(room?.price_per_day || 0) * nights

  const submit = async (event) => {
    event.preventDefault()
    if (!room?.room_type_id) {
      toast.error('Please select a room type first')
      navigate('/rooms')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/bookings', {
        room_type_id: Number(room.room_type_id),
        check_in: form.check_in,
        check_out: form.check_out,
        num_guests: Number(form.num_guests),
      })
      toast.success('Room secured. Complete payment to generate receipt.')
      navigate(`/payment/${data.booking_id}`, { state: { booking: data, room, total, nights, guestInfo: form } })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className="label">Booking</p>
          <h1 className="display-lg">Confirm Your Stay</h1>
        </div>
      </section>

      <section className={`container ${styles.layout}`}>
        <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
          <div className="section-eyebrow">
            <span className="label" style={{ color: 'var(--amber-deep)' }}>Guest details</span>
          </div>
          <h2 className="display-md">Stay information</h2>

          <div className="form-grid-2">
            <div className="form-group"><label>First Name</label><input required value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} /></div>
            <div className="form-group"><label>Last Name</label><input required value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} /></div>
          </div>
          <div className="form-grid-2">
            <div className="form-group"><label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="form-group"><label>Phone</label><input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <div className="form-grid-3">
            <div className="form-group"><label>Check-in</label><input type="date" min={today} required value={form.check_in} onChange={(e) => setForm((p) => ({ ...p, check_in: e.target.value }))} /></div>
            <div className="form-group"><label>Check-out</label><input type="date" min={form.check_in} required value={form.check_out} onChange={(e) => setForm((p) => ({ ...p, check_out: e.target.value }))} /></div>
            <div className="form-group"><label>Guests</label><input type="number" min="1" max={room?.max_occupancy || 6} required value={form.num_guests} onChange={(e) => setForm((p) => ({ ...p, num_guests: e.target.value }))} /></div>
          </div>

          <p className={styles.muted}><Info size={14} style={{ display: 'inline', marginRight: 6 }} />Cancellation is available before check-in for confirmed bookings.</p>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Securing...' : 'Proceed to Payment'}</button>
        </form>

        <aside className={styles.summary}>
          <div className={styles.summaryImage} style={{ backgroundImage: `url(${getRoomImage(room?.type_name)})` }} />
          <div className={styles.side}>
            <h3>{room?.type_name || 'No room selected'}</h3>
            <div className={styles.line}><span><CalendarDays size={13} /> Check-in</span><strong>{form.check_in}</strong></div>
            <div className={styles.line}><span><CalendarDays size={13} /> Check-out</span><strong>{form.check_out}</strong></div>
            <div className={styles.line}><span><Users size={13} /> Guests</span><strong>{form.num_guests}</strong></div>
            <div className={styles.line}><span>{money(room?.price_per_day)} x {nights} night(s)</span><strong /></div>
            <div className={styles.total}><span>Total</span><strong>{money(total)}</strong></div>
          </div>
        </aside>
      </section>
    </main>
  )
}
