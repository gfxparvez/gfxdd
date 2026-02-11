# CloudDB - Database as a Service

## Overview
A fullstack database management application where users can create databases, tables, and manage data through API keys. Features include user authentication with session-based auth, role-based access control, query logging, and a public API endpoint for external data access.

## Architecture
- **Frontend**: React + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Express.js with session-based authentication
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Routing**: react-router-dom (frontend), Express routes (backend)

## Project Structure
```
client/             # Frontend (Vite root)
  index.html
  src/
    App.tsx          # Main app with routing
    main.tsx         # Entry point
    hooks/           # useAuth, use-toast, etc.
    pages/           # Auth, Dashboard, Databases, DatabaseDetail, ApiKeys, DataExplorer, QueryLogs, SettingsPage
    components/      # DashboardLayout, UI components (shadcn)
    lib/             # queryClient, utils
server/             # Backend
  index.ts           # Express server entry
  routes.ts          # All API routes (auth, CRUD, db-api)
  storage.ts         # IStorage interface + DatabaseStorage implementation
  db.ts              # Drizzle + pg pool connection
  vite.ts            # Vite dev server middleware
shared/
  schema.ts          # Drizzle schema (users, databases, tables, columns, rows, apiKeys, queryLogs)
```

## Key Design Decisions
- Session-based auth using express-session + connect-pg-simple (bcrypt password hashing)
- JSONB storage for table row data (flexible schema per user-created table)
- API key system for external access via POST /api/db-api endpoint
- Query logging tracks all external API usage with response times

## Recent Changes
- 2026-02-09: Migrated from Supabase to Replit/Neon PostgreSQL with Drizzle ORM
- Converted all frontend Supabase client calls to fetch API with server-side routes
- Replaced Supabase Auth with session-based authentication

## Running
- `npm run dev` starts the Express server (port 5000) with Vite middleware
- `npm run db:push` pushes schema changes to database
