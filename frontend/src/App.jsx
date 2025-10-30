import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ListasPage from './pages/ListasPage'
import ProductosPage from './pages/ProductosPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ListasPage />} />
          <Route path="/listas/:idLista/productos" element={<ProductosPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App