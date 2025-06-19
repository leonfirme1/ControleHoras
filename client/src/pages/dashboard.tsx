import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, DollarSign, UserCheck } from "lucide-react";

interface DashboardStats {
  totalClients: number;
  monthlyHours: number;
  monthlyRevenue: number;
  activeConsultants: number;
}

interface TimeEntryDetailed {
  id: number;
  date: string;
  consultant: { name: string };
  client: { name: string };
  service: { description: string };
  totalHours: string;
  totalValue: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentEntries, isLoading: entriesLoading, error: entriesError } = useQuery<TimeEntryDetailed[]>({
    queryKey: ["/api/time-entries"],
    select: (data) => data?.slice(0, 5) || [],
  });

  console.log("Dashboard render - stats:", stats, "entries:", recentEntries);
  console.log("Dashboard errors - stats:", statsError, "entries:", entriesError);

  if (statsError || entriesError) {
    return (
      <Layout title="Dashboard">
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar dados</h2>
            <p className="text-gray-600">
              {statsError?.message || entriesError?.message || "Erro desconhecido"}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (statsLoading || entriesLoading) {
    return (
      <Layout title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stats-card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getClientInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-primary h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Este Mês</p>
                <p className="text-3xl font-bold text-gray-900">{Number(stats?.monthlyHours || 0).toFixed(1)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="text-green-600 h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento Mensal</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(Number(stats?.monthlyRevenue || 0))}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <DollarSign className="text-yellow-600 h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultores Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.activeConsultants || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <UserCheck className="text-purple-600 h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="content-card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Atividades Recentes</h3>
            </div>
            <div className="p-6">
              {recentEntries && recentEntries.length > 0 ? (
                <div className="space-y-4">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="text-primary h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Novo lançamento de horas</p>
                        <p className="text-xs text-gray-600">
                          Cliente: {entry.client.name} - {parseFloat(entry.totalHours).toFixed(1)}h trabalhadas
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.consultant.name} • {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhum lançamento encontrado</p>
              )}
            </div>
          </div>

          <div className="content-card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Resumo do Sistema</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sistema de Controle de Horas</span>
                  <span className="text-sm font-semibold text-green-600">Ativo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última atualização</span>
                  <span className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Versão</span>
                  <span className="text-sm font-semibold text-gray-900">1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
