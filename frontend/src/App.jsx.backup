import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import Layout from './components/Layout'

// Páginas existentes
import ListasPage from './pages/ListasPage'
import ProductosPage from './pages/ProductosPage'

// Páginas de autenticación
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/admin/DashboardPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* RUTA DE PRUEBA */}
          <Route path="/test" element={<div style={{padding: '20px', background: 'yellow'}}><h1>TEST FUNCIONANDO</h1></div>} />

          {/* RUTAS PÚBLICAS */}
          <Route 
            path="/" 
            element={
              <Layout>
                <ListasPage />
              </Layout>
            } 
          />
          
          <Route 
            path="/listas/:idLista/productos" 
            element={
              <Layout>
                <ProductosPage />
              </Layout>
            } 
          />

          {/* LOGIN */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* ADMIN PROTEGIDO */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<div style={{padding: '20px'}}><h1>404 - Página no encontrada</h1></div>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App