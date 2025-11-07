import { Package, LayoutDashboard, List } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { LogoutButton } from '@/features/auth/components/LogoutButton'

function Layout({ children }) {
  const location = useLocation()
  const { profile } = useAuth()
  
  const isActive = (path) => location.pathname === path

  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Listas',
      path: '/admin/listas',
      icon: List
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Import Marketplace
              </h1>
            </div>

            {/* Navegación principal */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${active 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Usuario y logout */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.nombre || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile?.role || 'admin'}
                </p>
              </div>
              <LogoutButton variant="secondary" size="sm" />
            </div>
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
