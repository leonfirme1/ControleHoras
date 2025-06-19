import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertTimeEntrySchema, 
  type TimeEntryDetailed, 
  type InsertTimeEntry, 
  type Client, 
  type Consultant, 
  type Service 
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TimeEntries() {
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [calculatedValue, setCalculatedValue] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [clientServices, setClientServices] = useState<Service[]>([]);
  const { toast } = useToast();

  const { data: timeEntries, isLoading: entriesLoading } = useQuery<TimeEntryDetailed[]>({
    queryKey: ["/api/time-entries"],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: consultants, isLoading: consultantsLoading } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

  const form = useForm<InsertTimeEntry>({
    resolver: zodResolver(insertTimeEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      consultantId: 0,
      clientId: 0,
      serviceId: 0,
      startTime: "",
      endTime: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTimeEntry) => apiRequest("POST", "/api/time-entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset({
        date: new Date().toISOString().split('T')[0],
        consultantId: 0,
        clientId: 0,
        serviceId: 0,
        startTime: "",
        endTime: "",
        description: "",
      });
      setCalculatedHours(0);
      setCalculatedValue(0);
      setSelectedService(null);
      setClientServices([]);
      toast({
        title: "Sucesso",
        description: "Lançamento de horas criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lançamento",
        variant: "destructive",
      });
    },
  });

  const watchedClientId = form.watch("clientId");
  const watchedStartTime = form.watch("startTime");
  const watchedEndTime = form.watch("endTime");
  const watchedServiceId = form.watch("serviceId");

  // Load services when client changes
  useEffect(() => {
    if (watchedClientId) {
      fetch(`/api/services/by-client/${watchedClientId}`)
        .then(res => res.json())
        .then(services => {
          setClientServices(services);
          form.setValue("serviceId", 0);
          setSelectedService(null);
        })
        .catch(() => {
          setClientServices([]);
        });
    } else {
      setClientServices([]);
      form.setValue("serviceId", 0);
      setSelectedService(null);
    }
  }, [watchedClientId, form]);

  // Update selected service when service changes
  useEffect(() => {
    if (watchedServiceId && clientServices.length > 0) {
      const service = clientServices.find(s => s.id === watchedServiceId);
      setSelectedService(service || null);
    } else {
      setSelectedService(null);
    }
  }, [watchedServiceId, clientServices]);

  // Calculate hours and value when times or service change
  useEffect(() => {
    if (watchedStartTime && watchedEndTime && selectedService) {
      const startParts = watchedStartTime.split(':');
      const endParts = watchedEndTime.split(':');
      
      if (startParts.length === 2 && endParts.length === 2) {
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        
        if (endMinutes > startMinutes) {
          const totalMinutes = endMinutes - startMinutes;
          const hours = totalMinutes / 60;
          const value = hours * parseFloat(selectedService.hourlyRate);
          
          setCalculatedHours(hours);
          setCalculatedValue(value);
        } else {
          setCalculatedHours(0);
          setCalculatedValue(0);
        }
      }
    } else {
      setCalculatedHours(0);
      setCalculatedValue(0);
    }
  }, [watchedStartTime, watchedEndTime, selectedService]);

  const onSubmit = (data: InsertTimeEntry) => {
    createMutation.mutate(data);
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getClientInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  if (entriesLoading || clientsLoading || consultantsLoading) {
    return (
      <Layout title="Lançamento de Horas">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="content-card">
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="content-card">
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Lançamento de Horas">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form for new time entry */}
        <div className="content-card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Novo Lançamento de Horas</h3>
          </div>
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consultantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um consultor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {consultants?.map((consultant) => (
                              <SelectItem key={consultant.id} value={consultant.id.toString()}>
                                {consultant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                        disabled={!watchedClientId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientServices.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora Início</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora Fim</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição das Atividades</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3} 
                          placeholder="Descreva as atividades realizadas..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total de Horas:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatTime(calculatedHours)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium text-gray-700">Valor Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(calculatedValue)}
                    </span>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-blue-700"
                  disabled={createMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? "Salvando..." : "Salvar Lançamento"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Recent time entries */}
        <div className="content-card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Lançamentos Recentes</h3>
          </div>
          <div className="p-6">
            {timeEntries && timeEntries.length > 0 ? (
              <div className="space-y-4">
                {timeEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
                            {getClientInitials(entry.client.name)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{entry.client.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{entry.service.description}</p>
                        <p className="text-xs text-gray-500">
                          {entry.consultant.name} • {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.startTime} - {entry.endTime} ({parseFloat(entry.totalHours).toFixed(1)}h)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(parseFloat(entry.totalValue))}
                        </p>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700 text-xs mt-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Nenhum lançamento encontrado
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
