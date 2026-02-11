import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum("app_role", ["admin", "moderator", "user"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: appRoleEnum("role").notNull(),
});

export const databases = pgTable("databases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const databaseTables = pgTable("database_tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  databaseId: uuid("database_id").references(() => databases.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tableColumns = pgTable("table_columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").references(() => databaseTables.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  dataType: text("data_type").notNull().default("text"),
  isNullable: boolean("is_nullable").notNull().default(true),
  defaultValue: text("default_value"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tableRows = pgTable("table_rows", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").references(() => databaseTables.id, { onDelete: "cascade" }).notNull(),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  databaseId: uuid("database_id").references(() => databases.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  keyValue: text("key_value").notNull(),
  name: text("name").notNull().default("Default"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const queryLogs = pgTable("query_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  databaseId: uuid("database_id").references(() => databases.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  method: text("method").notNull(),
  endpoint: text("endpoint").notNull(),
  statusCode: integer("status_code").notNull().default(200),
  requestBody: jsonb("request_body"),
  responseTimeMs: integer("response_time_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  databases: many(databases),
  apiKeys: many(apiKeys),
  queryLogs: many(queryLogs),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
}));

export const databasesRelations = relations(databases, ({ one, many }) => ({
  user: one(users, { fields: [databases.userId], references: [users.id] }),
  tables: many(databaseTables),
  apiKeys: many(apiKeys),
  queryLogs: many(queryLogs),
}));

export const databaseTablesRelations = relations(databaseTables, ({ one, many }) => ({
  database: one(databases, { fields: [databaseTables.databaseId], references: [databases.id] }),
  columns: many(tableColumns),
  rows: many(tableRows),
}));

export const tableColumnsRelations = relations(tableColumns, ({ one }) => ({
  table: one(databaseTables, { fields: [tableColumns.tableId], references: [databaseTables.id] }),
}));

export const tableRowsRelations = relations(tableRows, ({ one }) => ({
  table: one(databaseTables, { fields: [tableRows.tableId], references: [databaseTables.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  database: one(databases, { fields: [apiKeys.databaseId], references: [databases.id] }),
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

export const queryLogsRelations = relations(queryLogs, ({ one }) => ({
  database: one(databases, { fields: [queryLogs.databaseId], references: [databases.id] }),
  user: one(users, { fields: [queryLogs.userId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDatabaseSchema = createInsertSchema(databases).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDatabaseTableSchema = createInsertSchema(databaseTables).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTableColumnSchema = createInsertSchema(tableColumns).omit({ id: true, createdAt: true });
export const insertTableRowSchema = createInsertSchema(tableRows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true });
export const insertQueryLogSchema = createInsertSchema(queryLogs).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DatabaseRecord = typeof databases.$inferSelect;
export type InsertDatabase = z.infer<typeof insertDatabaseSchema>;
export type DatabaseTable = typeof databaseTables.$inferSelect;
export type InsertDatabaseTable = z.infer<typeof insertDatabaseTableSchema>;
export type TableColumn = typeof tableColumns.$inferSelect;
export type InsertTableColumn = z.infer<typeof insertTableColumnSchema>;
export type TableRow = typeof tableRows.$inferSelect;
export type InsertTableRow = z.infer<typeof insertTableRowSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type QueryLog = typeof queryLogs.$inferSelect;
export type InsertQueryLog = z.infer<typeof insertQueryLogSchema>;
