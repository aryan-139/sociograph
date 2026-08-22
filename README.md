# SocioGraph 📇

> **A modern, editorial-style Personal CRM and Social Network Archive** to curate, track, and nurture relationships across your personal and professional network.

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://golang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

---

## ✨ Features

- **Editorial Rolodex Archive**: A timeless paper-texture interface with typography powered by *Cormorant Garamond* & *Lora*.
- **Dynamic Relationship Tracking**: Log contact details, roles, companies, origins (*college, meetup, company, party*), first met dates, and last interaction dates.
- **Intent Tagging**: Categorize connections strategically by intents (*friend, emulate, connector, family, connection*).
- **Search & Refinement**: Instant search by name or company, interactive intent filters, role filtering, and multiple sort modes.
- **Dual Architecture**:
  - **Frontend Client**: High-performance React 19 SPA communicating directly with Supabase via `@supabase/supabase-js`.
  - **Backend Service**: Lightweight, high-throughput Go HTTP service with Chi router and `pgx` connection pooling for batch ingestion and seed processing.

---

## 📁 Repository Structure

```text
sociograph/
├── backend/                  # Go REST API service
│   ├── cmd/
│   │   └── server/main.go    # HTTP server entrypoint
│   ├── config/               # Environment and DB configuration
│   ├── internal/
│   │   ├── db/               # PostgreSQL / pgx connection pool
│   │   ├── handlers/         # HTTP handlers for people & interactions
│   │   ├── models/           # Data models & schemas
│   │   ├── repository/       # Database query layer
│   │   └── seed/             # Seed data and bulk import utilities
│   ├── go.mod
│   └── .env.example
├── frontend/                 # React + Vite Frontend application
│   ├── index.html            # HTML entry point with web fonts
│   ├── package.json
│   ├── vite.config.js        # Vite + Tailwind CSS configuration
│   └── src/
│       ├── App.jsx           # Main Rolodex UI & state management
│       ├── index.css         # Tailwind directives & editorial aesthetics
│       └── main.jsx          # React DOM root
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, `@supabase/supabase-js`
- **Backend**: Go (1.22+), Chi (`github.com/go-chi/chi/v5`), `pgx/v5`
- **Database**: PostgreSQL hosted on [Supabase](https://supabase.com)

---

## 🚀 Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20.19+ or v22.12+) and `npm`
- [Go](https://go.dev/) (v1.22+)
- A [Supabase](https://supabase.com/) project

---

### 2. Database Setup (Supabase)

Create the required PostgreSQL tables in your Supabase SQL Editor:

```sql
-- People Table
CREATE TABLE public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    location TEXT,
    met_at TEXT,
    first_met DATE,
    last_interaction TIMESTAMPTZ,
    intent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interactions Table
CREATE TABLE public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Allow public access policy (for development)
CREATE POLICY "Allow public all access on people" ON public.people 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access on interactions" ON public.interactions 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
```

---

### 3. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional, defaults are embedded in `App.jsx`):
   Create a `.env` file in `frontend/`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

### 4. Backend Setup (Optional API Service)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Configure environment variables:
   Copy the `.env.example` file and fill in your Supabase connection string:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   SUPABASE_DB_URL=postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   PORT=8080
   LOG_LEVEL=info
   ```

3. Run the Go server:
   ```bash
   go run cmd/server/main.go
   ```
   The API server will listen on `http://localhost:8080`.

---

## 📡 Backend API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/healthz` | Health check endpoint |
| `POST` | `/people/seed-data?type=<type>` | Ingest/seed person record |
| `PUT` | `/people/seed-data?id=<uuid>` | Update seeded person data |
| `DELETE` | `/people/seed-data?id=<uuid>` | Delete seeded person record |
| `POST` | `/people/bulk-seed-data?type=<type>` | Bulk ingest records |
| `POST` | `/interactions` | Create a new interaction log |
| `PUT` | `/interactions/{id}` | Update an existing interaction log |

---

## 📄 License

MIT © 2026 [Aryan Raj](https://github.com/aryan-139)