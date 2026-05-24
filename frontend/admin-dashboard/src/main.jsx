import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import {
  BedDouble,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react'
import './styles.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL: API_BASE, timeout: 15000 })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gulmohar_staff_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(error.response?.data?.error || error.message || 'Request failed')),
)

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gulmohar_staff_user')) || null
    } catch {
      return null
    }
  })

  const login = (user, token) => {
    setSession(user)
    localStorage.setItem('gulmohar_staff_user', JSON.stringify(user))
    localStorage.setItem('gulmohar_staff_token', token)
  }

  const logout = () => {
    setSession(null)
    localStorage.removeItem('gulmohar_staff_user')
    localStorage.removeItem('gulmohar_staff_token')
  }

  return session ? <Console user={session} onLogout={logout} /> : <Login onLogin={login} />
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/staff/login', form)
      onLogin(data.user, data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-art">
          <p className="label">Gulmohar Operations</p>
          <h1>Staff Console</h1>
          <p>Separate staff/admin frontend for bookings, rooms, kitchen orders, service tickets, refunds, and resort metrics.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <div>
            <p className="label amber">Secure access</p>
            <h2>Sign in</h2>
          </div>
          <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={loading}>{loading ? 'Signing in...' : 'Enter console'}</button>
        </form>
      </section>
    </main>
  )
}

function Console({ user, onLogout }) {
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({
    dashboard: null,
    bookings: [],
    orders: [],
    tickets: [],
    rooms: [],
    guests: [],
    staff: [],
    refunds: [],
  })
  const [message, setMessage] = useState('')
  const isAdmin = user.role === 'ADMIN'

  const load = async () => {
    const requests = [
      api.get('/admin/dashboard'),
      api.get('/bookings'),
      api.get('/restaurant/active-orders'),
      api.get('/tickets'),
      api.get('/rooms'),
    ]
    if (isAdmin) {
      requests.push(api.get('/admin/guests'))
      requests.push(api.get('/admin/staff'))
      requests.push(api.get('/admin/refunds'))
    }
    const result = await Promise.all(requests)
    setData({
      dashboard: result[0].data,
      bookings: result[1].data.bookings || [],
      orders: result[2].data || [],
      tickets: result[3].data || [],
      rooms: result[4].data || [],
      guests: result[5]?.data.guests || result[5]?.data || [],
      staff: result[6]?.data || [],
      refunds: result[7]?.data || [],
    })
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [])

  const run = async (action, success = 'Updated') => {
    try {
      await action()
      await load()
      setMessage(success)
    } catch (err) {
      setMessage(err.message)
    }
  }

  const metrics = useMemo(() => {
    if (!data.dashboard) return []
    return [
      ['Bookings', data.dashboard.total_bookings, ClipboardList],
      ['Active stays', data.dashboard.active_bookings, BedDouble],
      ['Revenue', money(data.dashboard.total_revenue), CreditCard],
      ['Open tickets', data.dashboard.open_tickets, Ticket],
      ['Kitchen orders', data.dashboard.active_orders, ChefHat],
      ['Guests', data.dashboard.total_guests, Users],
    ]
  }, [data.dashboard])

  return (
    <main className="console">
      <aside className="sidebar">
        <div className="brand">
          <span>Gulmohar</span>
          <small>{user.role} Console</small>
        </div>
        {[
          ['overview', 'Overview', LayoutDashboard],
          ['bookings', 'Bookings', ClipboardList],
          ['orders', 'Kitchen', ChefHat],
          ['tickets', 'Tickets', Ticket],
          ['rooms', 'Rooms', BedDouble],
          ...(isAdmin ? [['admin', 'Admin', ShieldCheck]] : []),
        ].map(([key, label, Icon]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={16} /> {label}</button>
        ))}
        <button onClick={onLogout}><LogOut size={16} /> Sign out</button>
      </aside>

      <section className="content">
        <header className="top">
          <div>
            <p className="label amber">Welcome, {user.name}</p>
            <h1>{tab[0].toUpperCase() + tab.slice(1)}</h1>
          </div>
          <button className="outline" onClick={() => load().catch((err) => setMessage(err.message))}><RefreshCcw size={15} /> Refresh</button>
        </header>
        {message && <div className="toast" onAnimationEnd={() => setMessage('')}>{message}</div>}

        {tab === 'overview' && <Overview metrics={metrics} bookings={data.bookings} orders={data.orders} tickets={data.tickets} />}
        {tab === 'bookings' && <Bookings bookings={data.bookings} run={run} />}
        {tab === 'orders' && <Orders orders={data.orders} run={run} />}
        {tab === 'tickets' && <Tickets tickets={data.tickets} run={run} />}
        {tab === 'rooms' && <Rooms rooms={data.rooms} run={run} isAdmin={isAdmin} />}
        {tab === 'admin' && isAdmin && <Admin data={data} run={run} />}
      </section>
    </main>
  )
}

function Overview({ metrics, bookings, orders, tickets }) {
  return (
    <>
      <section className="metrics">{metrics.map(([label, value, Icon]) => <article key={label}><Icon size={18} /><span>{label}</span><strong>{value}</strong></article>)}</section>
      <section className="grid-3">
        <Mini title="Recent bookings" rows={bookings.slice(0, 5).map((b) => [`#${b.booking_id} ${b.first_name || ''} ${b.last_name || ''}`, b.status])} />
        <Mini title="Kitchen queue" rows={orders.slice(0, 5).map((o) => [`#${o.order_id} Room ${o.room_number}`, o.status])} />
        <Mini title="Open tickets" rows={tickets.slice(0, 5).map((t) => [`#${t.ticket_id} ${t.category}`, t.status])} />
      </section>
    </>
  )
}

function Mini({ title, rows }) {
  return <article className="panel"><h2>{title}</h2>{rows.length ? rows.map(([a, b]) => <div className="mini-row" key={a}><span>{a}</span><b>{b}</b></div>) : <p className="muted">Nothing pending.</p>}</article>
}

function Bookings({ bookings, run }) {
  return <section className="panel"><h2>Booking lifecycle</h2>{bookings.map((b) => <div className="table-row" key={b.booking_id}><div><strong>#{b.booking_id} {b.first_name} {b.last_name}</strong><span>{b.room_type} - Room {b.room_number} - {b.check_in} to {b.check_out}</span></div><select value={b.status} onChange={(e) => run(() => api.patch(`/bookings/${b.booking_id}/status`, { status: e.target.value }), 'Booking status updated')}><option>PENDING</option><option>CONFIRMED</option><option>CHECKED_IN</option><option>CHECKED_OUT</option><option>CANCELLED</option></select></div>)}</section>
}

function Orders({ orders, run }) {
  return <section className="panel"><h2>Kitchen orders</h2>{orders.map((o) => <div className="table-row" key={o.order_id}><div><strong>Order #{o.order_id} - Room {o.room_number}</strong><span>{o.items_summary || o.delivery_type}</span></div><select value={o.status} onChange={(e) => run(() => api.patch(`/restaurant/orders/${o.order_id}/status`, { status: e.target.value }), 'Order status updated')}><option>PLACED</option><option>PREPARING</option><option>READY</option><option>SERVED</option><option>CANCELLED</option></select></div>)}</section>
}

function Tickets({ tickets, run }) {
  return <section className="panel"><h2>Service tickets</h2>{tickets.map((t) => <div className="table-row" key={t.ticket_id}><div><strong>Ticket #{t.ticket_id} - {t.category}</strong><span>{t.description}</span></div><select value={t.status} onChange={(e) => run(() => api.patch(`/tickets/${t.ticket_id}`, { status: e.target.value }), 'Ticket status updated')}><option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CANCELLED</option></select></div>)}</section>
}

function Rooms({ rooms, run, isAdmin }) {
  return <section className="panel"><h2>Room inventory</h2>{rooms.map((r) => <div className="table-row" key={r.room_id}><div><strong>Room {r.room_number}</strong><span>{r.type_name} - Floor {r.floor} - {money(r.price_per_day)}</span></div>{isAdmin ? <select value={r.status} onChange={(e) => run(() => api.patch(`/rooms/${r.room_id}/status`, { status: e.target.value }), 'Room status updated')}><option>ACTIVE</option><option>MAINTENANCE</option><option>INACTIVE</option></select> : <b>{r.status}</b>}</div>)}</section>
}

function Admin({ data, run }) {
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'STAFF' })
  return (
    <section className="admin-grid">
      <article className="panel"><h2>Guests</h2>{data.guests.slice(0, 12).map((g) => <div className="mini-row" key={g.guest_id || g.email}><span>{g.first_name} {g.last_name}</span><b>{g.email}</b></div>)}</article>
      <article className="panel"><h2>Staff accounts</h2><form className="staff-form" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/admin/staff', staffForm), 'Staff account created'); setStaffForm({ name: '', email: '', password: '', role: 'STAFF' }) }}><input placeholder="Name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required /><input placeholder="Email" type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required /><input placeholder="Password" type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} required /><select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}><option>STAFF</option><option>ADMIN</option></select><button className="primary">Create</button></form>{data.staff.map((s) => <div className="mini-row" key={s.staff_id}><span>{s.name}</span><b>{s.role}</b></div>)}</article>
      <article className="panel"><h2>Refunds</h2>{data.refunds.map((r) => <div className="mini-row" key={r.refund_id}><span>#{r.refund_id} {r.first_name} {r.last_name}</span><b>{r.refund_status}</b><button className="outline" onClick={() => run(() => api.patch(`/cancellations/refunds/${r.refund_id}`, { gateway_ref: `MANUAL-${Date.now()}` }), 'Refund processed')}>Process</button></div>)}</article>
    </section>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
