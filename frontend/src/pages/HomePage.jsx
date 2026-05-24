import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, ChevronRight, Star, Waves, Dumbbell, UtensilsCrossed,
         Wifi, Car, TreePine, Sparkles, ArrowRight, Users, BedDouble, Coffee } from 'lucide-react'
import styles from './HomePage.module.css'

import hero1 from '../assets/images/hero-1.jpg'
import hero2 from '../assets/images/hero-2.jpg'
import hero3 from '../assets/images/hero-3.jpg'
import hero4 from '../assets/images/hero-4.jpg'
import hero5 from '../assets/images/hero-5.jpg'

import roomAmber from '../assets/images/room-amber.jpg'
import roomFlame from '../assets/images/room-flame.jpg'
import roomPenthouse from '../assets/images/room-penthouse.jpg'
import logoImg from '../components/logo.jpg'

import img1 from '../assets/images/1.jpg'
import img2 from '../assets/images/2.jpg'
import img4 from '../assets/images/4.jpg'
import img5 from '../assets/images/5.jpg'

/* ── Hero slides ── */
const SLIDES = [
  { id: 1, src: hero1, label: 'Gulmohar Resort', caption: 'A Sanctuary of Elegance', desc: 'Experience the perfect blend of natural beauty and unparalleled luxury at our sprawling estate.' },
  { id: 2, src: hero2, label: 'Grand Ballroom', caption: 'Celebrate in Style', desc: 'Elegant and spacious venues designed to make your weddings and celebrations truly unforgettable.' },
  { id: 3, src: hero3, label: 'Spa & Wellness', caption: 'Rejuvenate Your Senses', desc: 'Indulge in holistic therapies and traditional treatments amidst a serene, natural backdrop.' },
  { id: 4, src: hero4, label: 'The Vermilion Pavilion', caption: 'Bold Flavors, Crimson Hues', desc: 'A culinary journey featuring authentic flavors served in an exquisitely designed setting.' },
  { id: 5, src: hero5, label: 'Lagoon Pool', caption: 'Drift Into Serenity', desc: 'Relax and unwind in our expansive free-form pool, surrounded by lush tropical landscapes.' },
]

const AMENITIES = [
  { icon: Waves,        label: 'Lagoon Pool',       desc: 'An expansive free-form lagoon pool surrounded by tropical palms' },
  { icon: UtensilsCrossed, label: 'Fine Dining',    desc: 'The Vermilion Pavilion — open 24×7, serving Indian & continental cuisine' },
  { icon: Sparkles,     label: 'Spa & Wellness',    desc: 'Ayurvedic treatments and full-body therapies in a serene garden setting' },
  { icon: Dumbbell,     label: 'Fitness Centre',    desc: 'State-of-the-art gym with personal trainers available on request' },
  { icon: TreePine,     label: 'Kids Play Area',    desc: 'A safe, adventure-filled outdoor space for the little explorers' },
  { icon: Coffee,       label: 'Grand Ballroom',    desc: 'Elegant event spaces for weddings, conferences, and celebrations' },
  { icon: Wifi,         label: 'High-Speed Wi-Fi',  desc: 'Seamless connectivity across every corner of the resort' },
  { icon: Car,          label: 'Free Parking',      desc: 'Complimentary valet and self-parking for all guests' },
]

const ROOMS = [
  {
    name: 'The Amber Petal Suite',
    price: '₹9,000',
    unit: 'per night',
    guests: 2,
    img: roomAmber,
    tags: ['Queen Bed', 'Smart TV', 'AC', 'Work Desk'],
    desc: 'An intimate sanctuary wrapped in warm amber tones, perfect for couples seeking a tranquil escape.',
  },
  {
    name: 'The Flame Canopy Villa',
    price: '₹14,000',
    unit: 'per night',
    guests: 4,
    img: roomFlame,
    tags: ['King + Queen Beds', 'Mini Fridge', 'Smart TV', 'AC'],
    desc: 'Expansive family villas nestled beneath a canopy of flame trees, blending nature with refined comfort.',
  },
  {
    name: 'The Royal Poinciana Penthouse',
    price: '₹22,000',
    unit: 'per night',
    guests: 6,
    img: roomPenthouse,
    tags: ['Dual King Beds', 'Panoramic Balcony', 'Marble Bathtub', 'Kitchenette'],
    desc: 'Our crown jewel — a sweeping penthouse with panoramic views and every luxury imaginable.',
  },
]

const STATS = [
  { value: '30+', label: 'Rooms & Villas' },
  { value: '5★',  label: 'Guest Rating' },
  { value: '24/7', label: 'Concierge' },
  { value: '15+', label: 'Years of Hospitality' },
]

export default function HomePage({ onOpenAuth }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [slide, setSlide]   = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef(null)

  const goTo = (idx) => {
    setFading(true)
    setTimeout(() => { setSlide(idx); setFading(false) }, 350)
  }
  const next = () => goTo((slide + 1) % SLIDES.length)
  const prev = () => goTo((slide - 1 + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    timerRef.current = setInterval(next, 6000)
    return () => clearInterval(timerRef.current)
  }, [slide])

  const handleBookNow = () => {
    if (user) navigate('/rooms')
    else onOpenAuth()
  }

  return (
    <main>
      {/* ══════════════════════════════════════════════
          HERO SLIDER
      ══════════════════════════════════════════════ */}
      <section className={styles.hero}>
        {/* Slide image */}
        <div className={`${styles.heroImg} ${fading ? styles.fading : ''}`}>
          {/* Placeholder shown when actual image isn't loaded */}
          <div className={styles.imgPlaceholder} style={{ backgroundImage: `url(${SLIDES[slide].src})` }} />
          <div className={styles.heroOverlay} />
        </div>

        {/* Content */}
        <div className={styles.heroContent}>
          <p className={`${styles.heroEyebrow} fade-up`}>{SLIDES[slide].label}</p>
          <h2 className={`${styles.heroTitle} fade-up fade-up-d1`}>
            {SLIDES[slide].caption}
          </h2>
          <p className={`${styles.heroSub} fade-up fade-up-d2`}>
            {SLIDES[slide].desc}
          </p>
          <div className={`${styles.heroCtas} fade-up fade-up-d3`}>
            <button className="btn btn-primary btn-sm" onClick={handleBookNow}>
              Reserve <ArrowRight size={14} />
            </button>
            <Link to="/rooms" className="btn btn-ghost btn-sm">Rooms</Link>
          </div>
        </div>

        {/* Slide controls */}
        <div className={styles.heroControls}>
          <button className={styles.slideBtn} onClick={prev}><ChevronLeft size={22} /></button>
          <div className={styles.dots}>
            {SLIDES.map((_, i) => (
              <button key={i} className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
          <button className={styles.slideBtn} onClick={next}><ChevronRight size={22} /></button>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          {STATS.map(({ value, label }) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statVal}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          INTRO SECTION
      ══════════════════════════════════════════════ */}
      <section className={`section-pad ${styles.intro}`}>
        <div className="container">
          <div className={styles.introGrid}>
            <div className={styles.introText}>
              <div className="section-eyebrow">
                <span className="label" style={{ color: 'var(--amber-deep)' }}>Our Story</span>
              </div>
              <h2 className="display-lg" style={{ marginBottom: '1.5rem' }}>
                Where the Gulmohar<br /><em>Always Blooms</em>
              </h2>
              <p className="body-lg" style={{ color: 'var(--taupe)', marginBottom: '1.2rem' }}>
                Named after the flame tree that blazes in crimson and gold, Gulmohar Resort was born from a singular vision: to create a sanctuary where luxury meets the unhurried rhythms of nature.
              </p>
              <p className="body-lg" style={{ color: 'var(--taupe)', marginBottom: '2rem' }}>
                Each of our thirty rooms and villas has been thoughtfully designed to honour local craft traditions while offering every modern comfort. Come, let time slow down.
              </p>
              <button className="btn btn-outline" onClick={handleBookNow}>Book Your Escape</button>
            </div>
            <div className={styles.introImgGrid}>
              <div className={`${styles.introImg} ${styles.imgTall}`} style={{ backgroundImage: 'url(/images/about-1.jpg)' }} />
              <div className={styles.introImgCol}>
                <div className={styles.introImg} style={{ backgroundImage: 'url(/images/about-2.jpg)' }} />
                <div className={styles.introImg} style={{ backgroundImage: 'url(/images/about-3.jpg)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ROOMS SHOWCASE
      ══════════════════════════════════════════════ */}
      <section className={`section-pad ${styles.roomsSection}`} style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
              <span className="label" style={{ color: 'var(--amber-deep)' }}>Accommodation</span>
            </div>
            <h2 className="display-lg">Rooms &amp; Villas</h2>
            <div className="divider divider-center" style={{ marginTop: '1rem' }} />
          </div>
          <div className={styles.roomsGrid}>
            {ROOMS.map((room, i) => (
              <div key={i} className={`${styles.roomCard} card`}>
                <div className={styles.roomImgWrap}>
                  <div className={styles.roomImg} style={{ backgroundImage: `url(${room.img})` }} />
                  <div className={styles.roomImgOverlay}>
                    <Link to="/rooms" className="btn btn-ghost btn-sm">View Details</Link>
                  </div>
                </div>
                <div className={styles.roomBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, lineHeight: 1.2 }}>{room.name}</h3>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--amber-deep)', fontWeight: 500 }}>{room.price}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--taupe)', letterSpacing: '0.05em' }}>{room.unit}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--taupe)', marginBottom: '1rem', lineHeight: 1.7 }}>{room.desc}</p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                    {room.tags.map(t => <span key={t} className="badge badge-amber">{t}</span>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--taupe)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Users size={13} /> Up to {room.guests} guests
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={handleBookNow}>Book Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/rooms" className="btn btn-outline">View All Rooms <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          AMENITIES
      ══════════════════════════════════════════════ */}
      <section className="section-pad" id="amenities">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
              <span className="label" style={{ color: 'var(--amber-deep)' }}>Resort Facilities</span>
            </div>
            <h2 className="display-lg">World-Class Amenities</h2>
            <div className="divider divider-center" style={{ marginTop: '1rem' }} />
            <p className="body-lg" style={{ color: 'var(--taupe)', maxWidth: '540px', margin: '1rem auto 0' }}>
              Every corner of Gulmohar is curated to delight your senses and refresh your spirit.
            </p>
          </div>
          <div className={styles.amenitiesGrid}>
            {AMENITIES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className={styles.amenityCard}>
                <div className={styles.amenityIcon}><Icon size={26} /></div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, marginBottom: '0.5rem' }}>{label}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          GALLERY STRIP (placeholder)
      ══════════════════════════════════════════════ */}
      <section className={styles.galleryStrip}>
        {[
          { id: 1, src: img1 },
          { id: 2, src: img2 },
          { id: 3, src: logoImg },
          { id: 4, src: img4 },
          { id: 5, src: img5 }
        ].map(item => (
          <div key={item.id} className={styles.galleryCell} style={{ 
            backgroundImage: `url(${item.src})`,
            backgroundSize: item.id === 3 ? 'contain' : 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundColor: item.id === 3 ? 'var(--white)' : 'var(--bark)'
          }}>
            {item.id !== 3 && <div className={styles.galleryCellOverlay} />}
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section className={`section-pad`} style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
              <span className="label" style={{ color: 'var(--amber-deep)' }}>Guest Stories</span>
            </div>
            <h2 className="display-lg">Moments That Stay</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { name: 'Meera & Arjun', origin: 'Mumbai', text: 'The Penthouse suite was beyond our wildest dreams. The panoramic balcony with morning mist was absolutely magical. We will return.' },
              { name: 'Kiran Nair', origin: 'Bangalore', text: 'Service here is extraordinary — they remembered my wifes birthday without being asked and surprised her with fresh marigolds. Truly special.' },
              { name: 'The Desai Family', origin: 'Pune', text: 'Our children loved the pool and play area. Parents loved the spa. It is the rare resort where everyone leaves happy.' },
            ].map(({ name, origin, text }, i) => (
              <div key={i} style={{
                background: 'var(--white)', border: '1px solid var(--sand)', borderRadius: '4px',
                padding: '2rem', boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="var(--amber)" stroke="none" />)}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--umber)', lineHeight: 1.7, marginBottom: '1.2rem' }}>
                  "{text}"
                </p>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--taupe)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {name} · <span style={{ fontWeight: 400 }}>{origin}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA BANNER
      ══════════════════════════════════════════════ */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerBg} style={{ backgroundImage: 'url(/images/cta-bg.jpg)' }} />
        <div className={styles.ctaBannerOverlay} />
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <p className="label" style={{ color: 'var(--amber-light)', marginBottom: '0.75rem' }}>Begin Your Journey</p>
          <h2 className="display-lg" style={{ color: 'var(--white)', marginBottom: '1rem' }}>
            Your Gulmohar Awaits
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem' }}>
            Reserve your stay today and step into a world where luxury and nature exist in perfect harmony.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleBookNow}>
            Book Your Stay <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  )
}
