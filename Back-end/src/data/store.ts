import {
  adminSubjects,
  classes,
  csvColumns,
  examTypes,
  grades,
  leaderboards,
  students,
  subjects,
  teachers,
  users,
} from './seed.js';
import { AdminStudent, AdminStudentMark, AdminTeacher, AuthUser, DashboardOverview, LeaderboardEntry, StudentEnrollment, SubjectModule } from '../types.js';
import { buildMarkKey, normalizeSearchText } from '../utils/marks.js';
import { createId } from '../utils/ids.js';

export const store = {
  users,
  subjects,
  students,
  teachers,
  leaderboards,
  grades,
  classes,
  adminSubjects,
  examTypes,
  csvColumns,
  studentEnrollments: [] as StudentEnrollment[],
  subjectModules: [] as SubjectModule[],
  homeworkAssignments: [] as Array<{ id: string; classId: string; title: string; dueDate: string; records: Array<{ studentId: string; isDone: boolean; updatedAt: string }> }>,
};

export const publicUser = (user: AuthUser): AuthUser => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  teacherId: user.teacherId,
  isActive: user.isActive,
});

export const findUserByEmail = (email: string) =>
  store.users.find((user) => {
    const normalized = email.trim().toLowerCase();
    return user.email.toLowerCase() === normalized || user.username.toLowerCase() === normalized;
  });

export const findUserByUsername = (username: string) =>
  store.users.find((user) => user.username.toLowerCase() === username.trim().toLowerCase());

export const findUserById = (id: string) => store.users.find((user) => user.id === id);

export const getStudentProfile = (studentId?: string) => {
  const student = studentId
    ? store.students.find((item) => item.id === studentId)
    : store.students[0];
  if (!student) return undefined;
  return {
    id: student.id,
    name: student.name,
    index: student.index,
    grade: student.grade,
    classId: student.classId,
    address: student.address,
    school: student.school,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    avatar: student.name.charAt(0).toUpperCase(),
  };
};

export const getDashboardOverview = (): DashboardOverview => {
  const averageMark = Math.round(
    store.subjects.reduce((total, subject) => total + subject.currentMark, 0) / store.subjects.length,
  );
  const bestSubject = [...store.subjects].sort((a, b) => b.currentMark - a.currentMark)[0]?.name ?? 'N/A';
  const homeworkDone = store.subjects.reduce((total, subject) => total + subject.homeworkDoneThisMonth, 0);
  const homeworkTarget = store.subjects.reduce((total, subject) => total + subject.homeworkTargetThisMonth, 0);
  const bestRank = Math.min(...store.subjects.map((subject) => subject.rank));

  return {
    averageMark,
    bestSubject,
    subjectsEnrolled: store.subjects.length,
    homeworkCompletion: homeworkTarget > 0 ? Math.round((homeworkDone / homeworkTarget) * 100) : 0,
    classRank: bestRank,
  };
};

export const getProgressSeries = () => [
  { month: 'Jan', average: 72 },
  { month: 'Feb', average: 76 },
  { month: 'Mar', average: 81 },
  { month: 'Apr', average: 86 },
  { month: 'May', average: 89 },
];

export const getSubjectById = (subjectId: string) => store.subjects.find((subject) => subject.id === subjectId);

export const getLeaderboardForSubject = (subjectId: string): LeaderboardEntry[] =>
  store.leaderboards[subjectId] ??
  store.subjects.slice(0, 5).map((subject, index) => ({
    rank: index + 1,
    name: `${subject.name} Student ${index + 1}`,
    marks: Math.max(60, 100 - index * 3),
    avatar: subject.name.charAt(0),
  }));

export const getClassesForGrade = (grade: string) => store.classes.filter((classItem) => classItem.grade === grade);

export const getSubjectsForClass = (classId: string) => {
  if (!classId) return store.adminSubjects;

  const classItem = store.classes.find((item) => item.id === classId);
  if (classItem?.subjectId) {
    return store.adminSubjects.filter((subject) => subject.id === classItem.subjectId);
  }

  return store.adminSubjects;
};

export const filterStudents = (params: { grade?: string; classId?: string; query?: string }) => {
  const query = normalizeSearchText(params.query ?? '');

  return store.students.filter((student) => {
    const matchesGrade = !params.grade || student.grade === params.grade;
    const matchesClass = !params.classId || student.classId === params.classId;
    const matchesQuery =
      !query ||
      student.name.toLowerCase().includes(query) ||
      student.index.toLowerCase().includes(query);

    return matchesGrade && matchesClass && matchesQuery;
  });
};

export const createStudent = (input: Omit<AdminStudent, 'id' | 'marks' | 'grade'> & { grade?: string; marks?: AdminStudentMark[] }) => {
  const classItem = store.classes.find((item) => item.id === input.classId);
  const enrollment = classItem
    ? createStudentEnrollment({
        studentId: '',
        classId: input.classId,
        academicYear: classItem.academicYear ?? new Date().getFullYear(),
      }, false)
    : null;
  const student: AdminStudent = {
    id: createId('st'),
    name: input.name,
    index: input.index,
    dateOfBirth: input.dateOfBirth,
    address: input.address,
    school: input.school,
    grade: classItem?.grade ?? input.grade ?? 'Unassigned',
    classId: input.classId,
    enrollments: [],
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    marks: input.marks ?? [],
  };

  if (enrollment) {
    enrollment.studentId = student.id;
    student.enrollments = [enrollment];
  }

  store.students.unshift(student);
  return student;
};

export const createStudentEnrollment = (
  input: { studentId: string; classId: string; academicYear: number },
  attachToStudent = true,
) : StudentEnrollment & { status: 'active' } => {
  const enrollment: StudentEnrollment & { status: 'active' } = {
    id: createId('enr'),
    studentId: input.studentId,
    classId: input.classId,
    academicYear: input.academicYear,
    status: 'active',
    enrolledAt: new Date().toISOString(),
  };

  store.studentEnrollments.unshift(enrollment);
  if (attachToStudent) {
    const student = store.students.find((item) => item.id === input.studentId);
    if (student) {
      student.enrollments = [enrollment, ...(student.enrollments ?? [])];
      const classItem = store.classes.find((item) => item.id === input.classId);
      student.classId = input.classId;
      student.grade = classItem?.grade ?? student.grade;
    }
  }

  return enrollment;
};

export const getStudentEnrollments = (studentId: string) =>
  [
    ...store.studentEnrollments.filter((item) => item.studentId === studentId && item.status === 'active'),
    ...(store.students.find((item) => item.id === studentId)?.enrollments ?? []),
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);

export const createTeacher = (input: { name: string; subject?: string; grade?: string; email: string; phone: string; assignments?: AdminTeacher['assignments'] }) => {
  const teacher: AdminTeacher = {
    id: createId('t'),
    name: input.name,
    subject: input.subject ?? '',
    grade: input.grade ?? '',
    email: input.email,
    phone: input.phone,
    assignments: input.assignments ?? [],
  };

  store.teachers.unshift(teacher);
  return teacher;
};

export const createClass = (input: Omit<typeof store.classes[number], 'id'>) => {
  const normalizedGrade = input.grade.trim();
  const normalizedName = input.name.trim();
  const normalizedMedium = input.medium.trim();
  const classItem = {
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
    isActive: input.isActive ?? true,
  };

  store.classes.unshift(classItem);
  if (classItem.subjectName && !store.adminSubjects.some((subject) => subject.name === classItem.subjectName)) {
    store.adminSubjects.unshift({
      id: classItem.id,
      name: classItem.subjectName,
      teacher: 'Unassigned',
    });
  }
  return classItem;
};

export const createUser = (input: Omit<AuthUser, 'id'> & { passwordHash: string }) => {
  const user = {
    id: createId('user'),
    ...input,
    isActive: input.isActive ?? true,
  };

  store.users.unshift(user);
  return user;
};

export const deleteUser = (userId: string) => {
  const beforeCount = store.users.length;
  store.users = store.users.filter((user) => user.id !== userId);
  return beforeCount !== store.users.length;
};

export const deleteStudent = (studentId: string) => {
  const beforeCount = store.students.length;
  store.students = store.students.filter((student) => student.id !== studentId);
  store.users = store.users.filter((user) => user.studentId !== studentId);
  store.studentEnrollments = store.studentEnrollments.filter((enrollment) => enrollment.studentId !== studentId);
  return beforeCount !== store.students.length;
};

export const deleteTeacher = (teacherId: string) => {
  const beforeCount = store.teachers.length;
  store.teachers = store.teachers.filter((teacher) => teacher.id !== teacherId);
  store.users = store.users.filter((user) => user.teacherId !== teacherId);
  return beforeCount !== store.teachers.length;
};

export const deleteClass = (classId: string) => {
  const beforeCount = store.classes.length;
  store.classes = store.classes.filter((classItem) => classItem.id !== classId);
  store.studentEnrollments = store.studentEnrollments.filter((enrollment) => enrollment.classId !== classId);
  store.students = store.students.map((student) => ({
    ...student,
    classId: student.classId === classId ? '' : student.classId,
    grade: student.classId === classId ? 'Unassigned' : student.grade,
    enrollments: student.enrollments?.filter((enrollment) => enrollment.classId !== classId),
  }));
  return beforeCount !== store.classes.length;
};

export const deleteStudentEnrollment = (params: { studentId: string; classId: string }) => {
  const beforeCount = store.studentEnrollments.length;
  store.studentEnrollments = store.studentEnrollments.filter(
    (enrollment) => enrollment.studentId !== params.studentId || enrollment.classId !== params.classId,
  );
  const student = store.students.find((item) => item.id === params.studentId);
  if (student) {
    student.enrollments = student.enrollments?.filter((enrollment) => enrollment.classId !== params.classId);
    if (student.classId === params.classId) {
      const nextEnrollment = getStudentEnrollments(params.studentId)[0];
      const nextClass = store.classes.find((classItem) => classItem.id === nextEnrollment?.classId);
      student.classId = nextClass?.id ?? '';
      student.grade = nextClass?.grade ?? 'Unassigned';
    }
  }
  return beforeCount !== store.studentEnrollments.length;
};

export const upsertMark = (studentId: string, mark: AdminStudentMark) => {
  const student = store.students.find((item) => item.id === studentId || item.index === studentId);
  if (!student) return null;

  const markKey = buildMarkKey(mark.subjectId, mark.examType, mark.examName, mark.examDate);
  const existingIndex = student.marks.findIndex(
    (item) => buildMarkKey(item.subjectId, item.examType, item.examName, item.examDate) === markKey,
  );

  if (existingIndex >= 0) {
    student.marks[existingIndex] = mark;
    return { student, mark, action: 'updated' as const };
  }

  student.marks.unshift(mark);
  return { student, mark, action: 'created' as const };
};

export const deleteMark = (params: {
  studentId: string;
  subjectId: string;
  examType: string;
  examName: string;
  examDate?: string;
}) => {
  const student = store.students.find((item) => item.id === params.studentId || item.index === params.studentId);
  if (!student) return null;

  const markKey = buildMarkKey(params.subjectId, params.examType, params.examName, params.examDate);
  const legacyMarkKey = buildMarkKey(params.subjectId, params.examType, params.examName);
  const beforeCount = student.marks.length;
  student.marks = student.marks.filter(
    (item) => params.examDate
      ? buildMarkKey(item.subjectId, item.examType, item.examName, item.examDate) !== markKey
      : buildMarkKey(item.subjectId, item.examType, item.examName) !== legacyMarkKey,
  );

  return { student, deleted: student.marks.length < beforeCount };
};
