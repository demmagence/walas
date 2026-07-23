# Walas - School Management System

Walas is a web-based school management application designed to facilitate homeroom teachers (wali kelas) in managing student databases, daily attendance logging, academic grade recording, and report exports. It also provides parents (orang tua) with access to view their children's daily logs and academic performance, and system administrators (admin) with tools to manage users, classes, academic years, and departments.

## Technology Stack

- **Frontend Framework**: Next.js 16.2 (App Router)
- **Programming Language**: JavaScript (ES6+)
- **UI Library & Components**: React 19, shadcn/ui, Radix UI
- **Styling**: Tailwind CSS v4 (configured via oklch CSS color tokens in globals.css)
- **Database & Authentication**: Supabase (PostgreSQL with Row Level Security)
- **Export Formats**: Excel (xlsx), PDF (jspdf, jspdf-autotable)

## Project Directory Structure

```
├── public/                 # Static assets (images, logos, icons)
│   └── images/
│       └── walas.png       # Custom application logo
├── src/
│   ├── app/                # Next.js App Router folders
│   │   ├── (auth)/         # Authentication route group (Login screen)
│   │   ├── (dashboard)/    # Main application route group (Homeroom & Parent portal)
│   │   │   └── dashboard/
│   │   │       ├── absensi/  # Daily attendance logging and monthly recap reports
│   │   │       ├── nilai/    # Subject-based grade logging and semester reports
│   │   │       ├── profil/   # Account profile settings
│   │   │       └── siswa/    # Student profile management and bulk imports
│   │   ├── admin/          # Admin control panel (Kelas, Jurusan, Pengguna, Tahun Ajaran)
│   │   ├── layout.js       # Root application HTML layout
│   │   └── page.js         # Entrypoint route checking authentication session
│   ├── components/         # Shared React components (Sidebar, form elements, tables)
│   └── lib/                # Shared utilities and configurations
│       ├── actions/        # Supabase Server Actions for database transactions
│       ├── supabase/       # Supabase client, server, and middleware configurations
│       ├── auth.js         # Authentication helpers
│       ├── excel.js        # Excel parsing and generation helpers
│       └── export-pdf.js   # PDF generation and formatting helpers
└── supabase/
    └── migrations/         # PostgreSQL schema definition and security policies
```

## Database Schema

The database consists of 8 core tables with specific relational integrity constraints and foreign keys:

1. **profiles**: Extends the `auth.users` schema. Stores full names, user roles (`admin`, `wali_kelas`, `orang_tua`), avatar URLs, and creation timestamps.
2. **departments**: Configures school programs / majors (e.g., IPA, IPS, RPL).
3. **academic_years**: Defines academic periods with dates and active status checks.
4. **classes**: Represents class groups (e.g., XII RPL 1) mapped to departments, academic years, and assigned homeroom teachers.
5. **students**: Stores student bio-data, NISN, NIS, class assignments, and links them to parent profiles.
6. **attendances**: Tracks daily attendance status (`hadir`, `sakit`, `izin`, `alpha`) per student with a unique composite key on `(student_id, date)`.
7. **subjects**: Mapped to specific classes, representing courses taught.
8. **grades**: Logs academic scores per student, subject, semester, and academic year, utilizing a unique composite key.

Row Level Security (RLS) is enabled globally with granular select/insert/update/delete policies matching user roles decoded from active JWT metadata.

## User Roles & Capabilities

### 1. Administrator (Admin)
- Configure academic years, active sessions, and school departments.
- Create and assign classes to homeroom teachers.
- Create and manage system users (Wali Kelas and Orang Tua) and coordinate account assignments.

### 2. Homeroom Teacher (Wali Kelas)
- Manage student rosters under their class (Add, Edit, View details).
- Perform bulk imports of student lists from Excel templates.
- Log daily student attendance status.
- Record and update student academic grades for assigned subjects.
- Export attendance recaps and grade summaries to Excel and PDF formats.

### 3. Parent (Orang Tua)
- Access the dashboard to view child data.
- Inspect real-time attendance logs and monthly summaries.
- Monitor child grade reports per subject and academic semester.

## Local Development Setup

### Prerequisites

- Node.js (version 20 or higher is recommended)
- Supabase account/CLI for database setup
- NPM or equivalent package manager

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/demmagence/walas.git
   cd walas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory based on `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Database Setup:
   Apply SQL files from `supabase/migrations/` sequentially inside your Supabase SQL editor:
   - `00001_create_initial_schema.sql`
   - `00002_create_profile_trigger.sql`
   - `00003_enable_rls_policies.sql`
   - `00004_admin_helpers.sql`

5. Running the Development Server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to access the application.

## Build and Production

To compile the application for production deployment:

```bash
npm run build
```

This compiles optimized client assets and server pages using Turbopack. To start the production server locally:

```bash
npm run start
```
