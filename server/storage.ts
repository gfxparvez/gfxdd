import {
  users, userRoles, databases, databaseTables, tableColumns, tableRows, apiKeys, queryLogs,
  type User, type InsertUser,
  type DatabaseRecord, type InsertDatabase,
  type DatabaseTable, type InsertDatabaseTable,
  type TableColumn, type InsertTableColumn,
  type TableRow, type InsertTableRow,
  type ApiKey, type InsertApiKey,
  type QueryLog, type InsertQueryLog,
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.resolve(process.cwd(), "maindb.json");

interface JSONDb {
  users: User[];
  userRoles: any[];
  databases: DatabaseRecord[];
  databaseTables: DatabaseTable[];
  tableColumns: TableColumn[];
  tableRows: TableRow[];
  apiKeys: ApiKey[];
  queryLogs: QueryLog[];
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getDatabases(userId: string): Promise<DatabaseRecord[]>;
  getDatabase(id: string): Promise<DatabaseRecord | undefined>;
  createDatabase(data: InsertDatabase): Promise<DatabaseRecord>;
  deleteDatabase(id: string): Promise<void>;
  getDatabaseStats(userId: string): Promise<{ databases: number; apiKeys: number; requests: number }>;

  getTables(databaseId: string): Promise<DatabaseTable[]>;
  getTable(id: string): Promise<DatabaseTable | undefined>;
  getTableByName(databaseId: string, name: string): Promise<DatabaseTable | undefined>;
  createTable(data: InsertDatabaseTable): Promise<DatabaseTable>;
  deleteTable(id: string): Promise<void>;

  getColumns(tableId: string): Promise<TableColumn[]>;
  createColumns(data: InsertTableColumn[]): Promise<TableColumn[]>;

  getRows(tableId: string, offset: number, limit: number): Promise<TableRow[]>;
  getRow(id: string): Promise<TableRow | undefined>;
  createRow(data: InsertTableRow): Promise<TableRow>;
  updateRow(id: string, data: Record<string, unknown>): Promise<TableRow | undefined>;
  deleteRow(id: string): Promise<void>;
  getFilteredRows(tableId: string, filters: Record<string, string>): Promise<TableRow[]>;

  getApiKeys(userId: string): Promise<(ApiKey & { databaseName: string | null })[]>;
  getApiKeyByValue(keyValue: string): Promise<(ApiKey & { databaseId: string }) | undefined>;
  createApiKey(data: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<void>;

  getQueryLogs(userId: string, databaseId?: string, method?: string, limit?: number): Promise<QueryLog[]>;
  createQueryLog(data: InsertQueryLog): Promise<QueryLog>;
}

export class JSONStorage implements IStorage {
  private async readDb(): Promise<JSONDb> {
    try {
      const data = await fs.readFile(DB_PATH, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return {
        users: [], userRoles: [], databases: [], databaseTables: [],
        tableColumns: [], tableRows: [], apiKeys: [], queryLogs: []
      };
    }
  }

  private async writeDb(data: JSONDb): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  }

  async getUser(id: string): Promise<User | undefined> {
    const db = await this.readDb();
    return db.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.readDb();
    return db.users.find(u => u.email === email);
  }

  async getUsers(): Promise<User[]> {
    const db = await this.readDb();
    return db.users;
  }

  async createUser(data: InsertUser): Promise<User> {
    const db = await this.readDb();
    const newUser: User = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    } as any;
    db.users.push(newUser);
    db.userRoles.push({ id: uuidv4(), userId: newUser.id, role: "user" });
    await this.writeDb(db);
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const db = await this.readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    db.users[index] = { ...db.users[index], ...data };
    await this.writeDb(db);
    return db.users[index];
  }

  async getDatabases(userId: string): Promise<DatabaseRecord[]> {
    const db = await this.readDb();
    return db.databases.filter(d => d.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDatabase(id: string): Promise<DatabaseRecord | undefined> {
    const db = await this.readDb();
    return db.databases.find(d => d.id === id);
  }

  async createDatabase(data: InsertDatabase): Promise<DatabaseRecord> {
    const db = await this.readDb();
    const newDb: DatabaseRecord = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    db.databases.push(newDb);
    await this.writeDb(db);
    return newDb;
  }

  async deleteDatabase(id: string): Promise<void> {
    const db = await this.readDb();
    db.databases = db.databases.filter(d => d.id !== id);
    db.databaseTables = db.databaseTables.filter(t => t.databaseId !== id);
    db.apiKeys = db.apiKeys.filter(k => k.databaseId !== id);
    db.queryLogs = db.queryLogs.filter(l => l.databaseId !== id);
    await this.writeDb(db);
  }

  async getDatabaseStats(userId: string): Promise<{ databases: number; apiKeys: number; requests: number }> {
    const db = await this.readDb();
    return {
      databases: db.databases.filter(d => d.userId === userId).length,
      apiKeys: db.apiKeys.filter(k => k.userId === userId).length,
      requests: db.queryLogs.filter(l => l.userId === userId).length,
    };
  }

  async getTables(databaseId: string): Promise<DatabaseTable[]> {
    const db = await this.readDb();
    return db.databaseTables.filter(t => t.databaseId === databaseId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getTable(id: string): Promise<DatabaseTable | undefined> {
    const db = await this.readDb();
    return db.databaseTables.find(t => t.id === id);
  }

  async getTableByName(databaseId: string, name: string): Promise<DatabaseTable | undefined> {
    const db = await this.readDb();
    return db.databaseTables.find(t => t.databaseId === databaseId && t.name === name);
  }

  async createTable(data: InsertDatabaseTable): Promise<DatabaseTable> {
    const db = await this.readDb();
    const newTable: DatabaseTable = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    db.databaseTables.push(newTable);
    await this.writeDb(db);
    return newTable;
  }

  async deleteTable(id: string): Promise<void> {
    const db = await this.readDb();
    db.databaseTables = db.databaseTables.filter(t => t.id !== id);
    db.tableColumns = db.tableColumns.filter(c => c.tableId !== id);
    db.tableRows = db.tableRows.filter(r => r.tableId !== id);
    await this.writeDb(db);
  }

  async getColumns(tableId: string): Promise<TableColumn[]> {
    const db = await this.readDb();
    return db.tableColumns.filter(c => c.tableId === tableId).sort((a, b) => a.position - b.position);
  }

  async createColumns(data: InsertTableColumn[]): Promise<TableColumn[]> {
    const db = await this.readDb();
    const newCols = data.map(c => ({ ...c, id: uuidv4(), createdAt: new Date() } as TableColumn));
    db.tableColumns.push(...newCols);
    await this.writeDb(db);
    return newCols;
  }

  async getRows(tableId: string, offset: number, limit: number): Promise<TableRow[]> {
    const db = await this.readDb();
    return db.tableRows.filter(r => r.tableId === tableId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(offset, offset + limit);
  }

  async getRow(id: string): Promise<TableRow | undefined> {
    const db = await this.readDb();
    return db.tableRows.find(r => r.id === id);
  }

  async createRow(data: InsertTableRow): Promise<TableRow> {
    const db = await this.readDb();
    const newRow: TableRow = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    db.tableRows.push(newRow);
    await this.writeDb(db);
    return newRow;
  }

  async updateRow(id: string, data: Record<string, unknown>): Promise<TableRow | undefined> {
    const db = await this.readDb();
    const index = db.tableRows.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    const mergedData = { ...(db.tableRows[index].data as object), ...data };
    db.tableRows[index] = { ...db.tableRows[index], data: mergedData, updatedAt: new Date() };
    await this.writeDb(db);
    return db.tableRows[index];
  }

  async deleteRow(id: string): Promise<void> {
    const db = await this.readDb();
    db.tableRows = db.tableRows.filter(r => r.id !== id);
    await this.writeDb(db);
  }

  async getFilteredRows(tableId: string, filters: Record<string, string>): Promise<TableRow[]> {
    const db = await this.readDb();
    let rows = db.tableRows.filter(r => r.tableId === tableId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (Object.keys(filters).length > 0) {
      rows = rows.filter(row => {
        const data = row.data as Record<string, unknown>;
        return Object.entries(filters).every(([key, value]) => String(data[key]) === String(value));
      });
    }
    return rows.slice(0, 100);
  }

  async getApiKeys(userId: string): Promise<(ApiKey & { databaseName: string | null })[]> {
    const db = await this.readDb();
    return db.apiKeys.filter(k => k.userId === userId).map(k => {
      const database = db.databases.find(d => d.id === k.databaseId);
      return { ...k, databaseName: database ? database.name : null };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApiKeyByValue(keyValue: string): Promise<(ApiKey & { databaseId: string }) | undefined> {
    const db = await this.readDb();
    const key = db.apiKeys.find(k => k.keyValue === keyValue);
    return key ? { ...key, databaseId: key.databaseId } : undefined;
  }

  async createApiKey(data: InsertApiKey): Promise<ApiKey> {
    const db = await this.readDb();
    const keyValue = data.keyValue || crypto.randomBytes(32).toString("hex");
    const newKey: ApiKey = {
      ...data,
      id: uuidv4(),
      keyValue,
      createdAt: new Date(),
      lastUsedAt: null,
    } as any;
    db.apiKeys.push(newKey);
    await this.writeDb(db);
    return newKey;
  }

  async updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const db = await this.readDb();
    const index = db.apiKeys.findIndex(k => k.id === id);
    if (index === -1) return undefined;
    db.apiKeys[index] = { ...db.apiKeys[index], ...data };
    await this.writeDb(db);
    return db.apiKeys[index];
  }

  async deleteApiKey(id: string): Promise<void> {
    const db = await this.readDb();
    db.apiKeys = db.apiKeys.filter(k => k.id !== id);
    await this.writeDb(db);
  }

  async getQueryLogs(userId: string, databaseId?: string, method?: string, limit = 200): Promise<QueryLog[]> {
    const db = await this.readDb();
    let logs = db.queryLogs.filter(l => l.userId === userId);
    if (databaseId) logs = logs.filter(l => l.databaseId === databaseId);
    if (method) logs = logs.filter(l => l.method === method);
    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  async createQueryLog(data: InsertQueryLog): Promise<QueryLog> {
    const db = await this.readDb();
    const newLog: QueryLog = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    } as any;
    db.queryLogs.push(newLog);
    await this.writeDb(db);
    return newLog;
  }
}

export const storage = new JSONStorage();
