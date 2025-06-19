import { 
  clients, 
  consultants, 
  services, 
  timeEntries,
  type Client, 
  type Consultant, 
  type Service, 
  type TimeEntry,
  type InsertClient, 
  type InsertConsultant, 
  type InsertService, 
  type InsertTimeEntry,
  type ServiceWithClient,
  type TimeEntryDetailed
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientByCode(code: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Consultants
  getConsultants(): Promise<Consultant[]>;
  getConsultant(id: number): Promise<Consultant | undefined>;
  getConsultantByCode(code: string): Promise<Consultant | undefined>;
  createConsultant(consultant: InsertConsultant): Promise<Consultant>;
  updateConsultant(id: number, consultant: Partial<InsertConsultant>): Promise<Consultant | undefined>;
  deleteConsultant(id: number): Promise<boolean>;

  // Services
  getServices(): Promise<ServiceWithClient[]>;
  getService(id: number): Promise<Service | undefined>;
  getServicesByClient(clientId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Time Entries
  getTimeEntries(): Promise<TimeEntryDetailed[]>;
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByDateRange(startDate: string, endDate: string): Promise<TimeEntryDetailed[]>;
  getTimeEntriesByClient(clientId: number): Promise<TimeEntryDetailed[]>;
  getTimeEntriesByConsultant(consultantId: number): Promise<TimeEntryDetailed[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalClients: number;
    monthlyHours: number;
    monthlyRevenue: number;
    activeConsultants: number;
  }>;

  // Reports
  getReportData(filters: {
    startDate?: string;
    endDate?: string;
    clientId?: number;
    consultantId?: number;
  }): Promise<{
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
  }>;
}

export class MemStorage implements IStorage {
  private clients: Map<number, Client>;
  private consultants: Map<number, Consultant>;
  private services: Map<number, Service>;
  private timeEntries: Map<number, TimeEntry>;
  private currentClientId: number;
  private currentConsultantId: number;
  private currentServiceId: number;
  private currentTimeEntryId: number;

  constructor() {
    this.clients = new Map();
    this.consultants = new Map();
    this.services = new Map();
    this.timeEntries = new Map();
    this.currentClientId = 1;
    this.currentConsultantId = 1;
    this.currentServiceId = 1;
    this.currentTimeEntryId = 1;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByCode(code: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.code === code);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { ...insertClient, id };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...updateData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Consultants
  async getConsultants(): Promise<Consultant[]> {
    return Array.from(this.consultants.values());
  }

  async getConsultant(id: number): Promise<Consultant | undefined> {
    return this.consultants.get(id);
  }

  async getConsultantByCode(code: string): Promise<Consultant | undefined> {
    return Array.from(this.consultants.values()).find(consultant => consultant.code === code);
  }

  async createConsultant(insertConsultant: InsertConsultant): Promise<Consultant> {
    const id = this.currentConsultantId++;
    const consultant: Consultant = { ...insertConsultant, id };
    this.consultants.set(id, consultant);
    return consultant;
  }

  async updateConsultant(id: number, updateData: Partial<InsertConsultant>): Promise<Consultant | undefined> {
    const consultant = this.consultants.get(id);
    if (!consultant) return undefined;
    
    const updatedConsultant = { ...consultant, ...updateData };
    this.consultants.set(id, updatedConsultant);
    return updatedConsultant;
  }

  async deleteConsultant(id: number): Promise<boolean> {
    return this.consultants.delete(id);
  }

  // Services
  async getServices(): Promise<ServiceWithClient[]> {
    const servicesList = Array.from(this.services.values());
    const servicesWithClients: ServiceWithClient[] = [];
    
    for (const service of servicesList) {
      const client = this.clients.get(service.clientId);
      if (client) {
        servicesWithClients.push({ ...service, client });
      }
    }
    
    return servicesWithClients;
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServicesByClient(clientId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.clientId === clientId);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const service: Service = { 
      ...insertService, 
      id,
      hourlyRate: insertService.hourlyRate.toString()
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { 
      ...service, 
      ...updateData,
      hourlyRate: updateData.hourlyRate ? updateData.hourlyRate.toString() : service.hourlyRate
    };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntryDetailed[]> {
    const entriesList = Array.from(this.timeEntries.values());
    const detailedEntries: TimeEntryDetailed[] = [];
    
    for (const entry of entriesList) {
      const consultant = this.consultants.get(entry.consultantId);
      const client = this.clients.get(entry.clientId);
      const service = this.services.get(entry.serviceId);
      
      if (consultant && client && service) {
        detailedEntries.push({ ...entry, consultant, client, service });
      }
    }
    
    return detailedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async getTimeEntriesByDateRange(startDate: string, endDate: string): Promise<TimeEntryDetailed[]> {
    const allEntries = await this.getTimeEntries();
    return allEntries.filter(entry => entry.date >= startDate && entry.date <= endDate);
  }

  async getTimeEntriesByClient(clientId: number): Promise<TimeEntryDetailed[]> {
    const allEntries = await this.getTimeEntries();
    return allEntries.filter(entry => entry.clientId === clientId);
  }

  async getTimeEntriesByConsultant(consultantId: number): Promise<TimeEntryDetailed[]> {
    const allEntries = await this.getTimeEntries();
    return allEntries.filter(entry => entry.consultantId === consultantId);
  }

  private calculateHoursAndValue(
    startTime: string, 
    endTime: string, 
    hourlyRate: string, 
    breakStartTime?: string, 
    breakEndTime?: string
  ): { hours: number; value: number } {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let totalMinutes = endMinutes - startMinutes;
    
    // Calculate break time if provided
    if (breakStartTime && breakEndTime) {
      const [breakStartHour, breakStartMin] = breakStartTime.split(':').map(Number);
      const [breakEndHour, breakEndMin] = breakEndTime.split(':').map(Number);
      
      const breakStartMinutes = breakStartHour * 60 + breakStartMin;
      const breakEndMinutes = breakEndHour * 60 + breakEndMin;
      
      const breakDuration = breakEndMinutes - breakStartMinutes;
      totalMinutes = totalMinutes - breakDuration;
    }
    
    const hours = Math.max(0, totalMinutes / 60);
    const value = hours * parseFloat(hourlyRate);
    
    return { hours, value };
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const service = this.services.get(insertTimeEntry.serviceId);
    if (!service) throw new Error("Service not found");
    
    const { hours, value } = this.calculateHoursAndValue(
      insertTimeEntry.startTime, 
      insertTimeEntry.endTime, 
      service.hourlyRate,
      insertTimeEntry.breakStartTime || undefined,
      insertTimeEntry.breakEndTime || undefined
    );
    
    const id = this.currentTimeEntryId++;
    const timeEntry: TimeEntry = { 
      id,
      date: insertTimeEntry.date,
      consultantId: insertTimeEntry.consultantId,
      clientId: insertTimeEntry.clientId,
      serviceId: insertTimeEntry.serviceId,
      startTime: insertTimeEntry.startTime,
      endTime: insertTimeEntry.endTime,
      description: insertTimeEntry.description || null,
      breakStartTime: insertTimeEntry.breakStartTime || null,
      breakEndTime: insertTimeEntry.breakEndTime || null,
      activityCompleted: insertTimeEntry.activityCompleted || null,
      deliveryForecast: insertTimeEntry.deliveryForecast || null,
      actualDelivery: insertTimeEntry.actualDelivery || null,
      project: insertTimeEntry.project || null,
      serviceLocation: insertTimeEntry.serviceLocation || null,
      totalHours: hours.toString(),
      totalValue: value.toString()
    };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  async updateTimeEntry(id: number, updateData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const timeEntry = this.timeEntries.get(id);
    if (!timeEntry) return undefined;
    
    const updatedEntry = { ...timeEntry, ...updateData };
    
    // Recalculate if times or service changed
    if (updateData.startTime || updateData.endTime || updateData.serviceId) {
      const serviceId = updateData.serviceId || timeEntry.serviceId;
      const service = this.services.get(serviceId);
      if (!service) return undefined;
      
      const startTime = updateData.startTime || timeEntry.startTime;
      const endTime = updateData.endTime || timeEntry.endTime;
      
      const { hours, value } = this.calculateHoursAndValue(startTime, endTime, service.hourlyRate);
      updatedEntry.totalHours = hours.toString();
      updatedEntry.totalValue = value.toString();
    }
    
    this.timeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalClients: number;
    monthlyHours: number;
    monthlyRevenue: number;
    activeConsultants: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyEntries = Array.from(this.timeEntries.values())
      .filter(entry => entry.date.startsWith(currentMonth));
    
    const monthlyHours = monthlyEntries.reduce((sum, entry) => sum + parseFloat(entry.totalHours), 0);
    const monthlyRevenue = monthlyEntries.reduce((sum, entry) => sum + parseFloat(entry.totalValue), 0);
    
    const activeConsultantIds = new Set(monthlyEntries.map(entry => entry.consultantId));
    
    return {
      totalClients: this.clients.size,
      monthlyHours,
      monthlyRevenue,
      activeConsultants: activeConsultantIds.size
    };
  }

  // Reports
  async getReportData(filters: {
    startDate?: string;
    endDate?: string;
    clientId?: number;
    consultantId?: number;
  }): Promise<{
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
  }> {
    let filteredEntries = Array.from(this.timeEntries.values());
    
    if (filters.startDate) {
      filteredEntries = filteredEntries.filter(entry => entry.date >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filteredEntries = filteredEntries.filter(entry => entry.date <= filters.endDate!);
    }
    
    if (filters.clientId) {
      filteredEntries = filteredEntries.filter(entry => entry.clientId === filters.clientId);
    }
    
    if (filters.consultantId) {
      filteredEntries = filteredEntries.filter(entry => entry.consultantId === filters.consultantId);
    }
    
    const totalHours = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.totalHours), 0);
    const totalValue = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.totalValue), 0);
    const totalEntries = filteredEntries.length;
    
    const clientIds = new Set(filteredEntries.map(entry => entry.clientId));
    const totalClients = clientIds.size;
    
    // Client breakdown
    const clientBreakdown: Array<{
      clientId: number;
      clientName: string;
      hours: number;
      value: number;
      entries: number;
    }> = [];
    
    clientIds.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (!client) return;
      
      const clientEntries = filteredEntries.filter(entry => entry.clientId === clientId);
      const clientHours = clientEntries.reduce((sum, entry) => sum + parseFloat(entry.totalHours), 0);
      const clientValue = clientEntries.reduce((sum, entry) => sum + parseFloat(entry.totalValue), 0);
      
      clientBreakdown.push({
        clientId,
        clientName: client.name,
        hours: clientHours,
        value: clientValue,
        entries: clientEntries.length
      });
    });
    
    clientBreakdown.sort((a, b) => b.value - a.value);
    
    return {
      totalHours,
      totalValue,
      totalEntries,
      totalClients,
      clientBreakdown
    };
  }
}

export class DatabaseStorage implements IStorage {
  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByCode(code: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.code, code));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db.update(clients).set(updateData).where(eq(clients.id, id)).returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Consultants
  async getConsultants(): Promise<Consultant[]> {
    return await db.select().from(consultants);
  }

  async getConsultant(id: number): Promise<Consultant | undefined> {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.id, id));
    return consultant || undefined;
  }

  async getConsultantByCode(code: string): Promise<Consultant | undefined> {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.code, code));
    return consultant || undefined;
  }

  async createConsultant(insertConsultant: InsertConsultant): Promise<Consultant> {
    const [consultant] = await db.insert(consultants).values(insertConsultant).returning();
    return consultant;
  }

  async updateConsultant(id: number, updateData: Partial<InsertConsultant>): Promise<Consultant | undefined> {
    const [consultant] = await db.update(consultants).set(updateData).where(eq(consultants.id, id)).returning();
    return consultant || undefined;
  }

  async deleteConsultant(id: number): Promise<boolean> {
    const result = await db.delete(consultants).where(eq(consultants.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Services
  async getServices(): Promise<ServiceWithClient[]> {
    const result = await db.select().from(services).leftJoin(clients, eq(services.clientId, clients.id));
    return result.map((row) => ({
      ...row.services,
      client: row.clients!,
    }));
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getServicesByClient(clientId: number): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.clientId, clientId));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const serviceData = {
      code: insertService.code,
      clientId: insertService.clientId,
      description: insertService.description,
      hourlyRate: insertService.hourlyRate.toString()
    };
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }

  async updateService(id: number, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const serviceData: any = {};
    if (updateData.code !== undefined) serviceData.code = updateData.code;
    if (updateData.clientId !== undefined) serviceData.clientId = updateData.clientId;
    if (updateData.description !== undefined) serviceData.description = updateData.description;
    if (updateData.hourlyRate !== undefined) serviceData.hourlyRate = updateData.hourlyRate.toString();
    
    const [service] = await db.update(services).set(serviceData).where(eq(services.id, id)).returning();
    return service || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntryDetailed[]> {
    const result = await db
      .select()
      .from(timeEntries)
      .leftJoin(consultants, eq(timeEntries.consultantId, consultants.id))
      .leftJoin(clients, eq(timeEntries.clientId, clients.id))
      .leftJoin(services, eq(timeEntries.serviceId, services.id));

    return result.map((row) => ({
      ...row.time_entries,
      consultant: row.consultants!,
      client: row.clients!,
      service: row.services!,
    }));
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return timeEntry || undefined;
  }

  async getTimeEntriesByDateRange(startDate: string, endDate: string): Promise<TimeEntryDetailed[]> {
    const result = await db
      .select()
      .from(timeEntries)
      .leftJoin(consultants, eq(timeEntries.consultantId, consultants.id))
      .leftJoin(clients, eq(timeEntries.clientId, clients.id))
      .leftJoin(services, eq(timeEntries.serviceId, services.id))
      .where(and(gte(timeEntries.date, startDate), lte(timeEntries.date, endDate)));

    return result.map((row) => ({
      ...row.time_entries,
      consultant: row.consultants!,
      client: row.clients!,
      service: row.services!,
    }));
  }

  async getTimeEntriesByClient(clientId: number): Promise<TimeEntryDetailed[]> {
    const result = await db
      .select()
      .from(timeEntries)
      .leftJoin(consultants, eq(timeEntries.consultantId, consultants.id))
      .leftJoin(clients, eq(timeEntries.clientId, clients.id))
      .leftJoin(services, eq(timeEntries.serviceId, services.id))
      .where(eq(timeEntries.clientId, clientId));

    return result.map((row) => ({
      ...row.time_entries,
      consultant: row.consultants!,
      client: row.clients!,
      service: row.services!,
    }));
  }

  async getTimeEntriesByConsultant(consultantId: number): Promise<TimeEntryDetailed[]> {
    const result = await db
      .select()
      .from(timeEntries)
      .leftJoin(consultants, eq(timeEntries.consultantId, consultants.id))
      .leftJoin(clients, eq(timeEntries.clientId, clients.id))
      .leftJoin(services, eq(timeEntries.serviceId, services.id))
      .where(eq(timeEntries.consultantId, consultantId));

    return result.map((row) => ({
      ...row.time_entries,
      consultant: row.consultants!,
      client: row.clients!,
      service: row.services!,
    }));
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    // Calculate hours and value
    const service = await this.getService(insertTimeEntry.serviceId);
    if (!service) {
      throw new Error("Service not found");
    }

    const totalHours = this.calculateHours(
      insertTimeEntry.startTime,
      insertTimeEntry.endTime,
      insertTimeEntry.breakStartTime,
      insertTimeEntry.breakEndTime
    );

    const totalValue = totalHours * parseFloat(service.hourlyRate);

    const timeEntryWithCalc = {
      ...insertTimeEntry,
      totalHours: totalHours.toString(),
      totalValue: totalValue.toString(),
    };

    const [timeEntry] = await db.insert(timeEntries).values(timeEntryWithCalc).returning();
    return timeEntry;
  }

  async updateTimeEntry(id: number, updateData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    // If time-related fields are updated, recalculate
    if (updateData.startTime || updateData.endTime || updateData.breakStartTime || updateData.breakEndTime || updateData.serviceId) {
      const existing = await this.getTimeEntry(id);
      if (!existing) return undefined;

      const serviceId = updateData.serviceId || existing.serviceId;
      const service = await this.getService(serviceId);
      if (!service) throw new Error("Service not found");

      const startTime = updateData.startTime || existing.startTime;
      const endTime = updateData.endTime || existing.endTime;
      const breakStartTime = updateData.breakStartTime || existing.breakStartTime;
      const breakEndTime = updateData.breakEndTime || existing.breakEndTime;

      const totalHours = this.calculateHours(startTime, endTime, breakStartTime, breakEndTime);
      const totalValue = totalHours * parseFloat(service.hourlyRate);

      const updatedData: any = {
        ...updateData,
        totalHours: totalHours.toString(),
        totalValue: totalValue.toString()
      };

      const [timeEntry] = await db.update(timeEntries).set(updatedData).where(eq(timeEntries.id, id)).returning();
      return timeEntry || undefined;
    }

    const [timeEntry] = await db.update(timeEntries).set(updateData).where(eq(timeEntries.id, id)).returning();
    return timeEntry || undefined;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  private calculateHours(startTime: string, endTime: string, breakStartTime?: string | null, breakEndTime?: string | null): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    let workMinutes = end - start;

    if (breakStartTime && breakEndTime) {
      const breakStart = this.timeToMinutes(breakStartTime);
      const breakEnd = this.timeToMinutes(breakEndTime);
      workMinutes -= (breakEnd - breakStart);
    }

    return workMinutes / 60;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalClients: number;
    monthlyHours: number;
    monthlyRevenue: number;
    activeConsultants: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const [clientsCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const [consultantsCount] = await db.select({ count: sql<number>`count(*)` }).from(consultants);
    
    const monthlyEntries = await db
      .select({
        totalHours: sql<number>`sum(${timeEntries.totalHours})`,
        totalValue: sql<number>`sum(${timeEntries.totalValue})`
      })
      .from(timeEntries)
      .where(sql`${timeEntries.date} >= ${currentMonth + '-01'} AND ${timeEntries.date} < ${currentMonth + '-32'}`);

    return {
      totalClients: clientsCount.count,
      monthlyHours: monthlyEntries[0]?.totalHours || 0,
      monthlyRevenue: monthlyEntries[0]?.totalValue || 0,
      activeConsultants: consultantsCount.count,
    };
  }

  // Reports
  async getReportData(filters: {
    startDate?: string;
    endDate?: string;
    clientId?: number;
    consultantId?: number;
  }): Promise<{
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
  }> {
    const conditions = [];
    if (filters.startDate) conditions.push(gte(timeEntries.date, filters.startDate));
    if (filters.endDate) conditions.push(lte(timeEntries.date, filters.endDate));
    if (filters.clientId) conditions.push(eq(timeEntries.clientId, filters.clientId));
    if (filters.consultantId) conditions.push(eq(timeEntries.consultantId, filters.consultantId));
    
    let entries;
    const baseQuery = db.select().from(timeEntries).leftJoin(clients, eq(timeEntries.clientId, clients.id));
    
    if (conditions.length > 0) {
      entries = await baseQuery.where(and(...conditions));
    } else {
      entries = await baseQuery;
    }
    
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.time_entries.totalHours), 0);
    const totalValue = entries.reduce((sum, entry) => sum + parseFloat(entry.time_entries.totalValue), 0);
    const totalEntries = entries.length;
    
    const uniqueClients = new Set(entries.map(entry => entry.time_entries.clientId));
    const totalClients = uniqueClients.size;
    
    const clientBreakdown = Array.from(uniqueClients).map(clientId => {
      const clientEntries = entries.filter(entry => entry.time_entries.clientId === clientId);
      const clientName = clientEntries[0]?.clients?.name || 'Unknown';
      const hours = clientEntries.reduce((sum, entry) => sum + parseFloat(entry.time_entries.totalHours), 0);
      const value = clientEntries.reduce((sum, entry) => sum + parseFloat(entry.time_entries.totalValue), 0);
      
      return {
        clientId,
        clientName,
        hours,
        value,
        entries: clientEntries.length,
      };
    });

    clientBreakdown.sort((a, b) => b.value - a.value);
    
    return {
      totalHours,
      totalValue,
      totalEntries,
      totalClients,
      clientBreakdown
    };
  }
}

export const storage = new DatabaseStorage();
