import productsData from '@/data/products.json'

export interface LocalProduct {
  id: string
  name: string
  price: number
  description: string
  imageUrl: string
}

export default function ProductGallery() {
  const products: LocalProduct[] = productsData
  // Replace with your actual WhatsApp phone number (e.g. 919876543210)
  const phoneNumber = "911234567890"

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Featured Tulsi Malas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
            `Hi, I want to order ${product.name} (Price: ₹${product.price})`
          )}`

          return (
            <div key={product.id} className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
              <div>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{product.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t flex flex-col gap-2">
                <span className="text-green-700 font-bold text-xl">₹{product.price}</span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white text-center text-sm font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  Order on WhatsApp
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
