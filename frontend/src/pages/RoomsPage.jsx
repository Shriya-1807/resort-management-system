import React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, CheckCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './FlowPages.module.css'

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const roomImage = (name = '') => {
  if (name.toLowerCase().includes('amber')) return '/images/room-amber.jpg'
  if (name.toLowerCase().includes('flame')) return '/images/room-flame.jpg'
  if (name.toLowerCase().includes('poinciana')) return '/images/room-penthouse.jpg'
  return '/images/room-default.jpg'
}

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export default function RoomsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState({ check_in: today, check_out: tomorrow, num_guests: 1 })
  const [rooms, setRooms] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rooms/types')
      .then(({ data }) => setRooms(data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const checkAvailability = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.get('/rooms/available', { params: search })
      setRooms(data)
      setSearched(true)
      if (!data.length) toast('No room types available for these dates', { icon: 'Search' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectRoom = (room) => {
    if (!user) {
      toast('Please sign in before booking', { icon: 'Lock' })
      navigate('/auth')
      return
    }
    navigate('/booking', { state: { room, ...search } })
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className="label">Accommodation</p>
          <h1 className="display-lg">Rooms and Villas</h1>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <form className={styles.search} onSubmit={checkAvailability}>
          <div className="form-group">
            <label>Check-in</label>
            <input type="date" min={today} value={search.check_in} onChange={(e) => setSearch((prev) => ({ ...prev, check_in: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Check-out</label>
            <input type="date" min={search.check_in} value={search.check_out} onChange={(e) => setSearch((prev) => ({ ...prev, check_out: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Guests</label>
            <select value={search.num_guests} onChange={(e) => setSearch((prev) => ({ ...prev, num_guests: Number(e.target.value) }))}>
              {[1, 2, 3, 4, 5, 6].map((num) => <option key={num} value={num}>{num}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" disabled={loading}><Search size={15} /> {loading ? 'Checking...' : 'Check'}</button>
        </form>

        {loading ? (
          <div className={styles.empty}>Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className={styles.empty}>No room types match this stay period.</div>
        ) : (
          <div className={styles.stack}>
            <p className="label" style={{ color: 'var(--taupe)' }}>
              {searched ? `${rooms.length} available room type(s)` : 'Browse all room types'}
            </p>
            {rooms.map((room) => (
              <article key={room.room_type_id} className={styles.roomCard}>
                <div className={styles.image} style={{ backgroundImage: `url(${roomImage(room.type_name)})` }} />
                <div className={styles.roomBody}>
                  <h3>{room.type_name}</h3>
                  <p><Users size={13} style={{ display: 'inline', marginRight: 6 }} />Up to {room.max_occupancy} guests</p>
                  {room.available_count && <p style={{ color: 'var(--success)' }}>{room.available_count} rooms available for selected dates</p>}
                  <div className={styles.chips}>
                    {(room.amenities || []).slice(0, 8).map((amenity) => (
                      <span key={amenity} className="badge badge-amber"><CheckCircle size={11} /> {amenity}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.side}>
                  <div className={styles.price}>{money(room.price_per_day)}</div>
                  <span className={styles.muted}>per night</span>
                  <button className="btn btn-primary" onClick={() => selectRoom(room)}>
                    Select <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
