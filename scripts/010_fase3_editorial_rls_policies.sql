-- =========================
-- Fase 3: RLS Policies — Staff Dashboard
-- Cubre: staff_profiles, editorial_staff_assignments (refinement),
--        editorial_projects, editorial_stages, editorial_files,
--        editorial_comments, author_profiles, editorial_project_members
--
-- Principio de menor privilegio:
--   · author   → solo ve sus propios proyectos y contenido visibility = 'author' o 'public'
--   · staff    → ve lo asignado + contenido visibility = 'staff'
--   · manager  → ve todo dentro de su org (coordinator + superadmin/admin)
--   · service_role → siempre bypasea RLS (comportamiento por defecto de Supabase)
--
-- TODO: Las policies de editorial_projects, editorial_stages, editorial_files,
--       editorial_comments, author_profiles y editorial_project_members asumen
--       el esquema de Phase 1/2. Verificar nombres de columna antes de aplicar.
-- =========================

-- =========================
-- HELPER FUNCTIONS
-- Evitan subconsultas repetitivas en cada policy.
-- =========================

-- Devuelve el staff_profile.id del usuario actual, o NULL si no existe.
CREATE OR REPLACE FUNCTION public.get_my_staff_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM staff_profiles WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Devuelve true si el usuario actual es un staff activo.
CREATE OR REPLACE FUNCTION public.is_editorial_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Devuelve true si el usuario es manager editorial (coordinator) o admin de org.
-- RIESGO: usa SECURITY DEFINER — revisión humana recomendada.
-- TODO: confirmar que las columnas de profiles no hayan cambiado.
CREATE OR REPLACE FUNCTION public.is_editorial_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.is_active = true
      AND sp.role = 'coordinator'
  )
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('superadmin', 'admin')
  );
$$;

-- Devuelve true si el usuario actual es autor (tiene author_profiles activo).
-- TODO: confirmar nombre de tabla y columnas contra schema Phase 1/2.
CREATE OR REPLACE FUNCTION public.is_editorial_author()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM author_profiles
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Devuelve true si el usuario es author y está asignado al proyecto dado.
-- TODO: confirmar nombre de tabla y columnas contra schema Phase 1/2.
CREATE OR REPLACE FUNCTION public.author_has_project_access(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM editorial_project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$;

-- Devuelve true si el staff actual está asignado al proyecto dado.
CREATE OR REPLACE FUNCTION public.staff_has_project_access(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM editorial_staff_assignments esa
    JOIN staff_profiles sp ON sp.id = esa.staff_profile_id
    WHERE esa.project_id = p_project_id
      AND sp.user_id = auth.uid()
      AND sp.is_active = true
  );
$$;

-- =========================
-- 1) staff_profiles
-- Ya habilitado en migración 009. Se reemplazan policies para mayor claridad.
-- =========================

-- Lectura: staff activo de la misma org puede leerse entre sí.
-- Manager puede leer todos. Editor solo puede leer su propio perfil.
DROP POLICY IF EXISTS "staff read staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff read staff_profiles in org"
ON staff_profiles FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND public.is_editorial_staff()
);

-- RIESGO: Un editor puede ver los perfiles de todo su equipo.
-- Si se desea más restricción, limitar a: id = public.get_my_staff_profile_id()
-- TODO: confirmar si la visibilidad cruzada de perfiles es aceptable.

DROP POLICY IF EXISTS "staff insert staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff insert staff_profiles in org"
ON staff_profiles FOR INSERT
WITH CHECK (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "staff update staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff update staff_profiles in org"
ON staff_profiles FOR UPDATE
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "staff delete staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff delete staff_profiles in org"
ON staff_profiles FOR DELETE
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

-- =========================
-- 2) editorial_staff_assignments
-- Ya habilitado en migración 009. Se reemplazan policies.
-- =========================

-- Lectura: manager ve todo; staff no-manager solo ve sus propias asignaciones.
DROP POLICY IF EXISTS "staff read assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff read assignments in org"
ON editorial_staff_assignments FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND (
    public.is_editorial_manager()
    OR staff_profile_id = public.get_my_staff_profile_id()
  )
);

DROP POLICY IF EXISTS "staff insert assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff insert assignments in org"
ON editorial_staff_assignments FOR INSERT
WITH CHECK (
  org_id = public.get_my_org_id()
  AND public.is_editorial_manager()
);

DROP POLICY IF EXISTS "staff update assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff update assignments in org"
ON editorial_staff_assignments FOR UPDATE
USING (
  org_id = public.get_my_org_id()
  AND public.is_editorial_manager()
);

DROP POLICY IF EXISTS "staff delete assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff delete assignments in org"
ON editorial_staff_assignments FOR DELETE
USING (
  org_id = public.get_my_org_id()
  AND public.is_editorial_manager()
);

-- =========================
-- 3) editorial_projects — Lectura por staff
-- TODO: verificar que la tabla tiene columna org_id.
--       Ajustar si Phase 1/2 usa brand_id en lugar de org_id.
-- =========================
ALTER TABLE editorial_projects ENABLE ROW LEVEL SECURITY;

-- Manager ve todos los proyectos de la org.
DROP POLICY IF EXISTS "manager read editorial_projects" ON editorial_projects;
CREATE POLICY "manager read editorial_projects"
ON editorial_projects FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND public.is_editorial_manager()
);

-- Staff (no manager) solo ve proyectos en los que está asignado.
DROP POLICY IF EXISTS "staff read assigned editorial_projects" ON editorial_projects;
CREATE POLICY "staff read assigned editorial_projects"
ON editorial_projects FOR SELECT
USING (
  public.is_editorial_staff()
  AND public.staff_has_project_access(id)
);

-- Author solo ve proyectos en los que es miembro.
DROP POLICY IF EXISTS "author read own editorial_projects" ON editorial_projects;
CREATE POLICY "author read own editorial_projects"
ON editorial_projects FOR SELECT
USING (
  public.is_editorial_author()
  AND public.author_has_project_access(id)
);

-- =========================
-- 4) editorial_stages — Lectura y escritura por staff autorizado
-- TODO: verificar columna project_id y nombre de tabla.
-- =========================
ALTER TABLE editorial_stages ENABLE ROW LEVEL SECURITY;

-- Manager puede leer todas las etapas de proyectos de su org.
DROP POLICY IF EXISTS "manager read editorial_stages" ON editorial_stages;
CREATE POLICY "manager read editorial_stages"
ON editorial_stages FOR SELECT
USING (
  public.is_editorial_manager()
  AND EXISTS (
    SELECT 1 FROM editorial_projects ep
    WHERE ep.id = editorial_stages.project_id
      AND ep.org_id = public.get_my_org_id()
  )
);

-- Staff asignado puede leer las etapas de sus proyectos.
DROP POLICY IF EXISTS "staff read assigned editorial_stages" ON editorial_stages;
CREATE POLICY "staff read assigned editorial_stages"
ON editorial_stages FOR SELECT
USING (
  public.is_editorial_staff()
  AND public.staff_has_project_access(project_id)
);

-- Author puede leer las etapas de sus proyectos.
DROP POLICY IF EXISTS "author read own editorial_stages" ON editorial_stages;
CREATE POLICY "author read own editorial_stages"
ON editorial_stages FOR SELECT
USING (
  public.is_editorial_author()
  AND public.author_has_project_access(project_id)
);

-- Solo staff asignado (o manager) puede actualizar etapas — marcar in_progress, etc.
-- RIESGO: cualquier staff asignado puede modificar la etapa, no solo el asignado a ella.
-- TODO: si se necesita restricción por assigned_to, añadir: AND assigned_to = auth.uid()
DROP POLICY IF EXISTS "staff update editorial_stages" ON editorial_stages;
CREATE POLICY "staff update editorial_stages"
ON editorial_stages FOR UPDATE
USING (
  public.is_editorial_staff()
  AND public.staff_has_project_access(project_id)
);

-- Solo managers pueden aprobar (el campo approved_by se escribe en UPDATE).
-- La validación de negocio (solo etapas in_progress) se aplica en la server action.
DROP POLICY IF EXISTS "manager approve editorial_stages" ON editorial_stages;
CREATE POLICY "manager approve editorial_stages"
ON editorial_stages FOR UPDATE
USING (
  public.is_editorial_manager()
  AND EXISTS (
    SELECT 1 FROM editorial_projects ep
    WHERE ep.id = editorial_stages.project_id
      AND ep.org_id = public.get_my_org_id()
  )
);

-- =========================
-- 5) editorial_files — Lectura / escritura según visibilidad
-- TODO: verificar columna project_id, visibility y uploaded_by.
-- =========================
ALTER TABLE editorial_files ENABLE ROW LEVEL SECURITY;

-- Manager ve todos los archivos de sus proyectos (cualquier visibilidad).
DROP POLICY IF EXISTS "manager read editorial_files" ON editorial_files;
CREATE POLICY "manager read editorial_files"
ON editorial_files FOR SELECT
USING (
  public.is_editorial_manager()
  AND EXISTS (
    SELECT 1 FROM editorial_projects ep
    WHERE ep.id = editorial_files.project_id
      AND ep.org_id = public.get_my_org_id()
  )
);

-- Staff asignado ve archivos con visibility 'staff', 'author' o 'public'.
DROP POLICY IF EXISTS "staff read editorial_files" ON editorial_files;
CREATE POLICY "staff read editorial_files"
ON editorial_files FOR SELECT
USING (
  public.is_editorial_staff()
  AND public.staff_has_project_access(project_id)
  AND visibility IN ('staff', 'author', 'public')
);

-- Author ve archivos con visibility 'author' o 'public' en sus proyectos.
-- RIESGO: un author puede leer archivos marcados como 'author' aunque sean internos.
-- TODO: revisar si 'author' debe ser más restrictivo (p.ej. solo archivos que subió el staff con intención de compartir).
DROP POLICY IF EXISTS "author read editorial_files" ON editorial_files;
CREATE POLICY "author read editorial_files"
ON editorial_files FOR SELECT
USING (
  public.is_editorial_author()
  AND public.author_has_project_access(project_id)
  AND visibility IN ('author', 'public')
);

-- Staff asignado puede subir (insertar) archivos en sus proyectos.
DROP POLICY IF EXISTS "staff insert editorial_files" ON editorial_files;
CREATE POLICY "staff insert editorial_files"
ON editorial_files FOR INSERT
WITH CHECK (
  public.is_editorial_staff()
  AND public.staff_has_project_access(project_id)
);

-- Solo el uploader original o un manager puede actualizar metadatos del archivo.
DROP POLICY IF EXISTS "staff update own editorial_files" ON editorial_files;
CREATE POLICY "staff update own editorial_files"
ON editorial_files FOR UPDATE
USING (
  public.is_editorial_staff()
  AND (
    uploaded_by = auth.uid()
    OR public.is_editorial_manager()
  )
);

-- Solo managers pueden eliminar archivos.
DROP POLICY IF EXISTS "manager delete editorial_files" ON editorial_files;
CREATE POLICY "manager delete editorial_files"
ON editorial_files FOR DELETE
USING (public.is_editorial_manager());

-- =========================
-- 6) editorial_comments — Lectura / escritura según visibilidad
-- TODO: verificar columnas project_id, author_id, visibility.
-- =========================
ALTER TABLE editorial_comments ENABLE ROW LEVEL SECURITY;

-- Manager ve todos los comentarios (cualquier visibilidad).
DROP POLICY IF EXISTS "manager read editorial_comments" ON editorial_comments;
CREATE POLICY "manager read editorial_comments"
ON editorial_comments FOR SELECT
USING (
  public.is_editorial_manager()
  AND EXISTS (
    SELECT 1 FROM editorial_projects ep
    WHERE ep.id = editorial_comments.project_id
      AND ep.org_id = public.get_my_org_id()
  )
);

-- Staff asignado ve comentarios con visibility 'staff' o 'author' en sus proyectos.
DROP POLICY IF EXISTS "staff read editorial_comments" ON editorial_comments;
CREATE POLICY "staff read editorial_comments"
ON editorial_comments FOR SELECT
USING (
  public.is_editorial_staff()
  AND public.staff_has_project_access(project_id)
  AND visibility IN ('staff', 'author')
);

-- Author ve solo los comentarios con visibility 'author' en sus proyectos.
DROP POLICY IF EXISTS "author read editorial_comments" ON editorial_comments;
CREATE POLICY "author read editorial_comments"
ON editorial_comments FOR SELECT
USING (
  public.is_editorial_author()
  AND public.author_has_project_access(project_id)
  AND visibility = 'author'
);

-- Staff asignado puede crear comentarios en sus proyectos.
DROP POLICY IF EXISTS "staff insert editorial_comments" ON editorial_comments;
CREATE POLICY "staff insert editorial_comments"
ON editorial_comments FOR INSERT
WITH CHECK (
  public.is_editorial_staff()
  AND public.staff_has_project_access(project_id)
);

-- Solo el autor del comentario o un manager puede actualizar.
-- RIESGO: un manager puede editar comentarios de otros. Esto es intencional
--         para moderación, pero debe ser revisado si no aplica al negocio.
DROP POLICY IF EXISTS "staff update own editorial_comments" ON editorial_comments;
CREATE POLICY "staff update own editorial_comments"
ON editorial_comments FOR UPDATE
USING (
  public.is_editorial_staff()
  AND (
    author_id = auth.uid()
    OR public.is_editorial_manager()
  )
);

-- Solo managers pueden eliminar comentarios.
DROP POLICY IF EXISTS "manager delete editorial_comments" ON editorial_comments;
CREATE POLICY "manager delete editorial_comments"
ON editorial_comments FOR DELETE
USING (public.is_editorial_manager());

-- =========================
-- 7) author_profiles — Solo lectura por staff/manager
-- Los autores solo pueden ver su propio perfil.
-- TODO: verificar esquema de tabla contra Phase 1/2.
-- =========================
ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;

-- Manager ve todos los perfiles de autores de su org.
DROP POLICY IF EXISTS "manager read author_profiles" ON author_profiles;
CREATE POLICY "manager read author_profiles"
ON author_profiles FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND public.is_editorial_manager()
);

-- Staff puede ver perfiles de autores de su org (para asignarlos).
DROP POLICY IF EXISTS "staff read author_profiles" ON author_profiles;
CREATE POLICY "staff read author_profiles"
ON author_profiles FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND public.is_editorial_staff()
);

-- Author puede ver solo su propio perfil.
DROP POLICY IF EXISTS "author read own profile" ON author_profiles;
CREATE POLICY "author read own profile"
ON author_profiles FOR SELECT
USING (user_id = auth.uid());

-- =========================
-- 8) editorial_project_members — Gestión de autores en proyectos
-- TODO: verificar esquema de tabla contra Phase 1/2.
-- =========================
ALTER TABLE editorial_project_members ENABLE ROW LEVEL SECURITY;

-- Manager ve todas las membresías de proyectos de su org.
DROP POLICY IF EXISTS "manager read project_members" ON editorial_project_members;
CREATE POLICY "manager read project_members"
ON editorial_project_members FOR SELECT
USING (
  public.is_editorial_manager()
  AND EXISTS (
    SELECT 1 FROM editorial_projects ep
    WHERE ep.id = editorial_project_members.project_id
      AND ep.org_id = public.get_my_org_id()
  )
);

-- Staff asignado puede ver quién más está en sus proyectos.
DROP POLICY IF EXISTS "staff read project_members" ON editorial_project_members;
CREATE POLICY "staff read project_members"
ON editorial_project_members FOR SELECT
USING (
  public.is_editorial_staff()
  AND public.staff_has_project_access(project_id)
);

-- Author solo puede ver su propia membresía.
DROP POLICY IF EXISTS "author read own membership" ON editorial_project_members;
CREATE POLICY "author read own membership"
ON editorial_project_members FOR SELECT
USING (user_id = auth.uid());

-- Solo managers pueden asignar o remover autores.
DROP POLICY IF EXISTS "manager insert project_members" ON editorial_project_members;
CREATE POLICY "manager insert project_members"
ON editorial_project_members FOR INSERT
WITH CHECK (public.is_editorial_manager());

DROP POLICY IF EXISTS "manager delete project_members" ON editorial_project_members;
CREATE POLICY "manager delete project_members"
ON editorial_project_members FOR DELETE
USING (public.is_editorial_manager());
