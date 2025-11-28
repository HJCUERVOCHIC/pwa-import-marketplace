import { Link } from 'react-router-dom'
import { ShoppingBag, Home } from 'lucide-react'

/**
 * Layout Público
 * Header y footer para páginas del catálogo sin autenticación
 */
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background-main">
      {/* Header Público */}
      <header className="sticky top-0 z-40 bg-card border-b border-neutral-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Brand */}
            <Link 
              to="/catalogo"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-base"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gold-600 to-gold-700 rounded-lg flex items-center justify-center shadow-md">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-neutral-charcoal leading-tight">
                  Chic Import USA
                </h1>
                <p className="text-xs text-neutral-stone">
                  Catálogo de Importados
                </p>
              </div>
            </Link>

            {/* Navegación Pública */}
            <nav className="flex items-center gap-6">
              <Link
                to="/catalogo"
                className="flex items-center gap-2 text-neutral-slate hover:text-gold-600 transition-colors duration-base font-medium"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Catálogo</span>
              </Link>

              {/* Link a Admin (opcional) */}
              <Link
                to="/admin/login"
                className="text-sm text-neutral-stone hover:text-gold-600 transition-colors duration-base"
              >
                Acceso Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer Público */}
      <footer className="bg-neutral-charcoal text-white mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna 1: Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gold-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold">
                  Chic Import USA
                </h3>
              </div>
              <p className="text-sm text-gray-400">
                Productos importados de calidad premium directamente desde Estados Unidos.
              </p>
            </div>

            {/* Columna 2: Enlaces */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">
                Navegación
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link 
                    to="/catalogo" 
                    className="hover:text-gold-400 transition-colors"
                  >
                    Catálogo de Ofertas
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/login" 
                    className="hover:text-gold-400 transition-colors"
                  >
                    Acceso Administradores
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Contacto */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">
                Contacto
              </h4>
              <p className="text-sm text-gray-400">
                ¿Interesado en nuestros productos?
                <br />
                Contáctanos para más información.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} Chic Import USA. 
              Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
