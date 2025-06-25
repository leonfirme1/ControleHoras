import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Download, Eye, EyeOff, Calendar, Clock, DollarSign } from "lucide-react";
import type { Client, TimeEntryDetailed } from "@shared/schema";

interface BillingGroupItem {
  project: string;
  sector: string;
  serviceType: string;
  hours: number;
  value: number;
  entries: number;
}

export default function Billing() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [showValues, setShowValues] = useState(false);
  const [reportType, setReportType] = useState<"detailed" | "synthetic">("detailed");

  // Queries
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: timeEntries = [], isLoading } = useQuery<TimeEntryDetailed[]>({
    queryKey: ["/api/time-entries/billing", selectedClient, startDate, endDate],
    enabled: !!selectedClient && !!startDate && !!endDate,
  });

  // Calculate totals
  const selectedTimeEntries = timeEntries.filter(entry => selectedEntries.has(entry.id));
  const totalHours = selectedTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalValue = selectedTimeEntries.reduce((sum, entry) => sum + entry.value, 0);

  // Group by project-sector-service type
  const groupedData: BillingGroupItem[] = selectedTimeEntries.reduce((groups, entry) => {
    const key = `${entry.service.name}-${entry.sector?.name || 'Sem Setor'}-${entry.service.serviceType || 'Sem Tipo'}`;
    const existing = groups.find(g => 
      g.project === entry.service.name && 
      g.sector === (entry.sector?.name || 'Sem Setor') && 
      g.serviceType === (entry.service.serviceType || 'Sem Tipo')
    );

    if (existing) {
      existing.hours += entry.hours;
      existing.value += entry.value;
      existing.entries += 1;
    } else {
      groups.push({
        project: entry.service.name,
        sector: entry.sector?.name || 'Sem Setor',
        serviceType: entry.service.serviceType || 'Sem Tipo',
        hours: entry.hours,
        value: entry.value,
        entries: 1,
      });
    }
    return groups;
  }, [] as BillingGroupItem[]);

  const handleSelectAll = () => {
    if (selectedEntries.size === timeEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(timeEntries.map(entry => entry.id)));
    }
  };

  const handleEntrySelect = (entryId: number, checked: boolean) => {
    const newSelected = new Set(selectedEntries);
    if (checked) {
      newSelected.add(entryId);
    } else {
      newSelected.delete(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleGeneratePDF = async () => {
    if (!selectedClient || selectedEntries.size === 0) return;

    try {
      const response = await fetch('/api/billing/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: parseInt(selectedClient),
          startDate,
          endDate,
          entryIds: Array.from(selectedEntries),
          reportType,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fatura-${clients.find(c => c.id.toString() === selectedClient)?.name}-${startDate}-${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  return (
    <Layout title="Faturamento">
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gerar Fatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reportType">Tipo de Relatório</Label>
                <Select value={reportType} onValueChange={(value: "detailed" | "synthetic") => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed">Detalhado</SelectItem>
                    <SelectItem value="synthetic">Sintético</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValues(!showValues)}
                className="flex items-center gap-2"
              >
                {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showValues ? "Ocultar Valores" : "Mostrar Valores"}
              </Button>

              <Button
                onClick={handleGeneratePDF}
                disabled={selectedEntries.size === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Gerar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Agrupado */}
        {groupedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Projeto - Setor - Tipo de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupedData.map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{group.project}</div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{group.sector}</Badge>
                        <Badge variant="outline">{group.serviceType}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {group.hours.toFixed(2)}h ({group.entries} atividades)
                      </div>
                      {showValues && (
                        <div className="flex items-center gap-2 font-medium">
                          <DollarSign className="h-4 w-4" />
                          R$ {group.value.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Totais */}
        {selectedEntries.size > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedEntries.size}</div>
                  <div className="text-sm text-muted-foreground">Atividades Selecionadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
                  <div className="text-sm text-muted-foreground">Total de Horas</div>
                </div>
                {showValues && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Atividades */}
        {timeEntries.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Atividades do Período</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectedEntries.size === timeEntries.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll">Selecionar Todas</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                      selectedEntries.has(entry.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedEntries.has(entry.id)}
                      onCheckedChange={(checked) => handleEntrySelect(entry.id, checked as boolean)}
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{entry.service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {entry.description}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {entry.startTime} - {entry.endTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {entry.hours.toFixed(2)}h
                        </div>
                        {showValues && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            R$ {entry.value.toFixed(2)}
                          </div>
                        )}
                        <Badge variant="secondary">{entry.consultant.name}</Badge>
                        {entry.sector && (
                          <Badge variant="outline">{entry.sector.name}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Carregando atividades...</div>
          </div>
        )}

        {!isLoading && timeEntries.length === 0 && selectedClient && startDate && endDate && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-muted-foreground">
                Nenhuma atividade encontrada para o período selecionado.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}