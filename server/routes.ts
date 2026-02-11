import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export function registerRoutes(app: Express): Server {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );

  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  }

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "An account with this email already exists." });
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashed, displayName: displayName || email });
      (req.session as any).userId = user.id;
      
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid email or password." });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid email or password." });
      (req.session as any).userId = user.id;
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    res.json({ user: { id: user.id, email: user.email, displayName: user.displayName } });
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { displayName } = req.body;
      const user = await storage.updateUser(userId, { displayName });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { password } = req.body;
      if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      const hashed = await bcrypt.hash(password, 10);
      await storage.updateUser(userId, { password: hashed });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const stats = await storage.getDatabaseStats(userId);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/databases", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const dbs = await storage.getDatabases(userId);
      res.json(dbs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/databases/:id", requireAuth, async (req, res) => {
    try {
      const db = await storage.getDatabase(req.params.id);
      if (!db || db.userId !== (req.session as any).userId) return res.status(404).json({ error: "Database not found" });
      res.json(db);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/databases", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { name, description } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Name required" });
      const record = await storage.createDatabase({ name: name.trim(), description: description || "", userId, status: "active" });
      await storage.createApiKey({ databaseId: record.id, userId, name: "Default", keyValue: crypto.randomBytes(32).toString("hex"), isActive: true });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/databases/:id", requireAuth, async (req, res) => {
    try {
      const db = await storage.getDatabase(req.params.id);
      if (!db || db.userId !== (req.session as any).userId) return res.status(404).json({ error: "Not found" });
      await storage.deleteDatabase(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/databases/:id/tables", requireAuth, async (req, res) => {
    try {
      const db = await storage.getDatabase(req.params.id);
      if (!db || db.userId !== (req.session as any).userId) return res.status(404).json({ error: "Not found" });
      const tables = await storage.getTables(req.params.id);
      res.json(tables);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/databases/:id/tables", requireAuth, async (req, res) => {
    try {
      const db = await storage.getDatabase(req.params.id);
      if (!db || db.userId !== (req.session as any).userId) return res.status(404).json({ error: "Not found" });
      const { name, columns } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Name required" });
      const table = await storage.createTable({ databaseId: req.params.id, name: name.trim() });
      if (columns && Array.isArray(columns)) {
        const validCols = columns.filter((c: any) => c.name?.trim()).map((c: any, i: number) => ({
          tableId: table.id, name: c.name.trim(), dataType: c.data_type || "text",
          isNullable: c.is_nullable !== false, defaultValue: c.default_value || null, position: i,
        }));
        if (validCols.length > 0) await storage.createColumns(validCols);
      }
      res.status(201).json(table);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tables/:id", requireAuth, async (req, res) => {
    try {
      const table = await storage.getTable(req.params.id);
      if (!table) return res.status(404).json({ error: "Table not found" });
      res.json(table);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tables/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteTable(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tables/:id/columns", requireAuth, async (req, res) => {
    try {
      const cols = await storage.getColumns(req.params.id);
      res.json(cols);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tables/:id/rows", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      const rows = await storage.getRows(req.params.id, page * limit, limit);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tables/:id/rows", requireAuth, async (req, res) => {
    try {
      const { data } = req.body;
      const row = await storage.createRow({ tableId: req.params.id, data: data || {} });
      res.status(201).json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/rows/:id", requireAuth, async (req, res) => {
    try {
      const { data } = req.body;
      const row = await storage.updateRow(req.params.id, data || {});
      if (!row) return res.status(404).json({ error: "Row not found" });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/rows/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteRow(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const keys = await storage.getApiKeys(userId);
      res.json(keys);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/api-keys/:id/regenerate", requireAuth, async (req, res) => {
    try {
      const newKey = crypto.randomBytes(32).toString("hex");
      const key = await storage.updateApiKey(req.params.id, { keyValue: newKey });
      if (!key) return res.status(404).json({ error: "Not found" });
      res.json(key);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteApiKey(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/query-logs", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const databaseId = req.query.database_id as string | undefined;
      const method = req.query.method as string | undefined;
      const logs = await storage.getQueryLogs(
        userId,
        databaseId !== "all" ? databaseId : undefined,
        method !== "all" ? method : undefined
      );
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/db-api", async (req, res) => {
    const startTime = Date.now();
    try {
      const { api_key, action, table, data, filters, row_id } = req.body;
      if (!api_key || !action || !table) {
        return res.status(400).json({ error: "Missing required fields: api_key, action, table" });
      }

      const keyData = await storage.getApiKeyByValue(api_key);
      if (!keyData || !keyData.isActive) {
        return res.status(401).json({ error: "Invalid or inactive API key" });
      }

      const tableData = await storage.getTableByName(keyData.databaseId, table);
      if (!tableData) {
        return res.status(404).json({ error: `Table "${table}" not found` });
      }

      let result: any = null;
      let statusCode = 200;

      switch (action) {
        case "select": {
          const rows = filters
            ? await storage.getFilteredRows(tableData.id, filters)
            : await storage.getRows(tableData.id, 0, 100);
          result = rows.map((r) => ({ id: r.id, ...(r.data as object), _created_at: r.createdAt, _updated_at: r.updatedAt }));
          break;
        }
        case "insert": {
          if (!data || typeof data !== "object") {
            return res.status(400).json({ error: "Missing 'data' object for insert" });
          }
          const inserted = await storage.createRow({ tableId: tableData.id, data });
          result = { id: inserted.id, ...(inserted.data as object) };
          statusCode = 201;
          break;
        }
        case "update": {
          if (!row_id || !data) {
            return res.status(400).json({ error: "Missing 'row_id' and 'data' for update" });
          }
          const updated = await storage.updateRow(row_id, data);
          if (!updated) return res.status(404).json({ error: "Row not found" });
          result = { id: updated.id, ...(updated.data as object) };
          break;
        }
        case "delete": {
          if (!row_id) {
            return res.status(400).json({ error: "Missing 'row_id' for delete" });
          }
          await storage.deleteRow(row_id);
          result = { deleted: true };
          break;
        }
        default:
          return res.status(400).json({ error: `Unknown action "${action}". Use: select, insert, update, delete` });
      }

      const responseTime = Date.now() - startTime;

      await storage.createQueryLog({
        databaseId: keyData.databaseId,
        userId: keyData.userId,
        method: action,
        endpoint: `/${table}`,
        statusCode,
        requestBody: { action, table, filters: filters || null },
        responseTimeMs: responseTime,
      });

      await storage.updateApiKey(keyData.id, { lastUsedAt: new Date() });

      res.status(statusCode).json({ success: true, data: result });
    } catch (e: any) {
      console.error("db-api error:", e);
      res.status(500).json({ error: e.message || "Internal server error" });
    }
  });

  app.get("/api/admin/export", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const dbs = await storage.getDatabases(userId);
      const fullData = [];

      for (const dbRecord of dbs) {
        const tables = await storage.getTables(dbRecord.id);
        const dbData: any = { ...dbRecord, tables: [] };
        
        for (const table of tables) {
          const columns = await storage.getColumns(table.id);
          const rows = await storage.getRows(table.id, 0, 1000);
          dbData.tables.push({ ...table, columns, rows });
        }
        fullData.push(dbData);
      }
      
      res.json(fullData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/import", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const fullData = req.body;
      
      if (!Array.isArray(fullData)) return res.status(400).json({ error: "Invalid data format" });

      for (const dbData of fullData) {
        const dbRecord = await storage.createDatabase({
          name: dbData.name,
          description: dbData.description,
          userId,
          status: dbData.status || "active"
        });

        if (dbData.tables && Array.isArray(dbData.tables)) {
          for (const tableData of dbData.tables) {
            const table = await storage.createTable({
              databaseId: dbRecord.id,
              name: tableData.name
            });

            if (tableData.columns && Array.isArray(tableData.columns)) {
              const cols = tableData.columns.map((c: any, i: number) => ({
                tableId: table.id,
                name: c.name,
                dataType: c.dataType || "text",
                isNullable: c.isNullable !== false,
                defaultValue: c.defaultValue || null,
                position: i
              }));
              await storage.createColumns(cols);
            }

            if (tableData.rows && Array.isArray(tableData.rows)) {
              for (const rowData of tableData.rows) {
                await storage.createRow({
                  tableId: table.id,
                  data: rowData.data || rowData
                });
              }
            }
          }
        }
      }
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
