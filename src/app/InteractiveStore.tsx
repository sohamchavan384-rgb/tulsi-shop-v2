'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Product {
  id: number
  name: string
  price: number
  description: string
  imageUrl?: string
}

interface CartItem extends Product {
  quantity: number
}

interface QAItem {
  id: number | string
  question: string
  answer: string
}

interface Review {
  id: number | string
  name: string
  rating: number
  comment: string
  imageUrl?: string
}

const defaultQA: QAItem[] = [
  {
    id: 'def-1',
    question: "Can I wear the Tulsi Mala while bathing?",
    answer: "Yes! According to the Skanda Purana, bathing while wearing Tulsi wood grants the immense spiritual benefit of bathing in all holy rivers (tirthas). Water passing over sacred Tulsi purifies both physical and subtle bodies."
  },
  {
    id: 'def-2',
    question: "Where are these malas crafted?",
    answer: "All malas and bracelets are hand-carved directly at Radha Kund, Mathura (Vraja Dham) by local Vaisnava craftspeople."
  },
  {
    id: 'def-3',
    question: "How to verify authenticity?",
    answer: "Pure Tulsi wood has a distinct natural herbal aroma, light weight, and unique natural grain patterns."
  }
]

const defaultReviews: Review[] = [
  {
    id: 'def-rev-1',
    name: "Aarav Sharma",
    rating: 5,
    comment: "Received authentic Tulsi mala directly from Radha Kund. Pure fragrance and wonderful craftsmanship!",
  }
]

export default function InteractiveStore({ initialProducts }: { initialProducts?: Product[] }) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)

  const products: Product[] = initialProducts && initialProducts.length > 0 ? initialProducts : [
    {
      id: 1,
      name: "1 round thick tulsi kanthi mala",
      price: 399,
      description: "Hand-carved thick round Tulsi beads strung on sturdy thread."
    }
  ]

  const [qaList, setQaList] = useState<QAItem[]>(defaultQA)
  const [expandedQa, setExpandedQa] = useState<number | string | null>('def-1')
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")

  const [reviews, setReviews] = useState<Review[]>(defaultReviews)
  const [revName, setRevName] = useState("")
  const [revRating, setRevRating] = useState(5)
  const [revComment, setRevComment] = useState("")
  const [revImage, setRevImage] = useState<string | null>(null)

  // Fetch Reviews & Q&A from Supabase and merge with defaults
  useEffect(() => {
    async function fetchData() {
      if (!supabaseUrl || !supabaseAnonKey) return

      // Fetch Q&A
      const { data: qaData } = await supabase.from('qa_items').select('*').order('created_at', { ascending: false })
      if (qaData && qaData.length > 0) {
        const fetchedQa = qaData.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer || 'Answer pending...'
        }))
        setQaList([...fetchedQa, ...defaultQA])
      }

      // Fetch Reviews
      const { data: revData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
      if (revData && revData.length > 0) {
        const fetchedRev = revData.map(item => ({
          id: item.id,
          name: item.name,
          rating: item.rating,
          comment: item.comment,
          imageUrl: item.image_url
        }))
        setReviews([...fetchedRev, ...defaultReviews])
      }
    }
    fetchData()
  }, [])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }))
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const toggleWishlist = () => {
    setWishlistCount(prev => (prev === 0 ? 1 : 0))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Submit Q&A to Supabase
  const handleAddQA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    const qaToInsert = {
      question: newQuestion,
      answer: newAnswer.trim() ? newAnswer : "Thank you for asking! Our Radha Kund team will update this answer shortly."
    }

    if (supabaseUrl && supabaseAnonKey) {
      const { data } = await supabase.from('qa_items').insert([qaToInsert]).select()
      if (data && data[0]) {
        setQaList(prev => [{ id: data[0].id, question: data[0].question, answer: data[0].answer }, ...prev])
      }
    } else {
      setQaList(prev => [{ id: Date.now(), question: qaToInsert.question, answer: qaToInsert.answer }, ...prev])
    }

    setNewQuestion("")
    setNewAnswer("")
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setRevImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit Review to Supabase
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!revName.trim() || !revComment.trim()) return

    const reviewToInsert = {
      name: revName,
      rating: revRating,
      comment: revComment,
      image_url: revImage || null
    }

    if (supabaseUrl && supabaseAnonKey) {
      const { data } = await supabase.from('reviews').insert([reviewToInsert]).select()
      if (data && data[0]) {
        setReviews(prev => [{ id: data[0].id, name: data[0].name, rating: data[0].rating, comment: data[0].comment, imageUrl: data[0].image_url }, ...prev])
      }
    } else {
      setReviews(prev => [{ id: Date.now(), name: revName, rating: revRating, comment: revComment, imageUrl: revImage || undefined }, ...prev])
    }

    setRevName("")
    setRevComment("")
    setRevImage(null)
  }

  const getWhatsAppCartLink = () => {
    const itemsList = cart.map(item => `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`).join('\n')
    const message = `Hare Krishna! I would like to place an order from Radha Kund:\n\n${itemsList}\n\nTotal Amount: ₹${cartTotal}\nLocation: Radha Kund, Mathura`
    return `https://wa.me/919082229021?text=${encodeURIComponent(message)}`
  }

  return (
    <div style={{ backgroundColor: '#FDFBF7', color: '#2C3E2E', minHeight: '100vh', fontFamily: 'serif', margin: 0, padding: 0, position: 'relative' }}>
      
      {/* Top Notification Banner */}
      <div style={{ backgroundColor: '#2D4A3E', color: '#FDFBF7', fontSize: '10px', padding: '6px 12px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
        ✨ HAND-CARVED AT SACRED RADHA KUND • DIRECT WHATSAPP ORDERING ACROSS INDIA ✨
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #E2D8C3' }}>
          <button 
            onClick={() => setIsNavOpen(true)}
            aria-label="Open Navigation Menu"
            style={{ padding: '6px 10px', color: '#2C3E2E', border: '1px solid #D1C4A9', backgroundColor: '#FFF', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '16px' }}>☰</span>
            <span style={{ fontSize: '14px' }}>🌿</span>
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#1B2E22', margin: 0 }}>
              Sacred Radha Kund Tulsi
            </h1>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Shopping Cart Drawer"
            style={{ padding: '6px 10px', color: '#2C3E2E', border: '1px solid #D1C4A9', backgroundColor: '#FFF', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}
          >
            <span>🛍️</span>
            <span style={{ backgroundColor: '#C87D12', color: '#FFF', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '4px', fontWeight: 'bold' }}>
              {cartCount}
            </span>
          </button>
        </header>

        {/* Hero Section */}
        <section id="hero" style={{ padding: '28px 0', borderBottom: '1px solid #E2D8C3', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', color: '#2D4A3E', textTransform: 'uppercase', backgroundColor: '#EBF2EE', padding: '4px 10px', borderRadius: '12px', border: '1px solid #C8DEC3' }}>
            ● Hand-Carved at Sacred Radha Kund
          </span>

          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1B2E22', marginTop: '16px', marginBottom: '12px', lineHeight: '1.2' }}>
            Blessed Radha Kund Tulsi Kanthi Malas, Bracelets & Jewelry
          </h2>

          <p style={{ fontSize: '12px', color: '#556B5B', lineHeight: '1.6', margin: '0 auto 20px auto', fontFamily: 'sans-serif' }}>
            Explore our authentic collection of hand-carved Tulsi wood items with accurate images directly from our Radha Kund workshop.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a href="#catalog" style={{ backgroundColor: '#C87D12', color: '#FFF', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px', borderRadius: '20px', textDecoration: 'none', textAlign: 'center' }}>
              BROWSE COLLECTION
            </a>
            <a href="#scriptures" style={{ backgroundColor: '#FFF', color: '#1B2E22', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px', borderRadius: '20px', textDecoration: 'none', textAlign: 'center', border: '1px solid #D1C4A9' }}>
              Read Scripture Benefits
            </a>
          </div>
        </section>

        {/* Sacred Scriptures Section */}
        <section id="scriptures" style={{ padding: '28px 0', borderBottom: '1px solid #E2D8C3' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#C87D12', textTransform: 'uppercase' }}>SACRED TRADITION</span>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1B2E22', margin: '4px 0 0 0' }}>
              Glory of Tulsi in Sacred Scriptures
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1B2E22', marginBottom: '6px' }}>🌸 Sacred Origin: Made in Radha Kund</div>
              <p style={{ fontSize: '11px', color: '#556B5B', margin: 0, lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                Every bead in our catalog is hand-carved at Radha Kund, the holy lake of Radharani in Vraja Dham, by traditional Vaisnava artisans.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFF', borderLeft: '3px solid #C87D12', borderRadius: '4px', padding: '14px', borderTop: '1px solid #E2D8C3', borderRight: '1px solid #E2D8C3', borderBottom: '1px solid #E2D8C3' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#C87D12', letterSpacing: '1px', marginBottom: '4px' }}>PADMA PURANA</div>
              <p style={{ fontSize: '11px', color: '#2C3E2E', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>
                &quot;Those who wear Tulsi neckbeads (Kanthi Mala) are protected from all fears, illness, and negative forces day and night.&quot;
              </p>
            </div>

            <div style={{ backgroundColor: '#FFF', borderLeft: '3px solid #C87D12', borderRadius: '4px', padding: '14px', borderTop: '1px solid #E2D8C3', borderRight: '1px solid #E2D8C3', borderBottom: '1px solid #E2D8C3' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#C87D12', letterSpacing: '1px', marginBottom: '4px' }}>SKANDA PURANA</div>
              <p style={{ fontSize: '11px', color: '#2C3E2E', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>
                &quot;Bathing while wearing Tulsi grants the spiritual merit of taking a dip in all holy rivers (Tirthas) throughout the universe.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Material & Spiritual Benefits */}
        <section id="benefits" style={{ padding: '28px 0', borderBottom: '1px solid #E2D8C3' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#C87D12', textTransform: 'uppercase' }}>HOLISTIC WELL-BEING</span>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1B2E22', margin: '4px 0 0 0' }}>
              Material & Spiritual Benefits
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🧘</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B2E22', marginBottom: '4px' }}>Spiritual Protection</div>
              <p style={{ fontSize: '11px', color: '#556B5B', margin: 0, lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                Protects from negative energy, balances throat chakra, and strengthens Krishna bhakti.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>❄️</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B2E22', marginBottom: '4px' }}>Body Cooling & Health</div>
              <p style={{ fontSize: '11px', color: '#556B5B', margin: 0, lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                Natural Holy Basil wood absorbs excessive heat and promotes peace of mind.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🌊</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B2E22', marginBottom: '4px' }}>Tirtha Bathing Merit</div>
              <p style={{ fontSize: '11px', color: '#556B5B', margin: 0, lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                As stated in the Skanda Purana, bathing while wearing Tulsi offers the spiritual benefit of bathing in all holy rivers.
              </p>
            </div>
          </div>
        </section>

        {/* Product Catalog Section */}
        <section id="catalog" style={{ padding: '28px 0', borderBottom: '1px solid #E2D8C3' }}>
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#C87D12', textTransform: 'uppercase' }}>SACRED CRAFTS</span>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1B2E22', margin: '4px 0 0 0' }}>
              Sacred Tulsi Collection
            </h3>
            <p style={{ fontSize: '11px', color: '#556B5B', margin: '4px 0 0 0', fontFamily: 'sans-serif' }}>Authentic products with true to life photography</p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#C87D12', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📿</span> <span>1-Round Tulsi Kanthi Malas</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {products.map((product) => (
              <div key={product.id} style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', borderRadius: '12px', padding: '12px', position: 'relative' }}>
                
                <button 
                  onClick={toggleWishlist}
                  style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 5, backgroundColor: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ fontSize: '12px' }}>{wishlistCount > 0 ? '❤️' : '🌺'}</span>
                </button>

                <div style={{ width: '100%', height: '220px', backgroundColor: '#F7F4EC', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={product.imageUrl || "/images/tulsi-mala.jpg"} 
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B2E22', margin: '0 0 4px 0' }}>{product.name}</h4>
                <p style={{ fontSize: '11px', color: '#556B5B', margin: '0 0 12px 0', lineHeight: '1.4', fontFamily: 'sans-serif' }}>{product.description}</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E2D8C3' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#C87D12' }}>₹{product.price}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => addToCart(product)} style={{ backgroundColor: '#C87D12', color: '#FFF', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', padding: '8px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                      With Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Q&A Section */}
        <section id="qa" style={{ padding: '28px 0', borderBottom: '1px solid #E2D8C3' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#C87D12', textTransform: 'uppercase' }}>KNOWLEDGE & GUIDANCE</span>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1B2E22', margin: '4px 0 0 0' }}>
              Questions & Answers
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {qaList.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', borderRadius: '6px', overflow: 'hidden' }}>
                <button 
                  onClick={() => setExpandedQa(expandedQa === item.id ? null : item.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '12px', backgroundColor: 'transparent', border: 'none', fontWeight: 'bold', color: '#1B2E22', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span style={{ color: '#C87D12' }}>{expandedQa === item.id ? '▼' : '►'}</span>
                  <span>{item.question}</span>
                </button>
                {expandedQa === item.id && (
                  <div style={{ padding: '0 12px 12px 24px', fontSize: '11px', color: '#556B5B', lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddQA} style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', padding: '14px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1B2E22', margin: '0 0 10px 0' }}>Ask a Question</h4>
            <input 
              type="text" 
              placeholder="Your Question (e.g. How to care for Tulsi Mala?)" 
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #D1C4A9', backgroundColor: '#FDFBF7', color: '#2C3E2E', fontSize: '11px', boxSizing: 'border-box' }}
              required
            />
            <textarea 
              placeholder="Optional detail..." 
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #D1C4A9', backgroundColor: '#FDFBF7', color: '#2C3E2E', fontSize: '11px', boxSizing: 'border-box', height: '50px' }}
            />
            <button type="submit" style={{ backgroundColor: '#C87D12', color: '#FFF', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', padding: '8px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
              Submit Question
            </button>
          </form>
        </section>

        {/* Reviews Section */}
        <section id="reviews" style={{ padding: '28px 0', borderBottom: '1px solid #E2D8C3' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#C87D12', textTransform: 'uppercase' }}>DEVOTEE FEEDBACK</span>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1B2E22', margin: '4px 0 0 0' }}>
              Customer Reviews
            </h3>
          </div>

          <form onSubmit={handleAddReview} style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1B2E22', margin: '0 0 10px 0' }}>Leave a Devotee Review</h4>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={revName}
              onChange={(e) => setRevName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #D1C4A9', backgroundColor: '#FDFBF7', color: '#2C3E2E', fontSize: '11px', boxSizing: 'border-box' }}
              required
            />
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: '#1B2E22', marginRight: '6px' }}>Rating:</label>
              <select value={revRating} onChange={(e) => setRevRating(Number(e.target.value))} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #D1C4A9', backgroundColor: '#FDFBF7', color: '#2C3E2E', fontSize: '11px' }}>
                <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                <option value={3}>⭐⭐⭐ (3/5)</option>
              </select>
            </div>
            <textarea 
              placeholder="Write your review about the product..." 
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #D1C4A9', backgroundColor: '#FDFBF7', color: '#2C3E2E', fontSize: '11px', boxSizing: 'border-box', height: '60px' }}
              required
            />
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '10px', color: '#556B5B', display: 'block', marginBottom: '4px', fontFamily: 'sans-serif' }}>Upload Received Product Image:</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '10px', color: '#556B5B' }} />
              {revImage && (
                <div style={{ marginTop: '6px' }}>
                  <img src={revImage} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #C87D12' }} />
                </div>
              )}
            </div>
            <button type="submit" style={{ backgroundColor: '#C87D12', color: '#FFF', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', padding: '8px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
              Post Review
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reviews.map((rev) => (
              <div key={rev.id} style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', padding: '12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#1B2E22' }}>{rev.name}</span>
                  <span style={{ color: '#C87D12', fontSize: '11px' }}>{'⭐'.repeat(rev.rating)}</span>
                </div>
                <p style={{ fontSize: '11px', color: '#556B5B', margin: '4px 0 6px 0', lineHeight: '1.4', fontFamily: 'sans-serif' }}>{rev.comment}</p>
                {rev.imageUrl && (
                  <img src={rev.imageUrl} alt="Customer product" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #C87D12' }} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" style={{ padding: '20px 0 10px 0', textAlign: 'center', fontSize: '11px', color: '#556B5B', fontFamily: 'sans-serif' }}>
          <p style={{ fontWeight: 'bold', color: '#1B2E22', margin: '0 0 4px 0' }}>📍 Location: Radha Kund, Mathura (Vraja Dham)</p>
          <p style={{ margin: '0 0 8px 0' }}>📱 WhatsApp Orders: <strong>+91 9082229021</strong></p>
        </footer>

      </div>

      {/* Nav Drawer Overlay */}
      {isNavOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}>
          <div style={{ width: '280px', height: '100%', backgroundColor: '#FDFBF7', color: '#2C3E2E', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #E2D8C3' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #E2D8C3' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1B2E22' }}>🌿 Sacred Navigation</span>
                <button onClick={() => setIsNavOpen(false)} style={{ background: 'none', border: 'none', color: '#1B2E22', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                <a href="#scriptures" onClick={() => setIsNavOpen(false)} style={{ color: '#1B2E22', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📜</span> Sacred Scripture Verses (Puranas)
                </a>
                <a href="#benefits" onClick={() => setIsNavOpen(false)} style={{ color: '#1B2E22', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✨</span> Material & Spiritual Benefits
                </a>
                <a href="#catalog" onClick={() => setIsNavOpen(false)} style={{ color: '#1B2E22', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛍️</span> Full Catalog
                </a>
                <div style={{ color: '#1B2E22', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>❤️</span> Saved Wishlist</span>
                  <span style={{ backgroundColor: '#EBF2EE', color: '#2D4A3E', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', border: '1px solid #C8DEC3' }}>{wishlistCount}</span>
                </div>
                <a href="#qa" onClick={() => setIsNavOpen(false)} style={{ color: '#1B2E22', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>❓</span> Q&A (Bathing & Care)
                </a>
                <a href="#reviews" onClick={() => setIsNavOpen(false)} style={{ color: '#1B2E22', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⭐</span> Customer Reviews
                </a>
                <a href="#contact" onClick={() => setIsNavOpen(false)} style={{ color: '#1B2E22', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📞</span> Contact Us
                </a>
              </nav>

              <div style={{ marginTop: '24px', backgroundColor: '#EBF2EE', border: '1px solid #C8DEC3', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#C87D12', marginBottom: '4px' }}>Sacred Origin: Radha Kund</div>
                <p style={{ fontSize: '10px', color: '#556B5B', margin: 0, fontFamily: 'sans-serif' }}>
                  Crafted by Vaisnava artisans at the holy banks of Radha Kund in Vraja Dham.
                </p>
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#2D4A3E', textAlign: 'center', borderTop: '1px solid #E2D8C3', paddingTop: '12px' }}>
              Direct Orders via WhatsApp
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', height: '100%', backgroundColor: '#FDFBF7', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid #E2D8C3' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #E2D8C3' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1B2E22' }}>🛍️ Your Cart</span>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: '#1B2E22', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>

              {cart.length === 0 ? (
                <p style={{ fontSize: '11px', color: '#556B5B', marginTop: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>Your cart is empty.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ backgroundColor: '#FFF', border: '1px solid #E2D8C3', padding: '10px', borderRadius: '6px', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1B2E22' }}>{item.name}</div>
                      <div style={{ color: '#C87D12', fontWeight: 'bold', margin: '2px 0 6px 0' }}>₹{item.price * item.quantity}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px 6px', fontWeight: 'bold', border: '1px solid #D1C4A9', backgroundColor: '#FDFBF7', color: '#1B2E22', borderRadius: '2px', cursor: 'pointer' }}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px 6px', fontWeight: 'bold', border: '1px solid #D1C4A9', backgroundColor: '#FDFBF7', color: '#1B2E22', borderRadius: '2px', cursor: 'pointer' }}>+</button>
                        </div>

                        <button onClick={() => removeFromCart(item.id)} style={{ color: '#D32F2F', border: 'none', background: 'none', fontSize: '10px', cursor: 'pointer' }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid #E2D8C3', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '15px', color: '#1B2E22', marginBottom: '12px' }}>
                  <span>Total:</span>
                  <span style={{ color: '#C87D12' }}>₹{cartTotal}</span>
                </div>
                <a 
                  href={getWhatsAppCartLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', backgroundColor: '#C87D12', color: '#FFF', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', padding: '12px', borderRadius: '4px', textDecoration: 'none' }}
                >
                  Checkout on WhatsApp →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
