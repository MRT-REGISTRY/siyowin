'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';
import { Users, Clock, ArrowLeft, Mail, Phone, UserCircle, Search, X, Award, BookOpen, FileText, Video, Link2, Trash2, Loader2, Plus, Edit3 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ApiSubjectModule, SubjectModuleItem } from '@/types';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/utils/api';

interface Props {
  subjects: any[];
  students: any[];
}

type ResourceType = 'document' | 'video' | 'link';
type TeacherHomework = {
  id: string;
  title: string;
  dueDate: string;
  completedCount: number;
  totalCount: number;
  records: Array<{ studentId: string; isDone: boolean; updatedAt?: string | null }>;
};

export default function TeacherClassesPage({ subjects, students }: Props) {
  const { isSinhala } = useLanguage();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgressStudent, setSelectedProgressStudent] = useState<any | null>(null);
  const [modules, setModules] = useState<ApiSubjectModule[]>([]);
  const [topicTitle, setTopicTitle] = useState('');
  const [resourceForm, setResourceForm] = useState({ moduleId: '', title: '', href: '', type: 'document' as ResourceType });
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState('');
  const [homeworks, setHomeworks] = useState<TeacherHomework[]>([]);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [homeworkStudentQuery, setHomeworkStudentQuery] = useState('');
  const [homeworkForm, setHomeworkForm] = useState({ title: '', dueDate: new Date().toISOString().slice(0, 10) });
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [homeworkError, setHomeworkError] = useState('');
    const [editingMark, setEditingMark] = useState<any | null>(null);
    const [editingMarkValue, setEditingMarkValue] = useState('');
    const [editMarkLoading, setEditMarkLoading] = useState(false);
    const [editMarkError, setEditMarkError] = useState('');
    const [editingHomework, setEditingHomework] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedClass = useMemo(() => {
    return selectedClassId ? subjects.find(s => s.id === selectedClassId) : null;
  }, [selectedClassId, subjects]);

  const enrolledStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const query = searchQuery.toLowerCase().trim();
    
    return students.filter(student => {
      const inClass = student.classId === selectedClassId || student.enrollments?.some((e: any) => e.classId === selectedClassId);
      if (!inClass) return false;
      
      if (!query) return true;
      return student.name.toLowerCase().includes(query) || student.index.toLowerCase().includes(query);
    });
  }, [selectedClassId, students, searchQuery]);

  const classAssignments = useMemo(() => {
    if (!selectedClassId) return [];
    const map = new Map<string, any>();
    students.forEach((s: any) => {
      (s.marks || []).forEach((m: any) => {
        if (m.subjectId === selectedClassId) {
          const key = `${m.examName}-${m.examDate}`;
          if (!map.has(key)) {
            map.set(key, { name: m.examName, type: m.examType, date: m.examDate });
          }
        }
      });
    });
    return Array.from(map.values()).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [students, selectedClassId]);

  const resourceGroups = useMemo(() => {
    return modules
      .map((module) => ({
        ...module,
        resources: module.items.filter((item): item is Extract<SubjectModuleItem, { type: 'document' | 'video' | 'link' }> =>
          item.type === 'document' || item.type === 'video' || item.type === 'link',
        ),
      }))
      .filter((module) => module.resources.length > 0);
  }, [modules]);

  const selectedHomework = selectedHomeworkId ? homeworks.find((homework) => homework.id === selectedHomeworkId) ?? null : null;
  const homeworkStudentSearch = homeworkStudentQuery.trim().toLowerCase();
  const homeworkStudents = useMemo(() => {
    if (!homeworkStudentSearch) return enrolledStudents;

    return enrolledStudents.filter((student) =>
      student.name.toLowerCase().includes(homeworkStudentSearch) ||
      student.index.toLowerCase().includes(homeworkStudentSearch),
    );
  }, [enrolledStudents, homeworkStudentSearch]);

  useEffect(() => {
    if (!selectedClassId) {
      setModules([]);
      setHomeworks([]);
      setSelectedHomeworkId(null);
      setResourceError('');
      setHomeworkError('');
      setResourceForm({ moduleId: '', title: '', href: '', type: 'document' });
      return;
    }

    let mounted = true;
    setResourceLoading(true);
    setResourceError('');
    Promise.all([
      apiGet<{ modules: ApiSubjectModule[] }>(`/dashboard/subjects/${selectedClassId}/modules`),
      apiGet<{ homeworks: TeacherHomework[] }>(`/teacher/homework/${selectedClassId}`),
    ])
      .then(([response, homeworkResponse]) => {
        if (!mounted) return;
        const nextModules = response.modules ?? [];
        setModules(nextModules);
        setHomeworks(homeworkResponse.homeworks ?? []);
        setSelectedHomeworkId((current) =>
          current && (homeworkResponse.homeworks ?? []).some((homework) => homework.id === current) ? current : null,
        );
        setResourceForm((current) => ({
          ...current,
          moduleId: current.moduleId && nextModules.some((module) => module.id === current.moduleId)
            ? current.moduleId
            : nextModules[0]?.id ?? '',
        }));
      })
      .catch((error) => {
        if (mounted) setResourceError(error instanceof Error ? error.message : 'Unable to load resources.');
      })
      .finally(() => {
        if (mounted) setResourceLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedClassId]);

  const reloadModules = async (preferredModuleId?: string) => {
    if (!selectedClassId) return [];
    const response = await apiGet<{ modules: ApiSubjectModule[] }>(`/dashboard/subjects/${selectedClassId}/modules`);
    const nextModules = response.modules ?? [];
    setModules(nextModules);
    setResourceForm((current) => ({
      ...current,
      moduleId: preferredModuleId ?? current.moduleId ?? nextModules[0]?.id ?? '',
    }));
    return nextModules;
  };

  const reloadHomeworks = async () => {
    if (!selectedClassId) return [];
    const response = await apiGet<{ homeworks: TeacherHomework[] }>(`/teacher/homework/${selectedClassId}`);
    setHomeworks(response.homeworks ?? []);
    return response.homeworks ?? [];
  };

  const handleTopicSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClassId) return;

    const title = topicTitle.trim();
    if (!title) {
      setResourceError('Enter a topic name.');
      return;
    }

    setResourceLoading(true);
    setResourceError('');
    try {
      const response = await apiPost<{ topic: ApiSubjectModule }>('/teacher/topics', {
        classId: selectedClassId,
        title,
      });
      await reloadModules(response.topic.id);
      setTopicTitle('');
    } catch (error) {
      setResourceError(error instanceof Error ? error.message : 'Unable to add topic.');
    } finally {
      setResourceLoading(false);
    }
  };

  const handleResourceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClassId) return;

    const title = resourceForm.title.trim();
    const href = resourceForm.href.trim();
    if (!title || !href) {
      setResourceError('Enter a resource title and external link.');
      return;
    }

    setResourceLoading(true);
    setResourceError('');
    try {
      let moduleId = resourceForm.moduleId || modules[0]?.id || '';
      if (!moduleId) {
        const response = await apiPost<{ topic: ApiSubjectModule }>('/teacher/topics', {
          classId: selectedClassId,
          title: 'Resources',
        });
        moduleId = response.topic.id;
      }

      await apiPost('/teacher/resources', {
        classId: selectedClassId,
        moduleId,
        title,
        href,
        type: resourceForm.type,
      });
      await reloadModules(moduleId);
      setResourceForm({ moduleId, title: '', href: '', type: resourceForm.type });
    } catch (error) {
      setResourceError(error instanceof Error ? error.message : 'Unable to add resource.');
    } finally {
      setResourceLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!selectedClassId) return;

    setResourceLoading(true);
    setResourceError('');
    try {
      await apiDelete(`/teacher/resources/${encodeURIComponent(selectedClassId)}/${encodeURIComponent(resourceId)}`);
      setModules((current) =>
        current.map((module) => ({
          ...module,
          items: module.items.filter((item) => item.id !== resourceId),
        })),
      );
    } catch (error) {
      setResourceError(error instanceof Error ? error.message : 'Unable to delete resource.');
    } finally {
      setResourceLoading(false);
    }
  };

  const handleDeleteTopic = async (moduleId: string) => {
    if (!selectedClassId) return;

    const topic = modules.find((module) => module.id === moduleId);
    const resourceCount = topic?.items.filter((item) => item.type === 'document' || item.type === 'video' || item.type === 'link').length ?? 0;
    const confirmed = window.confirm(
      resourceCount > 0
        ? `Delete "${topic?.title ?? 'this topic'}" and its ${resourceCount} resource(s)?`
        : `Delete "${topic?.title ?? 'this topic'}"?`,
    );
    if (!confirmed) return;

    setResourceLoading(true);
    setResourceError('');
    try {
      await apiDelete(`/teacher/topics/${encodeURIComponent(selectedClassId)}/${encodeURIComponent(moduleId)}`);
      setModules((current) => current.filter((module) => module.id !== moduleId));
      setResourceForm((current) => ({
        ...current,
        moduleId: current.moduleId === moduleId ? '' : current.moduleId,
      }));
    } catch (error) {
      setResourceError(error instanceof Error ? error.message : 'Unable to delete topic.');
    } finally {
      setResourceLoading(false);
    }
  };

  const handleHomeworkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClassId) return;

    const title = homeworkForm.title.trim();
    if (!title) {
      setHomeworkError('Enter a homework title.');
      return;
    }

    setHomeworkLoading(true);
    setHomeworkError('');
    try {
      await apiPost('/teacher/homework', {
        classId: selectedClassId,
        title,
        dueDate: new Date().toISOString().slice(0, 10),
      });
      await reloadHomeworks();
      setHomeworkForm((current) => ({ ...current, title: '' }));
    } catch (error) {
      setHomeworkError(error instanceof Error ? error.message : 'Unable to add homework.');
    } finally {
      setHomeworkLoading(false);
    }
  };

    const handleSaveMarkFromProgress = async () => {
      if (!editingMark || !selectedProgressStudent || !selectedClassId) return;

      const markValue = parseInt(editingMarkValue, 10);
      if (isNaN(markValue) || markValue < 0 || markValue > 100) {
        setEditMarkError('Mark must be a number between 0 and 100.');
        return;
      }

      setEditMarkLoading(true);
      setEditMarkError('');
      try {
        await apiPost('/teacher/marks', {
          studentId: selectedProgressStudent.id,
          subjectId: editingMark.subject_id,
          examType: editingMark.exam_type,
          examName: editingMark.exam_name,
          examDate: new Date().toISOString().split('T')[0],
          mark: markValue,
        });
        setEditingMark(null);
        setEditingMarkValue('');
        // Refresh the student data if needed
        if (selectedProgressStudent) {
          const idx = students.findIndex(s => s.id === selectedProgressStudent.id);
          if (idx >= 0) {
            students[idx].marks = students[idx].marks || [];
            const existingMarkIndex = students[idx].marks.findIndex((m: any) => 
              m.exam_name === editingMark.exam_name && 
              m.exam_type === editingMark.exam_type && 
              m.subject_id === editingMark.subject_id
            );
            if (existingMarkIndex >= 0) {
              students[idx].marks[existingMarkIndex].mark = markValue;
            } else {
              students[idx].marks.push({
                exam_name: editingMark.exam_name,
                exam_type: editingMark.exam_type,
                subject_id: editingMark.subject_id,
                subject_name: editingMark.subject_name,
                mark: markValue,
              });
            }
            setSelectedProgressStudent({...students[idx]});
          }
        }
      } catch (error) {
        setEditMarkError(error instanceof Error ? error.message : 'Unable to save mark.');
      } finally {
        setEditMarkLoading(false);
      }
    };

    const handleToggleHomeworkFromProgress = async (homeworkId: string, isDone: boolean) => {
      if (!selectedProgressStudent || !selectedClassId) return;

      setEditMarkLoading(true);
      setEditMarkError('');
      try {
        await apiPatch('/teacher/homework/completion', {
          classId: selectedClassId,
          homeworkId,
          studentId: selectedProgressStudent.id,
          isDone,
        });
        // Update local state
        const hwIndex = homeworks.findIndex(hw => hw.id === homeworkId);
        if (hwIndex >= 0) {
          const recordIndex = homeworks[hwIndex].records.findIndex(r => r.studentId === selectedProgressStudent.id);
          if (recordIndex >= 0) {
            homeworks[hwIndex].records[recordIndex].isDone = isDone;
          } else {
            homeworks[hwIndex].records.push({ studentId: selectedProgressStudent.id, isDone, updatedAt: null });
          }
          if (isDone) homeworks[hwIndex].completedCount++;
          else homeworks[hwIndex].completedCount--;
          setHomeworks([...homeworks]);
        }
      } catch (error) {
        setEditMarkError(error instanceof Error ? error.message : 'Unable to update homework.');
      } finally {
        setEditMarkLoading(false);
      }
    };
  const handleHomeworkCompletion = async (homeworkId: string, studentId: string, isDone: boolean) => {
    if (!selectedClassId) return;

    setHomeworkLoading(true);
    setHomeworkError('');
    try {
      await apiPatch('/teacher/homework/completion', {
        classId: selectedClassId,
        homeworkId,
        studentId,
        isDone,
      });
      await reloadHomeworks();
    } catch (error) {
      setHomeworkError(error instanceof Error ? error.message : 'Unable to update homework completion.');
    } finally {
      setHomeworkLoading(false);
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (!selectedClassId) return;
    const homework = homeworks.find((item) => item.id === homeworkId);
    if (!window.confirm(`Delete "${homework?.title ?? 'this homework'}"?`)) return;

    setHomeworkLoading(true);
    setHomeworkError('');
    try {
      await apiDelete(`/teacher/homework/${encodeURIComponent(selectedClassId)}/${encodeURIComponent(homeworkId)}`);
      setHomeworks((current) => current.filter((item) => item.id !== homeworkId));
      setSelectedHomeworkId((current) => current === homeworkId ? null : current);
      setHomeworkStudentQuery('');
    } catch (error) {
      setHomeworkError(error instanceof Error ? error.message : 'Unable to delete homework.');
    } finally {
      setHomeworkLoading(false);
    }
  };

  if (selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSelectedClassId(null); setSearchQuery(''); }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {selectedClass.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                {selectedClass.grade}
              </span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                {selectedClass.medium}
              </span>
            </div>
          </div>
        </div>

        <div className="sdp-card p-6">
        {editingMark && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
              <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                <h3 className="text-lg font-black text-slate-800">
                  {isSinhala ? 'ලකුණු සකස්කරන්න' : 'Edit Mark'}
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  {selectedProgressStudent?.name} • {editingMark.exam_name}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {editMarkError && (
                  <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {editMarkError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {isSinhala ? 'ලකුණු (0-100)' : 'Mark (0-100)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingMarkValue}
                    onChange={(e) => {
                      setEditingMarkValue(e.target.value);
                      setEditMarkError('');
                    }}
                    placeholder={isSinhala ? 'ලකුණු ඇතුළු කරන්න' : 'Enter mark'}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1B3A8C] focus:ring-1 focus:ring-[#1B3A8C]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingMark(null);
                      setEditingMarkValue('');
                      setEditMarkError('');
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    {isSinhala ? '취소' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveMarkFromProgress}
                    disabled={editMarkLoading || !editingMarkValue}
                    className="flex-1 rounded-xl bg-[#1B3A8C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#152C6A] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editMarkLoading ? (
                      <>
                        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
                        {isSinhala ? 'සුරකින්න...' : 'Saving...'}
                      </>
                    ) : (
                      isSinhala ? 'සුරකින්න' : 'Save'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-[#1B3A8C]" />
                Class Resources
              </h3>
              <p className="mt-1 text-xs text-slate-500">Share external Google Drive, YouTube, or website links with enrolled students.</p>
            </div>
            {resourceLoading && <Loader2 size={18} className="animate-spin text-slate-400" />}
          </div>

          <form className="grid gap-3 lg:grid-cols-[160px_1fr_1.5fr_auto]" onSubmit={handleResourceSubmit}>
            <select
              value={resourceForm.type}
              onChange={(event) => setResourceForm((current) => ({ ...current, type: event.target.value as ResourceType }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#1B3A8C]"
            >
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
            </select>
            <input
              value={resourceForm.title}
              onChange={(event) => setResourceForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1B3A8C]"
            />
            <input
              value={resourceForm.href}
              onChange={(event) => setResourceForm((current) => ({ ...current, href: event.target.value }))}
              placeholder="https://drive.google.com/... or https://youtube.com/..."
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1B3A8C]"
            />
            <button
              type="submit"
              disabled={resourceLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B3A8C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#152C6A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              Add
            </button>
          </form>

          {resourceError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{resourceError}</p>}

          <div className="mt-5 space-y-3">
            {resourceGroups.flatMap((group) => group.resources).map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <ResourceIcon type={item.type} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">{item.title}</p>
                    <a href={item.href} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs font-medium text-blue-600 hover:underline">
                      {item.href}
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteResource(item.id)}
                  disabled={resourceLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            ))}

            {!resourceLoading && resourceGroups.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                No resources shared yet.
              </div>
            )}
          </div>
        </div>

        <div className="sdp-card p-6">
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-[#1B3A8C]" />
                Homework Completion
              </h3>
              <p className="mt-1 text-xs text-slate-500">Create homework and mark each student as done or not done.</p>
            </div>
            {homeworkLoading && <Loader2 size={18} className="animate-spin text-slate-400" />}
          </div>

          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleHomeworkSubmit}>
            <input
              value={homeworkForm.title}
              onChange={(event) => setHomeworkForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Homework title"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1B3A8C]"
            />
            <button
              type="submit"
              disabled={homeworkLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B3A8C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#152C6A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              Add Homework
            </button>
          </form>

          {homeworkError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{homeworkError}</p>}

          <div className="mt-5 space-y-4">
            {homeworks.map((homework) => (
              <div key={homework.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{homework.title}</h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {homework.completedCount}/{homework.totalCount} done
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHomeworkId(homework.id);
                    setHomeworkStudentQuery('');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1B3A8C] bg-white px-3 py-2 text-xs font-bold text-[#1B3A8C] transition hover:bg-[#1B3A8C] hover:text-white"
                    >
                      Manage Completion
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHomework(homework.id)}
                      disabled={homeworkLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!homeworkLoading && homeworks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                No homework added yet.
              </div>
            )}
          </div>
        </div>

        <div className="sdp-card p-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-[#1B3A8C]" />
                {isSinhala ? 'ලියාපදිංචි සිසුන්' : 'Enrolled Students'}
              </h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {enrolledStudents.length} {isSinhala ? 'සිසුන්' : 'Total'}
              </span>
            </div>
            <div 
              onClick={() => inputRef.current?.focus()} 
              className="sd-search-bar bg-white border border-slate-200 w-full sm:max-w-md cursor-text"
            >
              <Search size={15} className="sd-search-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder={isSinhala ? 'සිසුවා සොයන්න...' : 'Search by name or ID...'}
                className="sd-search-input bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {enrolledStudents.map(student => (
              <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{student.name}</h4>
                    <p className="text-xs text-slate-500 uppercase font-medium">{student.index}</p>
                  </div>
                </div>
                
                <div className="mt-3 sm:mt-0 flex flex-col gap-1.5 text-xs text-slate-500">
                  {student.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {student.email}
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {student.phone}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedProgressStudent(student)}
                  className="mt-3 sm:mt-0 px-4 py-2 rounded-xl text-xs font-bold border border-[#1B3A8C] text-[#1B3A8C] hover:bg-[#1B3A8C] hover:text-white transition self-start sm:self-center"
                >
                  {isSinhala ? 'ප්‍රගතිය' : 'View Progress'}
                </button>
              </div>
            ))}

            {enrolledStudents.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-500 flex flex-col items-center">
                <UserCircle size={40} className="text-slate-300 mb-3" />
                {searchQuery 
                  ? (isSinhala ? 'මෙම නම හෝ හැඳුනුම්පත සහිත සිසුවෙකු හමු නොවීය.' : 'No students match your search query.')
                  : (isSinhala ? 'මෙම පන්තිය සඳහා කිසිදු සිසුවෙකු ලියාපදිංචි වී නොමැත.' : 'No students are currently enrolled in this class.')}
              </div>
            )}
          </div>
        </div>

        {selectedProgressStudent && (() => {
          const studentSubjectMarks = (selectedProgressStudent.marks || [])
            .filter((m: any) => m.subjectId === selectedClassId)
            .sort((a: any, b: any) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

          const averageMark = studentSubjectMarks.length === 0 
            ? 0 
            : Math.round(studentSubjectMarks.reduce((acc: number, m: any) => acc + (m.mark || 0), 0) / studentSubjectMarks.length);

          const gradeLabel = (() => {
            if (studentSubjectMarks.length === 0) return '-';
            if (averageMark >= 75) return isSinhala ? 'ඒ (විශිෂ්ට)' : 'A (Excellent)';
            if (averageMark >= 65) return isSinhala ? 'බී (ඉතා හොඳ)' : 'B (Very Good)';
            if (averageMark >= 50) return isSinhala ? 'සී (සාමාන්‍ය)' : 'C (Credit)';
            if (averageMark >= 35) return isSinhala ? 'එස් (සාමාර්ථය)' : 'S (Simple Pass)';
            return isSinhala ? 'ඩබ්ලිව් (අසමත්)' : 'F (Fail)';
          })();

          const chartData = studentSubjectMarks.map((m: any) => ({
            name: m.examName,
            score: m.mark,
          }));

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-3 sm:px-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex-shrink-0 relative flex items-center justify-center p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-base sm:text-lg text-slate-800 text-center pr-10">
                    {isSinhala ? 'සිසු ප්‍රගති වාර්තාව' : 'Student Progress Report'}
                  </h3>
                  <button 
                    onClick={() => setSelectedProgressStudent(null)} 
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1" 
                    title={isSinhala ? 'වසන්න' : 'Close'}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
                  {/* Student Profile Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                    <div className="flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-full bg-[#1B3A8C] text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                      {selectedProgressStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-bold text-slate-800">{selectedProgressStudent.name}</h4>
                      <p className="text-xs font-semibold text-[#1B3A8C] uppercase mt-0.5">{selectedProgressStudent.index}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase mt-0.5 truncate">{selectedClass.name} • {selectedClass.grade}</p>
                    </div>
                  </div>

                  {/* Student Details Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3 sm:p-4 rounded-xl border border-blue-100">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">{isSinhala ? 'ඉංගිති' : 'ID'}</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedProgressStudent.index}</p>
                    </div>
                    {selectedProgressStudent.phone && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">{isSinhala ? 'දුරකතන' : 'Phone'}</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedProgressStudent.phone}</p>
                      </div>
                    )}
                    {selectedProgressStudent.parent_name && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">{isSinhala ? 'දෙමාපිය නම' : 'Parent Name'}</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedProgressStudent.parent_name}</p>
                      </div>
                    )}
                    {selectedProgressStudent.parent_phone && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">{isSinhala ? 'දෙමාපිය දුරකතන' : 'Parent Phone'}</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedProgressStudent.parent_phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Chart Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                      <Award size={14} className="text-[#1B3A8C] flex-shrink-0" />
                      {isSinhala ? 'පැවරුම් ලකුණු ප්‍රවණතාව' : 'Assignment Score Trend'}
                    </h4>
                    {studentSubjectMarks.length > 0 ? (
                      <div className="h-[200px] sm:h-[220px] w-full bg-white rounded-xl border border-slate-100 p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" name={isSinhala ? 'ලකුණු' : 'Score'} stroke="#1B3A8C" strokeWidth={3} dot={{ r: 4, fill: '#1B3A8C' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[200px] sm:h-[220px] bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                        <Clock size={32} className="text-slate-300 mb-2 animate-pulse" />
                        {isSinhala ? 'තවමත් ලකුණු කිසිවක් ඇතුළත් කර නොමැත.' : 'No assignments have been graded for this student yet.'}
                      </div>
                    )}
                  </div>

                  {/* Recent Assignments & Marks Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#1B3A8C] flex-shrink-0" />
                      {isSinhala ? 'පැවරුම් සහ ලකුණු' : 'Assignments & Marks'}
                    </h4>
                    {classAssignments.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                        {classAssignments.map((assignment: any, index: number) => {
                          const sMark = (selectedProgressStudent.marks || []).find((m: any) => m.subjectId === selectedClassId && m.examName === assignment.name);
                          const isAbsent = sMark?.isAbsent === true;
                          const hasMark = sMark && sMark.mark !== undefined && sMark.mark !== null && !isAbsent;

                          return (
                            <div key={index} className="p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition-colors gap-2">
                              <div className="pr-0 sm:pr-3 min-w-0">
                                <h5 className="text-xs sm:text-sm font-bold text-slate-700 truncate">{assignment.name}</h5>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{assignment.type}</span>
                                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{assignment.date}</span>
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                <div className="flex items-center gap-2">
                                {hasMark ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold uppercase tracking-wider">
                                    {sMark.mark}%
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                                    {isSinhala ? 'නැත' : 'Pending'}
                                  </span>
                                )}
                                  <button
                                    onClick={() => {
                                      setEditingMark({
                                        exam_name: assignment.name,
                                        exam_type: assignment.type,
                                        subject_id: selectedClassId,
                                        subject_name: selectedClass.name,
                                        mark: hasMark ? sMark.mark : '',
                                        student_id: selectedProgressStudent.id,
                                      });
                                      setEditingMarkValue(hasMark ? sMark.mark.toString() : '');
                                    }}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-[#1B3A8C]"
                                    title={isSinhala ? 'ලකුණු සකස්කරන්න' : 'Edit mark'}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {isSinhala ? 'කිසිදු පැවරුමක් හමු නොවීය.' : 'No assignments have been created yet.'}
                      </div>
                    )}
                  </div>

                  {/* Homework Completion Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#1B3A8C] flex-shrink-0" />
                      {isSinhala ? 'ගৃහ කාර්ය සම්පාදනය' : 'Homework Completion'}
                    </h4>
                    {homeworks.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                        {homeworks.map((homework: any) => {
                          const hwRecord = homework.records.find((r: any) => r.studentId === selectedProgressStudent.id);
                          const isCompleted = hwRecord?.isDone || false;

                          return (
                            <div key={homework.id} className="p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition-colors gap-2">
                              <div className="pr-0 sm:pr-3 min-w-0">
                                <h5 className="text-xs sm:text-sm font-bold text-slate-700 truncate">{homework.title}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{homework.dueDate}</span>
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                                    ✓ {isSinhala ? 'සම්පූර්ණ' : 'Done'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold uppercase tracking-wider">
                                    {isSinhala ? 'අපූර්ණ' : 'Pending'}
                                  </span>
                                )}
                                  <button
                                    onClick={() => handleToggleHomeworkFromProgress(homework.id, !isCompleted)}
                                    disabled={editMarkLoading}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-[#1B3A8C] disabled:opacity-50"
                                    title={isCompleted ? (isSinhala ? 'අපූර්ණ ලෙස සලකුණු කරන්න' : 'Mark as pending') : (isSinhala ? 'සම්පූර්ණ ලෙස සලකුණු කරන්න' : 'Mark as done')}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {isSinhala ? 'ගෙරු කර්තव්ය නොමැත.' : 'No homework assigned.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {selectedHomework && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="relative border-b border-slate-100 bg-slate-50/70 p-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHomeworkId(null);
                    setHomeworkStudentQuery('');
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-slate-700"
                  aria-label="Close homework completion"
                >
                  <X size={20} />
                </button>
                <h3 className="pr-10 text-lg font-black text-slate-800">{selectedHomework.title}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {selectedHomework.completedCount}/{selectedHomework.totalCount} done
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {homeworkError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{homeworkError}</p>}
                <div className="mb-4 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search size={15} className="flex-shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={homeworkStudentQuery}
                    onChange={(event) => setHomeworkStudentQuery(event.target.value)}
                    placeholder="Search student by name or ID..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {homeworkStudentQuery && (
                    <button
                      type="button"
                      onClick={() => setHomeworkStudentQuery('')}
                      className="flex-shrink-0 text-slate-400 transition hover:text-slate-700"
                      aria-label="Clear student search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {homeworkStudents.map((student) => {
                    const record = selectedHomework.records.find((item) => item.studentId === student.id);
                    const isDone = Boolean(record?.isDone);
                    return (
                      <label key={student.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800">{student.name}</span>
                          <span className="block text-xs font-medium uppercase text-slate-400">{student.index}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={isDone}
                          disabled={homeworkLoading}
                          onChange={(event) => handleHomeworkCompletion(selectedHomework.id, student.id, event.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-[#1B3A8C] focus:ring-[#1B3A8C]"
                        />
                      </label>
                    );
                  })}
                </div>
                {enrolledStudents.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    No students are currently enrolled in this class.
                  </div>
                )}
                {enrolledStudents.length > 0 && homeworkStudents.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    No students match this search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          {isSinhala ? 'මගේ පන්ති' : 'My Classes'}
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setSelectedClassId(subject.id)}
            className="sdp-card p-5 text-left transition-all hover:border-[#1B3A8C] hover:shadow-md group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {subject.grade}
                </span>
                <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {subject.medium}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1B3A8C] transition-colors">{subject.name}</h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl self-start sm:self-center">
              <Users size={14} className="text-[#1B3A8C]" />
              <span>{subject.studentCount} {isSinhala ? 'සිසුන්' : 'Students'}</span>
            </div>
          </button>
        ))}
        {subjects.length === 0 && (
          <div className="sdp-card p-8 text-center text-sm text-slate-500">
            {isSinhala ? 'පන්ති කිසිවක් හමු නොවීය.' : 'No classes assigned.'}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceIcon({ type }: { type: ResourceType }) {
  const iconClass = 'mt-0.5 h-9 w-9 flex-shrink-0 rounded-xl border bg-white p-2';

  if (type === 'document') {
    return <FileText className={`${iconClass} border-emerald-100 text-emerald-600`} />;
  }

  if (type === 'video') {
    return <Video className={`${iconClass} border-red-100 text-red-600`} />;
  }

  return <Link2 className={`${iconClass} border-blue-100 text-blue-600`} />;
}
