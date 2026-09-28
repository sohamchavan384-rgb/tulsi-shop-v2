export default function Header() {
  return (
    <header className="border-b bg-white shadow-sm mb-8">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">Tulsi Shop</h1>
        <nav className="space-x-4 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-green-700">Home</a>
          <a href="#" className="hover:text-green-700">Products</a>
          <a href="#" className="hover:text-green-700">Contact</a>
        </nav>
      </div>
    </header>
  )
}
