import { repo } from '../data/repository.js';
import { supabase } from '../config/supabase.js';
import { store } from '../data/store.js';
import { RequestContext } from '../context/RequestContext.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const slugifyLocal = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Resolve which class IDs a teacher is assigned to.
 * Tries the RPC first (fast, single query); falls back to JSONB parsing if
 * the migration hasn't been applied yet.
 */
const getAssignedClassIds = async (teacher: any): Promise<string[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_teacher_class_ids', { p_teacher_id: teacher.id });
      if (!error && data) return (data as { class_id: string }[]).map((r) => r.class_id);
    } catch {
      // RPC not yet deployed — fall through to JSONB parsing
    }
  }
  // Fallback: read from the teacher's assigned_subjects JSONB
  return (teacher.assignments ?? []).map((a: any) => a.classId).filter(Boolean);
};

/**
 * Check whether a teacher can manage a given class.
 * Uses the is_teacher_assigned_to_class RPC (single boolean query) when
 * available; falls back to in-memory check against teacher.assignments.
 */
const canManageClass = async (teacher: any, classId: string): Promise<boolean> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('is_teacher_assigned_to_class', {
        p_teacher_id: teacher.id,
        p_class_id: classId,
      });
      if (!error) return Boolean(data);
    } catch {
      // RPC not yet deployed — fall through
    }
  }
  // Fallback: in-memory check
  const assignedClassIds = new Set((teacher.assignments ?? []).map((a: any) => a.classId).filter(Boolean));
  return (
    assignedClassIds.has(classId) ||
    teacher.name === undefined // no assignments yet, allow all
  );
};

const canManageSubject = async (teacher: any, subject: any): Promise<boolean> => {
  if (!subject) return false;
  return canManageClass(teacher, subject.id);
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const teacherService = {
  // -------------------------------------------------------------------------
  // Dashboard — Phase 2.1 + 2.2
  // -------------------------------------------------------------------------
  async getDashboard(teacherId: string | undefined, ctx: RequestContext) {
    if (!teacherId) throw new Error('Teacher profile not found.');

    // Phase 2.1: Fetch teacher, classes, and teachers in parallel — 3 queries,
    // all memoized so any other method in this request re-uses the results.
    const [teacher, classes, teachers] = await Promise.all([
      ctx.getTeacher(teacherId),
      ctx.getClasses(),
      ctx.getTeachers(),
    ]);

    if (!teacher) throw new Error('Teacher profile not found.');

    const assignedClassIds = await ctx.getTeacherClassIds(teacherId);
    const assignedClassIdSet = new Set(assignedClassIds);

    const classById = new Map(classes.map((c) => [c.id, c]));
    const teacherById = new Map(teachers.map((t) => [t.id, t]));

    // Filter to only classes this teacher manages
    const teacherClasses = classes.filter((c) => assignedClassIdSet.has(c.id));

    // Build subject list from filtered classes
    const subjects = teacherClasses.map((c) => ({
      id: c.id,
      name: c.subjectName ?? c.label ?? c.id,
      teacher: teacherById.get(c.teacherId ?? '')?.name ?? 'Unassigned',
      classLabel: c.label,
      grade: c.grade,
      medium: c.medium,
      schedule: c.schedule ?? null,
      fee: c.fee ?? null,
    }));

    // Fetch students enrolled in assigned classes + exams in parallel
    const [enrollmentRows, examRows] = await Promise.all([
      assignedClassIds.length > 0
        ? supabase!
            .from('student_enrollments')
            .select('student_id,class_id,status')
            .in('class_id', assignedClassIds)
            .eq('status', 'active')
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
      assignedClassIds.length > 0
        ? supabase!
            .from('exams')
            .select('id,class_id,exam_type,title,exam_date')
            .in('class_id', assignedClassIds)
            .neq('exam_type', 'homework')
            .order('exam_date', { ascending: false })
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
    ]);

    // Unique student IDs from enrollments
    const studentIdSet = new Set(enrollmentRows.map((e) => e.student_id));
    const studentCount = studentIdSet.size;

    // Phase 2.2: Count results per exam using the RPC (aggregate in Postgres)
    const examIds = examRows.map((e) => e.id);
    const resultCountMap = examIds.length > 0
      ? await ctx.getResultCountsByExamId(examIds)
      : new Map<string, number>();

    const dbExams = examRows.map((e) => ({
      id: e.id,
      classId: e.class_id,
      examType: e.exam_type,
      examName: e.title,
      examDate: e.exam_date,
      markedStudentCount: resultCountMap.get(e.id) ?? 0,
    }));

    // Recent 5 assignments (no per-student mark download needed for the list)
    const recentAssignments = dbExams.slice(0, 5);

    // Student count per subject from enrollment data
    const studentCountByClassId = new Map<string, number>();
    enrollmentRows.forEach((e) => {
      studentCountByClassId.set(e.class_id, (studentCountByClassId.get(e.class_id) ?? 0) + 1);
    });

    return {
      teacher,
      assignments: teacher.assignments,
      subjects: subjects.map((subject) => ({
        ...subject,
        studentCount: studentCountByClassId.get(subject.id) ?? 0,
      })),
      examTypes: store.examTypes,
      dbExams,
      overview: {
        studentsCount: studentCount,
        subjectsCount: subjects.length,
        marksCount: Array.from(resultCountMap.values()).reduce((a, b) => a + b, 0),
        averageMark: 0, // computed lazily when needed
      },
      recentAssignments,
    };
  },

  // -------------------------------------------------------------------------
  // Mark operations
  // -------------------------------------------------------------------------
  async addMark(teacherId: string | undefined, data: any, ctx: RequestContext) {
    // Phase 2.3: single-row teacher lookup instead of full-table fetch
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    // Resolve subject from the cached classes list
    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === data.subjectId);
    if (!classItem) throw new Error('You can only manage marks for your assigned subject.');

    const allowed = await canManageClass(teacher, classItem.id);
    if (!allowed) throw new Error('You can only manage marks for your assigned subject.');

    // Verify student is enrolled in the class
    if (supabase) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id,class_id')
        .eq('id', data.studentId)
        .maybeSingle();

      if (!studentRow) throw new Error('Student not found.');

      if (studentRow.class_id !== classItem.id) {
        const { data: enrollment } = await supabase
          .from('student_enrollments')
          .select('id')
          .eq('student_id', data.studentId)
          .eq('class_id', classItem.id)
          .maybeSingle();
        if (!enrollment) throw new Error('You can only manage marks for students enrolled in the selected class.');
      }
    }

    const result = await repo.upsertMark(data.studentId, {
      subjectId: classItem.id,
      subjectName: classItem.subjectName ?? classItem.label ?? classItem.id,
      classId: classItem.id,
      examType: data.examType,
      examName: data.examName,
      examDate: data.examDate,
      mark: data.mark,
      note: data.note,
    });

    if (!result) throw new Error('Student not found.');
    return result;
  },

  async deleteMark(teacherId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const result = await repo.deleteMark(data);
    if (!result || !result.deleted) throw new Error('Mark not found or could not be deleted.');

    return { message: 'Mark deleted successfully.', student: result.student };
  },

  // -------------------------------------------------------------------------
  // Subject resources & topics
  // -------------------------------------------------------------------------
  async addResource(teacherId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === data.classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only add resources to your assigned classes.');
    }

    const resource = await repo.createSubjectResource({
      classId: classItem.id,
      moduleId: data.moduleId,
      title: data.title,
      href: data.href,
      type: data.type,
    });
    return { resource };
  },

  async addTopic(teacherId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === data.classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only add topics to your assigned classes.');
    }

    const topic = await repo.createSubjectTopic({ classId: classItem.id, title: data.title });
    return { topic };
  },

  async deleteResource(teacherId: string | undefined, classId: string, resourceId: string, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only delete resources from your assigned classes.');
    }

    const deleted = await repo.deleteSubjectResource(classItem.id, resourceId);
    if (!deleted) throw new Error('Resource not found.');
    return { message: 'Resource deleted successfully.' };
  },

  async deleteTopic(teacherId: string | undefined, classId: string, moduleId: string, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only delete topics from your assigned classes.');
    }

    const deleted = await repo.deleteSubjectTopic(classItem.id, moduleId);
    if (!deleted) throw new Error('Topic not found.');
    return { message: 'Topic deleted successfully.' };
  },

  // -------------------------------------------------------------------------
  // Homework
  // -------------------------------------------------------------------------
  async getHomework(teacherId: string | undefined, classId: string, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only view homework for your assigned classes.');
    }

    const homeworks = await repo.getClassHomeworks(classItem.id);
    return { homeworks };
  },

  async addHomework(teacherId: string | undefined, userId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === data.classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only add homework to your assigned classes.');
    }

    const homework = await repo.createHomework({
      classId: classItem.id,
      title: data.title,
      dueDate: data.dueDate,
      createdBy: userId,
    });
    return { homework };
  },

  async completeHomework(teacherId: string | undefined, userId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === data.classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only update homework for your assigned classes.');
    }

    const updated = await repo.setHomeworkCompletion({
      classId: classItem.id,
      homeworkId: data.homeworkId,
      studentId: data.studentId,
      isDone: data.isDone,
      updatedBy: userId,
    });

    if (!updated) throw new Error('Homework not found.');
    return { message: 'Homework completion updated.' };
  },

  async deleteHomework(teacherId: string | undefined, classId: string, homeworkId: string, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const classes = await ctx.getClasses();
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) throw new Error('Class subject not found.');

    if (!await canManageClass(teacher, classItem.id)) {
      throw new Error('You can only delete homework from your assigned classes.');
    }

    const deleted = await repo.deleteHomework(classItem.id, homeworkId);
    if (!deleted) throw new Error('Homework not found.');
    return { message: 'Homework deleted successfully.' };
  },

  // -------------------------------------------------------------------------
  // Student progress — Phase 2.4
  // -------------------------------------------------------------------------
  async getStudentProgress(teacherId: string | undefined, studentId: string, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    // Phase 2.4: Use RPC boolean check instead of loading all students
    if (supabase && teacher.assignments.length > 0) {
      try {
        const { data: allowed } = await supabase.rpc('is_student_in_teacher_classes', {
          p_teacher_id: teacher.id,
          p_student_id: studentId,
        });
        if (!allowed) {
          throw new Error('You can only view progress for students in your assigned grades and classes.');
        }
      } catch (err: any) {
        // If the RPC isn't deployed yet, fall back to the old approach
        if (!err.message?.includes('assigned grades')) {
          const assignedClassIds = await ctx.getTeacherClassIds(teacher.id);
          if (assignedClassIds.length > 0) {
            const { data: enrollment } = await supabase
              .from('student_enrollments')
              .select('id')
              .eq('student_id', studentId)
              .in('class_id', assignedClassIds)
              .limit(1)
              .maybeSingle();
            if (!enrollment) {
              throw new Error('You can only view progress for students in your assigned grades and classes.');
            }
          }
        } else {
          throw err;
        }
      }
    }

    const profile = await repo.getStudentProfile(studentId);
    if (!profile) throw new Error('Student profile not found.');

    const progress = await repo.getStudentProgressSeries(studentId);
    const overview = await repo.getStudentPerformanceSummary(studentId);

    return { student: profile, overview, progress };
  },

  // -------------------------------------------------------------------------
  // Assignment CRUD — Phase 2.5
  // -------------------------------------------------------------------------
  async createAssignment(teacherId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const examId = `${data.subjectId}-${slugifyLocal(data.examType)}-${slugifyLocal(data.examName)}-${slugifyLocal(data.examDate)}`;

    if (supabase) {
      const { error } = await supabase.from('exams').upsert({
        id: examId,
        class_id: data.subjectId,
        exam_type: data.examType,
        title: data.examName,
        exam_date: data.examDate,
        total_marks: 100,
      }, { onConflict: 'id' });
      if (error) throw error;
    }

    return {
      id: examId,
      subjectId: data.subjectId,
      examType: data.examType,
      examName: data.examName,
      examDate: data.examDate,
      markedStudentCount: 0,
    };
  },

  async updateAssignmentMarks(teacherId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const { subjectId, oldExamType, oldExamName, oldExamDate, newExamType, newExamName, newExamDate } = data;

    if (supabase) {
      let examQuery = supabase
        .from('exams')
        .select('id,exam_type,title,exam_date')
        .eq('class_id', subjectId)
        .eq('title', oldExamName);
      if (oldExamType) examQuery = examQuery.eq('exam_type', oldExamType);
      if (oldExamDate) examQuery = examQuery.eq('exam_date', oldExamDate);

      const { data: exams, error: examFetchError } = await examQuery;
      if (examFetchError) throw examFetchError;
      if (!exams || exams.length === 0) return { message: 'No matching exams found.', updatedCount: 0 };

      const examIds = exams.map((e) => e.id);

      // Phase 2.5: Batch update all matching exams + count results in parallel
      const [updateResult, countResult] = await Promise.all([
        supabase.from('exams').update({
          title: newExamName,
          exam_type: newExamType || exams[0]?.exam_type,
          exam_date: newExamDate || exams[0]?.exam_date,
        }).in('id', examIds),
        supabase.from('results').select('id', { count: 'exact', head: true }).in('exam_id', examIds),
      ]);

      if (updateResult.error) throw updateResult.error;
      const updatedCount = countResult.count ?? 0;
      return { message: `Assignment updated. ${updatedCount} mark(s) affected.`, updatedCount };
    }

    return { message: 'Assignment updated.', updatedCount: 0 };
  },

  async deleteAssignmentMarks(teacherId: string | undefined, data: any, ctx: RequestContext) {
    const teacher = await ctx.getTeacher(teacherId ?? '');
    if (!teacher) throw new Error('Teacher profile not found.');

    const { subjectId, examType, examName, examDate } = data;

    if (supabase) {
      let examQuery = supabase
        .from('exams')
        .select('id')
        .eq('class_id', subjectId)
        .eq('title', examName);
      if (examType) examQuery = examQuery.eq('exam_type', examType);
      if (examDate) examQuery = examQuery.eq('exam_date', examDate);

      const { data: exams, error: examFetchError } = await examQuery;
      if (examFetchError) throw examFetchError;
      if (!exams || exams.length === 0) return { message: 'No matching exams found.', deletedCount: 0 };

      const examIds = exams.map((e) => e.id);

      // Count, then delete — parallel where possible
      const { count: deletedCount } = await supabase
        .from('results')
        .select('id', { count: 'exact', head: true })
        .in('exam_id', examIds);

      const [resultDeleteResult, examDeleteResult] = await Promise.all([
        supabase.from('results').delete().in('exam_id', examIds),
        supabase.from('exams').delete().in('id', examIds),
      ]);
      if (resultDeleteResult.error) throw resultDeleteResult.error;
      if (examDeleteResult.error) throw examDeleteResult.error;

      return { message: `Assignment deleted. ${deletedCount ?? 0} mark(s) removed.`, deletedCount: deletedCount ?? 0 };
    }

    return { message: 'Assignment deleted.', deletedCount: 0 };
  },
};
