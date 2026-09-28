import Header from '@/components/Header'
import ProductGallery from '@/components/ProductGallery'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50">
      <div>
        <Header />
        <main className="max-w-6xl mx-auto p-6">
          <ProductGallery />
        </main>
      </div>
      <Footer />
    </div>
  )
}
