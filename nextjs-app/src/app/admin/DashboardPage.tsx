import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { FileText, Package2, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

interface Stats {
  totalListas: number;
  listasPublicadas: number;
  totalProductos: number;
  productosPublicados: number;
}

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalListas: 0,
    listasPublicadas: 0,
    totalProductos: 0,
    productosPublicados: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  async function cargarEstadisticas() {
    try {
      // Obtener total de listas
      const { count: totalListas } = await supabase
        .from('listas_oferta')
        .select('*', { count: 'exact', head: true });

      // Obtener listas publicadas
      const { count: listasPublicadas } = await supabase
        .from('listas_oferta')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'publicada');

      // Obtener total de productos
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      // Obtener productos publicados
      const { count: productosPublicados } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'publicado');

      setStats({
        totalListas: totalListas || 0,
        listasPublicadas: listasPublicadas || 0,
        totalProductos: totalProductos || 0,
        productosPublicados: productosPublicados || 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Listas',
      value: stats.totalListas,
      icon: FileText,
      color: 'gold',
      bgColor: 'bg-gold-100',
      iconColor: 'text-gold-600',
      trend: null,
    },
    {
      title: 'Listas Publicadas',
      value: stats.listasPublicadas,
      icon: CheckCircle,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: stats.totalListas > 0 ? `${Math.round((stats.listasPublicadas / stats.totalListas) * 100)}%` : null,
    },
    {
      title: 'Total Productos',
      value: stats.totalProductos,
      icon: Package2,
      color: 'gold',
      bgColor: 'bg-gold-100',
      iconColor: 'text-gold-600',
      trend: null,
    },
    {
      title: 'Productos Publicados',
      value: stats.productosPublicados,
      icon: TrendingUp,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: stats.totalProductos > 0 ? `${Math.round((stats.productosPublicados / stats.totalProductos) * 100)}%` : null,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-gold-50 to-emerald-50 border-l-4 border-gold-400 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-gold-400 rounded-md p-3 shadow-md">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <div className="ml-5">
            <h3 className="text-2xl font-display font-bold text-neutral-charcoal">
              ¡Bienvenido, {profile?.nombre}!
            </h3>
            <p className="mt-1 text-neutral-slate">
              Panel de administración - <span className="font-semibold text-gold-600">Chic Import USA</span>
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas en Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-card border border-neutral-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-base hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} rounded-md p-3 shadow-sm`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                {stat.trend && (
                  <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    {stat.trend}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-stone uppercase tracking-wide mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-display font-bold text-neutral-charcoal">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Información del rol */}
      <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4 mb-8 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-emerald-800">
              <strong>Tu rol:</strong>{' '}
              {profile?.role === 'superadmin' ? 'Super Administrador' : 'Administrador Full'}
              <br />
              {profile?.role === 'superadmin'
                ? 'Tienes acceso completo a todas las funcionalidades del sistema.'
                : 'Tienes acceso a la gestión de listas y productos.'}
            </p>
          </div>
        </div>
      </div>

      {/* Acceso rápido */}
      <div>
        <h2 className="text-2xl font-display font-bold text-neutral-charcoal mb-6">
          Acceso Rápido
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Gestión de Listas */}
          <Link
            to="/admin/listas"
            className="group relative bg-card border-2 border-gold-200 rounded-lg px-6 py-8 shadow-sm hover:shadow-gold hover:border-gold-400 transition-all duration-base hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex-shrink-0 bg-gold-100 rounded-full p-4 group-hover:bg-gold-200 group-hover:shadow-md transition-all">
                <FileText className="h-12 w-12 text-gold-600 group-hover:text-gold-700" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-display font-semibold text-neutral-charcoal group-hover:text-gold-700 transition-colors">
                  Gestión de Listas
                </p>
                <p className="text-sm text-neutral-stone mt-2">
                  Crea y administra tus catálogos de productos importados
                </p>
              </div>
              <div className="flex items-center text-gold-600 group-hover:text-gold-700 font-medium text-sm">
                <span>Ir a Listas</span>
                <svg
                  className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          {/* Info: Productos desde listas */}
          <div className="relative bg-neutral-gray border-2 border-dashed border-neutral-border rounded-lg px-6 py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex-shrink-0 bg-neutral-border rounded-full p-4">
                <Package2 className="h-12 w-12 text-neutral-stone" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-display font-semibold text-neutral-slate">
                  Gestión de Productos
                </p>
                <p className="text-sm text-neutral-stone mt-2">
                  Los productos se gestionan desde cada lista. Ve a "Gestión de Listas" para agregar productos.
                </p>
              </div>
            </div>
          </div>

          {/* Activity placeholder */}
          <div className="relative bg-card border-2 border-neutral-border rounded-lg px-6 py-8 opacity-60">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex-shrink-0 bg-neutral-border rounded-full p-4">
                <Clock className="h-12 w-12 text-neutral-stone" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-display font-semibold text-neutral-slate">
                  Actividad Reciente
                </p>
                <p className="text-sm text-neutral-stone mt-2">
                  Próximamente disponible
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
