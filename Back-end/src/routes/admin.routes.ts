import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { store } from '../data/store.js';
import { repo } from '../data/repository.js';
import { parseCsv } from '../utils/csv.js';

const router = Router();

router.use(requireAuth, requireRoles('admin', 'super-admin'));

const studentSchema = z.object({
  name: z.string().min(1),
  index: z.string().min(1),
  classId: z.string().min(1),
  dateOfBirth: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
});

const classSchema = z.object({
  grade: z.string().min(1),
  name: z.string().min(1),
  medium: z.string().min(1),
  subjectName: z.string().min(1),
  teacherId: z.string().optional(),
  academicYear: z.number().int().min(2000).max(2100).optional(),
  schedule: z.string().optional(),
  fee: z.number().min(0).optional(),
});

const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
});

const teacherAssignmentSchema = z.object({
  subject: z.string().min(1),
  grade: z.string().min(1),
  classId: z.string().min(1),
  medium: z.string().min(1),
});

const teacherSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional().default(''),
  grade: z.string().optional().default(''),
  username: z.string().min(1),
  password: z.string().min(6),
  email: z.string().email(),
  phone: z.string().min(1),
  assignments: z.array(teacherAssignmentSchema).optional().default([]),
});

const classTeacherSchema = z.object({
  teacherId: z.string().min(1).nullable().optional(),
});

const markSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  classId: z.string().optional(),
  examType: z.string().min(1),
  examName: z.string().min(1),
  examDate: z.string().min(1),
  mark: z.number().min(0).max(100),
  note: z.string().optional(),
});

const bulkMarksSchema = z.object({
  csvText: z.string().min(1),
});

const buildStudentUsername = (name: string, dateOfBirth?: string) => {
  const normalizedName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  if (!dateOfBirth) return normalizedName;

  const parsedDate = new Date(dateOfBirth);
  if (Number.isNaN(parsedDate.getTime())) return normalizedName;

  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${normalizedName}${month}${day}`;
};

router.get('/meta', asyncHandler(async (req, res) => {
  const grade = typeof req.query.grade === 'string' ? req.query.grade : '';
  const classId = typeof req.query.classId === 'string' ? req.query.classId : '';
  const classes = await repo.getClasses();
  const subjects = await repo.getSubjects();
  const studentClassOptions = await repo.getStudentEnrollmentOptions();
  const grades = Array.from(new Set([...store.grades, ...classes.map((classItem) => classItem.grade)]));

  res.json({
    grades,
    classes: grade ? classes.filter((classItem) => classItem.grade === grade) : classes,
    studentClassOptions: grade ? studentClassOptions.filter((option) => option.grade === grade) : studentClassOptions,
    subjects: classId
      ? await repo.getSubjectsForClass(classId)
      : subjects.map((subject) => ({ id: subject.id, name: subject.name, teacher: subject.teacher })),
    examTypes: store.examTypes,
    csvColumns: store.csvColumns,
  });
}));

router.get('/students', asyncHandler(async (req, res) => {
  res.json({
    students: await repo.getStudents({
      grade: typeof req.query.grade === 'string' ? req.query.grade : undefined,
      classId: typeof req.query.classId === 'string' ? req.query.classId : undefined,
      query: typeof req.query.query === 'string' ? req.query.query : undefined,
    }),
  });
}));

router.get('/users', asyncHandler(async (_req, res) => {
  res.json({ users: await repo.getRegisteredUsers() });
}));

router.delete('/users/:userId', asyncHandler(async (req, res) => {
  const userId = String(req.params.userId ?? '');
  const deleted = await repo.deleteUser(userId);
  if (!deleted) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  res.json({ deleted: true });
}));

router.post('/classes', validateBody(classSchema), asyncHandler(async (req, res) => {
  const existing = (await repo.getClasses()).find((classItem) =>
    classItem.grade.toLowerCase() === req.body.grade.trim().toLowerCase() &&
    classItem.name.toLowerCase() === req.body.name.trim().toLowerCase() &&
    classItem.medium.toLowerCase() === req.body.medium.trim().toLowerCase() &&
    classItem.subjectName?.toLowerCase() === req.body.subjectName.trim().toLowerCase(),
  );

  if (existing) {
    res.status(409).json({ message: 'This class/batch already exists.' });
    return;
  }

  const grade = req.body.grade.trim();
  const name = req.body.name.trim();
  const medium = req.body.medium.trim();
  const subjectName = req.body.subjectName.trim();
  const classItem = await repo.createClass({
    grade,
    name,
    medium,
    teacherId: req.body.teacherId?.trim() || undefined,
    subjectName,
    academicYear: req.body.academicYear ?? new Date().getFullYear(),
    schedule: req.body.schedule?.trim(),
    fee: req.body.fee,
    label: `${grade} - ${subjectName} - ${name} - ${medium} Medium`,
  });

  res.status(201).json({ class: classItem });
}));

router.patch('/classes/:classId/teacher', validateBody(classTeacherSchema), asyncHandler(async (req, res) => {
  const classId = String(req.params.classId ?? '');
  const classItem = await repo.setClassTeacher(classId, req.body.teacherId?.trim() || null);

  if (!classItem) {
    res.status(404).json({ message: 'Class or teacher not found.' });
    return;
  }

  res.json({ class: classItem });
}));

router.delete('/classes/:classId', asyncHandler(async (req, res) => {
  const classId = String(req.params.classId ?? '');
  const deleted = await repo.deleteClass(classId);
  if (!deleted) {
    res.status(404).json({ message: 'Class not found.' });
    return;
  }
  res.json({ deleted: true });
}));

router.post('/enrollments', validateBody(enrollmentSchema), asyncHandler(async (req, res) => {
  console.log('Enrollment in progress');
  const enrollment = await repo.enrollStudent(req.body);
  console.log('Enrollment result:', enrollment);
  if (!enrollment) {
    res.status(404).json({ message: 'Class or subject not found for enrollment.' });
    return;
  }
  res.status(201).json({ enrollment });
}));

// router.get('enrollments/classes', asyncHandler(async (req, res) => {
//   const classDetails = await repo.getClassDetailsForEnrollment();

//   if (!classDetails) {
//     res.status(404).json({ message: 'No classes found.' });
//     return;
//   };
//   res.json({ classes: classDetails });
// }));

router.delete('/enrollments', asyncHandler(async (req, res) => {
  const studentId = String(req.query.studentId ?? '');
  const classId = String(req.query.classId ?? '');

  if (!studentId || !classId) {
    res.status(400).json({ message: 'studentId and classId are required.' });
    return;
  }

  const deleted = await repo.deleteEnrollment({ studentId, classId });
  if (!deleted) {
    res.status(404).json({ message: 'Enrollment not found.' });
    return;
  }
  res.json({ deleted: true });
}));
// student registering //
router.post('/students', validateBody(studentSchema), asyncHandler(async (req, res) => {
  console.log('[admin/students] incoming payload:', JSON.stringify(req.body));
  const existing = (await repo.getStudents({})).find((student) => student.index === req.body.index);
  const normalizedName = req.body.name.trim();
  const normalizedIndex = req.body.index.trim();
  const normalizedUsername = buildStudentUsername(normalizedName, req.body.dateOfBirth?.trim() || undefined);
  const normalizedEmail = req.body.email?.trim().toLowerCase() || `${normalizedUsername}@siyowin.local`;
  const existingUserByUsername = await repo.findUserByEmail(normalizedUsername);
  const existingUserByEmail = await repo.findUserByEmail(normalizedEmail);

  if (existing && existingUserByUsername) {
    res.status(409).json({ message: 'A student with this index already exists.' });
    return;
  }

  if (existingUserByUsername) {
    res.status(409).json({ message: 'A user with this username already exists.' });
    return;
  }

  if (existingUserByEmail) {
    res.status(409).json({ message: 'A user with this email already exists.' });
    return;
  }

  const { password: _password, username: _username, email, ...studentInput } = req.body as z.infer<typeof studentSchema>;
  const normalizedDateOfBirth = studentInput.dateOfBirth?.trim() || undefined;
  if (normalizedDateOfBirth && Number.isNaN(Date.parse(normalizedDateOfBirth))) {
    res.status(400).json({ message: 'Invalid dateOfBirth. Use a valid date format (YYYY-MM-DD).' });
    return;
  }
  const normalizedStudentInput = {
    ...studentInput,
    name: normalizedName,
    index: normalizedIndex,
    dateOfBirth: normalizedDateOfBirth,
  };
  const passwordHash = bcrypt.hashSync(normalizedIndex, 10);

  try {
    if (existing) {
      const user = await repo.createUser({
        name: existing.name,
        username: normalizedUsername,
        email: normalizedEmail,
        role: 'student',
        studentId: existing.id,
        passwordHash,
      });

      res.status(200).json({ student: existing, user });
      return;
    }

    const { student, user } = await repo.createStudentWithUser({
      student: normalizedStudentInput,
      user: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
      },
    });

    res.status(201).json({ student, user });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: string }).code) : '';
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : '';

    console.error('[admin/students] create failed', {
      code,
      message,
      error,
    });

    if (code === '23505') {
      res.status(409).json({ message: 'A user with this username or email already exists.' });
      return;
    }
    if (code === '23503') {
      res.status(400).json({ message: 'Invalid classId or related reference.' });
      return;
    }
    if (code === '22P02') {
      res.status(400).json({ message: 'Invalid input format.' });
      return;
    }
    throw error;
  }
}));

router.delete('/students/:studentId', asyncHandler(async (req, res) => {
  const studentId = String(req.params.studentId ?? '');
  const deleted = await repo.deleteStudent(studentId);
  if (!deleted) {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }
  res.json({ deleted: true });
}));

router.get('/teachers', asyncHandler(async (_req, res) => {
  res.json({ teachers: await repo.getTeachers() });
}));

router.post('/teachers', validateBody(teacherSchema), asyncHandler(async (req, res) => {
  const existing = (await repo.getTeachers()).find((teacher) => teacher.email.toLowerCase() === req.body.email.toLowerCase());
  const existingUser = await repo.findUserByEmail(req.body.username);

  if (existing && existingUser) {
    res.status(409).json({ message: 'A teacher with this email already exists.' });
    return;
  }

  if (existingUser) {
    res.status(409).json({ message: 'A user with this username already exists.' });
    return;
  }

  const { username, password, ...teacherInput } = req.body as z.infer<typeof teacherSchema>;
  const teacher = existing ?? await repo.createTeacher(teacherInput);
  const user = await repo.createUser({
    name: teacher.name,
    username: username.trim().toLowerCase(),
    email: teacher.email.trim().toLowerCase(),
    role: 'teacher',
    teacherId: teacher.id,
    passwordHash: bcrypt.hashSync(password, 10),
  });

  res.status(existing ? 200 : 201).json({ teacher, user });
}));

router.delete('/teachers/:teacherId', asyncHandler(async (req, res) => {
  const teacherId = String(req.params.teacherId ?? '');
  const deleted = await repo.deleteTeacher(teacherId);
  if (!deleted) {
    res.status(404).json({ message: 'Teacher not found.' });
    return;
  }
  res.json({ deleted: true });
}));

router.get('/marks', asyncHandler(async (req, res) => {
  const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : '';
  const students = await repo.getStudents({});
  const student = students.find((item) => item.id === studentId || item.index === studentId);

  if (studentId && !student) {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }

  res.json({
    marks: student ? student.marks : students.flatMap((item) => item.marks.map((mark) => ({ ...mark, studentId: item.id }))),
  });
}));

router.post('/marks', validateBody(markSchema), asyncHandler(async (req, res) => {
  const { studentId, ...mark } = req.body as z.infer<typeof markSchema>;
  const result = await repo.upsertMark(studentId, mark);

  if (!result) {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }

  res.status(result.action === 'created' ? 201 : 200).json(result);
}));

router.delete('/marks', asyncHandler(async (req, res) => {
  const params = {
    studentId: String(req.query.studentId ?? ''),
    subjectId: String(req.query.subjectId ?? ''),
    examType: String(req.query.examType ?? ''),
    examName: String(req.query.examName ?? ''),
    examDate: String(req.query.examDate ?? '') || undefined,
  };

  if (!params.studentId || !params.subjectId || !params.examType || !params.examName) {
    res.status(400).json({ message: 'studentId, subjectId, examType, and examName are required.' });
    return;
  }

  const result = await repo.deleteMark(params);

  if (!result) {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }

  res.json(result);
}));

router.post('/marks/bulk', validateBody(bulkMarksSchema), asyncHandler(async (req, res) => {
  const rows = parseCsv(req.body.csvText);
  const results = await Promise.all(rows.map(async (row) => {
    const markValue = Number(row.mark);

    if (!row.student_index || Number.isNaN(markValue)) {
      return { row, status: 'skipped', reason: 'Missing student_index or invalid mark.' };
    }

    const classId = row.class_id ?? row.subject_id ?? '';
    const result = await repo.upsertMark(row.student_index, {
      subjectId: classId,
      subjectName: row.subject_name ?? '',
      classId,
      examType: row.exam_type ?? '',
      examName: row.exam_name ?? '',
      examDate: row.exam_date ?? '',
      mark: markValue,
      note: row.note,
    });

    if (!result) {
      return { row, status: 'skipped', reason: 'Student not found.' };
    }

    return { row, status: result.action };
  }));

  res.json({
    processed: results.length,
    createdOrUpdated: results.filter((item) => item.status === 'created' || item.status === 'updated').length,
    skipped: results.filter((item) => item.status === 'skipped').length,
    results,
  });
}));

router.patch('/users/:userId/promote', asyncHandler(async (req, res) => {
  const userId = String(req.params.userId ?? '');
  const user = await repo.findUserById(userId);

  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  if (user.role !== 'teacher') {
    res.status(400).json({ message: 'Only teachers can be promoted to admin.' });
    return;
  }

  // Update user role to admin
  const updatedUser = await repo.updateUserRole(userId, 'admin');

  if (!updatedUser) {
    res.status(404).json({ message: 'Failed to promote user.' });
    return;
  }

  res.json({ user: updatedUser, message: `${updatedUser.name} has been promoted to admin.` });
}));

export default router;
