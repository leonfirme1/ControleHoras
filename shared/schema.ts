import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  email: text("email").notNull(),
});

export const consultants = pgTable("consultants", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  description: text("description").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
});

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  consultantId: integer("consultant_id").notNull().references(() => consultants.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  breakStartTime: text("break_start_time"), // HH:MM format
  breakEndTime: text("break_end_time"), // HH:MM format
  description: text("description").default(""),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(),
  activityCompleted: text("activity_completed"), // "sim" or "nao"
  deliveryForecast: text("delivery_forecast"), // YYYY-MM-DD format
  actualDelivery: text("actual_delivery"), // YYYY-MM-DD format
  project: text("project"),
  serviceLocation: text("service_location"), // "presencial" or "remoto"
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
});

export const insertConsultantSchema = createInsertSchema(consultants).omit({
  id: true,
});

// Schema para validação do backend (converte string para number)
export const insertServiceSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  clientId: z.number().min(1, "Cliente é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  hourlyRate: z.string().transform((val) => parseFloat(val)).refine((val) => val >= 0, "Valor deve ser maior que zero"),
});

// Schema para o formulário frontend (mantém string)
export const insertServiceFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  clientId: z.number().min(1, "Cliente é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  hourlyRate: z.string().min(1, "Valor por hora é obrigatório"),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  totalHours: true,
  totalValue: true,
});

// Types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Consultant = typeof consultants.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertServiceForm = z.infer<typeof insertServiceFormSchema>;
export type Service = typeof services.$inferSelect;

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// Extended types for joined data
export type ServiceWithClient = Service & { client: Client };
export type TimeEntryDetailed = TimeEntry & {
  consultant: Consultant;
  client: Client;
  service: Service;
};
