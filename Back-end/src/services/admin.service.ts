import bcrypt from 'bcryptjs';
import { repo } from '../data/repository.js';
import { store } from '../data/store.js';
import { parseCsv } from '../utils/csv.js';

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

export const adminService = {
  async getMeta(grade: string, classId: string) {
    const classes = await repo.getClasses();
    const subjects = await repo.getSubjects();
    const studentClassOptions = await repo.getStudentEnrollmentOptions();
    const grades = Array.from(new Set([...store.grades, ...classes.map((classItem) => classItem.grade)]));

    return {
      grades,
      classes: grade ? classes.filter((classItem) => classItem.grade === grade) : classes,
      studentClassOptions: grade ? studentClassOptions.filter((option) => option.grade === grade) : studentClassOptions,
      subjects: classId
        ? await repo.getSubjectsForClass(classId)
        : subjects.map((subject) => ({ id: subject.id, name: subject.name, teacher: subject.teacher })),
      examTypes: store.examTypes,
      csvColumns: store.csvColumns,
    };
  },

  async getStudents(params: { grade?: string; classId?: string; query?: string }) {
    return { students: await repo.getStudents(params) };
  },

  async getUsers() {
    return { users: await repo.getRegisteredUsers() };
  },

  async deleteUser(userId: string) {
    const deleted = await repo.deleteUser(userId);
    if (!deleted) {
      throw new Error('User not found.');
    }
    return { deleted: true };
  },

  async createClass(data: any) {
    const existing = (await repo.getClasses()).find((classItem) =>
      classItem.grade.toLowerCase() === data.grade.trim().toLowerCase() &&
      classItem.name.toLowerCase() === data.name.trim().toLowerCase() &&
      classItem.medium.toLowerCase() === data.medium.trim().toLowerCase() &&
      classItem.subjectName?.toLowerCase() === data.subjectName.trim().toLowerCase(),
    );

    if (existing) {
      throw new Error('This class/batch already exists.');
    }

    const grade = data.grade.trim();
    const name = data.name.trim();
    const medium = data.medium.trim();
    const subjectName = data.subjectName.trim();
    const classItem = await repo.createClass({
      grade,
      name,
      medium,
      teacherId: data.teacherId?.trim() || undefined,
      subjectName,
      academicYear: data.academicYear ?? new Date().getFullYear(),
      schedule: data.schedule?.trim(),
      fee: data.fee,
      label: `${grade} - ${subjectName} - ${name} - ${medium} Medium`,
    });

    return { class: classItem };
  },

  async setClassTeacher(classId: string, teacherId: string | undefined | null) {
    const classItem = await repo.setClassTeacher(classId, teacherId?.trim() || null);
    if (!classItem) {
      throw new Error('Class or teacher not found.');
    }
    return { class: classItem };
  },

  async deleteClass(classId: string) {
    const deleted = await repo.deleteClass(classId);
    if (!deleted) {
      throw new Error('Class not found.');
    }
    return { deleted: true };
  },

  async enrollStudent(data: any) {
    const enrollment = await repo.enrollStudent(data);
    if (!enrollment) {
      throw new Error('Class or subject not found for enrollment.');
    }
    return { enrollment };
  },

  async deleteEnrollment(studentId: string, classId: string) {
    const deleted = await repo.deleteEnrollment({ studentId, classId });
    if (!deleted) {
      throw new Error('Enrollment not found.');
    }
    return { deleted: true };
  },

  async createStudent(data: any) {
    const existing = (await repo.getStudents({})).find((student) => student.index === data.index);
    const normalizedName = data.name.trim();
    const normalizedIndex = data.index.trim();
    const normalizedUsername = buildStudentUsername(normalizedName, data.dateOfBirth?.trim() || undefined);
    const normalizedEmail = data.email?.trim().toLowerCase() || `${normalizedUsername}@siyowin.local`;
    const existingUserByUsername = await repo.findUserByEmail(normalizedUsername);
    const existingUserByEmail = await repo.findUserByEmail(normalizedEmail);

    if (existing && existingUserByUsername) {
      throw new Error('A student with this index already exists.');
    }

    if (existingUserByUsername) {
      throw new Error('A user with this username already exists.');
    }

    if (existingUserByEmail) {
      throw new Error('A user with this email already exists.');
    }

    const { password: _password, username: _username, email, ...studentInput } = data;
    const normalizedDateOfBirth = studentInput.dateOfBirth?.trim() || undefined;
    if (normalizedDateOfBirth && Number.isNaN(Date.parse(normalizedDateOfBirth))) {
      throw new Error('Invalid dateOfBirth. Use a valid date format (YYYY-MM-DD).');
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

        return { student: existing, user };
      }

      const { student, user } = await repo.createStudentWithUser({
        student: normalizedStudentInput,
        user: {
          username: normalizedUsername,
          email: normalizedEmail,
          passwordHash,
        },
      });

      return { student, user };
    } catch (error: any) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (code === '23505') {
        throw new Error('A user with this username or email already exists.');
      }
      if (code === '23503') {
        throw new Error('Invalid classId or related reference.');
      }
      if (code === '22P02') {
        throw new Error('Invalid input format.');
      }
      throw error;
    }
  },

  async deleteStudent(studentId: string) {
    const deleted = await repo.deleteStudent(studentId);
    if (!deleted) {
      throw new Error('Student not found.');
    }
    return { deleted: true };
  },

  async getTeachers() {
    return { teachers: await repo.getTeachers() };
  },

  async createTeacher(data: any) {
    const existing = (await repo.getTeachers()).find((teacher) => teacher.email.toLowerCase() === data.email.toLowerCase());
    const existingUser = await repo.findUserByEmail(data.username);

    if (existing && existingUser) {
      throw new Error('A teacher with this email already exists.');
    }

    if (existingUser) {
      throw new Error('A user with this username already exists.');
    }

    const { username, password, ...teacherInput } = data;
    const teacher = existing ?? await repo.createTeacher(teacherInput);
    const user = await repo.createUser({
      name: teacher.name,
      username: username.trim().toLowerCase(),
      email: teacher.email.trim().toLowerCase(),
      role: 'teacher',
      teacherId: teacher.id,
      passwordHash: bcrypt.hashSync(password, 10),
    });

    return { teacher, user, existing: !!existing };
  },

  async deleteTeacher(teacherId: string) {
    const deleted = await repo.deleteTeacher(teacherId);
    if (!deleted) {
      throw new Error('Teacher not found.');
    }
    return { deleted: true };
  },

  async getMarks(studentId: string) {
    const students = await repo.getStudents({});
    const student = students.find((item) => item.id === studentId || item.index === studentId);

    if (studentId && !student) {
      throw new Error('Student not found.');
    }

    return {
      marks: student ? student.marks : students.flatMap((item) => item.marks.map((mark) => ({ ...mark, studentId: item.id }))),
    };
  },

  async upsertMark(data: any) {
    const { studentId, ...mark } = data;
    const result = await repo.upsertMark(studentId, mark);

    if (!result) {
      throw new Error('Student not found.');
    }
    return result;
  },

  async deleteMark(params: { studentId: string; subjectId: string; examType: string; examName: string; examDate?: string }) {
    const result = await repo.deleteMark(params);

    if (!result) {
      throw new Error('Student not found.');
    }

    return result;
  },

  async bulkUpsertMarks(csvText: string) {
    const rows = parseCsv(csvText);
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

    return {
      processed: results.length,
      createdOrUpdated: results.filter((item) => item.status === 'created' || item.status === 'updated').length,
      skipped: results.filter((item) => item.status === 'skipped').length,
      results,
    };
  },

  async promoteUser(userId: string) {
    const user = await repo.findUserById(userId);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.role !== 'teacher') {
      throw new Error('Only teachers can be promoted to admin.');
    }

    const updatedUser = await repo.updateUserRole(userId, 'admin');

    if (!updatedUser) {
      throw new Error('Failed to promote user.');
    }

    return { user: updatedUser, message: `${updatedUser.name} has been promoted to admin.` };
  }
};
