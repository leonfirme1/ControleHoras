import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertConsultantSchema, 
  insertServiceSchema, 
  insertSectorSchema,
  insertServiceTypeSchema,
  insertTimeEntrySchema,
  loginSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const consultant = await storage.authenticateConsultant(validatedData);
      
      if (!consultant) {
        return res.status(401).json({ message: "Código ou senha inválidos" });
      }

      // Remove password from response
      const { password, ...consultantData } = consultant;
      res.json({ consultant: consultantData, message: "Login realizado com sucesso" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      
      // Check if code already exists
      const existingByCode = await storage.getClientByCode(validatedData.code);
      if (existingByCode) {
        return res.status(400).json({ message: "Client code already exists" });
      }
      
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create client" });
      }
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertClientSchema.partial().parse(req.body);
      
      const client = await storage.updateClient(id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update client" });
      }
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Consultants routes
  app.get("/api/consultants", async (req, res) => {
    try {
      const consultants = await storage.getConsultants();
      res.json(consultants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultants" });
    }
  });

  app.post("/api/consultants", async (req, res) => {
    try {
      const validatedData = insertConsultantSchema.parse(req.body);
      
      // Check if code already exists
      const existingByCode = await storage.getConsultantByCode(validatedData.code);
      if (existingByCode) {
        return res.status(400).json({ message: "Consultant code already exists" });
      }
      
      const consultant = await storage.createConsultant(validatedData);
      res.status(201).json(consultant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create consultant" });
      }
    }
  });

  app.put("/api/consultants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertConsultantSchema.partial().parse(req.body);
      
      const consultant = await storage.updateConsultant(id, validatedData);
      if (!consultant) {
        return res.status(404).json({ message: "Consultant not found" });
      }
      res.json(consultant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update consultant" });
      }
    }
  });

  app.delete("/api/consultants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteConsultant(id);
      if (!deleted) {
        return res.status(404).json({ message: "Consultant not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete consultant" });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/by-client/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const services = await storage.getServicesByClient(clientId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create service" });
      }
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertServiceSchema.partial().parse(req.body);
      
      const service = await storage.updateService(id, validatedData);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update service" });
      }
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteService(id);
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Sectors routes
  app.get("/api/sectors", async (req, res) => {
    try {
      const sectors = await storage.getSectors();
      res.json(sectors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sectors" });
    }
  });

  app.get("/api/sectors/by-client/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const sectors = await storage.getSectorsByClient(clientId);
      res.json(sectors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sectors by client" });
    }
  });

  app.post("/api/sectors", async (req, res) => {
    try {
      const validatedData = insertSectorSchema.parse(req.body);
      const sector = await storage.createSector(validatedData);
      res.status(201).json(sector);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create sector" });
      }
    }
  });

  app.put("/api/sectors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSectorSchema.partial().parse(req.body);
      
      const sector = await storage.updateSector(id, validatedData);
      if (!sector) {
        return res.status(404).json({ message: "Sector not found" });
      }
      res.json(sector);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update sector" });
      }
    }
  });

  app.delete("/api/sectors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSector(id);
      if (!deleted) {
        return res.status(404).json({ message: "Sector not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sector" });
    }
  });

  // Service Types routes
  app.get("/api/service-types", async (req, res) => {
    try {
      const serviceTypes = await storage.getServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service types" });
    }
  });

  app.post("/api/service-types", async (req, res) => {
    try {
      const validatedData = insertServiceTypeSchema.parse(req.body);
      const serviceType = await storage.createServiceType(validatedData);
      res.status(201).json(serviceType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create service type" });
      }
    }
  });

  app.put("/api/service-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertServiceTypeSchema.partial().parse(req.body);
      
      const serviceType = await storage.updateServiceType(id, validatedData);
      if (!serviceType) {
        return res.status(404).json({ message: "Service type not found" });
      }
      res.json(serviceType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update service type" });
      }
    }
  });

  app.delete("/api/service-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteServiceType(id);
      if (!deleted) {
        return res.status(404).json({ message: "Service type not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service type" });
    }
  });

  // Time entries routes
  app.get("/api/time-entries", async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      if (month && year) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        const timeEntries = await storage.getTimeEntriesByDateRange(startDate, endDate);
        res.json(timeEntries);
      } else {
        const timeEntries = await storage.getTimeEntries();
        res.json(timeEntries);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.get("/api/time-entries/filtered", async (req, res) => {
    try {
      const { startDate, endDate, clientId, consultantId } = req.query;
      
      let timeEntries: any[];
      
      if (startDate && endDate) {
        timeEntries = await storage.getTimeEntriesByDateRange(startDate as string, endDate as string);
      } else {
        timeEntries = await storage.getTimeEntries();
      }
      
      // Apply additional filters
      if (clientId) {
        timeEntries = timeEntries.filter(entry => entry.clientId === parseInt(clientId as string));
      }
      
      if (consultantId) {
        timeEntries = timeEntries.filter(entry => entry.consultantId === parseInt(consultantId as string));
      }
      
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch filtered time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse(req.body);
      const timeEntry = await storage.createTimeEntry(validatedData);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create time entry" });
      }
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTimeEntrySchema.partial().parse(req.body);
      
      const timeEntry = await storage.updateTimeEntry(id, validatedData);
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update time entry" });
      }
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTimeEntry(id);
      if (!deleted) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const stats = await storage.getDashboardStats(month, year);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        consultantId: req.query.consultantId ? parseInt(req.query.consultantId as string) : undefined,
      };
      
      const reportData = await storage.getReportData(filters);
      res.json(reportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
