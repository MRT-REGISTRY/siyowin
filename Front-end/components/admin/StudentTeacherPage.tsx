'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { KeyRound, Plus, ShieldCheck, Trash2, UserPlus, Users, X, Crown } from 'lucide-react';

import { apiDelete, apiGet, apiPatch, apiPost, getStoredUser } from '@/utils/api';
import { AdminClassOption, AdminRole, AdminStudent, AdminStudentClassOption, AdminTeacher, RegisteredUser, TeacherAssignment } from '@/types';

type NoticeState = {
  message: string;
  variant: 'success' | 'danger' | 'info';
};

interface Props {
  onNotice?: (notice: NoticeState) => void;
}

const emptyAssignment: TeacherAssignment = {
  subject: '',
  grade: '',
  classId: '',
  medium: '',
};

const makePassword = () => `Siyo${Math.floor(100000 + Math.random() * 900000)}`;
const buildStudentUsername = (name: string, dateOfBirth: string) => {
  const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (!normalizedName) return '';
  if (!dateOfBirth) return normalizedName;

  const parsedDate = new Date(dateOfBirth);
  if (Number.isNaN(parsedDate.getTime())) return normalizedName;

  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${normalizedName}${month}${day}`;
};

export default function StudentTeacherPage({ onNotice }: Props) {
  const [role, setRole] = useState<AdminRole>('admin');
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [classes, setClasses] = useState<AdminClassOption[]>([]);
  const [studentClassOptions, setStudentClassOptions] = useState<AdminStudentClassOption[]>([]);
  const [newClassTeacherId, setNewClassTeacherId] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassMedium, setNewClassMedium] = useState('Sinhala');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassYear, setNewClassYear] = useState(String(new Date().getFullYear()));
  const [newClassSchedule, setNewClassSchedule] = useState('');
  const [newClassFee, setNewClassFee] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);

  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState(makePassword);
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([emptyAssignment]);

  const [studentName, setStudentName] = useState('');
  const [studentIndex, setStudentIndex] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentDateOfBirth, setStudentDateOfBirth] = useState('');
  const [studentClassId, setStudentClassId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [enrollmentStudentId, setEnrollmentStudentId] = useState('');
  const [enrollmentClassId, setEnrollmentClassId] = useState('');
  const [linkClassId, setLinkClassId] = useState('');
  const [linkTeacherId, setLinkTeacherId] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);
  const [isLinkingClassTeacher, setIsLinkingClassTeacher] = useState(false);
  const [expandedPanels, setExpandedPanels] = useState<{ classes: boolean; students: boolean; teachers: boolean; users: boolean }>({ classes: false, students: false, teachers: false, users: false });
  const [modalOpen, setModalOpen] = useState<'classes' | 'students' | 'teachers' | 'users' | null>(null);
  const [classesSearch, setClassesSearch] = useState('');
  const [studentsSearch, setStudentsSearch] = useState('');
  const [teachersSearch, setTeachersSearch] = useState('');
  const [usersSearch, setUsersSearch] = useState('');

  const togglePanelExpand = (panelName: 'classes' | 'students' | 'teachers' | 'users') => {
    setModalOpen(panelName);
  };

  const loadUsers = () => {
    apiGet<{ users: RegisteredUser[] }>('/admin/users')
      .then((data) => setUsers(data.users))
      .catch(() => undefined);
  };

  const loadTeachers = () => {
    apiGet<{ teachers: AdminTeacher[] }>('/admin/teachers')
      .then((data) => setTeachers(data.teachers))
      .catch(() => undefined);
  };

  const loadStudents = () => {
    apiGet<{ students: AdminStudent[] }>('/admin/students')
      .then((data) => {
        setStudents(data.students);
        setEnrollmentStudentId((current) => current || data.students[0]?.id || '');
      })
      .catch(() => undefined);
  };

  const loadMeta = () => {
    apiGet<{ classes: AdminClassOption[]; studentClassOptions: AdminStudentClassOption[] }>('/admin/meta')
      .then((data) => {
        setClasses(data.classes);
        setStudentClassOptions(data.studentClassOptions);
        const firstStudentClass = data.studentClassOptions[0] ?? data.classes[0];
        setStudentClassId((current) => current || firstStudentClass?.id || '');
        setEnrollmentClassId((current) => current || firstStudentClass?.id || '');
        setTeacherAssignments((current) => current.some((assignment) => assignment.classId)
          ? current
          : [{ ...emptyAssignment, classId: firstStudentClass?.id ?? '', grade: firstStudentClass?.grade ?? '', medium: firstStudentClass?.medium ?? '' }]);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role === 'super-admin' || user?.role === 'admin') {
      setRole(user.role);
    }

    loadMeta();
    loadTeachers();
    loadUsers();
    loadStudents();
  }, []);

  useEffect(() => {
    setStudentUsername(buildStudentUsername(studentName, studentDateOfBirth));
  }, [studentName, studentDateOfBirth]);

  useEffect(() => {
    setStudentPassword(studentIndex.trim());
  }, [studentIndex]);

  useEffect(() => {
    setNewClassTeacherId((current) => current || teachers[0]?.id || '');
    setLinkTeacherId((current) => current || teachers[0]?.id || '');
  }, [teachers]);

  useEffect(() => {
    setLinkClassId((current) => current || classes[0]?.id || '');
  }, [classes]);

  const updateAssignment = (index: number, patch: Partial<TeacherAssignment>) => {
    setTeacherAssignments((previous) => previous.map((assignment, assignmentIndex) => {
      if (assignmentIndex !== index) return assignment;
      const next = { ...assignment, ...patch };
      const selectedClass = classes.find((classItem) => classItem.id === next.classId);
      return selectedClass ? { ...next, grade: selectedClass.grade, medium: selectedClass.medium } : next;
    }));
  };

  const addClass = () => {
    if (isAddingClass) return;
    if (!newClassLevel.trim() || !newClassName.trim() || !newClassMedium.trim() || !newClassSubject.trim()) {
      onNotice?.({ message: 'Enter class level, subject, batch/class name, and medium.', variant: 'danger' });
      return;
    }

    setIsAddingClass(true);
    apiPost<{ class: AdminClassOption }>('/admin/classes', {
      grade: newClassLevel.trim(),
      name: newClassName.trim(),
      medium: newClassMedium.trim(),
      subjectName: newClassSubject.trim(),
      teacherId: newClassTeacherId.trim() || undefined,
      academicYear: Number(newClassYear) || new Date().getFullYear(),
      schedule: newClassSchedule.trim(),
      fee: newClassFee ? Number(newClassFee) : undefined,
    })
      .then((data) => {
        setClasses((previous) => [data.class, ...previous]);
        setStudentClassId(data.class.id);
        setEnrollmentClassId(data.class.id);
        setNewClassName('');
        setNewClassSubject('');
        setNewClassSchedule('');
        setNewClassFee('');
        onNotice?.({ message: `Class ${data.class.label} added.`, variant: 'success' });
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Class was not added.', variant: 'danger' }))
      .finally(() => setIsAddingClass(false));
  };

  const linkTeacherToClass = () => {
    if (isLinkingClassTeacher) return;
    if (!linkClassId || !linkTeacherId) {
      onNotice?.({ message: 'Select a class and teacher to link them.', variant: 'danger' });
      return;
    }

    setIsLinkingClassTeacher(true);
    apiPatch<{ class: AdminClassOption }>(`/admin/classes/${encodeURIComponent(linkClassId)}/teacher`, {
      teacherId: linkTeacherId,
    })
      .then((data) => {
        setClasses((previous) => previous.map((classItem) => (classItem.id === data.class.id ? data.class : classItem)));
        onNotice?.({ message: `Linked ${teachers.find((teacher) => teacher.id === linkTeacherId)?.name ?? 'teacher'} to ${classes.find((classItem) => classItem.id === linkClassId)?.label ?? 'class'}.`, variant: 'success' });
        loadMeta();
        loadTeachers();
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Teacher was not linked to class.', variant: 'danger' }))
      .finally(() => setIsLinkingClassTeacher(false));
  };

  const enrollExistingStudent = () => {
    if (isEnrollingStudent) return;
    if (!enrollmentStudentId || !enrollmentClassId) {
      onNotice?.({ message: 'Select a student and class for enrollment.', variant: 'danger' });
      return;
    }

    setIsEnrollingStudent(true);
    apiPost('/admin/enrollments', {
      studentId: enrollmentStudentId,
      classId: enrollmentClassId,
    })
      .then(() => {
        const student = students.find((item) => item.id === enrollmentStudentId);
        const classItem = classes.find((item) => item.id === enrollmentClassId);
        onNotice?.({ message: `${student?.name ?? 'Student'} enrolled in ${classItem?.label ?? 'selected class'}.`, variant: 'success' });
        loadStudents();
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Enrollment was not added.', variant: 'danger' }))
      .finally(() => setIsEnrollingStudent(false));
  };

  const addTeacher = () => {
    if (isAddingTeacher) return;
    if (!teacherName.trim() || !teacherEmail.trim() || !teacherUsername.trim() || !teacherPassword.trim()) {
      onNotice?.({ message: 'Enter teacher details and issued credentials.', variant: 'danger' });
      return;
    }

    const assignments = teacherAssignments.filter((assignment) => assignment.subject && assignment.grade && assignment.classId);

    setIsAddingTeacher(true);
    apiPost<{ teacher: AdminTeacher }>('/admin/teachers', {
      name: teacherName.trim(),
      subject: assignments[0]?.subject ?? '',
      grade: assignments[0]?.grade ?? '',
      username: teacherUsername.trim(),
      password: teacherPassword.trim(),
      email: teacherEmail.trim(),
      phone: teacherPhone.trim(),
      assignments,
    })
      .then((data) => {
        setTeachers((previous) => [data.teacher, ...previous]);
        onNotice?.({ message: `Teacher ${teacherName.trim()} added with login username ${teacherUsername.trim()}.`, variant: 'success' });
        setTeacherName('');
        setTeacherEmail('');
        setTeacherUsername('');
        setTeacherPassword(makePassword());
        setTeacherPhone('');
        setTeacherAssignments([emptyAssignment]);
        loadUsers();
        loadTeachers();
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Teacher was not added.', variant: 'danger' }))
      .finally(() => setIsAddingTeacher(false));
  };

  const addStudent = () => {
    if (isAddingStudent) return;
    if (!studentName.trim() || !studentIndex.trim() || !studentClassId) {
      onNotice?.({ message: 'Enter student details, class, and index.', variant: 'danger' });
      return;
    }

    const username = buildStudentUsername(studentName, studentDateOfBirth);
    const password = studentIndex.trim();

    if (!username || !password) {
      onNotice?.({ message: 'Enter a valid student name and index to generate credentials.', variant: 'danger' });
      return;
    }

    // client-side guard: ensure selected classId exists on the client
    const classExists = classes.some((c) => c.id === studentClassId) || studentClassOptions.some((c) => c.id === studentClassId);
    if (!classExists) {
      onNotice?.({ message: 'Selected class is not available on the server. Reload classes via the meta endpoint and try again.', variant: 'danger' });
      return;
    }

    const outgoing = {
      name: studentName.trim(),
      index: studentIndex.trim(),
      email: studentEmail.trim(),
      dateOfBirth: studentDateOfBirth,
      classId: studentClassId,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
    };

    // helpful debug log for admin: shows exact payload being sent
    // eslint-disable-next-line no-console
    console.log('[admin/students] outgoing payload:', outgoing);

    setIsAddingStudent(true);
    apiPost('/admin/students', outgoing)
      .then(() => {
        onNotice?.({ message: `Student ${studentName.trim()} added with username ${username} and password ${password}.`, variant: 'success' });
        setStudentName('');
        setStudentIndex('');
        setStudentUsername('');
        setStudentPassword('');
        setStudentEmail('');
        setStudentDateOfBirth('');
        setParentName('');
        setParentPhone('');
        loadUsers();
        loadStudents();
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Student was not added.', variant: 'danger' }))
      .finally(() => setIsAddingStudent(false));
  };

  const deleteUser = (user: RegisteredUser) => {
    if (!window.confirm(`Delete login for ${user.name}? This removes the account from the database.`)) return;
    apiDelete(`/admin/users/${encodeURIComponent(user.id)}`)
      .then(() => {
        setUsers((previous) => previous.filter((item) => item.id !== user.id));
        onNotice?.({ message: `Login ${user.username} deleted.`, variant: 'success' });
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Login was not deleted.', variant: 'danger' }));
  };

  const promoteTeacherToAdmin = (user: RegisteredUser) => {
    if (user.role !== 'teacher') {
      onNotice?.({ message: 'Only teachers can be promoted to admin.', variant: 'danger' });
      return;
    }

    if (!window.confirm(`Promote ${user.name} to admin? They will have full access to the admin panel.`)) return;

    apiPatch(`/admin/users/${encodeURIComponent(user.id)}/promote`, {})
      .then(() => {
        setUsers((previous) =>
          previous.map((item) =>
            item.id === user.id ? { ...item, role: 'admin' } : item
          )
        );
        onNotice?.({ message: `${user.name} has been promoted to admin.`, variant: 'success' });
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Failed to promote user.', variant: 'danger' }));
  };

  const deleteStudent = (student: AdminStudent) => {
    if (!window.confirm(`Delete student ${student.name}? This also removes linked login and enrollments.`)) return;
    apiDelete(`/admin/students/${encodeURIComponent(student.id)}`)
      .then(() => {
        setStudents((previous) => previous.filter((item) => item.id !== student.id));
        setUsers((previous) => previous.filter((item) => item.studentId !== student.id));
        onNotice?.({ message: `Student ${student.name} deleted.`, variant: 'success' });
        loadUsers();
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Student was not deleted.', variant: 'danger' }));
  };

  const deleteTeacher = (teacher: AdminTeacher) => {
    if (!window.confirm(`Delete teacher ${teacher.name}? This also removes linked login and assignments.`)) return;
    apiDelete(`/admin/teachers/${encodeURIComponent(teacher.id)}`)
      .then(() => {
        setTeachers((previous) => previous.filter((item) => item.id !== teacher.id));
        setUsers((previous) => previous.filter((item) => item.teacherId !== teacher.id));
        onNotice?.({ message: `Teacher ${teacher.name} deleted.`, variant: 'success' });
        loadUsers();
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Teacher was not deleted.', variant: 'danger' }));
  };

  const deleteClass = (classItem: AdminClassOption) => {
    if (!window.confirm(`Delete class ${classItem.label}? This removes related enrollments and teacher assignments.`)) return;
    apiDelete(`/admin/classes/${encodeURIComponent(classItem.id)}`)
      .then(() => {
        setClasses((previous) => previous.filter((item) => item.id !== classItem.id));
        onNotice?.({ message: `Class ${classItem.label} deleted.`, variant: 'success' });
        loadMeta();
        loadStudents();
        loadTeachers();
      })
      .catch((error) => onNotice?.({ message: error instanceof Error ? error.message : 'Class was not deleted.', variant: 'danger' }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  <ShieldCheck className="h-4 w-4" />
                  People and access
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Registered users</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Create accounts with issued usernames and passwords, assign students to institute batches, and assign teachers to manually entered subjects and classes.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  {role === 'super-admin' ? 'Super admin' : 'Admin'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 px-6 py-6 sm:grid-cols-3 sm:px-8">
            <Summary label="Registered users" value={users.length} />
            <Summary label="Teachers" value={teachers.length} />
            <Summary label="Batches/classes" value={classes.length} />
          </div>

          <div className="px-6 pt-6 sm:px-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Header eyebrow="Institute batch setup" title="Add class or batch" label="Manual" />
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr]">
                <input value={newClassLevel} onChange={(event) => setNewClassLevel(event.target.value)} placeholder="Level, e.g. Grade 10 / 2026 O/L" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={newClassSubject} onChange={(event) => setNewClassSubject(event.target.value)} placeholder="Subject, e.g. Physics" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={newClassName} onChange={(event) => setNewClassName(event.target.value)} placeholder="Batch or class name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={newClassMedium} onChange={(event) => setNewClassMedium(event.target.value)} placeholder="Medium" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <select value={newClassTeacherId} onChange={(event) => setNewClassTeacherId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  <option value="">Teacher optional</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                <input value={newClassYear} onChange={(event) => setNewClassYear(event.target.value)} placeholder="Year" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={newClassSchedule} onChange={(event) => setNewClassSchedule(event.target.value)} placeholder="Schedule optional" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={newClassFee} onChange={(event) => setNewClassFee(event.target.value)} placeholder="Fee optional" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <button type="button" onClick={addClass} disabled={isAddingClass} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  <Plus className="h-4 w-4" />
                  {isAddingClass ? 'Adding...' : 'Add class'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">If there is no teacher yet, leave this empty and link it later.</p>
            </section>
          </div>

          <div className="px-6 pt-6 sm:px-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Header eyebrow="Linking" title="Attach a teacher to an existing class" label="Optional" />
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select value={linkTeacherId} onChange={(event) => setLinkTeacherId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                <select value={linkClassId} onChange={(event) => setLinkClassId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  <option value="">Select class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.label}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={linkTeacherToClass} disabled={isLinkingClassTeacher} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60">
                  <ShieldCheck className="h-4 w-4" />
                  {isLinkingClassTeacher ? 'Linking...' : 'Link teacher'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">Use this after creating a teacher or a class first. It updates the class record and the teacher assignment together.</p>
            </section>
          </div>

          <div className="px-6 pt-6 sm:px-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Header eyebrow="Student enrollment" title="Move or add student to another class" label="Multi-class" />
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select value={enrollmentStudentId} onChange={(event) => setEnrollmentStudentId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name} - {student.index}</option>)}
                </select>
                <select value={enrollmentClassId} onChange={(event) => setEnrollmentClassId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {classes.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.label}</option>)}
                </select>
                <button type="button" onClick={enrollExistingStudent} disabled={isEnrollingStudent} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60">
                  <Plus className="h-4 w-4" />
                  {isEnrollingStudent ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            </section>
          </div>

          <div className="grid gap-6 px-6 py-6 xl:grid-cols-2 sm:px-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Header eyebrow="Student onboarding" title="Add student login" label="Admin" />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Student name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={studentIndex} onChange={(event) => setStudentIndex(event.target.value)} placeholder="Student index" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={studentUsername} readOnly placeholder="Issued username" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 placeholder:text-slate-400" />
                <input value={studentPassword} readOnly placeholder="Issued password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 placeholder:text-slate-400" />
                <input value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="Email optional" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 sm:col-span-2" />
                <input type="date" value={studentDateOfBirth} onChange={(event) => setStudentDateOfBirth(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <select value={studentClassId} onChange={(event) => setStudentClassId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400">
                  {studentClassOptions.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.subjectName} - {classItem.grade} - {classItem.teacherName} - {classItem.medium}
                    </option>
                  ))}
                </select>
                <input value={parentName} onChange={(event) => setParentName(event.target.value)} placeholder="Parent's name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} placeholder="Parent's phone number" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>

              <button type="button" onClick={addStudent} disabled={isAddingStudent} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60">
                <Users className="h-4 w-4" />
                {isAddingStudent ? 'Adding student...' : 'Add student account'}
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Header eyebrow="Teacher onboarding" title="Add teacher account" label="Optional classes" />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input value={teacherName} onChange={(event) => setTeacherName(event.target.value)} placeholder="Teacher name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={teacherEmail} onChange={(event) => setTeacherEmail(event.target.value)} placeholder="Teacher email" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={teacherUsername} onChange={(event) => setTeacherUsername(event.target.value)} placeholder="Issued username" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                <CredentialField value={teacherPassword} onChange={setTeacherPassword} onGenerate={() => setTeacherPassword(makePassword())} />
                <input value={teacherPhone} onChange={(event) => setTeacherPhone(event.target.value)} placeholder="Phone number" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 sm:col-span-2" />
              </div>

              <div className="mt-5 space-y-3">
                {teacherAssignments.map((assignment, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <input value={assignment.subject} onChange={(event) => updateAssignment(index, { subject: event.target.value })} placeholder="Subject, e.g. Combined Maths" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
                    <select value={assignment.classId} onChange={(event) => updateAssignment(index, { classId: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400">
                      {classes.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.label}</option>)}
                    </select>
                    <button type="button" onClick={() => setTeacherAssignments((previous) => previous.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:bg-slate-100" aria-label="Remove assignment">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => setTeacherAssignments((previous) => [...previous, { ...emptyAssignment, classId: classes[0]?.id ?? '', grade: classes[0]?.grade ?? '', medium: classes[0]?.medium ?? '' }])} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Plus className="h-4 w-4" />
                  Add optional assignment
                </button>
                <button type="button" onClick={addTeacher} disabled={isAddingTeacher} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  <UserPlus className="h-4 w-4" />
                  {isAddingTeacher ? 'Adding teacher...' : 'Add teacher account'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">You can create the teacher first and attach classes later using the linking section above.</p>
            </section>
          </div>

          <section className="grid gap-6 px-6 pb-6 lg:grid-cols-3 sm:px-8">
            <RecordPanel title="Classes / batches" emptyLabel="No classes found." hasMore={classes.filter(c => c.label.toLowerCase().includes(classesSearch.toLowerCase())).length > 5} onViewAll={() => setModalOpen('classes')} searchValue={classesSearch} onSearchChange={setClassesSearch}>
              {classes.filter(c => c.label.toLowerCase().includes(classesSearch.toLowerCase())).slice(0, 5).map((classItem, index) => (
                <RecordRow
                  key={classItem.id}
                  number={index + 1}
                  title={classItem.label}
                  detail={`${classItem.subjectName ?? 'Subject not set'} - ${classItem.medium} medium`}
                  onDelete={() => deleteClass(classItem)}
                />
              ))}
            </RecordPanel>

            <RecordPanel title="Student records" emptyLabel="No students found." hasMore={students.filter(s => s.name.toLowerCase().includes(studentsSearch.toLowerCase()) || s.index.toLowerCase().includes(studentsSearch.toLowerCase())).length > 5} onViewAll={() => setModalOpen('students')} searchValue={studentsSearch} onSearchChange={setStudentsSearch}>
              {students.filter(s => s.name.toLowerCase().includes(studentsSearch.toLowerCase()) || s.index.toLowerCase().includes(studentsSearch.toLowerCase())).slice(0, 5).map((student, index) => {
                const classItem = classes.find((item) => item.id === student.classId);
                return (
                  <RecordRow
                    key={student.id}
                    number={index + 1}
                    title={student.name}
                    detail={`${student.index} - ${classItem?.label ?? student.grade}`}
                    onDelete={() => deleteStudent(student)}
                  />
                );
              })}
            </RecordPanel>

            <RecordPanel title="Teacher records" emptyLabel="No teachers found." hasMore={teachers.filter(t => t.name.toLowerCase().includes(teachersSearch.toLowerCase()) || t.email.toLowerCase().includes(teachersSearch.toLowerCase())).length > 5} onViewAll={() => setModalOpen('teachers')} searchValue={teachersSearch} onSearchChange={setTeachersSearch}>
              {teachers.filter(t => t.name.toLowerCase().includes(teachersSearch.toLowerCase()) || t.email.toLowerCase().includes(teachersSearch.toLowerCase())).slice(0, 5).map((teacher, index) => (
                <RecordRow
                  key={teacher.id}
                  number={index + 1}
                  title={teacher.name}
                  detail={teacher.assignments.map((assignment) => `${assignment.subject} ${assignment.grade}`).join(', ') || teacher.email}
                  onDelete={() => deleteTeacher(teacher)}
                />
              ))}
            </RecordPanel>
          </section>

          <section className="px-6 pb-6 sm:px-8">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-900">All registered logins</h2>
              </div>
              <div className="mb-4 flex gap-3">
                <input type="text" value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} placeholder="Search by name, username, or email..." className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-[0.15em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.name.toLowerCase().includes(usersSearch.toLowerCase()) || u.username.toLowerCase().includes(usersSearch.toLowerCase()) || u.email.toLowerCase().includes(usersSearch.toLowerCase())).slice(0, 10).map((user) => (
                      <tr key={user.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">{user.name}</td>
                        <td className="px-4 py-3 text-slate-700">{user.username}</td>
                        <td className="px-4 py-3 capitalize text-slate-600">{user.role.replace('-', ' ')}</td>
                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive === false ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {user.isActive === false ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => deleteUser(user)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100" aria-label={`Delete login ${user.username}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No registered users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {users.length > 10 && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <button type="button" onClick={() => setModalOpen('users')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    See all
                  </button>
                </div>
              )}
            </div>
          </section>

          {modalOpen === 'classes' && (
            <RecordsModal title="All Classes / batches" onClose={() => setModalOpen(null)}>
              <div className="border-b border-slate-200 p-4">
                <input type="text" value={classesSearch} onChange={(e) => setClassesSearch(e.target.value)} placeholder="Search classes..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Medium</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.filter(c => c.label.toLowerCase().includes(classesSearch.toLowerCase())).map((classItem, index) => (
                    <tr key={classItem.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{classItem.label}</td>
                      <td className="px-4 py-3 text-slate-700">{classItem.subjectName ?? 'Subject not set'}</td>
                      <td className="px-4 py-3 text-slate-600">{classItem.medium} medium</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => deleteClass(classItem)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100" aria-label={`Delete class ${classItem.label}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </RecordsModal>
          )}

          {modalOpen === 'students' && (
            <RecordsModal title="All Student Records" onClose={() => setModalOpen(null)}>
              <div className="border-b border-slate-200 p-4">
                <input type="text" value={studentsSearch} onChange={(e) => setStudentsSearch(e.target.value)} placeholder="Search by name or index..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Index</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.name.toLowerCase().includes(studentsSearch.toLowerCase()) || s.index.toLowerCase().includes(studentsSearch.toLowerCase())).map((student, index) => {
                    const classItem = classes.find((item) => item.id === student.classId);
                    return (
                      <tr key={student.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{student.name}</td>
                        <td className="px-4 py-3 text-slate-700">{student.index}</td>
                        <td className="px-4 py-3 text-slate-600">{classItem?.label ?? student.grade}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => deleteStudent(student)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100" aria-label={`Delete student ${student.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </RecordsModal>
          )}

          {modalOpen === 'teachers' && (
            <RecordsModal title="All Teacher Records" onClose={() => setModalOpen(null)}>
              <div className="border-b border-slate-200 p-4">
                <input type="text" value={teachersSearch} onChange={(e) => setTeachersSearch(e.target.value)} placeholder="Search by name or email..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Assignments</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.filter(t => t.name.toLowerCase().includes(teachersSearch.toLowerCase()) || t.email.toLowerCase().includes(teachersSearch.toLowerCase())).map((teacher, index) => (
                    <tr key={teacher.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{teacher.name}</td>
                      <td className="px-4 py-3 text-slate-700">{teacher.email}</td>
                      <td className="px-4 py-3 text-slate-600">{teacher.assignments.map((assignment) => `${assignment.subject} ${assignment.grade}`).join(', ') || 'No assignments'}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => deleteTeacher(teacher)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100" aria-label={`Delete teacher ${teacher.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </RecordsModal>
          )}

          {modalOpen === 'users' && (
            <RecordsModal title="All Registered Logins" onClose={() => setModalOpen(null)}>
              <div className="border-b border-slate-200 p-4">
                <input type="text" value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} placeholder="Search by name, username, or email..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.name.toLowerCase().includes(usersSearch.toLowerCase()) || u.username.toLowerCase().includes(usersSearch.toLowerCase()) || u.email.toLowerCase().includes(usersSearch.toLowerCase())).map((user, index) => (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{user.name}</td>
                      <td className="px-4 py-3 text-slate-700">{user.username}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{user.role.replace('-', ' ')}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive === false ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {user.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 flex items-center justify-end">
                        {user.role === 'teacher' && (
                          <button
                            type="button"
                            onClick={() => promoteTeacherToAdmin(user)}
                            className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 transition hover:bg-amber-100"
                            aria-label={`Promote ${user.name} to admin`}
                            title="Promote to admin"
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                        )}
                        <button type="button" onClick={() => deleteUser(user)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100" aria-label={`Delete login ${user.username}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </RecordsModal>
          )}
        </section>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function RecordPanel({ title, emptyLabel, children, hasMore, onViewAll, searchValue, onSearchChange }: { title: string; emptyLabel: string; children: ReactNode; hasMore: boolean; onViewAll?: () => void; searchValue?: string; onSearchChange?: (value: string) => void }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {onSearchChange && (
          <input type="text" value={searchValue || ''} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search..." className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" />
        )}
      </div>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? items : <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{emptyLabel}</p>}
      </div>
      {hasMore && onViewAll && (
        <button type="button" onClick={onViewAll} className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
          See all
        </button>
      )}
    </div>
  );
}

function RecordRow({ number, title, detail, onDelete }: { number: number; title: string; detail: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">{number}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <button type="button" onClick={onDelete} className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100" aria-label={`Delete ${title}`}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Header({ eyebrow, title, label }: { eyebrow: string; title: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700">{label}</div>
    </div>
  );
}

function CredentialField({ value, onChange, onGenerate }: { value: string; onChange: (value: string) => void; onGenerate: () => void }) {
  return (
    <div className="flex gap-2">
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Issued password" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 min-w-0 flex-1" />
      <button type="button" onClick={onGenerate} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:bg-slate-100" aria-label="Generate password">
        <KeyRound className="h-4 w-4" />
      </button>
    </div>
  );
}

function RecordsModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-auto rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-slate-100" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
