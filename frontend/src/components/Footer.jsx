import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="contact" style={{
      background: 'var(--umber)',
      color: 'rgba(255,255,255,0.75)',
      padding: '5rem 0 2rem',
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.4fr', gap: '3rem', marginBottom: '4rem' }}>

          {/* Brand */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300,
              color: 'var(--white)', letterSpacing: '0.08em', marginBottom: '0.2rem',
            }}>Gulmohar</div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--amber-light)', marginBottom: '1.5rem' }}>
              Resort &amp; Spa
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.8, maxWidth: '280px' }}>
              Where the flame tree blooms and time slows down. An intimate luxury sanctuary crafted for those who seek the extraordinary.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" style={{
                  width: 36, height: 36, border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber-light)'; e.currentTarget.style.color = 'var(--amber-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--amber-light)', fontWeight: 600, marginBottom: '1.2rem' }}>Explore</p>
            {['Home', 'Rooms & Villas', 'Amenities', 'Dining', 'Contact'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--amber-light)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
              >{l}</a>
            ))}
          </div>

          {/* Policies */}
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--amber-light)', fontWeight: 600, marginBottom: '1.2rem' }}>Policies</p>
            {['Booking Policy', 'Cancellation Policy', 'Privacy Policy', 'Terms of Service', 'FAQ'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--amber-light)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
              >{l}</a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--amber-light)', fontWeight: 600, marginBottom: '1.2rem' }}>Get In Touch</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { Icon: MapPin, text: 'Mysuru-Madikeri Road, Coorg, Karnataka 571201' },
                { Icon: Phone, text: '+91 98765 43210' },
                { Icon: Mail,  text: 'reservations@gulmoharresort.in' },
              ].map(({ Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', alignItems: 'flex-start' }}>
                  <Icon size={15} style={{ color: 'var(--amber)', marginTop: '0.2rem', flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.35)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span>© {new Date().getFullYear()} Gulmohar Resort. All rights reserved.</span>
          <span>Crafted with care in Coorg, India</span>
        </div>
      </div>
    </footer>
  )
}