import { supabase } from '../config/supabase.js';
import { AdminClassOption, AdminTeacher } from '../types.js';

// ---------------------------------------------------------------------------
// mapClass / mapTeacher — inline copies to avoid circular deps with repository
// ---------------------------------------------------------------------------
const mapClassRow = (d: any): AdminClassOption => ({
  id: d.id,
  teacherId: d.teacher_id ?? null,
  grade: d.grade,
  name: d.name,
  label: d.label,
  medium: d.medium,
  subjectId: d.id,
  subjectName: d.subject_name ?? undefined,
  academicYear: d.academic_year ?? undefined,
  schedule: d.schedule ?? undefined,
  fee: d.fee ?? undefined,
  isActive: d.is_active ?? true,
});

const normalizeAssignments = (value: unknown, subject: string, grade: string) => {
  if (Array.isArray(value) && value.length > 0) {
    return value
      .map((item: any) => ({
        subject: String(item?.subject ?? subject),
        grade: String(item?.grade ?? grade),
        classId: String(item?.classId ?? ''),
        medium: String(item?.medium ?? ''),
      }))
      .filter((item) => item.subject && item.grade);
  }
  return [];
};

const mapTeacherRow = (d: any): AdminTeacher => ({
  id: d.id,
  name: d.name,
  subject: d.subject ?? '',
  grade: d.grade ?? '',
  email: d.email,
  phone: d.phone,
  assignments: normalizeAssignments(d.assigned_subjects, d.subject ?? '', d.grade ?? ''),
});

// ---------------------------------------------------------------------------
// RequestContext
// ---------------------------------------------------------------------------

/**
 * Per-request dependency injection container.
 *
 * Created once per HTTP request (via attachContext middleware) and attached
 * to req.context. Provides memoized wrappers around the most frequently
 * called DB queries so that calling the same method N times within a single
 * request results in exactly ONE database round-trip.
 *
 * Usage in a service:
 *   async getDashboard(teacherId: string, ctx: RequestContext) {
 *     const [teacher, classes] = await Promise.all([
 *       ctx.getTeacher(teacherId),
 *       ctx.getClasses(),
 *     ]);
 *   }
 */
export class RequestContext {
  // Keyed by a string identifier; stores the Promise (not the resolved value)
  // so that concurrent calls within the same tick still share one request.
  private cache = new Map<string, Promise<unknown>>();

  private fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, fetcher());
    }
    return this.cache.get(key) as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Hot-path wrappers
  // -------------------------------------------------------------------------

  /** All classes — called by subjects, teacher dashboard, student dashboard */
  getClasses(): Promise<AdminClassOption[]> {
    return this.fetch('classes', async () => {
      const { data, error } = await supabase!
        .from('classes')
        .select('id,teacher_id,grade,name,label,medium,subject_name,academic_year,schedule,fee,is_active,created_at')
        .order('id');
      if (error) throw error;
      return (data ?? []).map(mapClassRow);
    });
  }

  /** All teachers — called by subjects, teacher dashboard */
  getTeachers(): Promise<AdminTeacher[]> {
    return this.fetch('teachers', async () => {
      const { data, error } = await supabase!
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapTeacherRow);
    });
  }

  /** Single teacher row — replaces getTeachers().find() on every teacher action */
  getTeacher(teacherId: string): Promise<AdminTeacher | null> {
    return this.fetch(`teacher:${teacherId}`, async () => {
      const { data, error } = await supabase!
        .from('teachers')
        .select('id,name,subject,grade,assigned_subjects,email,phone')
        .eq('id', teacherId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapTeacherRow(data) : null;
    });
  }

  /**
   * All active class IDs for a student — merges students.class_id +
   * student_enrollments in a SINGLE query using PostgREST embedding.
   * Replaces getActiveClassIdsForStudent() which made 2 separate queries.
   */
  getStudentClassIds(studentId: string): Promise<string[]> {
    return this.fetch(`classIds:${studentId}`, async () => {
      const { data, error } = await supabase!
        .from('students')
        .select('class_id, student_enrollments(class_id, status)')
        .eq('id', studentId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return [] as string[];

      const d = data as any;
      const fromEnrollments = ((d.student_enrollments ?? []) as any[])
        .filter((e: any) => !e.status || e.status === 'active')
        .map((e: any) => e.class_id as string);

      return Array.from(new Set([
        ...(d.class_id ? [d.class_id as string] : []),
        ...fromEnrollments,
      ]));
    });
  }

  /**
   * Result counts per exam — uses the get_result_counts_by_exam RPC so we
   * count in Postgres instead of downloading every row to Node.js.
   */
  getResultCountsByExamId(examIds: string[]): Promise<Map<string, number>> {
    const key = `resultCounts:${examIds.sort().join(',')}`;
    return this.fetch(key, async () => {
      const { data, error } = await supabase!
        .rpc('get_result_counts_by_exam', { exam_ids: examIds });
      if (error) throw error;
      return new Map<string, number>(
        (data ?? []).map((row: { exam_id: string; result_count: number }) => [
          row.exam_id,
          Number(row.result_count),
        ]),
      );
    });
  }

  /**
   * All class IDs assigned to a teacher — uses get_teacher_class_ids RPC
   * which unions teacher_class_assignments + classes.teacher_id.
   */
  getTeacherClassIds(teacherId: string): Promise<string[]> {
    return this.fetch(`teacherClassIds:${teacherId}`, async () => {
      const { data, error } = await supabase!
        .rpc('get_teacher_class_ids', { p_teacher_id: teacherId });
      if (error) throw error;
      return (data ?? []).map((row: { class_id: string }) => row.class_id);
    });
  }
}
