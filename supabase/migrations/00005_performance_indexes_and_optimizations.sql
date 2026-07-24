-- ============================================================
-- Migration 5: Performance Indexes and Database Optimizations
-- Project: Walas (School Management System)
-- Description: Adds B-tree indexes for foreign keys, search columns,
--              and composite indexes for attendances & grades.
-- ============================================================

-- 1. Indexes for classes table
CREATE INDEX IF NOT EXISTS idx_classes_homeroom_teacher ON public.classes(homeroom_teacher);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year_id ON public.classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_classes_department_id ON public.classes(department_id);

-- 2. Indexes for students table
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_user_id ON public.students(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON public.students(full_name);

-- 3. Indexes for attendances table
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON public.attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON public.attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_student_date ON public.attendances(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendances_date_status ON public.attendances(date, status);

-- 4. Indexes for subjects table
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);

-- 5. Indexes for grades table
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_academic_year_id ON public.grades(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON public.grades(student_id, subject_id);

-- 6. Indexes for profiles & academic_years tables
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_academic_years_is_active ON public.academic_years(is_active) WHERE is_active = true;
