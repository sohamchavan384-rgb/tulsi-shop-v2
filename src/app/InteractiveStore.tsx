'use client'

import React, { useState, ChangeEvent } from 'react'

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
  id: number
  question: string
  answer: string
}

interface Review {
  id: number
  name: string
  rating: number
  comment: string
  imageUrl?: string
}

export default function InteractiveStore({ initialProducts }: { initialProducts?: Product[] }) {
  // Navigation & Cart Drawers
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>([])

  // Store Products Placeholder
  const products: Product[] = initialProducts && initialProducts.length > 0 ? initialProducts : [
    {
      id: 1,
      name: "1-Round Thick Radha Kund Tulsi Kanthi Mala",
      price: 399,
      description: "Hand-carved thick round Tulsi beads strung on sturdy thread by Vaisnava artisans at Radha Kund."
    },
    {
      id: 2,
      name: "Raw Carved Tulsi Wrist Bracelet",
      price: 249,
      description: "Authentic natural Tulsi wood beads with adjustable knot for daily wear and spiritual protection."
    }
  ]

  // Q&A State
  const [qaList, setQaList] = useState<QAItem[]>([
    {
      id: 1,
      question: "Can I wear the Tulsi Mala while bathing?",
      answer: "Yes! According to the Skanda Purana, bathing while wearing Tulsi wood grants the immense spiritual benefit of bathing in all holy rivers (tirthas). Water passing over sacred Tulsi purifies both physical and subtle bodies."
    },
    {
      id: 2,
      question: "Where are these malas crafted?",
      answer: "All malas and bracelets are hand-carved directly at Radha Kund, Mathura (Vraja Dham) by local Vaisnava craftspeople."
    },
    {
      id: 3,
      question: "How to verify authenticity?",
      answer: "Authentic Tulsi wood has a distinct natural herbal aroma, light weight, and unique natural grain patterns."
    }
  ])
  const [expandedQa, setExpandedQa] = useState<number | null>(1)
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 1,
      name: "Aarav Sharma",
      rating: 5,
      comment: "Received authentic Tulsi mala directly from Radha Kund. Pure fragrance and wonderful craftsmanship!",
    }
  ])
  const [revName, setRevName] = useState("")
  const [revRating, setRevRating] = useState(5)
  const [revComment, setRevComment] = useState("")
  const [revImage, setRevImage] = useState<string | null>(null)

  // Cart Functions
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Form Handlers
  const handleAddQA = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    setQaList(prev => [
      ...prev,
      {
        id: Date.now(),
        question: newQuestion,
        answer: newAnswer.trim() ? newAnswer : "Thank you for asking! Our Radha Kund team will update this answer shortly."
      }
    ])
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

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!revName.trim() || !revComment.trim()) return
    setReviews(prev => [
      {
        id: Date.now(),
        name: revName,
        rating: revRating,
        comment: revComment,
        imageUrl: revImage || undefined
      },
      ...prev
    ])
    setRevName("")
    setRevComment("")
    setRevImage(null)
  }

  // Checkout Link
  const getWhatsAppCartLink = () => {
    const itemsList = cart.map(item => `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`).join('\n')
    const message = `Hare Krishna! I would like to place an order from Radha Kund:\n\n${itemsList}\n\nTotal Amount: ₹${cartTotal}\nLocation: Radha Kund, Mathura`
    return `https://wa.me/919082229021?text=${encodeURIComponent(message)}`
  }

  return (
    <div style={{ backgroundColor: '#F9F6EE', color: '#1C201D', minHeight: '100vh', fontFamily: 'sans-serif', margin: 0, padding: 0, position: 'relative' }}>
      
      {/* Top Banner */}
      <div style={{ backgroundColor: '#0F2E1B', color: '#E2D4B7', fontSize: '11px', padding: '8px 16px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
        ✨ HAND-CARVED AT SACRED RADHA KUND • DIRECT WHATSAPP ORDERING ACROSS INDIA ✨
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
        
        {/* Header Navigation Bar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #E3DEC3' }}>
          
          {/* Menu Button */}
          <button 
            onClick={() => setIsNavOpen(true)}
            aria-label="Open Navigation Menu"
            style={{ padding: '8px 12px', color: '#0F2E1B', border: '1px solid #E3DEC3', backgroundColor: '#FAF8F2', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>☰</span>
            <span>🌿</span>
          </button>

          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0F2E1B', margin: 0, fontFamily: 'serif' }}>
              Sacred Radha Kund Tulsi
            </h1>
          </div>

          {/* Cart Icon Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Shopping Cart Drawer"
            style={{ padding: '8px 12px', color: '#0F2E1B', border: '1px solid #E3DEC3', backgroundColor: '#FAF8F2', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}
          >
            <span>🛍️</span>
            <span style={{ backgroundColor: '#C27803', color: '#FFFFFF', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '4px', fontWeight: 'bold' }}>
              {cartCount}
            </span>
          </button>
        </header>

        {/* Hero Section */}
        <section id="hero" style={{ padding: '32px 0', borderBottom: '1px solid #E3DEC3', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', color: '#0F2E1B', textTransform: 'uppercase', backgroundColor: '#EAE5D4', padding: '4px 10px', borderRadius: '2px', borderLeft: '3px solid #0F2E1B' }}>
            ● Hand-Carved at Sacred Radha Kund
          </span>

          <h2 style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'serif', color: '#0F2E1B', marginTop: '16px', marginBottom: '12px', lineHeight: '1.2' }}>
            Blessed Radha Kund Tulsi Kanthi Malas, Bracelets & Jewelry
          </h2>

          <p style={{ fontSize: '13px', color: '#48544B', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 20px auto' }}>
            Explore our authentic collection of hand-carved Tulsi wood items with accurate images directly from our Radha Kund workshop.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a 
              href="#catalog"
              style={{ backgroundColor: '#C27803', color: '#FFFFFF', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 24px', borderRadius: '20px', textDecoration: 'none' }}
            >
              BROWSE COLLECTION
            </a>
            <a 
              href="#scriptures"
              style={{ backgroundColor: '#0F2E1B', color: '#E2D4B7', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 24px', borderRadius: '20px', textDecoration: 'none' }}
            >
              READ SCRIPTURE BENEFITS
            </a>
          </div>
        </section>

        {/* Scriptures Section */}
        <section id="scriptures" style={{ padding: '32px 0', borderBottom: '1px solid #E3DEC3' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#C27803', textTransform: 'uppercase' }}>SACRED TRADITION</span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'serif', color: '#0F2E1B', margin: '4px 0 0 0' }}>
              Glory of Tulsi in Sacred Scriptures
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#EAE5D4', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #0F2E1B' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0F2E1B' }}>🌸 Sacred Origin: Made in Radha Kund</span>
              <p style={{ fontSize: '12px', color: '#48544B', margin: '6px 0 0 0' }}>
                Every bead in our catalog is hand-carved at Radha Kund, the holy lake of Radharani in Vraja Dham, by traditional Vaisnava artisans.
              </p>
            </div>

            <div style={{ backgroundColor: '#EAE5D4', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #0F2E1B' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#C27803' }}>PADMA PURANA</span>
              <p style={{ fontSize: '13px', fontFamily: 'serif', fontStyle: 'italic', color: '#2D3830', margin: '6px 0 0 0' }}>
                "Those who wear Tulsi neckbeads (Kanthi Mala) are protected from all fears, illness, and negative forces day and night."
              </p>
            </div>

            <div style={{ backgroundColor: '#EAE5D4', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #C27803' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#C27803' }}>SKANDA PURANA</span>
              <p style={{ fontSize: '13px', fontFamily: 'serif', fontStyle: 'italic', color: '#2D3830', margin: '6px 0 0 0' }}>
                "Bathing while wearing Tulsi grants the spiritual merit of taking a dip in all holy rivers (Tirthas) throughout the universe."
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" style={{ padding: '32px 0', borderBottom: '1px solid #E3DEC3' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#C27803', textTransform: 'uppercase' }}>HOLISTIC WELL-BEING</span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'serif', color: '#0F2E1B', margin: '4px 0 0 0' }}>
              Material & Spiritual Benefits
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#FAF8F2', padding: '16px', borderRadius: '8px', border: '1px solid #E3DEC3', textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>🧘‍♀️</div>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2E1B', margin: '8px 0 4px 0' }}>Spiritual Protection</h4>
              <p style={{ fontSize: '12px', color: '#525E55', margin: 0 }}>Protects from negative energy, balances throat chakra, and strengthens Krishna bhakti.</p>
            </div>

            <div style={{ backgroundColor: '#FAF8F2', padding: '16px', borderRadius: '8px', border: '1px solid #E3DEC3', textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>❄️</div>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2E1B', margin: '8px 0 4px 0' }}>Body Cooling & Health</h4>
              <p style={{ fontSize: '12px', color: '#525E55', margin: 0 }}>Natural Holy Basil wood absorbs excessive heat and promotes peace of mind.</p>
            </div>

            <div style={{ backgroundColor: '#FAF8F2', padding: '16px', borderRadius: '8px', border: '1px solid #E3DEC3', textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>🌊</div>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2E1B', margin: '8px 0 4px 0' }}>Tirtha Bathing Merit</h4>
              <p style={{ fontSize: '12px', color: '#525E55', margin: 0 }}>As stated in Skanda Purana, bathing while wearing Tulsi offers the merit of all holy rivers.</p>
            </div>
          </div>
        </section>

        {/* Product Catalog Section */}
        <section id="catalog" style={{ padding: '32px 0', borderBottom: '1px solid #E3DEC3' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#525E55', textTransform: 'uppercase' }}>SACRED CRAFTS</span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'serif', color: '#0F2E1B', margin: '4px 0 0 0' }}>
              Sacred Tulsi Collection
            </h3>
            <p style={{ fontSize: '12px', color: '#525E55', margin: '4px 0 0 0' }}>Authentic products directly from our Radha Kund workshop.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {products.map((product) => (
              <div 
                key={product.id} 
                style={{ backgroundColor: '#FAF8F2', border: '1px solid #E3DEC3', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F2E1B', fontFamily: 'serif', margin: '0 0 6px 0' }}>{product.name}</h4>
                  <p style={{ fontSize: '12px', color: '#525E55', margin: '0 0 12px 0', lineHeight: '1.5' }}>{product.description}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E3DEC3' }}>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#0F2E1B', fontFamily: 'serif' }}>₹{product.price}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => addToCart(product)}
                      style={{ backgroundColor: '#0F2E1B', color: '#F9F6EE', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', padding: '8px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                    >
                      Add To Cart
                    </button>
                    <a 
                      href={`https://wa.me/919082229021?text=${encodeURIComponent(`Hello, I would like to order: ${product.name} (₹${product.price})`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ backgroundColor: '#C27803', color: '#FFFFFF', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', padding: '8px 12px', borderRadius: '4px', textDecoration: 'none' }}
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Q&A Section */}
        <section id="qa" style={{ padding: '32px 0', borderBottom: '1px solid #E3DEC3' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#525E55', textTransform: 'uppercase' }}>KNOWLEDGE & GUIDANCE</span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'serif', color: '#0F2E1B', margin: '4px 0 0 0' }}>
              Questions & Answers
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {qaList.map((item) => (
              <div 
                key={item.id} 
                style={{ backgroundColor: '#EAE5D4', borderRadius: '6px', overflow: 'hidden', border: '1px solid #D3CBAD' }}
              >
                <button 
                  onClick={() => setExpandedQa(expandedQa === item.id ? null : item.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '14px', backgroundColor: 'transparent', border: 'none', fontWeight: 'bold', color: '#0F2E1B', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{expandedQa === item.id ? '▼' : '►'} {item.question}</span>
                </button>
                {expandedQa === item.id && (
                  <div style={{ padding: '0 14px 14px 14px', fontSize: '12px', color: '#3A453C', lineHeight: '1.5' }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ask Question Form */}
          <form onSubmit={handleAddQA} style={{ backgroundColor: '#FAF8F2', padding: '16px', borderRadius: '8px', border: '1px solid #E3DEC3' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F2E1B', margin: '0 0 10px 0' }}>Ask a Question / Post Answer</h4>
            <input 
              type="text" 
              placeholder="Your Question (e.g. How to care for Tulsi Mala?)" 
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #CCCCCC', fontSize: '12px', boxSizing: 'border-box' }}
              required
            />
            <textarea 
              placeholder="Optional: Provide an answer or experience..." 
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #CCCCCC', fontSize: '12px', boxSizing: 'border-box', height: '60px' }}
            />
            <button 
              type="submit"
              style={{ backgroundColor: '#0F2E1B', color: '#F9F6EE', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', padding: '10px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              Submit Question
            </button>
          </form>
        </section>

        {/* Customer Reviews Section */}
        <section id="reviews" style={{ padding: '32px 0', borderBottom: '1px solid #E3DEC3' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#525E55', textTransform: 'uppercase' }}>DEVOTEE FEEDBACK</span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'serif', color: '#0F2E1B', margin: '4px 0 0 0' }}>
              Customer Reviews
            </h3>
          </div>

          {/* Add Review Form */}
          <form onSubmit={handleAddReview} style={{ backgroundColor: '#FAF8F2', padding: '16px', borderRadius: '8px', border: '1px solid #E3DEC3', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F2E1B', margin: '0 0 10px 0' }}>Leave a Devotee Review</h4>
            
            <input 
              type="text" 
              placeholder="Your Name" 
              value={revName}
              onChange={(e) => setRevName(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #CCCCCC', fontSize: '12px', boxSizing: 'border-box' }}
              required
            />

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0F2E1B', marginRight: '8px' }}>Rating:</label>
              <select 
                value={revRating} 
                onChange={(e) => setRevRating(Number(e.target.value))}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CCCCCC', fontSize: '12px' }}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                <option value={3}>⭐⭐⭐ (3/5)</option>
              </select>
            </div>

            <textarea 
              placeholder="Write your review about the product..." 
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #CCCCCC', fontSize: '12px', boxSizing: 'border-box', height: '70px' }}
              required
            />

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0F2E1B', display: 'block', marginBottom: '4px' }}>Upload Received Product Image:</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ fontSize: '11px' }}
              />
              {revImage && (
                <div style={{ marginTop: '8px' }}>
                  <img src={revImage} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CCCCCC' }} />
                </div>
              )}
            </div>

            <button 
              type="submit"
              style={{ backgroundColor: '#0F2E1B', color: '#F9F6EE', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', padding: '10px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              Post Review
            </button>
          </form>

          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reviews.map((rev) => (
              <div key={rev.id} style={{ backgroundColor: '#EAE5D4', padding: '14px', borderRadius: '6px', border: '1px solid #D3CBAD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0F2E1B' }}>{rev.name}</span>
                  <span style={{ color: '#C27803', fontSize: '12px' }}>{'⭐'.repeat(rev.rating)}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#3A453C', margin: '4px 0 8px 0', lineHeight: '1.4' }}>{rev.comment}</p>
                {rev.imageUrl && (
                  <img src={rev.imageUrl} alt="Customer product" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #C27803' }} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact & Location Footer */}
        <footer id="contact" style={{ padding: '24px 0 12px 0', textAlign: 'center', fontSize: '12px', color: '#525E55' }}>
          <p style={{ fontWeight: 'bold', color: '#0F2E1B', margin: '0 0 4px 0' }}>📍 Location: Radha Kund, Mathura (Vraja Dham)</p>
          <p style={{ margin: '0 0 12px 0' }}>📱 WhatsApp Orders: <strong>+91 9082229021</strong></p>
          <p style={{ fontSize: '10px', color: '#8A948C' }}>Direct Orders via WhatsApp • Ethically Sourced Radha Kund Crafts</p>
        </footer>

      </div>

      {/* Side Navigation Drawer Overlay */}
      {isNavOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }}>
          <div style={{ width: '280px', height: '100%', backgroundColor: '#141815', color: '#F9F6EE', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #2D3830' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#E2D4B7' }}>🌿 Sacred Navigation</span>
                <button onClick={() => setIsNavOpen(false)} style={{ background: 'none', border: 'none', color: '#F9F6EE', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                <a href="#scriptures" onClick={() => setIsNavOpen(false)} style={{ color: '#E2D4B7', textDecoration: 'none' }}>📜 Sacred Scripture Verses (Puranas)</a>
                <a href="#benefits" onClick={() => setIsNavOpen(false)} style={{ color: '#E2D4B7', textDecoration: 'none' }}>✨ Material & Spiritual Benefits</a>
                <a href="#catalog" onClick={() => setIsNavOpen(false)} style={{ color: '#E2D4B7', textDecoration: 'none' }}>🛍️ Full Catalog</a>
                <a href="#qa" onClick={() => setIsNavOpen(false)} style={{ color: '#E2D4B7', textDecoration: 'none' }}>❓ Q&A (Bathing & Care)</a>
                <a href="#reviews" onClick={() => setIsNavOpen(false)} style={{ color: '#E2D4B7', textDecoration: 'none' }}>⭐ Customer Reviews</a>
                <a href="#contact" onClick={() => setIsNavOpen(false)} style={{ color: '#E2D4B7', textDecoration: 'none' }}>📞 Contact Us</a>
              </nav>

              <div style={{ backgroundColor: '#0F2E1B', padding: '12px', borderRadius: '6px', marginTop: '24px', fontSize: '11px', color: '#E2D4B7', border: '1px solid #1A472A' }}>
                <strong>Sacred Origin: Radha Kund</strong>
                <p style={{ margin: '4px 0 0 0', color: '#B3A88E' }}>Crafted by Vaisnava artisans at the holy banks of Radha Kund in Vraja Dham.</p>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#7A887C', borderTop: '1px solid #2D3830', paddingTop: '12px' }}>
              Direct Orders via WhatsApp<br />
              +91 9082229021
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', height: '100%', backgroundColor: '#FAF8F2', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '2px solid #E3DEC3' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #E3DEC3' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F2E1B' }}>🛍️ Your Cart</span>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: '#0F2E1B', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>

              {cart.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#525E55', marginTop: '20px', textAlign: 'center' }}>Your cart is empty.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ backgroundColor: '#EAE5D4', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0F2E1B' }}>{item.name}</div>
                      <div style={{ color: '#C27803', fontWeight: 'bold', margin: '2px 0 6px 0' }}>₹{item.price * item.quantity}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px 6px', fontWeight: 'bold', border: '1px solid #CCCCCC', backgroundColor: '#FFFFFF', borderRadius: '2px', cursor: 'pointer' }}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px 6px', fontWeight: 'bold', border: '1px solid #CCCCCC', backgroundColor: '#FFFFFF', borderRadius: '2px', cursor: 'pointer' }}>+</button>
                        </div>

                        <button onClick={() => removeFromCart(item.id)} style={{ color: '#8B0000', border: 'none', background: 'none', fontSize: '11px', cursor: 'pointer' }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid #E3DEC3', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '16px', color: '#0F2E1B', marginBottom: '12px' }}>
                  <span>Total:</span>
                  <span>₹{cartTotal}</span>
                </div>
                <a 
                  href={getWhatsAppCartLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', backgroundColor: '#0F2E1B', color: '#F9F6EE', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', padding: '12px', borderRadius: '4px', textDecoration: 'none' }}
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
