import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Client, type Consultant } from "@shared/schema";
import { Search, FileSpreadsheet, FileText } from "lucide-react";

interface ReportData {
  totalHours: number;
  totalValue: number;
  totalEntries: number;
  totalClients: number;
  clientBreakdown: Array<{
    clientId: number;
    clientName: string;
    hours: number;
    value: number;
    entries: number;
  }>;
}

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedConsultant, setSelectedConsultant] = useState("all");

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: consultants } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports", { startDate, endDate, selectedClient, selectedConsultant }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedClient && selectedClient !== "all") params.append("clientId", selectedClient);
      if (selectedConsultant && selectedConsultant !== "all") params.append("consultantId", selectedConsultant);
      
      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error("Failed to fetch report data");
      return response.json();
    },
    enabled: true,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExportExcel = () => {
    // Implementation for Excel export would go here
    alert("Exportação para Excel será implementada");
  };

  const handleExportPDF = () => {
    // Implementation for PDF export would go here
    alert("Exportação para PDF será implementada");
  };

  return (
    <Layout title="Relatórios">
      <div className="space-y-6">
        {/* Filters */}
        <div className="content-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros do Relatório</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consultor</label>
              <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
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
          <div className="mt-4 flex space-x-4">
            <Button className="bg-primary hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
            <Button 
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button 
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Report Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="content-card p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 content-card p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Resumo do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total de Horas:</span>
                    <span className="text-sm font-semibold">
                      {reportData?.totalHours?.toFixed(1) || '0.0'}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor Total:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(reportData?.totalValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Número de Lançamentos:</span>
                    <span className="text-sm font-semibold">
                      {reportData?.totalEntries || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Clientes Atendidos:</span>
                    <span className="text-sm font-semibold">
                      {reportData?.totalClients || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Report Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-md">Detalhamento por Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Horas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Lançamentos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData?.clientBreakdown && reportData.clientBreakdown.length > 0 ? (
                        reportData.clientBreakdown.map((item) => (
                          <tr key={item.clientId}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.clientName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.hours.toFixed(1)}h
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(item.value)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.entries}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            Nenhum dado encontrado para o período selecionado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
