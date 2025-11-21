import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import Layout from '@/components/Layout'
import ListasPage from '@/pages/ListasPage'
import ProductosPage from '@/pages/ProductosPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta raíz redirige a dashboard */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Login - accesible sin auth, pero redirige si ya está autenticado */}
          <Route path="/admin/login" element={<LoginPage />} />
          
          {/* Dashboard - ruta protegida */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Listas - ruta protegida */}
          <Route
            path="/admin/listas"
            element={
              <ProtectedRoute>
                <Layout>
                  <ListasPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Productos de una lista - ruta protegida */}
          <Route
            path="/admin/listas/:id/productos"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductosPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Ruta 404 - redirige a dashboard */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App