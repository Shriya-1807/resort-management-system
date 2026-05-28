import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './RestaurantPage.module.css'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
const todayISO = () => new Date().toISOString().split('T')[0]
const isInStayWindow = (booking) => {
  if (!booking) return false
  if (booking.status === 'CHECKED_IN') return true
  if (booking.status === 'CONFIRMED') {
    const today = todayISO()
    const checkIn = String(booking.check_in).split('T')[0]
    const checkOut = String(booking.check_out).split('T')[0]
    return today >= checkIn && today <= checkOut
  }
  return false
}

export default function RestaurantPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [cart, setCart] = useState({})
  const [deliveryType, setDeliveryType] = useState('ROOM_SERVICE')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const cartItems = Object.values(cart)
  const total = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [cartItems])
  const visibleMenu = category ? menu.filter((item) => item.category === category) : menu
  const canOrder = isInStayWindow(booking)

  useEffect(() => {
    Promise.all([
      api.get(`/bookings/${bookingId}`),
      api.get('/restaurant/menu'),
      api.get('/restaurant/menu/categories'),
      api.get(`/restaurant/orders/${bookingId}`),
    ])
      .then(([bookingRes, menuRes, categoryRes, ordersRes]) => {
        setBooking(bookingRes.data)
        setMenu(menuRes.data)
        setCategories(categoryRes.data)
        setOrders(ordersRes.data)
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [bookingId])

  const addItem = (item) => {
    setCart((current) => ({
      ...current,
      [item.item_id]: {
        ...item,
        quantity: (current[item.item_id]?.quantity || 0) + 1,
      },
    }))
  }

  const changeQty = (item, delta) => {
    setCart((current) => {
      const quantity = (current[item.item_id]?.quantity || 0) + delta
      if (quantity <= 0) {
        const next = { ...current }
        delete next[item.item_id]
        return next
      }
      return { ...current, [item.item_id]: { ...item, quantity } }
    })
  }

  const placeOrder = async () => {
    if (!booking?.room_id) {
      toast.error('Room details are missing for this booking. Refresh after backend update.')
      return
    }
    if (!canOrder) {
      toast.error('Food orders open only during your stay, from check-in date until before check-out')
      return
    }
    if (!cartItems.length) {
      toast.error('Add at least one menu item')
      return
    }
    try {
      const { data } = await api.post('/restaurant/orders', {
        booking_id: Number(bookingId),
        room_id: booking.room_id,
        delivery_type: deliveryType,
        items: cartItems.map((item) => ({ item_id: item.item_id, quantity: item.quantity })),
      })
      toast.success(`Food order #${data.order_id} confirmed`)
      setCart({})
      const ordersRes = await api.get(`/restaurant/orders/${bookingId}`)
      setOrders(ordersRes.data)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className="label">Food Time</p>
          <h1 className="display-lg">The Vermilion Pavilion</h1>
          <p>Browse the menu, add food to your cart, choose in-room or in-dine service, and confirm your order.</p>
        </div>
      </section>

      <section className={`container ${styles.layout}`}>
        <div className={styles.menuPanel}>
          <div className={styles.contextBar}>
            <div>
              <span className="label">Active stay</span>
              <strong>{booking ? `Booking #${booking.booking_id} - Room ${booking.room_number}` : 'Loading booking...'}</strong>
            </div>
            <Link to="/dashboard" className="btn btn-outline btn-sm">Back to dashboard</Link>
          </div>

          {!canOrder && booking && (
            <div className={styles.stayNotice}>
              Food ordering opens during your stay only. This booking runs from {String(booking.check_in).split('T')[0]} to {String(booking.check_out).split('T')[0]}.
            </div>
          )}

          <div className={styles.categories}>
            <button className={!category ? styles.active : ''} onClick={() => setCategory('')}>All</button>
            {categories.map((item) => (
              <button key={item} className={category === item ? styles.active : ''} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>

          {loading ? (
            <div className={styles.empty}>Loading menu...</div>
          ) : (
            <div className={styles.menuGrid}>
              {visibleMenu.map((item) => (
                <article key={item.item_id} className={styles.menuCard}>
                  <div>
                    <span>{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description || 'A Gulmohar kitchen favorite prepared fresh for your stay.'}</p>
                  </div>
                  <div className={styles.menuFoot}>
                    <strong>{money(item.price)}</strong>
                    <button className="btn btn-primary btn-sm" onClick={() => addItem(item)}>Add</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className={styles.cartPanel}>
          <div className={styles.cartHeader}>
            <ShoppingBag size={18} />
            <div>
              <p className="label">Order Cart</p>
              <h2>Confirm food</h2>
            </div>
          </div>

          <div className={styles.delivery}>
            <button className={deliveryType === 'ROOM_SERVICE' ? styles.active : ''} onClick={() => setDeliveryType('ROOM_SERVICE')}>In-room</button>
            <button className={deliveryType === 'DINE_IN' ? styles.active : ''} onClick={() => setDeliveryType('DINE_IN')}>In-dine</button>
          </div>

          {cartItems.length === 0 ? (
            <p className={styles.muted}>Your selected dishes will appear here.</p>
          ) : (
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.item_id} className={styles.cartItem}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{money(item.price)} each</span>
                  </div>
                  <div className={styles.qty}>
                    <button onClick={() => changeQty(item, -1)}><Minus size={13} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => changeQty(item, 1)}><Plus size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.total}>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="btn btn-primary" onClick={placeOrder} disabled={!canOrder}>
            <UtensilsCrossed size={15} /> Pay and Confirm Order
          </button>

          <div className={styles.history}>
            <h3>Order status</h3>
            {orders.length === 0 ? <p>No food orders yet.</p> : orders.map((order) => (
              <article key={order.order_id}>
                <div>
                  <strong>Order #{order.order_id}</strong>
                  <span>{order.delivery_type} - {money(order.total_amount)}</span>
                </div>
                <span className={`badge status-${order.status}`}>{order.status}</span>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}
