import React from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Download, Ticket, UtensilsCrossed } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './FlowPages.module.css'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export default function ReceiptPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/payments/receipt/${bookingId}`)
      .then(({ data }) => setReceipt(data))
      .catch((err) => {
        toast.error(err.message)
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
  }, [bookingId])

  if (loading) return <main className={styles.page}><div className={styles.empty}>Loading receipt...</div></main>
  if (!receipt) return null

  return (
    <main className={styles.page}>
      <section className={styles.receipt}>
        <div className={styles.receiptHead}>
          <div>
            <p className="label" style={{ color: 'var(--amber-light)' }}>Booking Confirmation</p>
            <h1 className="display-md" style={{ color: 'var(--white)' }}>Gulmohar</h1>
            <p>Receipt for booking #{receipt.booking_id}</p>
          </div>
          <span className="badge badge-success"><CheckCircle size={13} /> Confirmed</span>
        </div>
        <div className={styles.receiptBody}>
          <h2 className="display-md">{receipt.first_name} {receipt.last_name}</h2>
          <p className={styles.muted}>{receipt.email} - {receipt.phone}</p>

          <div className={styles.detailGrid}>
            <div className={styles.detail}><span className="label">Check-in</span><strong>{receipt.check_in}</strong></div>
            <div className={styles.detail}><span className="label">Check-out</span><strong>{receipt.check_out}</strong></div>
            <div className={styles.detail}><span className="label">Room</span><strong>{receipt.room_type}, room {receipt.room_number}</strong></div>
            <div className={styles.detail}><span className="label">Guests</span><strong>{receipt.num_guests}</strong></div>
          </div>

          <div className={styles.card}>
            <div className={styles.line}><span>Rate</span><strong>{money(receipt.price_per_day)} x {receipt.nights} night(s)</strong></div>
            <div className={styles.line}><span>Payment method</span><strong>{receipt.method || receipt.payment_method}</strong></div>
            <div className={styles.total}><span>Total paid</span><strong>{money(receipt.amount || receipt.amount_paid)}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1.5rem' }} className="no-print">
            <button className="btn btn-primary" onClick={() => window.print()}><Download size={14} /> Download Receipt</button>
            <Link to={`/restaurant/${receipt.booking_id}`} className="btn btn-outline"><UtensilsCrossed size={14} /> Food Time</Link>
            <Link to={`/tickets/${receipt.booking_id}`} className="btn btn-outline"><Ticket size={14} /> Ticket</Link>
            <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
