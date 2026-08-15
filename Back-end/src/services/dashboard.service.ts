import { repo } from '../data/repository.js';

export const toSubjectResponse = (subject: any) => ({
  id: subject.id,
  class_id: subject.id,
  class_label: subject.classLabel ?? subject.name ?? subject.id,
  grade: subject.gradeId ?? null,
  teacher_id: subject.teacherId ?? null,
  teacher_name: subject.teacher ?? null,
  grade_id: subject.gradeId ?? null,
  subject_name: subject.subjectName ?? subject.name ?? null,
  medium: subject.medium ?? null,
  schedule: subject.schedule ?? null,
  fee: subject.fee ?? null,
  current_mark: subject.currentMark ?? 0,
  class_avg: subject.classAvg ?? 0,
  rank: subject.rank ?? 0,
  year: subject.year ?? null,
  is_active: subject.isActive ?? null,
  created_at: subject.createdAt ?? null,
});

export const dashboardService = {
  async getStudentDashboard(studentId: string | undefined, email: string) {
    const subjects = await repo.getEnrolledSubjects(studentId);
    const profile = await repo.getStudentProfile(studentId);
    
    if (!profile) {
      throw new Error('Student profile not found.');
    }

    return {
      profile: {
        ...profile,
        email,
      },
      overview: await repo.getOverview(subjects),
      subjects: subjects.map(toSubjectResponse),
      latestModuleItems: await repo.getLatestModuleItemsForStudent(studentId),
      latestResults: await repo.getLatestResultsForStudent(studentId),
      progress: await repo.getStudentProgressSeries(studentId),
      homework: subjects.flatMap((subject) =>
        subject.recentHomeworks.map((homework) => ({
          ...homework,
          subjectId: subject.id,
          subjectName: subject.name,
          color: subject.color,
        })),
      ),
    };
  },

  async updateStudentProfile(studentId: string | undefined, email: string, data: {
    name: string;
    address?: string | null;
    school?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
  }) {
    if (!studentId) {
      throw new Error('Student profile is required.');
    }

    const profile = await repo.updateStudentProfile(studentId, data);

    if (!profile) {
      throw new Error('Student profile not found.');
    }

    return {
      profile: {
        ...profile,
        email,
      },
    };
  },

  async getSubjects(studentId?: string) {
    const subjects = await repo.getEnrolledSubjects(studentId);
    return { subjects: subjects.map(toSubjectResponse) };
  },

  async getSubjectById(subjectId: string) {
    const subject = await repo.getSubjectById(subjectId);
    if (!subject) {
      throw new Error('Subject not found.');
    }
    return { subject: toSubjectResponse(subject) };
  },

  async getSubjectResults(subjectId: string, studentId: string | undefined) {
    const subject = await repo.getSubjectById(subjectId);
    if (!subject) {
      throw new Error('Subject not found.');
    }

    if (!studentId) {
      throw new Error('Student profile is required.');
    }

    const enrolledSubjects = await repo.getEnrolledSubjects(studentId);
    if (!enrolledSubjects.some((item) => item.id === subject.id)) {
      throw new Error('You are not enrolled in this subject.');
    }

    const results = await repo.getStudentSubjectResults(studentId, subject.id);

    if (!results.length) {
      return {
        subject: toSubjectResponse(subject),
        results: [],
        recentResults: [],
        previousResults: [],
      };
    }

    const recentResults = results.slice(0, 3);
    const previousResults = results.slice(3);

    return {
      subject: toSubjectResponse(subject),
      results,
      recentResults,
      previousResults,
    };
  },

  async getSubjectModules(subjectId: string, user: { role: string; studentId?: string } | undefined) {
    const subject = await repo.getSubjectById(subjectId);
    if (!subject) {
      throw new Error('Subject not found.');
    }

    if (user?.role === 'student') {
      const studentId = user.studentId;
      if (!studentId) {
        throw new Error('Student profile is required.');
      }

      const enrolledSubjects = await repo.getEnrolledSubjects(studentId);
      if (!enrolledSubjects.some((item) => item.id === subject.id)) {
        throw new Error('You are not enrolled in this subject.');
      }
    }

    const modules = await repo.getSubjectModules(subject.id);
    return {
      subjectId: subject.id,
      modules,
    };
  },

  async getSubjectHomework(subjectId: string, user: { role: string; studentId?: string } | undefined, limitQuery?: any) {
    const subject = await repo.getSubjectById(subjectId);
    if (!subject) {
      throw new Error('Subject not found.');
    }

    if (user?.role === 'student') {
      const studentId = user.studentId;
      if (!studentId) {
        throw new Error('Student profile is required.');
      }

      const enrolledSubjects = await repo.getEnrolledSubjects(studentId);
      if (!enrolledSubjects.some((item) => item.id === subject.id)) {
        throw new Error('You are not enrolled in this subject.');
      }

      const homework = await repo.getStudentSubjectHomeworks(studentId, subject.id);
      const completed = homework.filter((item) => item.status === 'completed').length;
      return {
        subjectId: subject.id,
        homework,
        summary: {
          completed,
          target: homework.length,
          percent: homework.length ? Math.round((completed / homework.length) * 100) : 0,
        },
      };
    }

    const limit = Number(limitQuery ?? 5);
    return {
      subjectId: subject.id,
      homework: subject.recentHomeworks.slice(0, Number.isFinite(limit) ? limit : 5),
      summary: {
        completed: subject.homeworkDoneThisMonth,
        target: subject.homeworkTargetThisMonth,
        percent: subject.homeworkTargetThisMonth
          ? Math.round((subject.homeworkDoneThisMonth / subject.homeworkTargetThisMonth) * 100)
          : 0,
      },
    };
  },

  async getSubjectLeaderboard(subjectId: string, classIdFromQuery: any, studentId?: string) {
    const subject = await repo.getSubjectById(subjectId);
    if (!subject) {
      throw new Error('Subject not found.');
    }

    const classId = typeof classIdFromQuery === 'string' ? classIdFromQuery : subject.id;
    if (!classId) {
      throw new Error('classId is required for leaderboard lookups.');
    }

    return {
      subjectId: subject.id,
      classId,
      leaderboard: await repo.getLeaderboardForSubject(subject.id, classId, studentId),
    };
  },
};
