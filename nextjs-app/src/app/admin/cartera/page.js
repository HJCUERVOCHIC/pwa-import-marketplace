'use client'

import AdminLayout from '@/components/AdminLayout'
import CarteraClientes from '@/components/CarteraClientes'

export default function CarteraPage() {
  return (
    <AdminLayout>
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-neutrals-black mb-2">
            💼 Cartera de Clientes
          </h1>
          <p className="text-neutrals-graySoft">
            Gestiona los saldos pendientes y deudas por cliente
          </p>
        </div>

        {/* Componente de cartera */}
        <CarteraClientes />
      </main>
    </AdminLayout>
  )
}
