-- ============================================================
-- Migration 1: Create initial database schema
-- Project: Walas (School Management System)
-- Tables: profiles, departments, academic_years, classes,
--         students, attendances, subjects, grades
-- ============================================================

-- ------------------------------------------------
-- Custom ENUM types
-- ------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'wali_kelas', 'orang_tua');
CREATE TYPE gender_type AS ENUM ('laki-laki', 'perempuan');
CREATE TYPE attendance_status AS ENUM ('hadir', 'sakit', 'izin', 'alpha');

-- ------------------------------------------------
-- 1. profiles
-- ------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'orang_tua',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth. One row per authenticated user.';

-- ------------------------------------------------
-- 2. departments (Jurusan)
-- ------------------------------------------------
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE departments IS 'School departments / jurusan (e.g. IPA, IPS, Bahasa).';

-- ------------------------------------------------
-- 3. academic_years (Tahun Ajaran)
-- ------------------------------------------------
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

COMMENT ON TABLE academic_years IS 'Academic year periods. Only one should be active at a time.';

-- ------------------------------------------------
-- 4. classes (Kelas)
-- ------------------------------------------------
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level INT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  homeroom_teacher UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, academic_year_id)
);

COMMENT ON TABLE classes IS 'Class groups per academic year. Each class has one homeroom teacher (wali kelas).';

-- ------------------------------------------------
-- 5. students (Siswa)
-- ------------------------------------------------
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nisn TEXT UNIQUE,
  nis TEXT UNIQUE,
  birth_place TEXT,
  birth_date DATE,
  gender gender_type,
  religion TEXT,
  address TEXT,
  phone TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  parent_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE students IS 'Student records. Linked to a class and optionally to a parent user.';

-- ------------------------------------------------
-- 6. attendances (Kehadiran)
-- ------------------------------------------------
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'hadir',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

COMMENT ON TABLE attendances IS 'Daily attendance records per student.';

-- ------------------------------------------------
-- 7. subjects (Mata Pelajaran)
-- ------------------------------------------------
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, class_id)
);

COMMENT ON TABLE subjects IS 'Subjects taught per class.';

-- ------------------------------------------------
-- 8. grades (Nilai)
-- ------------------------------------------------
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester INT NOT NULL CHECK (semester IN (1, 2)),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, semester, academic_year_id)
);

COMMENT ON TABLE grades IS 'Student grades per subject, semester, and academic year.';
