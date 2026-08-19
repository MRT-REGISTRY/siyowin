'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import {
  filterStudents,
} from '@/utils/admin';
import { apiDelete, apiGet, apiPost } from '@/utils/api';
import { AdminClassOption, AdminExamType, AdminStudent, AdminStudentMark, AdminSubjectOption } from '@/types';
import { buildMarkKey } from '@/utils/admin';

type NoticeVariant = 'success' | 'danger' | 'info';

type NoticeState = {
  message: string;
  variant: NoticeVariant;
};

const DEFAULT_CSV_COLUMNS = ['student_index', 'student_name', 'grade', 'class', 'subject_id', 'subject_name', 'exam_type', 'exam_name', 'exam_date', 'mark', 'note'];
const CSV_TEMPLATE = `${DEFAULT_CSV_COLUMNS.join(',')}
2026-11-012,Alex Johnson,Grade 11,A,math,Mathematics,term-test,Term Test 2,2026-05-14,91,Strong algebra`;

export default function MarksPage() {
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [classes, setClasses] = useState<AdminClassOption[]>([]);
  const [subjects, setSubjects] = useState<AdminSubjectOption[]>([]);
  const [examTypes, setExamTypes] = useState<AdminExamType[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>(DEFAULT_CSV_COLUMNS);

  const [selectedGrade, setSelectedGrade] = useState('Grade 11');
  const [selectedClassId, setSelectedClassId] = useState('11-a');
  const [selectedSubjectId, setSelectedSubjectId] = useState('math');
  const [selectedExamType, setSelectedExamType] = useState('term-test');
  const [examName, setExamName] = useState('Term Test 2');
  const [examDate, setExamDate] = useState('2026-05-14');
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [markValue, setMarkValue] = useState('91');
  const [markNote, setMarkNote] = useState('Strong performance');
  const [csvText, setCsvText] = useState(CSV_TEMPLATE);

  const classesForSelectedGrade = useMemo(() => classes.filter((classItem) => classItem.grade === selectedGrade), [classes, selectedGrade]);
  const selectedClass = classes.find((classItem) => classItem.id === selectedClassId);
  const subjectsForSelectedClass = useMemo(() => {
    if (!selectedClass?.subjectId) return subjects;
    const matchedSubject = subjects.find((subject) => subject.id === selectedClass.subjectId);
    return matchedSubject
      ? [matchedSubject]
      : [{ id: selectedClass.subjectId, name: selectedClass.subjectName ?? selectedClass.subjectId, teacher: 'Unassigned' }];
  }, [selectedClass, subjects]);

  useEffect(() => {
    apiGet<{ grades: string[]; classes: AdminClassOption[]; subjects: AdminSubjectOption[]; examTypes: AdminExamType[]; csvColumns: string[] }>('/admin/meta')
      .then((data) => {
        setGrades(data.grades);
        setClasses(data.classes);
        setSubjects(data.subjects);
        setExamTypes(data.examTypes);
        setCsvColumns(data.csvColumns);
        setSelectedGrade(data.grades[0] ?? 'Grade 11');
        setSelectedClassId(data.classes[0]?.id ?? '11-a');
        setSelectedSubjectId(data.subjects[0]?.id ?? 'math');
        setSelectedExamType(data.examTypes[0]?.id ?? 'term-test');
      })
      .catch(() => showNotice('Admin metadata could not be loaded.', 'danger'));
    apiGet<{ students: AdminStudent[] }>('/admin/students')
      .then((data) => {
        setStudents(data.students);
        setSelectedStudentId(data.students[0]?.id ?? '');
      })
      .catch(() => showNotice('Students could not be loaded.', 'danger'));
  }, []);

  useEffect(() => {
    if (!classesForSelectedGrade.some((classItem) => classItem.id === selectedClassId)) {
      setSelectedClassId(classesForSelectedGrade[0]?.id ?? '');
    }
  }, [classesForSelectedGrade, selectedClassId]);

  useEffect(() => {
    if (!subjectsForSelectedClass.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(subjectsForSelectedClass[0]?.id ?? '');
    }
  }, [subjectsForSelectedClass, selectedSubjectId]);

  useEffect(() => {
    if (!students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0]?.id ?? '');
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const filteredStudents = useMemo(
    () => filterStudents(students, { grade: selectedGrade, classId: selectedClassId, query: studentQuery }),
    [selectedGrade, selectedClassId, studentQuery, students],
  );

  useEffect(() => {
    if (!filteredStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0]?.id ?? '');
    }
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const currentSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0];
  const currentMarkKey = buildMarkKey(selectedSubjectId, selectedExamType, examName.trim(), examDate);
  const currentMark = selectedStudent?.marks.find(
    (item) => buildMarkKey(item.subjectId, item.examType, item.examName, item.examDate) === currentMarkKey,
  ) ?? null;

  const showNotice = (message: string, variant: NoticeVariant = 'success') => {
    setNotice({ message, variant });
  };

  const upsertCurrentMark = () => {
    if (!selectedStudent || !currentSubject) {
      showNotice('Select a student before saving the mark.', 'info');
      return;
    }

    const mark = Number(markValue);
    if (Number.isNaN(mark)) {
      showNotice('Enter a valid mark before saving.', 'danger');
      return;
    }

    const nextMark: AdminStudentMark = {
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      classId: selectedClassId,
      examType: selectedExamType,
      examName: examName.trim() || 'Untitled Exam',
      examDate,
      mark,
      note: markNote.trim(),
    };

    const actionLabel = currentMark ? 'updated' : 'saved';

    apiPost('/admin/marks', { studentId: selectedStudent.id, ...nextMark })
      .then(() => {
        setStudents((previous) =>
      previous.map((student) => {
        if (student.id !== selectedStudent.id) return student;

        const existingIndex = student.marks.findIndex(
          (item) => buildMarkKey(item.subjectId, item.examType, item.examName, item.examDate) === buildMarkKey(nextMark.subjectId, nextMark.examType, nextMark.examName, nextMark.examDate),
        );

        const nextMarks = [...student.marks];
        if (existingIndex >= 0) {
          nextMarks[existingIndex] = nextMark;
        } else {
          nextMarks.unshift(nextMark);
        }

        return { ...student, marks: nextMarks };
      }),
        );
        showNotice(`${currentSubject.name} ${actionLabel} for ${selectedStudent.name}.`, 'success');
      })
      .catch((error) => showNotice(error instanceof Error ? error.message : 'Mark was not saved.', 'danger'));
  };

  const deleteCurrentMark = () => {
    if (!selectedStudent) {
      showNotice('Select a student before deleting a mark.', 'info');
      return;
    }

    if (!currentMark) {
      showNotice('No mark found for the selected subject and exam.', 'info');
      return;
    }

    apiDelete(`/admin/marks?studentId=${encodeURIComponent(selectedStudent.id)}&subjectId=${encodeURIComponent(selectedSubjectId)}&examType=${encodeURIComponent(selectedExamType)}&examName=${encodeURIComponent(examName.trim())}&examDate=${encodeURIComponent(examDate)}`)
      .then(() => {
        setStudents((previous) =>
      previous.map((student) => {
        if (student.id !== selectedStudent.id) return student;

        return {
          ...student,
          marks: student.marks.filter(
            (item) => buildMarkKey(item.subjectId, item.examType, item.examName, item.examDate) !== currentMarkKey,
          ),
        };
      }),
        );
        showNotice(`Removed ${currentSubject.name} mark for ${selectedStudent.name}.`, 'danger');
      })
      .catch((error) => showNotice(error instanceof Error ? error.message : 'Mark was not deleted.', 'danger'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {notice && (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,24rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-full p-2 ${notice.variant === 'success' ? 'bg-emerald-100 text-emerald-700' : notice.variant === 'danger' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Update complete</p>
              <p className="mt-1 text-sm text-slate-600">{notice.message}</p>
            </div>
            <button type="button" onClick={() => setNotice(null)} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  <ShieldCheck className="h-4 w-4" />
                  Results management
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Marks management</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Use this page to add, update, or delete marks. The form is filtered by grade, class, subject, and exam metadata first so the upload stays unambiguous.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current grade</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{selectedGrade}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current class</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{selectedClass?.label ?? 'No class selected'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current subject</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{currentSubject?.name}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Visible students</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 xl:grid-cols-[0.95fr_1.05fr] sm:px-8">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Result filter</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Select the upload context</h2>
                </div>
                <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  {statsLabel(filteredStudents.length)}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                </select>
                <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {classesForSelectedGrade.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.label}</option>)}
                </select>
                <select value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {subjectsForSelectedClass.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
                <select value={selectedExamType} onChange={(event) => setSelectedExamType(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {examTypes.map((exam) => <option key={exam.id} value={exam.id}>{exam.label}</option>)}
                </select>
                <input value={examName} onChange={(event) => setExamName(event.target.value)} placeholder="Exam name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 xl:col-span-2" />
                <input value={examDate} onChange={(event) => setExamDate(event.target.value)} type="date" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 xl:col-span-2" />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setUploadMode('single')} className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${uploadMode === 'single' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  Single student
                </button>
                <button type="button" onClick={() => setUploadMode('bulk')} className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${uploadMode === 'bulk' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  Bulk CSV
                </button>
              </div>

              {uploadMode === 'single' && (
                <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Search className="h-4 w-4" />
                      Search students by name or index
                    </div>
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Type name or index" className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" />
                    </div>

                    <div className="mt-4 space-y-2">
                      {filteredStudents.map((student) => (
                        <button key={student.id} type="button" onClick={() => setSelectedStudentId(student.id)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selectedStudentId === student.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                          <div>
                            <p className="font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.index} · {student.grade}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                      {filteredStudents.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">No students matched the current filter.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected student</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedStudent?.name ?? 'No student selected'}</h3>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{currentSubject?.name}</div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className="space-y-2 text-sm text-slate-600">
                        <span>Mark</span>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={markValue} 
                          onChange={(event) => {
                            const val = event.target.value;
                            if (val === '') {
                              setMarkValue('');
                              return;
                            }
                            const num = Number(val);
                            if (num < 0) {
                              setMarkValue('0');
                            } else if (num > 100) {
                              setMarkValue('100');
                            } else {
                              setMarkValue(val);
                            }
                          }} 
                          inputMode="numeric" 
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900" 
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-600 sm:col-span-2">
                        <span>Note</span>
                        <input value={markNote} onChange={(event) => setMarkNote(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900" />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={upsertCurrentMark} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500">
                        <BookOpenCheck className="h-4 w-4" />
                        {currentMark ? 'Update mark' : 'Add mark'}
                      </button>
                      <button type="button" onClick={deleteCurrentMark} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                        <Trash2 className="h-4 w-4" />
                        Delete mark
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {uploadMode === 'bulk' && (
                <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <FileSpreadsheet className="h-4 w-4" />
                      Bulk CSV upload
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Paste or upload a CSV using the structure below.
                    </p>

                    <label className="mt-4 block rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                      <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">CSV file</span>
                      <input type="file" accept=".csv" className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                    </label>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">CSV preview</p>
                      <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} className="mt-2 min-h-56 w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Users className="h-4 w-4" />
                      Relevant CSV columns
                    </div>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-xs uppercase tracking-[0.15em] text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Required column</th>
                            <th className="px-4 py-3">Purpose</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvColumns.map((column) => (
                            <tr key={column} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-medium text-slate-900">{column}</td>
                              <td className="px-4 py-3 text-slate-600">
                                {column === 'student_index' && 'Unique student index across grades'}
                                {column === 'student_name' && 'Student name'}
                                {column === 'grade' && 'Selected grade'}
                                {column === 'class' && 'Selected class'}
                                {column === 'subject_id' && 'Subject id like math or sci'}
                                {column === 'subject_name' && 'Subject display name'}
                                {column === 'exam_type' && 'term-test, day-paper, month-test, quiz, practical'}
                                {column === 'exam_name' && 'Exam display name'}
                                {column === 'exam_date' && 'ISO date for the exam'}
                                {column === 'mark' && 'Final obtained mark'}
                                {column === 'note' && 'Optional note'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Existing records are hidden here to keep this page focused on adding, updating, and deleting results.
              </p>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function statsLabel(count: number) {
  return `${count} students match the current filter`;
}
