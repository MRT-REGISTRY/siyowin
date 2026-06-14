import { supabase } from '../config/supabase.js';
import {
  AdminStudent,
  AdminStudentMark,
  AdminTeacher,
  AuthUser,
  LeaderboardEntry,
  RegisteredUser,
  SubjectModule,
  SubjectModuleItem,
  SubjectRecord,
  TeacherAssignment,
} from '../types.js';
import { createId } from '../utils/ids.js';
import {
  createUser as createMemoryUser,
  createClass as createMemoryClass,
  createStudentEnrollment as createMemoryStudentEnrollment,
  createStudent as createMemoryStudent,
  createTeacher as createMemoryTeacher,
  deleteClass as deleteMemoryClass,
  deleteMark as deleteMemoryMark,
  deleteStudent as deleteMemoryStudent,
  deleteStudentEnrollment as deleteMemoryStudentEnrollment,
  deleteTeacher as deleteMemoryTeacher,
  deleteUser as deleteMemoryUser,
  filterStudents as filterMemoryStudents,
  findUserByEmail as findMemoryUserByEmail,
  findUserByUsername as findMemoryUserByUsername,
  findUserById as findMemoryUserById,
  getDashboardOverview as getMemoryDashboardOverview,
  getStudentProfile as getMemoryStudentProfile,
  getSubjectById as getMemorySubjectById,
  getSubjectsForClass as getMemorySubjectsForClass,
  getStudentEnrollments as getMemoryStudentEnrollments,
  store,
  upsertMark as upsertMemoryMark,
} from './store.js';
import { demoPasswordHash } from './seed.js';

type DbUser = AuthUser & { passwordHash: string; password_hash?: string };
type UpsertMarkResult = { mark: AdminStudentMark; action: 'created' | 'updated' };
type PublicMarksheetLookup = {
  subject: { id: string; name: string; classLabel?: string | null; teacher?: string | null };
  assignment: {
    subjectId: string;
    examType: string;
    examName: string;
    examDate: string;
    totalMarks: number | null;
  };
  student?: { id: string; name: string; username: string; index: string };
  mark: number | null;
  rank: number | null;
  status: 'awaiting-username' | 'pending' | 'present' | 'absent';
};

const isMissingTable = (error: unknown) =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      ['42P01', '42703', 'PGRST204', 'PGRST205', 'PGRST116'].includes(String((error as { code?: string }).code)),
  );

const withFallback = async <T>(query: () => Promise<T>, fallback: () => T | Promise<T>) => {
  if (!supabase) return fallback();

  try {
    return await query();
  } catch (error) {
    if (isMissingTable(error)) return fallback();
    throw error;
  }
};

// Here line this 'email' will contain either email or username
export const repo = {
  async findUserByEmail(email: string) {
    return withFallback(async () => {
      const identifier = email.trim().toLowerCase();
      const { data, error } = await supabase!
        .from('users')
        .select('id,name,username,email,role,student_id,teacher_id,password_hash,is_active')
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .maybeSingle();
      // ".or(`email.eq.${identifier},username.eq.${identifier}`)" can handle both email and username logins
      if (error) throw error;
      if (!data) return undefined;
      return mapUser(data);
    }, () => findMemoryUserByEmail(email));
  },
  async findUserByUsername(username: string) {
    return withFallback(async () => {
      const identifier = username.trim().toLowerCase();
      const { data, error } = await supabase!
        .from('users')
        .select('id,name,username,email,role,student_id,teacher_id,password_hash,is_active')
        .eq('username', identifier)
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      return mapUser(data);
    }, () => findMemoryUserByUsername(username));
  },
  
  async findUserById(id: string) {
    return withFallback(async () => {
      const { data, error } = await supabase!
        .from('users')
        .select('id,name,username,email,role,student_id,teacher_id,password_hash,is_active')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      return mapUser(data);
    }, () => findMemoryUserById(id));
  },

  async getSubjects() {
    return withFallback(async () => {
      const [classes, teachers] = await Promise.all([this.getClasses(), this.getTeachers()]);
      const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));

      return classes.map((classItem) => mapClassAsSubject(classItem, classItem.teacherId ? teacherById.get(classItem.teacherId)?.name : undefined));
    }, () => store.subjects);
  },

  async getEnrolledSubjects(studentId?: string) {
    if (!studentId) return this.getSubjects();
    
    return withFallback(async () => {
      const classIds = await getActiveClassIdsForStudent(studentId);
      if (classIds.length === 0) return [];

      const classes = await this.getClasses();
      const teachers = await this.getTeachers();
      const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
      const enrolledClasses = classes
        .filter((classItem) => classIds.includes(classItem.id))
        .map((classItem) => mapClassAsSubject(classItem, classItem.teacherId ? teacherById.get(classItem.teacherId)?.name : undefined));

      const metricsByClassId = await getClassMetricsByClassId(classIds, studentId);

      return enrolledClasses.map((subject) => ({
        ...subject,
        ...(metricsByClassId.get(subject.id) ?? emptyClassMetrics()),
      }));
    }, () => {
      const enrolledSubjectIds = Array.from(new Set(getMemoryStudentEnrollments(studentId).map((item) => item.subjectId)));
      if (enrolledSubjectIds.length === 0) {
        const student = store.students.find((item) => item.id === studentId);
        if (!student) return [];
        const classSubjectIds = store.classes
          .filter((classItem) => classItem.id === student.classId)
          .map((classItem) => classItem.subjectId)
          .filter((subjectId): subjectId is string => Boolean(subjectId));
        if (classSubjectIds.length > 0) return store.subjects.filter((subject) => classSubjectIds.includes(subject.id));
        const markSubjectIds = Array.from(new Set(student.marks.map((mark) => mark.subjectId)));
        if (markSubjectIds.length === 0) return store.subjects;
        return store.subjects.filter((subject) => markSubjectIds.includes(subject.id));
      }

      return store.subjects.filter((subject) => enrolledSubjectIds.includes(subject.id));
    });
  },

  async getSubjectById(subjectId: string) {
    const subjects = await this.getSubjects();
    return subjects.find((subject) => subject.id === subjectId);
  },

  async getSubjectModules(subjectId: string): Promise<SubjectModule[]> {
    return withFallback(async () => {
      const { data: modules, error: modulesError } = await supabase!
        .from('subject_modules')
        .select('id,class_id,title,sort_order,is_active,created_at')
        .eq('class_id', subjectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (modulesError) throw modulesError;
      const moduleRows = modules ?? [];
      if (moduleRows.length === 0) return [];

      const moduleIds = moduleRows.map((module) => module.id);
      const { data: items, error: itemsError } = await supabase!
        .from('subject_module_items')
        .select('id,module_id,title,item_type,href,sort_order,is_active,created_at')
        .in('module_id', moduleIds)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      const itemsByModuleId = new Map<string, SubjectModuleItem[]>();
      (items ?? []).forEach((item) => {
        const moduleItems = itemsByModuleId.get(item.module_id) ?? [];
        moduleItems.push({
          id: item.id,
          title: item.title,
          type: mapModuleItemType(item.item_type),
          href: item.href ?? undefined,
          moduleId: item.module_id,
          createdAt: item.created_at ?? null,
        });
        itemsByModuleId.set(item.module_id, moduleItems);
      });

      return moduleRows.map((module) => ({
        id: module.id,
        title: module.title,
        items: itemsByModuleId.get(module.id) ?? [],
      }));
    }, () => buildMemorySubjectModules(subjectId));
  },

  async getLatestModuleItemsForStudent(studentId: string | undefined, limit = 3) {
    if (!studentId) return [];

    return withFallback(async () => {
      const classIds = await getActiveClassIdsForStudent(studentId);
      if (classIds.length === 0) return [];

      const { data: modules, error: modulesError } = await supabase!
        .from('subject_modules')
        .select('id,class_id')
        .in('class_id', classIds);
      if (modulesError) throw modulesError;
      const moduleRows = modules ?? [];
      const moduleIds = moduleRows.map((m) => m.id);
      if (moduleIds.length === 0) return [];

      const { data: items, error: itemsError } = await supabase!
        .from('subject_module_items')
        .select('id,module_id,title,item_type,href,created_at')
        .in('module_id', moduleIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (itemsError) throw itemsError;

      const classByModule = new Map((moduleRows ?? []).map((m) => [m.id, m.class_id]));

      return (items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        type: mapModuleItemType(item.item_type),
        href: item.href ?? undefined,
        moduleId: item.module_id,
        classId: classByModule.get(item.module_id) ?? undefined,
        createdAt: item.created_at ?? null,
      }));
    }, () => []);
  },

  async getLatestResultsForStudent(studentId: string | undefined, limit = 3) {
    if (!studentId) return [];

    return withFallback(async () => {
      const classIds = await getActiveClassIdsForStudent(studentId);
      if (classIds.length === 0) return [];

      const { data: exams, error: examsError } = await supabase!
        .from('exams')
        .select('id,class_id,title,exam_type,exam_date,total_marks,created_at')
        .in('class_id', classIds)
        .order('exam_date', { ascending: false })
        .limit(limit);
      if (examsError) throw examsError;
      const examRows = exams ?? [];
      if (examRows.length === 0) return [];

      const examIds = examRows.map((e) => e.id);
      const { data: results, error: resultsError } = await supabase!
        .from('results')
        .select('id,exam_id,student_id,marks_obtained,is_absent,created_at,updated_at')
        .eq('student_id', studentId)
        .in('exam_id', examIds)
        .order('created_at', { ascending: false });
      if (resultsError) throw resultsError;

      const resultByExamId = new Map((results ?? []).map((r) => [r.exam_id, r]));

      return (examRows ?? [])
        .map((exam) => {
          const result = resultByExamId.get(exam.id);
          if (!result) return null;
          return {
            classId: exam.class_id,
            examId: exam.id,
            examTitle: exam.title,
            examType: exam.exam_type,
            examDate: exam.exam_date,
            totalMarks: exam.total_marks ?? null,
            marksObtained: result.is_absent ? null : result.marks_obtained ?? null,
            isAbsent: Boolean(result.is_absent),
            status: result.is_absent ? 'absent' : 'present',
            createdAt: result.created_at ?? exam.created_at ?? null,
            updatedAt: result.updated_at ?? null,
          };
        })
        .filter((item) => item !== null)
        .slice(0, limit) as any[];
    }, () => {
      const student = store.students.find((s) => s.id === studentId || s.index === studentId);
      if (!student) return [];
      return student.marks
        .map((m) => ({
          classId: m.classId ?? undefined,
          examId: `${m.subjectId}-${m.examType}-${m.examName}`,
          examTitle: m.examName,
          examType: m.examType,
          examDate: m.examDate,
          totalMarks: 100,
          marksObtained: m.mark ?? null,
          isAbsent: false,
          status: 'present',
          createdAt: null,
          updatedAt: null,
        }))
        .sort((a, b) => String(b.examDate).localeCompare(String(a.examDate)))
        .slice(0, limit);
    });
  },

  async getStudentSubjectResults(studentId: string | undefined, subjectId: string) {
    if (!studentId) return [];

    return withFallback(async () => {
      const classIds = await getActiveClassIdsForStudent(studentId);
      if (!classIds.includes(subjectId)) {
        return [];
      }

      const { data: exams, error: examsError } = await supabase!
        .from('exams')
        .select('id,class_id,exam_type,title,exam_date,total_marks,created_at')
        .eq('class_id', subjectId)
        .order('exam_date', { ascending: false });

      if (examsError) throw examsError;
      const examRows = exams ?? [];
      if (examRows.length === 0) {
        return [];
      }

      const examIds = examRows.map((exam) => exam.id);
      const { data: results, error: resultsError } = await supabase!
        .from('results')
        .select('id,exam_id,student_id,marks_obtained,is_absent,created_at,updated_at')
        .eq('student_id', studentId)
        .in('exam_id', examIds);

      if (resultsError) throw resultsError;

      const resultByExamId = new Map((results ?? []).map((result) => [result.exam_id, result]));

      return examRows
        .map((exam) => {
          const result = resultByExamId.get(exam.id);
          if (!result) return null;

          return {
            examId: exam.id,
            examTitle: exam.title,
            examType: exam.exam_type,
            examDate: exam.exam_date,
            totalMarks: exam.total_marks ?? null,
            marksObtained: result.is_absent ? null : result.marks_obtained ?? null,
            isAbsent: Boolean(result.is_absent),
            status: result.is_absent ? 'absent' : 'present',
            createdAt: result.created_at ?? exam.created_at ?? null,
            updatedAt: result.updated_at ?? null,
          };
        })
        .filter((item): item is {
          examId: string;
          examTitle: string;
          examType: string;
          examDate: string;
          totalMarks: number | null;
          marksObtained: number | null;
          isAbsent: boolean;
          status: 'present' | 'absent';
          createdAt: string | null;
          updatedAt: string | null;
        } => item !== null)
        .sort((a, b) => String(b.examDate).localeCompare(String(a.examDate)));
    }, () => {
      const student = store.students.find((item) => item.id === studentId);
      if (!student) return [];

      const enrolledSubjectIds = new Set(student.marks.map((mark) => mark.subjectId));
      if (!enrolledSubjectIds.has(subjectId)) return [];

      return student.marks
        .filter((mark) => mark.subjectId === subjectId && (!mark.classId || mark.classId === student.classId))
        .map((mark) => ({
          examId: `${subjectId}-${mark.examType}-${mark.examName}`,
          examTitle: mark.examName,
          examType: mark.examType,
          examDate: mark.examDate,
          totalMarks: 100,
          marksObtained: mark.mark,
          isAbsent: false,
          status: 'present' as const,
          createdAt: null,
          updatedAt: null,
        }))
        .sort((a, b) => String(b.examDate).localeCompare(String(a.examDate)));
    });
  },

  async getPublicMarksheet(params: { subjectId: string; examType: string; examName: string; examDate: string; username?: string }) {
    const subject = await this.getSubjectById(params.subjectId);
    if (!subject) return undefined;

    const assignment = {
      subjectId: subject.id,
      examType: params.examType,
      examName: params.examName,
      examDate: params.examDate,
      totalMarks: 100,
    };

    if (!params.username?.trim()) {
      return {
        subject: {
          id: subject.id,
          name: subject.name,
          classLabel: subject.classLabel ?? null,
          teacher: subject.teacher ?? null,
        },
        assignment,
        mark: null,
        rank: null,
        status: 'awaiting-username' as const,
      } satisfies PublicMarksheetLookup;
    }

    return withFallback(async () => {
      const identifier = params.username?.trim();
      if (!identifier) return undefined;

      const normalizedIdentifier = identifier.toLowerCase();

      const { data: studentByIdOrIndex, error: studentLookupError } = await supabase!
        .from('students')
        .select('id,name,index_number')
        .or(`id.eq.${identifier},index_number.eq.${identifier}`)
        .maybeSingle();
      if (studentLookupError) throw studentLookupError;

      const { data: userByUsername, error: userLookupError } = await supabase!
        .from('users')
        .select('id,name,username,student_id,role')
        .or(`username.eq.${normalizedIdentifier},id.eq.${identifier}`)
        .maybeSingle();
      if (userLookupError) throw userLookupError;

      let student: { id: string; name: string; index_number: string } | null = studentByIdOrIndex ?? null;
      if (!student && userByUsername?.role === 'student' && userByUsername.student_id) {
        const { data: studentByUserId, error: linkedStudentError } = await supabase!
          .from('students')
          .select('id,name,index_number')
          .eq('id', userByUsername.student_id)
          .maybeSingle();
        if (linkedStudentError) throw linkedStudentError;
        student = studentByUserId ?? null;
      }

      if (!student) return undefined;

      const user = userByUsername?.role === 'student' ? userByUsername : undefined;

      const { data: exam, error: examError } = await supabase!
        .from('exams')
        .select('id,total_marks')
        .eq('class_id', params.subjectId)
        .eq('exam_type', params.examType)
        .eq('title', params.examName)
        .eq('exam_date', params.examDate)
        .maybeSingle();
      if (examError) throw examError;

      const { data: result, error: resultError } = await supabase!
        .from('results')
        .select('marks_obtained,is_absent')
        .eq('student_id', student.id)
        .eq('exam_id', exam?.id ?? '')
        .maybeSingle();
      if (resultError) throw resultError;

      // Calculate rank: count how many students have a higher mark
      let rank: number | null = null;
      if (result && !result.is_absent && result.marks_obtained !== null) {
        const { data: higherMarks, error: rankError } = await supabase!
          .from('results')
          .select('marks_obtained')
          .eq('exam_id', exam?.id ?? '')
          .gt('marks_obtained', result.marks_obtained)
          .neq('is_absent', true);
        if (!rankError && higherMarks) {
          rank = (higherMarks?.length ?? 0) + 1;
        }
      }

      return {
        subject: {
          id: subject.id,
          name: subject.name,
          classLabel: subject.classLabel ?? null,
          teacher: subject.teacher ?? null,
        },
        assignment: {
          ...assignment,
          totalMarks: exam?.total_marks ?? assignment.totalMarks,
        },
        student: {
          id: student.id,
          name: student.name,
          username: user?.username ?? identifier,
          index: student.index_number,
        },
        mark: result && !result.is_absent && result.marks_obtained !== null ? Number(result.marks_obtained) : null,
        rank,
        status: !result ? 'pending' : result.is_absent ? 'absent' : 'present',
      } satisfies PublicMarksheetLookup;
    }, () => {
      const student = store.students.find((item) => item.id === params.username?.trim() || item.index === params.username?.trim());
      if (!student) return undefined;

      // Get user info if available, but don't require it - we can still show marks with just student record
      const user = store.users.find((item) => item.studentId === student.id && item.role === 'student')
        ?? store.users.find((item) => item.username.toLowerCase() === params.username!.trim().toLowerCase());

      const mark = student.marks.find((item) =>
        item.subjectId === params.subjectId &&
        item.examType === params.examType &&
        item.examName === params.examName &&
        item.examDate === params.examDate,
      );

      // Calculate rank: count students with higher marks for the same exam
      let rank: number | null = null;
      if (mark?.mark !== null && mark?.mark !== undefined) {
        const higherMarksCount = store.students.reduce((count, otherStudent) => {
          const otherMark = otherStudent.marks.find((m) =>
            m.subjectId === params.subjectId &&
            m.examType === params.examType &&
            m.examName === params.examName &&
            m.examDate === params.examDate,
          );
          return otherMark && otherMark.mark !== null && otherMark.mark > mark.mark ? count + 1 : count;
        }, 0);
        rank = higherMarksCount + 1;
      }

      return {
        subject: {
          id: subject.id,
          name: subject.name,
          classLabel: subject.classLabel ?? null,
          teacher: subject.teacher ?? null,
        },
        assignment,
        student: {
          id: student.id,
          name: student.name,
          username: user?.username ?? `student_${student.id}`,
          index: student.index,
        },
        mark: mark?.mark ?? null,
        rank,
        status: mark ? 'present' : 'pending',
      } satisfies PublicMarksheetLookup;
    });
  },

  async getStudentProfile(studentId?: string) {
    return withFallback(async () => {
      if (!studentId) return undefined;
      const { data, error } = await supabase!
        .from('students')
        .select('id,name,index_number,date_of_birth,class_id,parent_name,parent_phone')
        .eq('id', studentId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      const classIds = await this.getStudentClassIds(data.id);
      const primaryClassId = data.class_id ?? classIds[0];
      const classItem = (await this.getClasses()).find((item) => item.id === primaryClassId);
      const termInfo = resolveTermInfo(classItem?.academicYear);
      return {
        id: data.id,
        name: data.name,
        index: data.index_number,
        dateOfBirth: data.date_of_birth ?? undefined,
        grade: classItem?.grade ?? 'Unassigned',
        classId: primaryClassId ?? '',
        avatar: data.name.charAt(0).toUpperCase(),
        term: termInfo.term,
        year: termInfo.year,
      };
    }, () => {
      const memoryProfile = getMemoryStudentProfile(studentId);
      if (!memoryProfile) return undefined;
      const classItem = store.classes.find((item) => item.id === memoryProfile.classId);
      const termInfo = resolveTermInfo(classItem?.academicYear);
      return {
        ...memoryProfile,
        dateOfBirth: undefined,
        term: termInfo.term,
        year: termInfo.year,
      };
    });
  },

  async getOverview(subjects?: SubjectRecord[]) {
    const targetSubjects = subjects ?? await this.getSubjects();
    if (targetSubjects.length === 0) {
      return {
        averageMark: 0,
        bestSubject: 'N/A',
        subjectsEnrolled: 0,
        homeworkCompletion: 0,
        classRank: 0,
      };
    }
    const averageMark = Math.round(targetSubjects.reduce((total, subject) => total + subject.currentMark, 0) / targetSubjects.length);
    const bestSubject = [...targetSubjects].sort((a, b) => b.currentMark - a.currentMark)[0]?.name ?? 'N/A';
    const homeworkDone = targetSubjects.reduce((total, subject) => total + subject.homeworkDoneThisMonth, 0);
    const homeworkTarget = targetSubjects.reduce((total, subject) => total + subject.homeworkTargetThisMonth, 0);
    return {
      averageMark,
      bestSubject,
      subjectsEnrolled: targetSubjects.length,
      homeworkCompletion: homeworkTarget > 0 ? Math.round((homeworkDone / homeworkTarget) * 100) : 0,
      classRank: Math.min(...targetSubjects.map((subject) => subject.rank)),
    };
  },

  async getStudentProgressSeries(studentId?: string) {
    if (!studentId) return buildEmptyProgressSeries();

    return withFallback(async () => {
      const classIds = await this.getStudentClassIds(studentId);
      if (classIds.length === 0) return buildEmptyProgressSeries();

      const { data: exams, error: examError } = await supabase!
        .from('exams')
        .select('id,exam_date')
        .in('class_id', classIds);
      if (examError) throw examError;
      const examRows = exams ?? [];
      if (examRows.length === 0) return buildEmptyProgressSeries();

      const examIds = examRows.map((exam) => exam.id);
      const { data: results, error: resultError } = await supabase!
        .from('results')
        .select('exam_id,student_id,marks_obtained,is_absent')
        .in('exam_id', examIds);
      if (resultError) throw resultError;

      return buildProgressSeries(examRows, results ?? [], studentId);
    }, () => buildProgressSeriesFromMemory(studentId));
  },

  async getStudentPerformanceSummary(studentId?: string) {
    if (!studentId) return buildEmptyPerformanceSummary();

    return withFallback(async () => {
      const classIds = await this.getStudentClassIds(studentId);
      if (classIds.length === 0) return buildEmptyPerformanceSummary();

      const classById = new Map((await this.getClasses()).map((item) => [item.id, item]));

      const { data: exams, error: examError } = await supabase!
        .from('exams')
        .select('id,class_id')
        .in('class_id', classIds);
      if (examError) throw examError;
      const examRows = exams ?? [];
      if (examRows.length === 0) return buildEmptyPerformanceSummary();

      const examIds = examRows.map((exam) => exam.id);
      const { data: results, error: resultError } = await supabase!
        .from('results')
        .select('exam_id,student_id,marks_obtained,is_absent')
        .eq('student_id', studentId)
        .in('exam_id', examIds);
      if (resultError) throw resultError;

      const summary = buildPerformanceSummary(examRows, results ?? [], classById);
      return summary;
    }, () => buildPerformanceSummaryFromMemory(studentId));
  },

  async getLeaderboardForSubject(subjectId: string, classId?: string, viewerStudentId?: string): Promise<LeaderboardEntry[]> {
    if (!classId) return [];

    return withFallback<LeaderboardEntry[]>(async () => {
      const { data: exams, error: examError } = await supabase!
        .from('exams')
        .select('id')
        .eq('class_id', classId);
      if (examError) throw examError;
      const examRows = exams ?? [];
      if (examRows.length === 0) return [];

      const examIds = examRows.map((exam) => exam.id);
      const { data: results, error: resultError } = await supabase!
        .from('results')
        .select('exam_id,student_id,marks_obtained,is_absent')
        .in('exam_id', examIds);
      if (resultError) throw resultError;

      const studentIds = Array.from(new Set((results ?? []).map((item) => item.student_id)));
      if (studentIds.length === 0) return [];

      const { data: students, error: studentError } = await supabase!
        .from('students')
        .select('id,name')
        .in('id', studentIds);
      if (studentError) throw studentError;

      return buildLeaderboardEntries(results ?? [], students ?? [], viewerStudentId);
    }, () => buildLeaderboardFromMemory(subjectId, classId, viewerStudentId));
  },

  async getClasses() {
    return withFallback(async () => {
      const { data, error } = await supabase!
        .from('classes')
        .select('id,teacher_id,grade,name,label,medium,subject_name,academic_year,schedule,fee,is_active,created_at')
        .order('id');
      if (error) throw error;
      return (data ?? []).map(mapClass);
    }, () => store.classes);
  },

  async getStudentEnrollmentOptions() {
    return withFallback(async () => {
      const [classes, teachers] = await Promise.all([
        this.getClasses(),
        this.getTeachers(),
      ]);

      const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));

      return classes
        .map((classItem) => {
          const teacherName = classItem.teacherId ? teacherById.get(classItem.teacherId)?.name : undefined;
          const subjectName = classItem.subjectName ?? classItem.label;
          
          return {
            id: classItem.id,
            grade: classItem.grade,
            medium: classItem.medium,
            subjectId: classItem.id,
            subjectName,
            teacherName: teacherName ?? 'Unassigned teacher',
          };
        })
        .filter((option) => Boolean(option.subjectId));
    }, () => {
      const teacherByName = new Map(store.teachers.map((teacher) => [teacher.id, teacher.name]));
      return store.classes
        .map((classItem) => {
          const teacherName = classItem.teacherId ? teacherByName.get(classItem.teacherId) : undefined;
          return {
            id: classItem.id,
            grade: classItem.grade,
            medium: classItem.medium,
            subjectId: classItem.id,
            subjectName: classItem.subjectName ?? classItem.label,
            teacherName: teacherName ?? 'Unassigned teacher',
          };
        })
        .filter((option) => Boolean(option.subjectId));
    });
  },

  async getRegisteredUsers(): Promise<RegisteredUser[]> {
    return withFallback(async () => {
      const { data, error } = await supabase!
        .from('users')
        .select('id,name,username,email,role,student_id,teacher_id,is_active,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return uniqueBy((data ?? []).map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username ?? user.email,
        email: user.email,
        role: user.role,
        studentId: user.student_id ?? undefined,
        teacherId: user.teacher_id ?? undefined,
        isActive: user.is_active ?? true,
        linkedName: user.name,
      })), (user) => user.username.toLowerCase());
    }, () => uniqueBy(store.users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      teacherId: user.teacherId,
      isActive: user.isActive ?? true,
      linkedName: user.name,
    })), (user) => user.username.toLowerCase()));
  },

  async getStudents(params: { grade?: string; classId?: string; query?: string }) {
    return withFallback(async () => {
      const [{ data, error }, classes, marksByStudentId, enrollmentsByStudentId] = await Promise.all([
        supabase!
        .from('students')
        .select('id,name,index_number,date_of_birth,class_id,parent_name,parent_phone,created_at')
        .order('created_at', { ascending: false }),
        this.getClasses(),
        getMarksByStudentId(),
        getActiveEnrollmentsByStudentId(),
      ]);
      if (error) throw error;
      const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));
      const students = uniqueBy((data ?? []).map((student) =>
        mapStudentWithData(student, classById, marksByStudentId.get(student.id) ?? [], enrollmentsByStudentId.get(student.id) ?? []),
      ), (student) => student.index.toLowerCase());
      const normalized = params.query?.trim().toLowerCase() ?? '';
      return students.filter((student) => {
        const matchesGrade = !params.grade || student.grade === params.grade || student.enrollments?.some((enrollment) => classById.get(enrollment.classId)?.grade === params.grade);
        const matchesClass = !params.classId || student.classId === params.classId || student.enrollments?.some((enrollment) => enrollment.classId === params.classId);
        const matchesQuery = !normalized || student.name.toLowerCase().includes(normalized) || student.index.toLowerCase().includes(normalized);
        return matchesGrade && matchesClass && matchesQuery;
      });
    }, () => uniqueBy(filterMemoryStudents(params), (student) => student.index.toLowerCase()));
  },

  async getTeachers() {
    return withFallback(async () => {
      const { data, error } = await supabase!.from('teachers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return uniqueBy((data ?? []).map(mapTeacher), (teacher) => teacher.email.toLowerCase());
    }, () => uniqueBy(store.teachers, (teacher) => teacher.email.toLowerCase()));
  },

  async getTeacherById(teacherId?: string) {
    if (!teacherId) return undefined;
    const teachers = await this.getTeachers();
    return teachers.find((teacher) => teacher.id === teacherId);
  },

  async createClass(input: { grade: string; name: string; label: string; medium: string; teacherId?: string | null; subjectName?: string; academicYear?: number; schedule?: string; fee?: number }) {
    return withFallback(async () => {
      const classItem = buildClass(input);
      const { error } = await supabase!.from('classes').upsert({
        id: classItem.id,
        teacher_id: classItem.teacherId ?? null,
        grade: classItem.grade,
        name: classItem.name,
        label: classItem.label,
        medium: classItem.medium,
        subject_name: classItem.subjectName ?? null,
        academic_year: classItem.academicYear ?? new Date().getFullYear(),
        schedule: classItem.schedule ?? null,
        fee: classItem.fee ?? null,
        is_active: classItem.isActive ?? true,
      });
      if (error) {
        if (isMissingTable(error)) {
          const { error: retryError } = await supabase!.from('classes').upsert({
            id: classItem.id,
            grade: classItem.grade,
            name: classItem.name,
            label: classItem.label,
            medium: classItem.medium,
          });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
        return classItem.teacherId ? (await this.setClassTeacher(classItem.id, classItem.teacherId)) ?? classItem : classItem;
    }, async () => {
      const classItem = createMemoryClass(input);
      if (classItem.teacherId) {
        await this.setClassTeacher(classItem.id, classItem.teacherId);
      }
      return classItem;
    });
  },

    async setClassTeacher(classId: string, teacherId?: string | null) {
      return withFallback(async () => {
        const nextTeacherId = teacherId?.trim() || null;
        const { data: classRow, error: classError } = await supabase!
          .from('classes')
          .select('id,teacher_id,grade,name,label,medium,subject_name,academic_year,schedule,fee,is_active')
          .eq('id', classId)
          .maybeSingle();

        if (classError) throw classError;
        if (!classRow) return null;
      const previousTeacherId = classRow.teacher_id ?? null;

        if (nextTeacherId) {
          const teacher = await this.getTeacherById(nextTeacherId);
          if (!teacher) return null;
        }

        const { error: updateError } = await supabase!
          .from('classes')
          .update({ teacher_id: nextTeacherId })
          .eq('id', classId);
        if (updateError) throw updateError;

        const { error: cleanupError } = await supabase!.from('teacher_class_assignments').delete().eq('class_id', classId);
        if (cleanupError && !isMissingTable(cleanupError)) throw cleanupError;

        const classAssignment = {
          subject: classRow.subject_name ?? classRow.label ?? classRow.name,
          grade: classRow.grade ?? '',
          classId: classRow.id,
          medium: classRow.medium ?? '',
        };

        if (nextTeacherId) {
          const { error: assignmentError } = await supabase!.from('teacher_class_assignments').upsert({
            id: `${nextTeacherId}-${classId}`,
            teacher_id: nextTeacherId,
            class_id: classId,
            role: 'primary',
            is_active: true,
          }, { onConflict: 'teacher_id,class_id' });
          if (assignmentError) throw assignmentError;

          const { data: teacherRow, error: teacherLookupError } = await supabase!
            .from('teachers')
            .select('id,assigned_subjects,subject,grade')
            .eq('id', nextTeacherId)
            .maybeSingle();
          if (teacherLookupError) throw teacherLookupError;
          if (teacherRow) {
            const assignments = normalizeAssignments(teacherRow.assigned_subjects, teacherRow.subject ?? '', teacherRow.grade ?? '');
            const mergedAssignments = [
              ...assignments.filter((assignment) => assignment.classId !== classId),
              classAssignment,
            ];
            const { error: teacherUpdateError } = await supabase!
              .from('teachers')
              .update({ assigned_subjects: mergedAssignments })
              .eq('id', nextTeacherId);
            if (teacherUpdateError) throw teacherUpdateError;
          }
        }

        if (previousTeacherId && previousTeacherId !== nextTeacherId) {
          const { data: previousTeacher, error: previousTeacherError } = await supabase!
            .from('teachers')
            .select('id,assigned_subjects,subject,grade')
            .eq('id', previousTeacherId)
            .maybeSingle();
          if (previousTeacherError) throw previousTeacherError;
          if (previousTeacher) {
            const assignments = normalizeAssignments(previousTeacher.assigned_subjects, previousTeacher.subject ?? '', previousTeacher.grade ?? '')
              .filter((assignment) => assignment.classId !== classId);
            const { error: previousTeacherUpdateError } = await supabase!
              .from('teachers')
              .update({ assigned_subjects: assignments })
              .eq('id', previousTeacherId);
            if (previousTeacherUpdateError) throw previousTeacherUpdateError;
          }
        }

        const { data: updatedClass, error: reloadError } = await supabase!
          .from('classes')
          .select('*')
          .eq('id', classId)
          .maybeSingle();
        if (reloadError) throw reloadError;
        return updatedClass ? mapClass(updatedClass) : null;
      }, () => {
        const classItem = store.classes.find((item) => item.id === classId);
        if (!classItem) return null;
        const previousTeacherId = classItem.teacherId ?? null;
        const nextTeacherId = teacherId?.trim() || null;

        classItem.teacherId = nextTeacherId;
        const assignment = {
          subject: classItem.subjectName ?? classItem.label ?? classItem.name,
          grade: classItem.grade,
          classId: classItem.id,
          medium: classItem.medium,
        };

        store.teachers = store.teachers.map((teacher) => {
          if (teacher.id !== nextTeacherId && teacher.id !== previousTeacherId) {
            return {
              ...teacher,
              assignments: teacher.assignments.filter((item) => item.classId !== classId),
            };
          }

          if (teacher.id === previousTeacherId && teacher.id !== nextTeacherId) {
            return {
              ...teacher,
              assignments: teacher.assignments.filter((item) => item.classId !== classId),
            };
          }

          return {
            ...teacher,
            assignments: [
              ...teacher.assignments.filter((item) => item.classId !== classId),
              assignment,
            ],
          };
        });

        return classItem;
      });
    },

  async createStudent(input: Omit<AdminStudent, 'id' | 'marks' | 'grade'> & { grade?: string }) {
    return withFallback(async () => {
      const student = buildStudent(input);
      const { error } = await supabase!.from('students').upsert({
        id: student.id,
        name: student.name,
        index_number: student.index,
        date_of_birth: student.dateOfBirth ?? null,
        class_id: student.classId,
        parent_name: student.parentName,
        parent_phone: student.parentPhone,
        password_hash: demoPasswordHash,
      });
      if (error) {
        if (isMissingTable(error)) {
          const { error: retryError } = await supabase!.from('students').upsert({
            id: student.id,
            name: student.name,
            index_number: student.index,
            class_id: student.classId,
            parent_name: student.parentName,
            parent_phone: student.parentPhone,
            password_hash: demoPasswordHash,
          });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      const classItem = (await this.getClasses()).find((item) => item.id === student.classId);
      if (classItem) {
        const enrollment = buildEnrollment({
          studentId: student.id,
          classId: classItem.id,
          academicYear: classItem.academicYear ?? new Date().getFullYear(),
        });
        try {
          const { error: enrollmentError } = await supabase!.from('student_enrollments').upsert({
            id: enrollment.id,
            student_id: enrollment.studentId,
            class_id: enrollment.classId,
            academic_year: enrollment.academicYear,
            status: enrollment.status,
            enrolled_at: enrollment.enrolledAt,
          }, { onConflict: 'student_id,class_id' });
          if (enrollmentError) throw enrollmentError;
        } catch (enrollmentError) {
          if (!isMissingTable(enrollmentError)) throw enrollmentError;
        }
      }
      return student;
    }, () => createMemoryStudent(input));
  },

  async createStudentWithUser(input: {
    student: Omit<AdminStudent, 'id' | 'marks' | 'grade'> & { grade?: string };
    user: {
      username: string;
      email: string;
      passwordHash: string;
      isActive?: boolean;
    };
  }) {
    return withFallback(async () => {
      const student = buildStudent(input.student);
      const normalizedDateOfBirth = typeof student.dateOfBirth === 'string' && student.dateOfBirth.trim()
        ? student.dateOfBirth
        : null;
      const user = buildUser({
        name: student.name,
        username: input.user.username.trim().toLowerCase(),
        email: input.user.email.trim().toLowerCase(),
        role: 'student',
        studentId: student.id,
        passwordHash: input.user.passwordHash,
        isActive: input.user.isActive ?? true,
      });

      const { error } = await supabase!.rpc('create_student_with_user', {
        p_student_id: student.id,
        p_student_name: student.name,
        p_index_number: student.index,
        p_date_of_birth: normalizedDateOfBirth,
        p_class_id: student.classId,
        p_parent_name: student.parentName ?? null,
        p_parent_phone: student.parentPhone ?? null,
        p_student_password_hash: demoPasswordHash,
        p_user_id: user.id,
        p_username: user.username,
        p_email: user.email,
        p_user_password_hash: user.passwordHash,
        p_is_active: user.isActive ?? true,
      });

      if (error) {
        const code = String((error as { code?: string }).code ?? '');
        const message = String((error as { message?: string }).message ?? '').toLowerCase();

        // Fall back to non-RPC flow if the function is not deployed yet.
        if (code === 'PGRST202' || message.includes('create_student_with_user')) {
          const fallbackStudent = await this.createStudent(input.student);
          const fallbackUser = await this.createUser({
            name: fallbackStudent.name,
            username: input.user.username.trim().toLowerCase(),
            email: input.user.email.trim().toLowerCase(),
            role: 'student',
            studentId: fallbackStudent.id,
            passwordHash: input.user.passwordHash,
            isActive: input.user.isActive ?? true,
          });

          return { student: fallbackStudent, user: fallbackUser };
        }

        throw error;
      }

      return {
        student,
        user: mapUser({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          student_id: user.studentId,
          teacher_id: null,
          password_hash: user.passwordHash,
          is_active: user.isActive,
        }),
      };
    }, () => {
      const student = createMemoryStudent(input.student);
      const user = createMemoryUser({
        name: student.name,
        username: input.user.username.trim().toLowerCase(),
        email: input.user.email.trim().toLowerCase(),
        role: 'student',
        studentId: student.id,
        passwordHash: input.user.passwordHash,
        isActive: input.user.isActive ?? true,
      });

      return { student, user };
    });
  },

  async enrollStudent(input: { studentId: string; classId: string }) {
    return withFallback(async () => {
      const classItem = (await this.getClasses()).find((item) => item.id === input.classId);
      if (!classItem) return null;
      const enrollment = buildEnrollment({
        studentId: input.studentId,
        classId: input.classId,
        academicYear: classItem.academicYear ?? new Date().getFullYear(),
      });
      const { error } = await supabase!.from('student_enrollments').upsert({
        id: enrollment.id,
        student_id: enrollment.studentId,
        class_id: enrollment.classId,
        academic_year: enrollment.academicYear,
        status: enrollment.status,
        enrolled_at: enrollment.enrolledAt,
      }, { onConflict: 'student_id,class_id' });
      if (error) throw error;

      const { data: studentRow, error: studentLookupError } = await supabase!
        .from('students')
        .select('class_id')
        .eq('id', enrollment.studentId)
        .maybeSingle();
      if (studentLookupError && !isMissingTable(studentLookupError)) throw studentLookupError;

      if (studentRow && !studentRow.class_id) {
        const { error: studentUpdateError } = await supabase!
          .from('students')
          .update({ class_id: enrollment.classId })
          .eq('id', enrollment.studentId);
        if (studentUpdateError && !isMissingTable(studentUpdateError)) throw studentUpdateError;
      }

      return enrollment;
    }, () => {
      const classItem = store.classes.find((item) => item.id === input.classId);
      if (!classItem) return null;
      return createMemoryStudentEnrollment({
        studentId: input.studentId,
        classId: input.classId,
        academicYear: classItem.academicYear ?? new Date().getFullYear(),
      });
    });
  },

  async createTeacher(input: { name: string; subject?: string; grade?: string; email: string; phone: string; assignments?: TeacherAssignment[] }) {
    return withFallback(async () => {
      const teacher = buildTeacher(input);
      const { error } = await supabase!.from('teachers').upsert({
        id: teacher.id,
        name: teacher.name,
        subject: teacher.subject,
        grade: teacher.grade,
        email: teacher.email,
        phone: teacher.phone,
        assigned_subjects: teacher.assignments,
        password_hash: demoPasswordHash,
      });
      if (error) {
        if (isMissingTable(error)) {
          const { error: retryError } = await supabase!.from('teachers').upsert({
            id: teacher.id,
            name: teacher.name,
            subject: teacher.subject,
            email: teacher.email,
            phone: teacher.phone,
            password_hash: demoPasswordHash,
          });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      await Promise.all(teacher.assignments
        .filter((assignment) => assignment.classId)
        .map((assignment) => this.setClassTeacher(assignment.classId, teacher.id)));
      return teacher;
    }, () => createMemoryTeacher(input));
  },

  async createUser(input: Omit<AuthUser, 'id' | 'isActive'> & { passwordHash: string; isActive?: boolean }) {
    return withFallback(async () => {
      const user = buildUser(input);
      const { error } = await supabase!.from('users').upsert({
        id: user.id,
        name: user.name,
        username: user.username.trim().toLowerCase(),
        email: user.email.trim().toLowerCase(),
        password_hash: user.passwordHash,
        role: user.role,
        student_id: user.studentId ?? null,
        teacher_id: user.teacherId ?? null,
        is_active: user.isActive ?? true,
      });
      if (error) throw error;
      return mapUser({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        student_id: user.studentId,
        teacher_id: user.teacherId,
        password_hash: user.passwordHash,
        is_active: user.isActive,
      });
    }, () => createMemoryUser(input));
  },

  async deleteUser(userId: string) {
    return withFallback(async () => {
      const { data: existing, error: lookupError } = await supabase!
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!existing) return false;

      const { error } = await supabase!.from('users').delete().eq('id', userId);
      if (error) throw error;
      return true;
    }, () => deleteMemoryUser(userId));
  },

  async updateUserRole(userId: string, newRole: string) {
    return withFallback(async () => {
      const { data, error } = await supabase!
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .select('id,name,username,email,role,student_id,teacher_id,is_active')
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      return mapUser(data);
    }, () => {
      // For memory fallback, find and update the user
      const user = findMemoryUserById(userId);
      if (!user) return undefined;
      return { ...user, role: newRole as any };
    });
  },

  async deleteStudent(studentId: string) {
    return withFallback(async () => {
      const { data: existing, error: lookupError } = await supabase!
        .from('students')
        .select('id')
        .eq('id', studentId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!existing) return false;

      const { error: userError } = await supabase!.from('users').delete().eq('student_id', studentId);
      if (userError) throw userError;
      const { error: enrollmentError } = await supabase!.from('student_enrollments').delete().eq('student_id', studentId);
      if (enrollmentError && !isMissingTable(enrollmentError)) throw enrollmentError;
      const { error } = await supabase!.from('students').delete().eq('id', studentId);
      if (error) throw error;
      return true;
    }, () => deleteMemoryStudent(studentId));
  },

  async deleteTeacher(teacherId: string) {
    return withFallback(async () => {
      const { data: existing, error: lookupError } = await supabase!
        .from('teachers')
        .select('id')
        .eq('id', teacherId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!existing) return false;

      const { error: userError } = await supabase!.from('users').delete().eq('teacher_id', teacherId);
      if (userError) throw userError;
      const { error: assignmentError } = await supabase!.from('teacher_class_assignments').delete().eq('teacher_id', teacherId);
      if (assignmentError && !isMissingTable(assignmentError)) throw assignmentError;
      const { error } = await supabase!.from('teachers').delete().eq('id', teacherId);
      if (error) throw error;
      return true;
    }, () => deleteMemoryTeacher(teacherId));
  },

  async deleteClass(classId: string) {
    return withFallback(async () => {
      const { data: existing, error: lookupError } = await supabase!
        .from('classes')
        .select('id')
        .eq('id', classId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!existing) return false;

      const { error: assignmentError } = await supabase!.from('teacher_class_assignments').delete().eq('class_id', classId);
      if (assignmentError && !isMissingTable(assignmentError)) throw assignmentError;
      const { error: enrollmentError } = await supabase!.from('student_enrollments').delete().eq('class_id', classId);
      if (enrollmentError && !isMissingTable(enrollmentError)) throw enrollmentError;

      const { data: exams, error: examLookupError } = await supabase!.from('exams').select('id').eq('class_id', classId);
      if (examLookupError && !isMissingTable(examLookupError)) throw examLookupError;
      const examIds = (exams ?? []).map((exam) => exam.id);
      if (examIds.length > 0) {
        const { error: resultError } = await supabase!.from('results').delete().in('exam_id', examIds);
        if (resultError && !isMissingTable(resultError)) throw resultError;
        const { error: examDeleteError } = await supabase!.from('exams').delete().in('id', examIds);
        if (examDeleteError && !isMissingTable(examDeleteError)) throw examDeleteError;
      }

      const { error } = await supabase!.from('classes').delete().eq('id', classId);
      if (error) throw error;
      return true;
    }, () => deleteMemoryClass(classId));
  },

  async deleteEnrollment(params: { studentId: string; classId: string }) {
    return withFallback(async () => {
      const { data: existing, error: lookupError } = await supabase!
        .from('student_enrollments')
        .select('id')
        .eq('student_id', params.studentId)
        .eq('class_id', params.classId);
      if (lookupError) throw lookupError;
      if (!existing || existing.length === 0) return false;

      const { error } = await supabase!
        .from('student_enrollments')
        .delete()
        .eq('student_id', params.studentId)
        .eq('class_id', params.classId);
      if (error) throw error;

      const { data: studentRow, error: studentLookupError } = await supabase!
        .from('students')
        .select('class_id')
        .eq('id', params.studentId)
        .maybeSingle();
      if (studentLookupError && !isMissingTable(studentLookupError)) throw studentLookupError;
      if (studentRow?.class_id === params.classId) {
        const nextClassId = (await getActiveClassIdsForStudent(params.studentId)).find((classId) => classId !== params.classId) ?? null;
        const { error: studentUpdateError } = await supabase!
          .from('students')
          .update({ class_id: nextClassId })
          .eq('id', params.studentId);
        if (studentUpdateError && !isMissingTable(studentUpdateError)) throw studentUpdateError;
      }
      return true;
    }, () => deleteMemoryStudentEnrollment(params));
  },

  async upsertMark(studentId: string, mark: AdminStudentMark) {
    return withFallback<UpsertMarkResult | null>(async () => {
      const classId = mark.classId ?? mark.subjectId;
      if (!classId) return null;
      
      let examId = `${classId}-${slugify(mark.examType)}-${slugify(mark.examName)}-${slugify(mark.examDate)}`;
      
      // Look up if an exam with this name already exists (since IDs don't change on rename)
      let examQuery = supabase!
        .from('exams')
        .select('id')
        .eq('class_id', classId)
        .eq('exam_type', mark.examType)
        .eq('title', mark.examName);
      if (mark.examDate) examQuery = examQuery.eq('exam_date', mark.examDate);

      const { data: existingExams, error: examLookupError } = await examQuery;
      const existingExam = existingExams?.[0];
      if (existingExam) {
        examId = existingExam.id;
      } else if (examLookupError && !isMissingTable(examLookupError)) {
        throw examLookupError;
      }

      const resultId = `${examId}-${studentId}`;
      const { data: existingResults, error: resultLookupError } = await supabase!
        .from('results')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .limit(1);
      if (resultLookupError) throw resultLookupError;
      const action = existingResults?.[0] ? 'updated' : 'created';

      // Run exam upsert and result upsert in parallel
      const [examResult, resultResult] = await Promise.all([
        supabase!.from('exams').upsert({
          id: examId,
          class_id: classId,
          exam_type: mark.examType,
          title: mark.examName,
          exam_date: mark.examDate,
          total_marks: 100,
        }),
        supabase!.from('results').upsert({
          id: resultId,
          exam_id: examId,
          student_id: studentId,
          marks_obtained: mark.mark,
          is_absent: false,
        }, { onConflict: 'exam_id,student_id' }),
      ]);
      if (examResult.error) throw examResult.error;
      if (resultResult.error) throw resultResult.error;

      return {
        mark,
        action,
      };
    }, () => upsertMemoryMark(studentId, mark));
  },


  async deleteMark(params: { studentId: string; subjectId: string; examType: string; examName: string; examDate?: string }) {
    return withFallback(async () => {
      const student = await findStudentForMark(params.studentId);
      if (!student) return null;
      let examQuery = supabase!
        .from('exams')
        .select('id')
        .eq('class_id', params.subjectId)
        .eq('exam_type', params.examType)
        .eq('title', params.examName);
      if (params.examDate) {
        examQuery = examQuery.eq('exam_date', params.examDate);
      }
      const { data: exams, error: examLookupError } = await examQuery;
      if (examLookupError) throw examLookupError;
      const examIds = (exams ?? []).map((exam) => exam.id);
      if (examIds.length === 0) {
        return {
          student: mapStudentWithData(student, new Map((await this.getClasses()).map((classItem) => [classItem.id, classItem])), [], []),
          deleted: false,
        };
      }
      const { error } = await supabase!
        .from('results')
        .delete()
        .eq('student_id', student.id)
        .in('exam_id', examIds);
      if (error) throw error;
      return {
        student: mapStudentWithData(student, new Map((await this.getClasses()).map((classItem) => [classItem.id, classItem])), [], []),
        deleted: true,
      };
    }, () => deleteMemoryMark(params));
  },

  getSubjectsForClass(classId: string) {
    return withFallback(async () => {
      const { data: classRow, error } = await supabase!
        .from('classes')
        .select('id,teacher_id,subject_name,label')
        .eq('id', classId)
        .maybeSingle();
      if (error) throw error;
      if (!classRow) return [];

      const teacher = classRow.teacher_id ? await this.getTeacherById(classRow.teacher_id) : undefined;

      return [
        {
          id: classRow.id,
          name: classRow.subject_name ?? classRow.label ?? classRow.id,
          teacher: teacher?.name ?? 'Unassigned',
        },
      ];
    }, () => getMemorySubjectsForClass(classId));
  },
  async getStudentClassId(studentId: string) {
    return withFallback(async () => {
      const { data, error } = await supabase!
        .from('students')
        .select('class_id')
        .eq('id', studentId)
        .maybeSingle();
      if (error) throw error;
      return data?.class_id ?? undefined;
    }, () => store.students.find((item) => item.id === studentId)?.classId);
  },

  async getStudentClassIds(studentId: string) {
    return withFallback(async () => getActiveClassIdsForStudent(studentId), () => {
      const student = store.students.find((item) => item.id === studentId);
      return Array.from(new Set([
        ...(student?.classId ? [student.classId] : []),
        ...getMemoryStudentEnrollments(studentId).map((item) => item.classId),
      ]));
    });
  },
};

const mapUser = (data: any): DbUser => ({
  id: data.id,
  name: data.name,
  username: data.username ?? data.email,
  email: data.email,
  role: data.role,
  studentId: data.student_id ?? undefined,
  teacherId: data.teacher_id ?? undefined,
  isActive: data.is_active ?? true,
  passwordHash: data.password_hash,
  password_hash: data.password_hash,
});

const mapSubject = (data: any): SubjectRecord => {
  const memorySubject = getMemorySubjectById(data.id);
  const fallbackSubject = memorySubject ?? buildSubjectDefaults(data);

  return {
    ...fallbackSubject,
    id: data.id,
    name: memorySubject?.name ?? data.subject_name ?? data.id,
    teacherId: data.teacher_id ?? null,
    gradeId: data.grade_id ?? null,
    subjectName: data.subject_name ?? null,
    year: data.year ?? null,
    isActive: data.is_active ?? null,
    createdAt: data.created_at ?? null,
  };
};

const mapStudent = (data: any): AdminStudent => mapStudentWithData(data, new Map(), [], []);

const mapStudentWithData = (
  data: any,
  classById: Map<string, import('../types.js').AdminClassOption>,
  marks: AdminStudentMark[],
  enrollments: import('../types.js').StudentEnrollment[],
): AdminStudent => {
  const primaryClass = classById.get(data.class_id ?? '') ?? classById.get(enrollments[0]?.classId ?? '');

  return {
    id: data.id,
    name: data.name,
    index: data.index_number,
    dateOfBirth: data.date_of_birth ?? undefined,
    grade: primaryClass?.grade ?? 'Unassigned',
    classId: data.class_id ?? enrollments[0]?.classId ?? '',
    enrollments,
    parentName: data.parent_name ?? undefined,
    parentPhone: data.parent_phone ?? undefined,
    marks,
  };
};

const mapTeacher = (data: any): AdminTeacher => ({
  id: data.id,
  name: data.name,
  subject: data.subject ?? '',
  grade: data.grade ?? '',
  email: data.email,
  phone: data.phone,
  assignments: normalizeAssignments(data.assigned_subjects, data.subject ?? '', data.grade ?? ''),
});

const mapClass = (data: any): import('../types.js').AdminClassOption => ({
  id: data.id,
  teacherId: data.teacher_id ?? null,
  grade: data.grade,
  name: data.name,
  label: data.label,
  medium: data.medium,
  subjectId: data.id,
  subjectName: data.subject_name ?? undefined,
  academicYear: data.academic_year ?? undefined,
  schedule: data.schedule ?? undefined,
  fee: data.fee ?? undefined,
  isActive: data.is_active ?? true,
});

const mapClassAsSubject = (classItem: import('../types.js').AdminClassOption, teacherName?: string): SubjectRecord => {
  const memorySubject = getMemorySubjectById(classItem.id);
  const fallbackSubject = memorySubject ?? buildSubjectDefaults({
    id: classItem.id,
    subject_name: classItem.subjectName ?? classItem.label,
  });

  return {
    ...fallbackSubject,
    id: classItem.id,
    name: classItem.subjectName ?? classItem.label ?? classItem.id,
    teacher: teacherName ?? memorySubject?.teacher ?? 'Unassigned',
    classLabel: classItem.label,
    teacherId: classItem.teacherId ?? null,
    gradeId: classItem.grade,
    subjectName: classItem.subjectName ?? null,
    medium: classItem.medium,
    schedule: classItem.schedule ?? null,
    fee: classItem.fee ?? null,
    year: classItem.academicYear ?? null,
    isActive: classItem.isActive ?? true,
    createdAt: null,
  };
};

const mapModuleItemType = (value: string | null | undefined): SubjectModuleItem['type'] => {
  if (value === 'mark' || value === 'link' || value === 'text') return value;
  return 'text';
};

const buildMemorySubjectModules = (subjectId: string): SubjectModule[] => {
  // Build modules dynamically from in-memory marks instead of hardcoding topic names
  // Collect all marks related to this subject/class from students
  const allMarks = store.students.flatMap((s) => s.marks.map((m) => ({ studentId: s.id, studentName: s.name, ...m })));
  const relevant = allMarks.filter((m) => m.subjectId === subjectId || m.classId === subjectId);
  if (relevant.length === 0) return [];

  // Group by assignment key (examType + examName + examDate)
  const groups = new Map<string, { examName: string; examType: string; examDate?: string; items: any[] }>();
  relevant.forEach((m) => {
    const key = `${m.examType}::${m.examName}::${m.examDate ?? ''}`;
    const existing = groups.get(key) ?? { examName: m.examName, examType: m.examType, examDate: m.examDate, items: [] };
    existing.items.push(m);
    groups.set(key, existing);
  });

  const assignments = Array.from(groups.values()).sort((a, b) => {
    if (!a.examDate && !b.examDate) return 0;
    if (!a.examDate) return 1;
    if (!b.examDate) return -1;
    return String(b.examDate).localeCompare(String(a.examDate));
  });

  return assignments.map((asg, idx) => ({
    id: `${subjectId}-assignment-${idx + 1}`,
    title: asg.examName || asg.examType,
    items: asg.items.map((m: any, itemIdx: number) => ({
      id: `${subjectId}-assignment-${idx + 1}-item-${itemIdx + 1}`,
      title: `${m.examName}: ${m.mark !== null && m.mark !== undefined ? `${m.mark}` : 'Absent'}`,
      type: 'mark' as const,
      moduleId: `${subjectId}-assignment-${idx + 1}`,
      classId: m.classId ?? undefined,
      createdAt: m.examDate ?? null,
    })),
  }));
};

const normalizeAssignments = (value: unknown, subject: string, grade: string): TeacherAssignment[] => {
  if (Array.isArray(value) && value.length > 0) {
    return value
      .map((item) => ({
        subject: String(item?.subject ?? subject),
        grade: String(item?.grade ?? grade),
        classId: String(item?.classId ?? ''),
        medium: String(item?.medium ?? ''),
      }))
      .filter((item) => item.subject && item.grade);
  }

  return [];
};

const buildClass = (input: { grade: string; name: string; label: string; medium: string; teacherId?: string | null; subjectName?: string; academicYear?: number; schedule?: string; fee?: number }) => {
  const normalizedGrade = input.grade.trim();
  const normalizedName = input.name.trim();
  const normalizedMedium = input.medium.trim();

  return {
    id: createId('cls'),
    teacherId: input.teacherId ?? null,
    grade: normalizedGrade,
    name: normalizedName,
    medium: normalizedMedium,
    label: input.label || `${normalizedGrade} - ${normalizedName} - ${normalizedMedium} Medium`,
    subjectName: input.subjectName,
    academicYear: input.academicYear,
    schedule: input.schedule,
    fee: input.fee,
    isActive: true,
  };
};

const buildStudent = (input: Omit<AdminStudent, 'id' | 'marks' | 'grade'> & { grade?: string }): AdminStudent => {
  const classItem = store.classes.find((item) => item.id === input.classId);
  return {
    id: createId('st'),
    name: input.name,
    index: input.index,
    dateOfBirth: input.dateOfBirth,
    grade: classItem?.grade ?? input.grade ?? 'Unassigned',
    classId: input.classId,
    enrollments: [],
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    marks: [],
  };
};

const buildTeacher = (input: { name: string; subject?: string; grade?: string; email: string; phone: string; assignments?: TeacherAssignment[] }): AdminTeacher => ({
  id: createId('t'),
  name: input.name,
  subject: input.subject ?? '',
  grade: input.grade ?? '',
  email: input.email,
  phone: input.phone,
  assignments: input.assignments ?? [],
});

const buildUser = (input: Omit<AuthUser, 'id' | 'isActive'> & { passwordHash: string; isActive?: boolean }) => ({
  id: createId('user'),
  ...input,
  isActive: input.isActive ?? true,
});

const buildEnrollment = (input: { studentId: string; classId: string; academicYear: number }) => ({
  id: `enr-${input.studentId}-${input.classId}`,
  studentId: input.studentId,
  classId: input.classId,
  academicYear: input.academicYear,
  status: 'active' as const,
  enrolledAt: new Date().toISOString(),
});

const uniqueBy = <T>(items: T[], keyOf: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const resolveTermInfo = (academicYear?: number) => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const term = month <= 4 ? 'Term 1' : month <= 8 ? 'Term 2' : 'Term 3';
  return {
    term,
    year: academicYear ?? today.getFullYear(),
  };
};

const getActiveClassIdsForStudent = async (studentId: string) => {
  const { data: enrollments, error: enrollmentError } = await supabase!
    .from('student_enrollments')
    .select('class_id,status')
    .eq('student_id', studentId);
  if (enrollmentError) throw enrollmentError;

  const { data: student, error: studentError } = await supabase!
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .maybeSingle();
  if (studentError) throw studentError;

  return Array.from(new Set([
    ...(student?.class_id ? [student.class_id] : []),
    ...((enrollments ?? [])
      .filter((item) => !item.status || item.status === 'active')
      .map((item) => item.class_id)
      .filter(Boolean) as string[]),
  ]));
};

const getActiveEnrollmentsByStudentId = async () => {
  const { data, error } = await supabase!
    .from('student_enrollments')
    .select('id,student_id,class_id,academic_year,status,enrolled_at');
  if (error) throw error;

  const map = new Map<string, import('../types.js').StudentEnrollment[]>();
  (data ?? []).forEach((row) => {
    if (row.status && row.status !== 'active') return;
    const enrollment = {
      id: row.id,
      studentId: row.student_id,
      classId: row.class_id,
      academicYear: row.academic_year,
      status: row.status ?? 'active',
      enrolledAt: row.enrolled_at,
    } as import('../types.js').StudentEnrollment;
    map.set(row.student_id, [enrollment, ...(map.get(row.student_id) ?? [])]);
  });
  return map;
};

const getMarksByStudentId = async () => {
  const [{ data: exams, error: examError }, { data: classes, error: classError }] = await Promise.all([
    supabase!
      .from('exams')
      .select('id,class_id,exam_type,title,exam_date'),
    supabase!
      .from('classes')
      .select('id,subject_name,label'),
  ]);
  if (examError) throw examError;
  if (classError) throw classError;

  const examById = new Map((exams ?? []).map((exam) => [exam.id, exam]));
  const classById = new Map((classes ?? []).map((classItem) => [classItem.id, classItem]));
  if (examById.size === 0) return new Map<string, AdminStudentMark[]>();

  const { data: results, error: resultError } = await supabase!
    .from('results')
    .select('exam_id,student_id,marks_obtained,is_absent');
  if (resultError) throw resultError;

  const map = new Map<string, AdminStudentMark[]>();
  (results ?? []).forEach((result) => {
    if (result.is_absent || result.marks_obtained === null) return;
    const exam = examById.get(result.exam_id);
    if (!exam) return;
    const classItem = classById.get(exam.class_id);
    const mark: AdminStudentMark = {
      subjectId: exam.class_id,
      subjectName: classItem?.subject_name ?? classItem?.label ?? exam.class_id,
      classId: exam.class_id,
      examType: exam.exam_type,
      examName: exam.title,
      examDate: exam.exam_date,
      mark: Number(result.marks_obtained),
    };
    map.set(result.student_id, [mark, ...(map.get(result.student_id) ?? [])]);
  });
  return map;
};

const findStudentForMark = async (studentIdOrIndex: string) => {
  const normalized = studentIdOrIndex.trim();
  const { data, error } = await supabase!
    .from('students')
    .select('id,name,index_number,date_of_birth,class_id,parent_name,parent_phone')
    .or(`id.eq.${normalized},index_number.eq.${normalized}`)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const emptyClassMetrics = (): Partial<SubjectRecord> => ({
  currentMark: 0,
  classAvg: 0,
  rank: 0,
  trend: 'neutral',
});

const getClassMetricsByClassId = async (classIds: string[], studentId: string): Promise<Map<string, Partial<SubjectRecord>>> => {
  const metricsByClassId = new Map<string, Partial<SubjectRecord>>();
  classIds.forEach((classId) => metricsByClassId.set(classId, emptyClassMetrics()));
  if (classIds.length === 0) return metricsByClassId;

  const { data: exams, error: examError } = await supabase!
    .from('exams')
    .select('id,class_id,exam_type,exam_date')
    .in('class_id', classIds);
  if (examError) throw examError;
  const examRows = exams ?? [];
  if (examRows.length === 0) return metricsByClassId;

  const examIds = examRows.map((exam) => exam.id);
  const { data: results, error: resultError } = await supabase!
    .from('results')
    .select('exam_id,student_id,marks_obtained,is_absent')
    .in('exam_id', examIds);
  if (resultError) throw resultError;

  const classIdByExamId = new Map(examRows.map((exam) => [exam.id, exam.class_id]));
  const scoredResults = (results ?? []).filter((result) => !result.is_absent && result.marks_obtained !== null);

  classIds.forEach((classId) => {
    const classResults = scoredResults.filter((result) => classIdByExamId.get(result.exam_id) === classId);
    const studentResults = classResults.filter((result) => result.student_id === studentId);
    const studentAverage = studentResults.length
      ? Math.round(studentResults.reduce((sum, result) => sum + Number(result.marks_obtained ?? 0), 0) / studentResults.length)
      : 0;
    const classAverage = classResults.length
      ? Math.round(classResults.reduce((sum, result) => sum + Number(result.marks_obtained ?? 0), 0) / classResults.length)
      : 0;
    const totalsByStudent = new Map<string, { total: number; count: number }>();
    classResults.forEach((result) => {
      const stats = totalsByStudent.get(result.student_id) ?? { total: 0, count: 0 };
      stats.total += Number(result.marks_obtained ?? 0);
      stats.count += 1;
      totalsByStudent.set(result.student_id, stats);
    });
    const rankedStudentIds = Array.from(totalsByStudent.entries())
      .map(([id, stats]) => ({ id, average: stats.count ? stats.total / stats.count : 0 }))
      .sort((a, b) => b.average - a.average)
      .map((entry) => entry.id);
    const rank = rankedStudentIds.indexOf(studentId) + 1;

    metricsByClassId.set(classId, {
      currentMark: studentAverage,
      classAvg: classAverage,
      rank,
      trend: studentAverage >= classAverage ? 'up' : studentAverage > 0 ? 'down' : 'neutral',
    });
  });

  return metricsByClassId;
};

const buildMonthKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleString('en-GB', { month: 'short' });
};

const buildEmptyProgressSeries = () => {
  const month = new Date().toLocaleString('en-GB', { month: 'short' });
  return [{ month, score: 0, classAvg: 0 }];
};

const buildProgressSeries = (
  exams: Array<{ id: string; exam_date: string }>,
  results: Array<{ exam_id: string; student_id: string; marks_obtained: number | null; is_absent: boolean | null }>,
  studentId: string,
) => {
  const examDateById = new Map(exams.map((exam) => [exam.id, exam.exam_date]));
  const statsByMonth = new Map<string, { studentTotal: number; studentCount: number; classTotal: number; classCount: number }>();

  results.forEach((result) => {
    if (result.is_absent || result.marks_obtained === null) return;
    const examDate = examDateById.get(result.exam_id);
    if (!examDate) return;
    const monthKey = buildMonthKey(examDate);
    if (!monthKey) return;

    const stats = statsByMonth.get(monthKey) ?? { studentTotal: 0, studentCount: 0, classTotal: 0, classCount: 0 };
    const markValue = Number(result.marks_obtained);
    stats.classTotal += markValue;
    stats.classCount += 1;

    if (result.student_id === studentId) {
      stats.studentTotal += markValue;
      stats.studentCount += 1;
    }

    statsByMonth.set(monthKey, stats);
  });

  const entries = Array.from(statsByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return buildEmptyProgressSeries();

  return entries.map(([monthKey, stats]) => ({
    month: formatMonthLabel(monthKey),
    score: stats.studentCount ? Math.round(stats.studentTotal / stats.studentCount) : 0,
    classAvg: stats.classCount ? Math.round(stats.classTotal / stats.classCount) : 0,
  }));
};

const buildProgressSeriesFromMemory = (studentId: string) => {
  const student = store.students.find((item) => item.id === studentId);
  if (!student) return buildEmptyProgressSeries();
  const classId = student.classId;
  const classStudents = store.students.filter((item) => item.classId === classId);
  const statsByMonth = new Map<string, { studentTotal: number; studentCount: number; classTotal: number; classCount: number }>();

  classStudents.forEach((classmate) => {
    classmate.marks.forEach((mark) => {
      if (mark.classId && mark.classId !== classId) return;
      const monthKey = buildMonthKey(mark.examDate);
      if (!monthKey) return;

      const stats = statsByMonth.get(monthKey) ?? { studentTotal: 0, studentCount: 0, classTotal: 0, classCount: 0 };
      stats.classTotal += mark.mark;
      stats.classCount += 1;
      if (classmate.id === studentId) {
        stats.studentTotal += mark.mark;
        stats.studentCount += 1;
      }
      statsByMonth.set(monthKey, stats);
    });
  });

  const entries = Array.from(statsByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return buildEmptyProgressSeries();

  return entries.map(([monthKey, stats]) => ({
    month: formatMonthLabel(monthKey),
    score: stats.studentCount ? Math.round(stats.studentTotal / stats.studentCount) : 0,
    classAvg: stats.classCount ? Math.round(stats.classTotal / stats.classCount) : 0,
  }));
};

const buildEmptyPerformanceSummary = () => ({
  averageMark: 0,
  bestSubject: 'N/A',
  subjectsCount: 0,
  examsCount: 0,
});

const buildPerformanceSummary = (
  exams: Array<{ id: string; class_id: string }>,
  results: Array<{ exam_id: string; student_id: string; marks_obtained: number | null; is_absent: boolean | null }>,
  classById = new Map<string, import('../types.js').AdminClassOption>(),
) => {
  const examClassById = new Map(exams.map((exam) => [exam.id, exam.class_id]));
  const classTotals = new Map<string, { total: number; count: number }>();
  let overallTotal = 0;
  let overallCount = 0;

  results.forEach((result) => {
    if (result.is_absent || result.marks_obtained === null) return;
    const classId = examClassById.get(result.exam_id);
    if (!classId) return;
    const stats = classTotals.get(classId) ?? { total: 0, count: 0 };
    const markValue = Number(result.marks_obtained);
    stats.total += markValue;
    stats.count += 1;
    classTotals.set(classId, stats);
    overallTotal += markValue;
    overallCount += 1;
  });

  const classAverages = Array.from(classTotals.entries()).map(([classId, stats]) => ({
    classId,
    average: stats.count ? Math.round(stats.total / stats.count) : 0,
  }));
  const bestClass = classAverages.sort((a, b) => b.average - a.average)[0];

  return {
    averageMark: overallCount ? Math.round(overallTotal / overallCount) : 0,
    bestSubject: bestClass ? (classById.get(bestClass.classId)?.subjectName ?? classById.get(bestClass.classId)?.label ?? bestClass.classId) : 'N/A',
    subjectsCount: classAverages.length,
    examsCount: overallCount,
  };
};

const buildPerformanceSummaryFromMemory = (studentId: string) => {
  const student = store.students.find((item) => item.id === studentId);
  if (!student) return buildEmptyPerformanceSummary();
  const subjectTotals = new Map<string, { total: number; count: number }>();
  let overallTotal = 0;
  let overallCount = 0;

  student.marks.forEach((mark) => {
    const stats = subjectTotals.get(mark.subjectId) ?? { total: 0, count: 0 };
    stats.total += mark.mark;
    stats.count += 1;
    subjectTotals.set(mark.subjectId, stats);
    overallTotal += mark.mark;
    overallCount += 1;
  });

  const subjectAverages = Array.from(subjectTotals.entries()).map(([subjectId, stats]) => ({
    subjectId,
    average: stats.count ? Math.round(stats.total / stats.count) : 0,
  }));
  const bestSubject = subjectAverages.sort((a, b) => b.average - a.average)[0];

  return {
    averageMark: overallCount ? Math.round(overallTotal / overallCount) : 0,
    bestSubject: bestSubject ? (getMemorySubjectById(bestSubject.subjectId)?.name ?? bestSubject.subjectId) : 'N/A',
    subjectsCount: subjectAverages.length,
    examsCount: overallCount,
  };
};

const buildLeaderboardEntries = (
  results: Array<{ exam_id: string; student_id: string; marks_obtained: number | null; is_absent: boolean | null }>,
  students: Array<{ id: string; name: string }>,
  viewerStudentId?: string,
) => {
  const totals = new Map<string, { total: number; count: number }>();
  results.forEach((result) => {
    if (result.is_absent || result.marks_obtained === null) return;
    const stats = totals.get(result.student_id) ?? { total: 0, count: 0 };
    stats.total += Number(result.marks_obtained);
    stats.count += 1;
    totals.set(result.student_id, stats);
  });

  const studentById = new Map(students.map((student) => [student.id, student]));
  const ranked = Array.from(totals.entries())
    .map(([studentId, stats]) => {
      const student = studentById.get(studentId);
      const name = student?.name ?? 'Student';
      return {
        studentId,
        name,
        marks: stats.count ? Math.round(stats.total / stats.count) : 0,
        avatar: name.charAt(0).toUpperCase(),
      };
    })
    .sort((a, b) => b.marks - a.marks)
    .map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      marks: entry.marks,
      avatar: entry.avatar,
      badge: index === 0 ? ('gold' as const) : index === 1 ? ('silver' as const) : index === 2 ? ('bronze' as const) : null,
      isYou: viewerStudentId ? entry.studentId === viewerStudentId : false,
    }));

  return ranked;
};

const buildLeaderboardFromMemory = (subjectId: string, classId: string, viewerStudentId?: string) => {
  const classStudents = store.students.filter((student) => student.classId === classId);
  const summaries = classStudents
    .map((student) => {
      const marks = student.marks.filter((mark) => mark.subjectId === subjectId && (!mark.classId || mark.classId === classId));
      if (marks.length === 0) return null;
      const total = marks.reduce((sum, mark) => sum + mark.mark, 0);
      return {
        studentId: student.id,
        name: student.name,
        marks: Math.round(total / marks.length),
      };
    })
    .filter((item): item is { studentId: string; name: string; marks: number } => item !== null)
    .sort((a, b) => b.marks - a.marks)
    .map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      marks: entry.marks,
      avatar: entry.name.charAt(0).toUpperCase(),
      badge: index === 0 ? ('gold' as const) : index === 1 ? ('silver' as const) : index === 2 ? ('bronze' as const) : null,
      isYou: viewerStudentId ? entry.studentId === viewerStudentId : false,
    }));

  return summaries;
};

const buildSubjectDefaults = (data: { id?: string; subject_name?: string | null }) => {
  const id = data.id ?? 'subject';
  const name = data.subject_name ?? id;
  return {
    id,
    name,
    emoji: name.charAt(0).toUpperCase(),
    color: subjectColorFromId(id),
    teacher: 'TBA',
    classLabel: name,
    rank: 0,
    trend: 'neutral' as const,
    currentMark: 0,
    classAvg: 0,
    nextExam: '',
    termTest: 0,
    dayPaper: 0,
    monthTest: 0,
    history: [],
    homeworkDoneThisMonth: 0,
    homeworkTargetThisMonth: 0,
    recentHomeworks: [],
  } satisfies SubjectRecord;
};

const subjectColorFromId = (id: string) => {
  const palette = ['#D9232D', '#F47920', '#1B3A8C', '#2C55C7', '#A761DD', '#16A34A'];
  const hash = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? palette[0] ?? '#D9232D';
};
