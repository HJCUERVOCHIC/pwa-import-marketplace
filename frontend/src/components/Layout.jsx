import { Package } from 'lucide-react'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Import Marketplace
              </h1>
            </div>
            <nav className="flex gap-4">
              <span className="text-sm text-gray-600">Admin Dashboard</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            PWA Import Marketplace © 2025
          </p>
        </div>
      </footer>
    </div>
  )
}
export default Layout