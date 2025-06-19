import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  type TimeEntryDetailed, 
  type Client, 
  type Consultant 
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash2, Filter, Calendar, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Activities() {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    clientId: 'all',
    consultantId: 'all'
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch filtered activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<TimeEntryDetailed[]>({
    queryKey: ["/api/time-entries/filtered", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.clientId && filters.clientId !== 'all') params.set('clientId', filters.clientId);
      if (filters.consultantId && filters.consultantId !== 'all') params.set('consultantId', filters.consultantId);
      
      const response = await fetch(`/api/time-entries/filtered?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      return response.json();
    },
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: consultants } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/time-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/filtered"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Atividade excluída com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir atividade",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const totals = activities?.reduce(
    (acc, activity) => ({
      hours: acc.hours + parseFloat(activity.totalHours),
      value: acc.value + parseFloat(activity.totalValue),
    }),
    { hours: 0, value: 0 }
  ) || { hours: 0, value: 0 };

  const handleEdit = (activity: TimeEntryDetailed) => {
    // Store the activity data in localStorage for the time-entries page
    localStorage.setItem('editingActivity', JSON.stringify(activity));
    // Navigate to time-entries page
    setLocation('/time-entries');
  };

  const handleDelete = (id: number, description: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a atividade "${description}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      clientId: 'all',
      consultantId: 'all'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getActivityStatus = (activity: TimeEntryDetailed) => {
    if (activity.activityCompleted === 'sim') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Concluída</Badge>;
    } else if (activity.activityCompleted === 'nao') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
    return <Badge variant="outline">Não informado</Badge>;
  };

  return (
    <Layout title="Atividades Executadas">
      <div className="space-y-6">
        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Cliente
                </label>
                <Select value={filters.clientId} onValueChange={(value) => handleFilterChange('clientId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Consultor
                </label>
                <Select value={filters.consultantId} onValueChange={(value) => handleFilterChange('consultantId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os consultores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os consultores</SelectItem>
                    {consultants?.map((consultant) => (
                      <SelectItem key={consultant.id} value={consultant.id.toString()}>
                        {consultant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => {
                  // Force refetch when filter button is clicked
                  queryClient.invalidateQueries({ queryKey: ["/api/time-entries/filtered"] });
                }}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <div className="ml-auto text-sm text-gray-600 flex items-center gap-4">
                <span className="font-medium">
                  Total: {totals.hours.toFixed(1)}h | {formatCurrency(totals.value)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades ({activities?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="text-center py-8">Carregando atividades...</div>
            ) : activities && activities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Consultor</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {new Date(activity.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.client.code}
                            </Badge>
                            <span className="truncate max-w-32">{activity.client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.consultant.code}
                            </Badge>
                            <span className="truncate max-w-32">{activity.consultant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-48">
                          <span className="truncate block">{activity.service.description}</span>
                        </TableCell>
                        <TableCell>
                          {activity.project ? (
                            <Badge variant="secondary" className="text-xs">
                              {activity.project}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            {activity.startTime} - {activity.endTime}
                            {activity.breakStartTime && activity.breakEndTime && (
                              <div className="text-gray-500">
                                Intervalo: {activity.breakStartTime} - {activity.breakEndTime}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(activity.totalHours).toFixed(1)}h
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(parseFloat(activity.totalValue))}
                        </TableCell>
                        <TableCell>
                          {getActivityStatus(activity)}
                        </TableCell>
                        <TableCell>
                          {activity.serviceLocation === 'presencial' ? (
                            <Badge variant="outline" className="text-xs">Presencial</Badge>
                          ) : activity.serviceLocation === 'remoto' ? (
                            <Badge variant="outline" className="text-xs">Remoto</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(activity)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(activity.id, activity.service.description)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma atividade encontrada para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        {activities && activities.length > 0 && (
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {totals.hours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-600">Total de Horas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totals.value)}
                  </div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}