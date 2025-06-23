import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  password: text("password").notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  description: text("description").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
});

export const sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id), // nullable - can exist without client
  description: text("description").notNull(),
});

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  consultantId: integer("consultant_id").notNull().references(() => consultants.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  sectorId: integer("sector_id").references(() => sectors.id), // optional sector
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

// Schema para login
export const loginSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
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

export const insertSectorSchema = createInsertSchema(sectors).omit({
  id: true,
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
export type LoginData = z.infer<typeof loginSchema>;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertServiceForm = z.infer<typeof insertServiceFormSchema>;
export type Service = typeof services.$inferSelect;

export type InsertSector = z.infer<typeof insertSectorSchema>;
export type Sector = typeof sectors.$inferSelect;

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// Extended types for joined data
export type ServiceWithClient = Service & { client: Client };
export type SectorWithClient = Sector & { client: Client | null };
export type TimeEntryDetailed = TimeEntry & {
  consultant: Consultant;
  client: Client;
  service: Service;
};

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  services: many(services),
  sectors: many(sectors),
  timeEntries: many(timeEntries),
}));

export const consultantsRelations = relations(consultants, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  client: one(clients, {
    fields: [services.clientId],
    references: [clients.id],
  }),
  timeEntries: many(timeEntries),
}));

export const sectorsRelations = relations(sectors, ({ one }) => ({
  client: one(clients, {
    fields: [sectors.clientId],
    references: [clients.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  consultant: one(consultants, {
    fields: [timeEntries.consultantId],
    references: [consultants.id],
  }),
  client: one(clients, {
    fields: [timeEntries.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [timeEntries.serviceId],
    references: [services.id],
  }),
  sector: one(sectors, {
    fields: [timeEntries.sectorId],
    references: [sectors.id],
  }),
}));
