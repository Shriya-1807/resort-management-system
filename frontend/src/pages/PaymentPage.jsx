import React from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CreditCard, Globe, Lock, Smartphone } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './FlowPages.module.css'

const methods = [
  { id: 'Card', label: 'Card', icon: CreditCard },
  { id: 'UPI', label: 'UPI', icon: Smartphone },
  { id: 'Net Banking', label: 'Net Banking', icon: Globe },
]

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export default function PaymentPage() {
  const { bookingId } = useParams()
  const { state = {} } = useLocation()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(state.booking || null)
  const [amount, setAmount] = useState(state.total || 0)
  const [method, setMethod] = useState('Card')
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [upi, setUpi] = useState('')
  const [bank, setBank] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (amount) return
    api.get(`/bookings/${bookingId}`)
      .then(({ data }) => {
        setBooking(data)
        setAmount(Number(data.total_room_cost || 0))
      })
      .catch((err) => toast.error(err.message))
  }, [bookingId, amount])

  const submit = async (event) => {
    event.preventDefault()
    if (method === 'UPI' && !upi.includes('@')) return toast.error('Enter a valid UPI ID')
    if (method === 'Net Banking' && !bank) return toast.error('Select a bank')
    setLoading(true)
    try {
      await api.post('/payments', {
        booking_id: Number(bookingId),
        amount: Number(amount),
        method,
      })
      toast.success('Payment confirmed')
      navigate(`/receipt/${bookingId}`)
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
          <p className="label">Payment</p>
          <h1 className="display-lg">Complete Payment</h1>
        </div>
      </section>

      <section className={`container ${styles.layout}`}>
        <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
          <div className="section-eyebrow">
            <span className="label" style={{ color: 'var(--amber-deep)' }}>Secure checkout</span>
          </div>
          <h2 className="display-md">Payment details</h2>

          <div className={styles.methodGrid}>
            {methods.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={method === id ? styles.active : ''} onClick={() => setMethod(id)}>
                <Icon size={20} /> {label}
              </button>
            ))}
          </div>

          {method === 'Card' && (
            <>
              <div className="form-group"><label>Name on Card</label><input required value={card.name} onChange={(e) => setCard((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Card Number</label><input required maxLength="19" value={card.number} onChange={(e) => setCard((p) => ({ ...p, number: e.target.value }))} /></div>
              <div className="form-grid-2">
                <div className="form-group"><label>Expiry</label><input required placeholder="08/27" value={card.expiry} onChange={(e) => setCard((p) => ({ ...p, expiry: e.target.value }))} /></div>
                <div className="form-group"><label>CVV</label><input required type="password" maxLength="4" value={card.cvv} onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value }))} /></div>
              </div>
            </>
          )}
          {method === 'UPI' && <div className="form-group"><label>UPI ID</label><input required placeholder="name@bank" value={upi} onChange={(e) => setUpi(e.target.value)} /></div>}
          {method === 'Net Banking' && (
            <div className="form-group"><label>Bank</label><select required value={bank} onChange={(e) => setBank(e.target.value)}><option value="">Select bank</option>{['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'].map((item) => <option key={item}>{item}</option>)}</select></div>
          )}

          <p className={styles.muted}><Lock size={14} style={{ display: 'inline', marginRight: 6 }} />This is a simulated payment form. No real gateway is integrated.</p>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Processing...' : `Confirm Payment - ${money(amount)}`}</button>
        </form>

        <aside className={styles.summary}>
          <div className={styles.side}>
            <p className="label" style={{ color: 'var(--amber-deep)' }}>Order Summary</p>
            <h3>Booking #{bookingId}</h3>
            <div className={styles.line}><span>Room</span><strong>{state.room?.type_name || booking?.room_type || 'Selected room'}</strong></div>
            <div className={styles.line}><span>Status</span><strong>{booking?.status || 'CONFIRMED'}</strong></div>
            <div className={styles.total}><span>Total Due</span><strong>{money(amount)}</strong></div>
          </div>
        </aside>
      </section>
    </main>
  )
}
