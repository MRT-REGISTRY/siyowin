import { repo } from '../data/repository.js';
import { supabase } from '../config/supabase.js';
import { store } from '../data/store.js';

const slugifyLocal = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const getTeacherAssignmentAccess = (teacher: any) => {
  const assignments = teacher.assignments.length > 0
    ? teacher.assignments
    : [{ subject: teacher.subject, grade: teacher.grade, classId: '', medium: '' }];

  return {
    assignments,
    assignedSubjectNames: new Set(assignments.map((assignment: any) => String(assignment.subject ?? '').toLowerCase())),
    assignedClassIds: new Set(assignments.map((assignment: any) => assignment.classId).filter(Boolean)),
  };
};

const canManageSubject = (teacher: any, subject: any) => {
  const { assignedSubjectNames, assignedClassIds } = getTeacherAssignmentAccess(teacher);
  return (
    assignedClassIds.has(subject.id) ||
    subject.teacher === teacher.name ||
    assignedSubjectNames.has(String(subject.name ?? '').toLowerCase()) ||
    String(subject.name ?? '').toLowerCase() === String(teacher.subject ?? '').toLowerCase()
  );
};

export const teacherService = {
  async getDashboard(teacherId: string | undefined) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const allSubjects = await repo.getSubjects();
    const classes = await repo.getClasses();
    const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));
    
    const { assignments, assignedSubjectNames, assignedClassIds } = getTeacherAssignmentAccess(teacher);
    
    const subjects = allSubjects.filter((subject) =>
      assignedClassIds.has(subject.id) || subject.teacher === teacher.name || assignedSubjectNames.has(subject.name.toLowerCase()),
    );
    
    const studentsByAssignment = await Promise.all(assignments.map((assignment: any) =>
      repo.getStudents({ grade: assignment.grade, classId: assignment.classId || undefined }),
    ));
    const students = Array.from(new Map(studentsByAssignment.flat().map((student) => [student.id, student])).values());
    const subjectIds = new Set(subjects.map((subject) => subject.id));
    const marks = students.flatMap((student) =>
      student.marks
        .filter((mark: any) => subjectIds.has(mark.subjectId))
        .map((mark: any) => ({
          ...mark,
          studentId: student.id,
          studentName: student.name,
          studentIndex: student.index,
        })),
    );

    const averageMark = marks.length > 0
      ? Math.round(marks.reduce((total, mark) => total + mark.mark, 0) / marks.length)
      : 0;

    let dbExams: Array<{ id: string; classId: string; examType: string; examName: string; examDate: string; markedStudentCount: number }> = [];
    if (supabase && subjectIds.size > 0) {
      const { data: examRows } = await supabase
        .from('exams')
        .select('id,class_id,exam_type,title,exam_date')
        .in('class_id', Array.from(subjectIds))
        .neq('exam_type', 'homework')
        .order('exam_date', { ascending: false });

      if (examRows && examRows.length > 0) {
        const examIds = examRows.map((e) => e.id);
        const { data: resultCounts } = await supabase
          .from('results')
          .select('exam_id')
          .in('exam_id', examIds);

        const countByExamId = new Map<string, number>();
        for (const row of resultCounts ?? []) {
          countByExamId.set(row.exam_id, (countByExamId.get(row.exam_id) ?? 0) + 1);
        }

        dbExams = examRows.map((e) => ({
          id: e.id,
          classId: e.class_id,
          examType: e.exam_type,
          examName: e.title,
          examDate: e.exam_date,
          markedStudentCount: countByExamId.get(e.id) ?? 0,
        }));
      }
    }

    const recentAssignments = dbExams.slice(0, 5).map((exam) => {
      const examMarks = marks.filter((m) =>
        m.subjectId === exam.classId &&
        m.examType === exam.examType &&
        m.examName === exam.examName &&
        m.examDate === exam.examDate
      );
      
      const topStudents = examMarks
        .sort((a, b) => b.mark - a.mark)
        .slice(0, 10)
        .map((m) => ({
          id: m.studentId,
          name: m.studentName,
          index: m.studentIndex,
          mark: m.mark
        }));
        
      return {
        ...exam,
        topStudents
      };
    });

    return {
      teacher,
      assignments,
      subjects: subjects.map((subject) => {
        const classItem = classById.get(subject.id);
        const studentCount = students.filter((student) =>
          student.classId === subject.id || student.enrollments?.some((enrollment: any) => enrollment.classId === subject.id),
        ).length;

        return {
          id: subject.id,
          name: subject.name,
          teacher: subject.teacher,
          classLabel: subject.classLabel,
          grade: subject.gradeId ?? classItem?.grade,
          medium: subject.medium ?? classItem?.medium,
          schedule: subject.schedule ?? classItem?.schedule,
          fee: subject.fee ?? classItem?.fee,
          studentCount,
        };
      }),
      students,
      examTypes: store.examTypes,
      dbExams,
      overview: {
        studentsCount: students.length,
        subjectsCount: subjects.length,
        marksCount: marks.length,
        averageMark,
      },
      recentAssignments,
    };
  },

  async addMark(teacherId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subjects = await repo.getSubjects();
    const subject = subjects.find((item) => item.id === data.subjectId);

    const { assignedSubjectNames, assignedClassIds } = getTeacherAssignmentAccess(teacher);

    if (!subject || (!assignedClassIds.has(subject.id) && subject.teacher !== teacher.name && !assignedSubjectNames.has(subject.name.toLowerCase()) && subject.name.toLowerCase() !== teacher.subject.toLowerCase())) {
      throw new Error('You can only manage marks for your assigned subject.');
    }

    if (supabase) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id,class_id')
        .eq('id', data.studentId)
        .maybeSingle();

      if (!studentRow) {
        throw new Error('Student not found.');
      }

      if (studentRow.class_id !== subject.id) {
        const { data: enrollment } = await supabase
          .from('student_enrollments')
          .select('id')
          .eq('student_id', data.studentId)
          .eq('class_id', subject.id)
          .maybeSingle();
        if (!enrollment) {
          throw new Error('You can only manage marks for students enrolled in the selected class.');
        }
      }
    }

    const classId = subject.id;

    const result = await repo.upsertMark(data.studentId, {
      subjectId: subject.id,
      subjectName: subject.name,
      classId,
      examType: data.examType,
      examName: data.examName,
      examDate: data.examDate,
      mark: data.mark,
      note: data.note,
    });

    if (!result) {
      throw new Error('Student not found.');
    }

    return result;
  },

  async addResource(teacherId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(data.classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only add resources to your assigned classes.');
    }

    const resource = await repo.createSubjectResource({
      classId: subject.id,
      moduleId: data.moduleId,
      title: data.title,
      href: data.href,
      type: data.type,
    });

    return { resource };
  },

  async addTopic(teacherId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(data.classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only add topics to your assigned classes.');
    }

    const topic = await repo.createSubjectTopic({
      classId: subject.id,
      title: data.title,
    });

    return { topic };
  },

  async deleteResource(teacherId: string | undefined, classId: string, resourceId: string) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only delete resources from your assigned classes.');
    }

    const deleted = await repo.deleteSubjectResource(subject.id, resourceId);
    if (!deleted) {
      throw new Error('Resource not found.');
    }

    return { message: 'Resource deleted successfully.' };
  },

  async deleteTopic(teacherId: string | undefined, classId: string, moduleId: string) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only delete topics from your assigned classes.');
    }

    const deleted = await repo.deleteSubjectTopic(subject.id, moduleId);
    if (!deleted) {
      throw new Error('Topic not found.');
    }

    return { message: 'Topic deleted successfully.' };
  },

  async getHomework(teacherId: string | undefined, classId: string) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only view homework for your assigned classes.');
    }

    const homeworks = await repo.getClassHomeworks(subject.id);
    return { homeworks };
  },

  async addHomework(teacherId: string | undefined, userId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(data.classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only add homework to your assigned classes.');
    }

    const homework = await repo.createHomework({
      classId: subject.id,
      title: data.title,
      dueDate: data.dueDate,
      createdBy: userId,
    });

    return { homework };
  },

  async completeHomework(teacherId: string | undefined, userId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(data.classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only update homework for your assigned classes.');
    }

    const updated = await repo.setHomeworkCompletion({
      classId: subject.id,
      homeworkId: data.homeworkId,
      studentId: data.studentId,
      isDone: data.isDone,
      updatedBy: userId,
    });

    if (!updated) {
      throw new Error('Homework not found.');
    }

    return { message: 'Homework completion updated.' };
  },

  async deleteHomework(teacherId: string | undefined, classId: string, homeworkId: string) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const subject = await repo.getSubjectById(classId);
    if (!subject) {
      throw new Error('Class subject not found.');
    }

    if (!canManageSubject(teacher, subject)) {
      throw new Error('You can only delete homework from your assigned classes.');
    }

    const deleted = await repo.deleteHomework(subject.id, homeworkId);
    if (!deleted) {
      throw new Error('Homework not found.');
    }

    return { message: 'Homework deleted successfully.' };
  },

  async getStudentProgress(teacherId: string | undefined, studentId: string) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const { assignments } = getTeacherAssignmentAccess(teacher);
    const studentsByAssignment = await Promise.all(assignments.map((assignment: any) =>
      repo.getStudents({ grade: assignment.grade, classId: assignment.classId || undefined }),
    ));
    const allowedStudentIds = new Set(studentsByAssignment.flat().map((student) => student.id));

    if (teacher.assignments.length > 0 && !allowedStudentIds.has(studentId)) {
      throw new Error('You can only view progress for students in your assigned grades and classes.');
    }

    const profile = await repo.getStudentProfile(studentId);
    if (!profile) {
      throw new Error('Student profile not found.');
    }

    const progress = await repo.getStudentProgressSeries(studentId);
    const overview = await repo.getStudentPerformanceSummary(studentId);

    return {
      student: profile,
      overview,
      progress,
    };
  },

  async deleteMark(teacherId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const result = await repo.deleteMark(data);
    if (!result || !result.deleted) {
      throw new Error('Mark not found or could not be deleted.');
    }

    return { message: 'Mark deleted successfully.', student: result.student };
  },

  async createAssignment(teacherId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

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

    return { id: examId, subjectId: data.subjectId, examType: data.examType, examName: data.examName, examDate: data.examDate, markedStudentCount: 0 };
  },

  async updateAssignmentMarks(teacherId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

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
      if (!exams || exams.length === 0) {
        return { message: 'No matching exams found.', updatedCount: 0 };
      }

      let updatedCount = 0;
      for (const exam of exams) {
        const { error: updateError } = await supabase
          .from('exams')
          .update({
            title: newExamName,
            exam_type: newExamType || exam.exam_type,
            exam_date: newExamDate || exam.exam_date,
          })
          .eq('id', exam.id);
        if (updateError) throw updateError;

        const { count } = await supabase
          .from('results')
          .select('id', { count: 'exact', head: true })
          .eq('exam_id', exam.id);
        updatedCount += count ?? 0;
      }

      return { message: `Assignment updated. ${updatedCount} mark(s) affected.`, updatedCount };
    }

    const allStudents = await repo.getStudents({});
    let updatedCount = 0;
    for (const student of allStudents) {
      for (const mark of (student.marks ?? []) as any[]) {
        if (
          mark.subjectId === subjectId &&
          mark.examName === oldExamName &&
          (oldExamType ? mark.examType === oldExamType : true) &&
          (oldExamDate ? mark.examDate === oldExamDate : true)
        ) {
          const updatedMark = {
            ...mark,
            examType: newExamType || mark.examType,
            examName: newExamName,
            examDate: newExamDate || mark.examDate,
          };
          await repo.upsertMark(student.id, updatedMark);
          if (mark.examName !== updatedMark.examName || mark.examType !== updatedMark.examType || mark.examDate !== updatedMark.examDate) {
            await repo.deleteMark({ studentId: student.id, subjectId, examType: mark.examType, examName: mark.examName, examDate: mark.examDate });
          }
          updatedCount++;
        }
      }
    }
    return { message: `Assignment updated. ${updatedCount} mark(s) affected.`, updatedCount };
  },

  async deleteAssignmentMarks(teacherId: string | undefined, data: any) {
    const teacher = await repo.getTeacherById(teacherId);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

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
      if (!exams || exams.length === 0) {
        return { message: 'No matching exams found.', deletedCount: 0 };
      }

      const examIds = exams.map((e) => e.id);

      const { count: deletedCount } = await supabase
        .from('results')
        .select('id', { count: 'exact', head: true })
        .in('exam_id', examIds);

      const { error: resultDeleteError } = await supabase.from('results').delete().in('exam_id', examIds);
      if (resultDeleteError) throw resultDeleteError;
      const { error: examDeleteError } = await supabase.from('exams').delete().in('id', examIds);
      if (examDeleteError) throw examDeleteError;

      return { message: `Assignment deleted. ${deletedCount ?? 0} mark(s) removed.`, deletedCount: deletedCount ?? 0 };
    }

    const allStudents = await repo.getStudents({});
    let deletedCount = 0;
    for (const student of allStudents) {
      for (const mark of (student.marks ?? []) as any[]) {
        if (
          mark.subjectId === subjectId &&
          mark.examName === examName &&
          (examType ? mark.examType === examType : true) &&
          (examDate ? mark.examDate === examDate : true)
        ) {
          await repo.deleteMark({ studentId: student.id, subjectId, examType: mark.examType, examName: mark.examName, examDate: mark.examDate });
          deletedCount++;
        }
      }
    }
    return { message: `Assignment deleted. ${deletedCount} mark(s) removed.`, deletedCount };
  }
};
