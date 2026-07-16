-- ============================================================
-- Migration 3: Enable RLS and create policies
-- Roles: admin, wali_kelas, orang_tua
-- ============================================================

-- ================================================
-- Enable RLS on ALL tables
-- ================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- ================================================
-- Helper function: get the current user's role
-- ================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ================================================
-- Helper function: check if user is admin
-- ================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ================================================
-- Helper function: get class IDs assigned to wali kelas
-- ================================================
CREATE OR REPLACE FUNCTION public.get_teacher_class_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.classes WHERE homeroom_teacher = auth.uid();
$$;

-- ================================================
-- Helper function: get student IDs for parent
-- ================================================
CREATE OR REPLACE FUNCTION public.get_parent_student_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.students WHERE parent_user_id = auth.uid();
$$;


-- ########################################################
-- PROFILES POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (public.is_admin());

-- Users can read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile (name, avatar only)
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow trigger to insert profiles (service role)
CREATE POLICY "service_insert_profile" ON profiles
  FOR INSERT WITH CHECK (true);


-- ########################################################
-- DEPARTMENTS POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_departments" ON departments
  FOR ALL USING (public.is_admin());

-- Authenticated users can read departments
CREATE POLICY "authenticated_read_departments" ON departments
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ########################################################
-- ACADEMIC_YEARS POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_academic_years" ON academic_years
  FOR ALL USING (public.is_admin());

-- Authenticated users can read academic years
CREATE POLICY "authenticated_read_academic_years" ON academic_years
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ########################################################
-- CLASSES POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_classes" ON classes
  FOR ALL USING (public.is_admin());

-- Wali Kelas: read their own class(es)
CREATE POLICY "wali_kelas_read_own_classes" ON classes
  FOR SELECT USING (
    public.get_user_role() = 'wali_kelas' AND homeroom_teacher = auth.uid()
  );

-- Orang Tua: read class of their student
CREATE POLICY "parent_read_student_class" ON classes
  FOR SELECT USING (
    public.get_user_role() = 'orang_tua'
    AND id IN (
      SELECT class_id FROM public.students WHERE parent_user_id = auth.uid()
    )
  );


-- ########################################################
-- STUDENTS POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_students" ON students
  FOR ALL USING (public.is_admin());

-- Wali Kelas: CRUD on students in their class
CREATE POLICY "wali_kelas_read_students" ON students
  FOR SELECT USING (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

CREATE POLICY "wali_kelas_insert_students" ON students
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

CREATE POLICY "wali_kelas_update_students" ON students
  FOR UPDATE USING (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  ) WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

CREATE POLICY "wali_kelas_delete_students" ON students
  FOR DELETE USING (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

-- Orang Tua: read-only on their own student
CREATE POLICY "parent_read_own_students" ON students
  FOR SELECT USING (
    public.get_user_role() = 'orang_tua'
    AND parent_user_id = auth.uid()
  );


-- ########################################################
-- ATTENDANCES POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_attendances" ON attendances
  FOR ALL USING (public.is_admin());

-- Wali Kelas: CRUD on attendances for students in their class
CREATE POLICY "wali_kelas_read_attendances" ON attendances
  FOR SELECT USING (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

CREATE POLICY "wali_kelas_insert_attendances" ON attendances
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

CREATE POLICY "wali_kelas_update_attendances" ON attendances
  FOR UPDATE USING (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  ) WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

CREATE POLICY "wali_kelas_delete_attendances" ON attendances
  FOR DELETE USING (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

-- Orang Tua: read-only on their student's attendances
CREATE POLICY "parent_read_own_attendances" ON attendances
  FOR SELECT USING (
    public.get_user_role() = 'orang_tua'
    AND student_id IN (SELECT public.get_parent_student_ids())
  );


-- ########################################################
-- SUBJECTS POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_subjects" ON subjects
  FOR ALL USING (public.is_admin());

-- Wali Kelas: CRUD on subjects in their class
CREATE POLICY "wali_kelas_read_subjects" ON subjects
  FOR SELECT USING (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

CREATE POLICY "wali_kelas_insert_subjects" ON subjects
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

CREATE POLICY "wali_kelas_update_subjects" ON subjects
  FOR UPDATE USING (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  ) WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

CREATE POLICY "wali_kelas_delete_subjects" ON subjects
  FOR DELETE USING (
    public.get_user_role() = 'wali_kelas'
    AND class_id IN (SELECT public.get_teacher_class_ids())
  );

-- Orang Tua: read-only on subjects in their student's class
CREATE POLICY "parent_read_subjects" ON subjects
  FOR SELECT USING (
    public.get_user_role() = 'orang_tua'
    AND class_id IN (
      SELECT class_id FROM public.students WHERE parent_user_id = auth.uid()
    )
  );


-- ########################################################
-- GRADES POLICIES
-- ########################################################

-- Admin: full access
CREATE POLICY "admin_all_grades" ON grades
  FOR ALL USING (public.is_admin());

-- Wali Kelas: CRUD on grades for students in their class
CREATE POLICY "wali_kelas_read_grades" ON grades
  FOR SELECT USING (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

CREATE POLICY "wali_kelas_insert_grades" ON grades
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

CREATE POLICY "wali_kelas_update_grades" ON grades
  FOR UPDATE USING (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  ) WITH CHECK (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

CREATE POLICY "wali_kelas_delete_grades" ON grades
  FOR DELETE USING (
    public.get_user_role() = 'wali_kelas'
    AND student_id IN (
      SELECT s.id FROM public.students s WHERE s.class_id IN (SELECT public.get_teacher_class_ids())
    )
  );

-- Orang Tua: read-only on their student's grades
CREATE POLICY "parent_read_own_grades" ON grades
  FOR SELECT USING (
    public.get_user_role() = 'orang_tua'
    AND student_id IN (SELECT public.get_parent_student_ids())
  );
