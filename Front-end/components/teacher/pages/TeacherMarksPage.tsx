'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, Plus, Edit3, Trash2, X, Filter, Calendar, FileText, CheckCircle, Pencil, Copy } from 'lucide-react';
import { apiPost, apiRequest, getStoredToken, apiGet } from '@/utils/api';
import { useLanguage } from '@/components/LanguageProvider';

interface Props {
  subjects: any[];
  students: any[];
  examTypes: any[];
  dbExams: any[];
  initialSubjectId: string | null;
  onRefresh: () => void;
}

export default function TeacherMarksPage({ subjects, students, examTypes, dbExams, initialSubjectId, onRefresh }: Props) {
  const { isSinhala } = useLanguage();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialSubjectId || null);
  const [selectedAssignment, setSelectedAssignment] = useState<{ examType: string, examName: string, examDate: string } | null>(null);
  
  // Filters for View 2 (Assignments)
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('');
  
  // Filters for View 3 (Students)
  const [studentSearch, setStudentSearch] = useState('');
  
  // Local cache for empty assignments
  const [emptyAssignments, setEmptyAssignments] = useState<Array<{ classId: string, examType: string, examName: string, examDate: string, markedStudentCount: number }>>([]);
  
  // Modals
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [editingMark, setEditingMark] = useState<any>(null);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<{ examType: string; examName: string; examDate: string } | null>(null);
  const [editAssignmentType, setEditAssignmentType] = useState('');
  const [editAssignmentName, setEditAssignmentName] = useState('');
  const [editAssignmentDate, setEditAssignmentDate] = useState('');
  
  // Forms
  const [formExamName, setFormExamName] = useState('');
  const [formExamDate, setFormExamDate] = useState('');
  const [formExamType, setFormExamType] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formMarkValue, setFormMarkValue] = useState('');
  const [generatedPortalLink, setGeneratedPortalLink] = useState('');
  
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-generate Assignment Name
  useEffect(() => {
    if (showAddAssignmentModal) {
      const typeLabel = examTypes.find(t => t.id === formExamType)?.label || 'Assignment';
      setFormExamName(`${typeLabel} ${formExamDate}`);
    }
  }, [formExamType, formExamDate, showAddAssignmentModal, examTypes]);

  // Auto-generate Portal Link when assignment is selected
  useEffect(() => {
    if (selectedAssignment && selectedClassId) {
      const link = buildPortalLink({
        subjectId: selectedClassId,
        examType: selectedAssignment.examType,
        examName: selectedAssignment.examName,
        examDate: selectedAssignment.examDate,
      });
      setGeneratedPortalLink(link);
    }
  }, [selectedAssignment, selectedClassId]);

  const selectedClass = useMemo(() => {
    return selectedClassId ? subjects.find(s => s.id === selectedClassId) : null;
  }, [selectedClassId, subjects]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(student => student.classId === selectedClassId || student.enrollments?.some((e: any) => e.classId === selectedClassId));
  }, [selectedClassId, students]);

  // Extract all unique assignments for View 2
  const classAssignments = useMemo(() => {
    if (!selectedClassId) return [];
    const assignmentsMap = new Map();
    
    students.forEach(student => {
      if (student.marks) {
        student.marks.forEach((mark: any) => {
          if (mark.subjectId === selectedClassId) {
            const key = `${mark.examType}||${mark.examName}||${mark.examDate}`;
            if (!assignmentsMap.has(key)) {
              assignmentsMap.set(key, {
                examType: mark.examType,
                examName: mark.examName,
                examDate: mark.examDate,
                markedStudentCount: 1
              });
            } else {
              assignmentsMap.get(key).markedStudentCount += 1;
            }
          }
        });
      }
    });
    return Array.from(assignmentsMap.values());
  }, [students, selectedClassId]);

  const allKnownAssignments = useMemo(() => {
    const combined = new Map<string, any>();

    // 1. Seed from DB exams (authoritative — these survive page reloads)
    dbExams.forEach(e => {
      if (e.classId === selectedClassId) {
        const key = `${e.examType}||${e.examName}||${e.examDate}`;
        combined.set(key, { examType: e.examType, examName: e.examName, examDate: e.examDate, markedStudentCount: e.markedStudentCount ?? 0 });
      }
    });

    // 2. Override/add with student-marks-derived data (has accurate markedStudentCount)
    classAssignments.forEach(a => {
      const key = `${a.examType}||${a.examName}||${a.examDate}`;
      combined.set(key, a);
    });

    // 3. Add locally-created assignments not yet in DB (optimistic UI)
    emptyAssignments.forEach(empty => {
      if (empty.classId === selectedClassId) {
        const key = `${empty.examType}||${empty.examName}||${empty.examDate}`;
        if (!combined.has(key)) combined.set(key, empty);
      }
    });

    return Array.from(combined.values()).sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
  }, [classAssignments, emptyAssignments, dbExams, selectedClassId]);

  const filteredAssignments = useMemo(() => {
    return allKnownAssignments.filter(a => {
      const q = assignmentSearch.toLowerCase().trim();
      const matchesSearch = !q || a.examName.toLowerCase().includes(q);
      const matchesType = !assignmentTypeFilter || a.examType === assignmentTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [allKnownAssignments, assignmentSearch, assignmentTypeFilter]);

  const filteredStudents = useMemo(() => {
    if (!selectedAssignment) return [];
    const q = studentSearch.toLowerCase().trim();
    return classStudents.filter(s => {
      return !q || s.name.toLowerCase().includes(q) || s.index.toLowerCase().includes(q);
    });
  }, [classStudents, selectedAssignment, studentSearch]);

  const showNoticeMessage = (text: string, type: 'success' | 'error') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3000);
  };

  const buildPortalLink = (assignment: { subjectId: string; examType: string; examName: string; examDate: string }) => {
    if (typeof window === 'undefined') return '';

    const params = new URLSearchParams({
      subjectId: assignment.subjectId,
      examType: assignment.examType,
      examName: assignment.examName,
      examDate: assignment.examDate,
    });

    return `${window.location.origin}/marksheet?${params.toString()}`;
  };

  const copyTextToClipboard = async (text: string, successMessage: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      showNoticeMessage(successMessage, 'success');
    } catch {
      showNoticeMessage(isSinhala ? 'සබැඳිය පිටපත් කිරීමට නොහැකි විය.' : 'Unable to copy the link.', 'error');
    }
  };

  const copyPortalLink = async (assignment: { subjectId: string; examType: string; examName: string; examDate: string }) => {
    const link = buildPortalLink(assignment);
    if (!link) return;

    await copyTextToClipboard(link, isSinhala ? 'පෝටල් සබැඳිය පිටපත් කරන ලදී.' : 'Portal link copied.');
    setGeneratedPortalLink(link);
  };

  const openEditAssignmentModal = (a: { examType: string; examName: string; examDate: string }) => {
    setEditingAssignment(a);
    setEditAssignmentType(a.examType);
    setEditAssignmentName(a.examName);
    setEditAssignmentDate(a.examDate);
    setShowEditAssignmentModal(true);
  };

  const handleEditAssignment = () => {
    if (!editingAssignment || !selectedClassId) return;
    if (!editAssignmentName.trim()) {
      showNoticeMessage(isSinhala ? 'කරුණාකර නමක් ඇතුලත් කරන්න.' : 'Please enter an assignment name.', 'error');
      return;
    }
    apiRequest('/teacher/marks/assignment', {
      method: 'PUT',
      token: getStoredToken(),
      body: JSON.stringify({
        subjectId: selectedClassId,
        oldExamType: editingAssignment.examType,
        oldExamName: editingAssignment.examName,
        oldExamDate: editingAssignment.examDate,
        newExamType: editAssignmentType,
        newExamName: editAssignmentName.trim(),
        newExamDate: editAssignmentDate,
      }),
    }).then(() => {
      showNoticeMessage(isSinhala ? 'පැවරුම සාර්ථකව යාවත්කාලීන කරන ලදී.' : 'Assignment updated successfully.', 'success');
      setShowEditAssignmentModal(false);
      setEditingAssignment(null);
      // Update local emptyAssignments cache if it was there
      setEmptyAssignments(prev => prev.map(e =>
        e.classId === selectedClassId &&
        e.examName === editingAssignment.examName &&
        e.examType === editingAssignment.examType &&
        e.examDate === editingAssignment.examDate
          ? { ...e, examType: editAssignmentType, examName: editAssignmentName.trim(), examDate: editAssignmentDate }
          : e
      ));
      onRefresh();
    }).catch(err => showNoticeMessage(err.message, 'error'));
  };

  const handleDeleteAssignment = (a: { examType: string; examName: string; examDate: string }) => {
    if (!selectedClassId) return;
    if (!confirm(isSinhala ? 'මෙම පැවරුම සහ සියලු ලකුණු මකාදැමීමට අවශ්‍ය බව විශ්වාසද?' : 'Delete this assignment and ALL its marks? This cannot be undone.')) return;
    apiRequest('/teacher/marks/assignment', {
      method: 'DELETE',
      token: getStoredToken(),
      body: JSON.stringify({
        subjectId: selectedClassId,
        examType: a.examType,
        examName: a.examName,
        examDate: a.examDate,
      }),
    }).then(() => {
      showNoticeMessage(isSinhala ? 'පැවරුම සාර්ථකව මකාදැමිනි.' : 'Assignment deleted successfully.', 'success');
      setEmptyAssignments(prev => prev.filter(e => !(e.classId === selectedClassId && e.examName === a.examName && e.examType === a.examType && e.examDate === a.examDate)));
      onRefresh();
    }).catch(err => showNoticeMessage(err.message, 'error'));
  };

  const handleCreateAssignment = () => {
    if (!formExamName.trim()) {
      showNoticeMessage(isSinhala ? 'කරුණාකර නමක් ඇතුලත් කරන්න.' : 'Please enter an assignment name.', 'error');
      return;
    }
    if (!selectedClassId) return;

    const key = `${formExamType}||${formExamName}||${formExamDate}`;
    const existsInReal = classAssignments.some(a => `${a.examType}||${a.examName}||${a.examDate}` === key);
    const existsInDb = dbExams.some(e => e.classId === selectedClassId && `${e.examType}||${e.examName}||${e.examDate}` === key);
    const existsInEmpty = emptyAssignments.some(a => a.classId === selectedClassId && `${a.examType}||${a.examName}||${a.examDate}` === key);

    if (existsInReal || existsInDb || existsInEmpty) {
      showNoticeMessage(isSinhala ? 'මෙම පැවරුම දැනටමත් ඇත.' : 'This assignment already exists.', 'error');
      return;
    }

    // Optimistically add to local state immediately
    const newAssignment = {
      classId: selectedClassId,
      examType: formExamType,
      examName: formExamName.trim(),
      examDate: formExamDate,
      markedStudentCount: 0,
    };
    setEmptyAssignments(prev => [newAssignment, ...prev]);
    setShowAddAssignmentModal(false);
    showNoticeMessage(isSinhala ? 'පැවරුම සාර්ථකව නිර්මාණය විය.' : 'Assignment created successfully.', 'success');

    // Persist to database
    apiRequest('/teacher/assignment', {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify({
        subjectId: selectedClassId,
        examType: formExamType,
        examName: formExamName.trim(),
        examDate: formExamDate,
      }),
    }).then(() => {
      const portalLink = buildPortalLink({
        subjectId: selectedClassId,
        examType: formExamType,
        examName: formExamName.trim(),
        examDate: formExamDate,
      });
      setGeneratedPortalLink(portalLink);
      // Refresh so dbExams is updated from the server
      onRefresh();
      showNoticeMessage(isSinhala ? 'පැවරුම සාර්ථකව නිර්මාණය කරන ලදී. සබැඳිය පිටපත් කළ හැක.' : 'Assignment created. The portal link is ready to copy.', 'success');
    }).catch(err => {
      showNoticeMessage((isSinhala ? 'DB සේවාදායකය සමඟ සම්බන්ධ කිරීම අසාර්ථකයි: ' : 'Failed to save to DB: ') + err.message, 'error');
    });
  };

  const openAddMarkForStudent = (studentId: string) => {
    setEditingMark(null);
    setFormStudentId(studentId);
    setFormMarkValue('');
    setShowMarkModal(true);
  };

  const openEditMarkModal = (studentId: string, mark: any) => {
    setEditingMark(mark);
    setFormStudentId(studentId);
    setFormMarkValue(String(mark.mark || 0));
    setShowMarkModal(true);
  };

  const handleSaveMark = () => {
    if (!selectedAssignment || !selectedClassId) return;
    const val = Number(formMarkValue);
    if (isNaN(val) || val < 0 || val > 100 || formMarkValue === '') {
      showNoticeMessage(isSinhala ? 'කරුණාකර 0ත් 100ත් අතර අගයක් ඇතුලත් කරන්න.' : 'Enter a valid mark 0-100.', 'error');
      return;
    }

    // Close modal immediately for snappy UX
    setShowMarkModal(false);
    showNoticeMessage(isSinhala ? 'ලකුණු සුරැකෙමින්...' : 'Saving mark...', 'success');

    apiPost('/teacher/marks', {
      studentId: formStudentId,
      subjectId: selectedClassId,
      examType: selectedAssignment.examType,
      examName: selectedAssignment.examName,
      examDate: selectedAssignment.examDate,
      mark: val
    }).then(() => {
      showNoticeMessage(isSinhala ? 'ලකුණු සාර්ථකව ගබඩා කරන ලදී.' : 'Mark saved successfully.', 'success');
      // Background refresh to sync data — non-blocking
      onRefresh();
    }).catch(err => {
      showNoticeMessage(err.message, 'error');
    });
  };


  const handleDeleteMark = (studentId: string, mark: any) => {
    if (!confirm(isSinhala ? 'මෙම ලකුණ මකාදැමීමට අවශ්‍ය බව විශ්වාසද?' : 'Are you sure you want to delete this mark?')) return;
    
    apiRequest('/teacher/marks', {
      method: 'DELETE',
      token: getStoredToken(),
      body: JSON.stringify({
        studentId: studentId,
        subjectId: selectedClassId,
        examType: mark.examType,
        examName: mark.examName,
        examDate: mark.examDate
      })
    }).then(() => {
      showNoticeMessage(isSinhala ? 'මකාදැමීම සාර්ථකයි.' : 'Deleted successfully.', 'success');
      onRefresh();
    }).catch(err => showNoticeMessage(err.message, 'error'));
  };

  const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-[#1B3A8C] transition-colors bg-white";
  const labelClass = "mb-1 block text-xs font-bold text-slate-500 uppercase";

  // VIEW 1: Class Selection Grid
  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800">
          {isSinhala ? 'ලකුණු කළමනාකරණය' : 'Manage Marks'}
        </h2>
        <p className="text-sm text-slate-500">
          {isSinhala ? 'ලකුණු බැලීමට හෝ එකතු කිරීමට පන්තියක් තෝරන්න.' : 'Select a class to manage assignments and grades.'}
        </p>

        <div className="flex flex-col gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setSelectedClassId(subject.id)}
              className="sdp-card p-5 text-left transition-all hover:border-[#1B3A8C] hover:shadow-md group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 uppercase">
                    {subject.grade}
                  </span>
                  <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 uppercase">
                    {subject.medium}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1B3A8C] transition-colors">{subject.name}</h3>
              </div>
              <ChevronLeft size={20} className="text-slate-300 transform rotate-180 group-hover:text-[#1B3A8C] transition-colors hidden sm:block" />
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

  // VIEW 2: Assignments List for Selected Class
  if (!selectedAssignment) {
    return (
      <div className="space-y-6 relative">
        {notice && (
          <div className={`p-4 rounded-xl text-sm font-bold shadow-sm ${notice.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {notice.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setSelectedClassId(null); setAssignmentSearch(''); setAssignmentTypeFilter(''); }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 flex-shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                {selectedClass.name} - {isSinhala ? 'පැවරුම්' : 'Assignments'}
              </h2>
              <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">
                {selectedClass.grade} • {selectedClass.medium}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setFormExamDate(new Date().toISOString().split('T')[0]);
              setFormExamType(examTypes[0]?.id ?? '');
              setShowAddAssignmentModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1B3A8C] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#152C6A] transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            {isSinhala ? 'නව පැවරුමක් එකතු කරන්න' : 'Add New Assignment'}
          </button>
        </div>

        <div className="sdp-card p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="sd-search-bar bg-slate-50 border border-slate-200 w-full rounded-xl">
              <Search size={16} className="text-slate-400 ml-3" />
              <input
                type="text"
                placeholder={isSinhala ? 'පැවරුම සොයන්න...' : 'Search Assignment Name...'}
                className="sd-search-input bg-transparent text-sm py-2 px-3 w-full outline-none"
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-[#1B3A8C] transition-colors w-full md:w-auto">
            <Filter size={16} className="text-slate-400 mr-2" />
            <select 
              className="bg-transparent text-sm outline-none text-slate-700 py-1"
              value={assignmentTypeFilter}
              onChange={(e) => setAssignmentTypeFilter(e.target.value)}
            >
              <option value="">{isSinhala ? 'සියලුම වර්ග' : 'All Types'}</option>
              {examTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredAssignments.map((a, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedAssignment(a)}
              className="sdp-card p-5 text-left transition-all hover:border-[#1B3A8C] hover:shadow-md group flex flex-col cursor-pointer"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 uppercase">
                  {a.examType}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  {a.examDate}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-4 group-hover:text-[#1B3A8C] transition-colors">{a.examName}</h3>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-auto">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-green-500" />
                  {a.markedStudentCount} / {classStudents.length} {isSinhala ? 'සිසුන්' : 'Graded'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyPortalLink({ subjectId: selectedClassId || '', examType: a.examType, examName: a.examName, examDate: a.examDate }); }}
                    className="p-1.5 text-slate-400 hover:text-[#1B3A8C] hover:bg-blue-50 rounded-lg transition"
                    title={isSinhala ? 'සබැඳිය පිටපත් කරන්න' : 'Copy portal link'}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditAssignmentModal(a); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title={isSinhala ? 'සංස්කරණය කරන්න' : 'Edit'}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(a); }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title={isSinhala ? 'මකාදැමීම' : 'Delete'}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedAssignment(a)}
                    className="ml-1 text-xs font-bold text-[#1B3A8C] hover:underline"
                  >
                    {isSinhala ? 'ලකුණු බලන්න' : 'View Grades'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredAssignments.length === 0 && (
            <div className="sdp-card p-8 text-center text-sm text-slate-500">
              {allKnownAssignments.length === 0 
                ? (isSinhala ? 'පැවරුම් කිසිවක් හමු නොවීය.' : 'No assignments have been created yet.')
                : (isSinhala ? 'ඔබගේ පෙරහන් වලට ගැළපෙන පැවරුම් හමු නොවීය.' : 'No assignments match your search.')}
            </div>
          )}
        </div>

        {/* Add Assignment Modal */}
        {showAddAssignmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800">
                  {isSinhala ? 'නව පැවරුමක් නිර්මාණය කරන්න' : 'Create New Assignment'}
                </h3>
                <button onClick={() => setShowAddAssignmentModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{isSinhala ? 'වර්ගය' : 'Assignment Type'}</label>
                    <select className={inputClass} value={formExamType} onChange={e => setFormExamType(e.target.value)}>
                      {examTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{isSinhala ? 'දිනය' : 'Date'}</label>
                    <input type="date" className={inputClass} value={formExamDate} onChange={e => setFormExamDate(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>{isSinhala ? 'නම' : 'Assignment Name'}</label>
                    <input type="text" className={inputClass} value={formExamName} onChange={e => setFormExamName(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowAddAssignmentModal(false)}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {isSinhala ? 'අවලංගු කරන්න' : 'Cancel'}
                </button>
                <button 
                  onClick={handleCreateAssignment}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[#1B3A8C] text-white hover:bg-[#152C6A] transition-colors shadow-sm"
                >
                  {isSinhala ? 'පැවරුම සාදන්න' : 'Create Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Assignment Modal */}
        {showEditAssignmentModal && editingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Pencil size={18} className="text-[#1B3A8C]" />
                  {isSinhala ? 'පැවරුම සංස්කරණය කරන්න' : 'Edit Assignment'}
                </h3>
                <button onClick={() => setShowEditAssignmentModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{isSinhala ? 'වර්ගය' : 'Assignment Type'}</label>
                    <select className={inputClass} value={editAssignmentType} onChange={e => setEditAssignmentType(e.target.value)}>
                      {examTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{isSinhala ? 'දිනය' : 'Date'}</label>
                    <input type="date" className={inputClass} value={editAssignmentDate} onChange={e => setEditAssignmentDate(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>{isSinhala ? 'නම' : 'Assignment Name'}</label>
                    <input type="text" className={inputClass} value={editAssignmentName} onChange={e => setEditAssignmentName(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowEditAssignmentModal(false)}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {isSinhala ? 'අවලංගු කරන්න' : 'Cancel'}
                </button>
                <button 
                  onClick={handleEditAssignment}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[#1B3A8C] text-white hover:bg-[#152C6A] transition-colors shadow-sm"
                >
                  {isSinhala ? 'සුරකින්න' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: Grading List for Selected Assignment
  return (
    <div className="space-y-6 relative">
      {notice && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm ${notice.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {notice.text}
        </div>
      )}

      {generatedPortalLink && (
        <div className="sdp-card border border-[#1B3A8C]/15 bg-gradient-to-r from-[#F6F8FF] to-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1B3A8C]">{isSinhala ? 'පෝටල් සබැඳිය' : 'Portal Link'}</p>
            <p className="text-sm text-slate-600 break-all mt-1">{generatedPortalLink}</p>
          </div>
          <button
            onClick={() => copyTextToClipboard(generatedPortalLink, isSinhala ? 'පෝටල් සබැඳිය පිටපත් කරන ලදී.' : 'Portal link copied.')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B3A8C] px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-[#152C6A] transition-colors"
          >
            <Copy size={16} />
            {isSinhala ? 'පිටපත් කරන්න' : 'Copy Link'}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSelectedAssignment(null); setStudentSearch(''); }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">
              {selectedAssignment.examName}
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">
              {selectedAssignment.examType} • {selectedAssignment.examDate}
            </p>
          </div>
        </div>
      </div>

      <div className="sdp-card p-4">
        <div className="sd-search-bar bg-slate-50 border border-slate-200 w-full rounded-xl mb-4">
          <Search size={16} className="text-slate-400 ml-3" />
          <input
            type="text"
            placeholder={isSinhala ? 'සිසුවා සොයන්න (නම/හැඳුනුම්පත)...' : 'Search Username or ID...'}
            className="sd-search-input bg-transparent text-sm py-2 px-3 w-full outline-none"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">{isSinhala ? 'සිසුවාගේ අංකය' : 'Student ID'}</th>
                <th className="px-6 py-4">{isSinhala ? 'නම' : 'Username'}</th>
                <th className="px-6 py-4 text-center">{isSinhala ? 'ලකුණු' : 'Marks'}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const mark = student.marks?.find((m: any) => 
                  m.subjectId === selectedClassId && 
                  m.examName === selectedAssignment.examName && 
                  m.examDate === selectedAssignment.examDate
                );

                return (
                  <tr key={student.id} className={`hover:bg-slate-50 transition-colors ${!mark ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-600">{student.index}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {mark ? (
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border text-xs font-bold ${mark.mark >= 50 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {mark.mark}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">{isSinhala ? 'නැත' : 'Pending'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {mark ? (
                        <div className="space-x-2">
                          <button onClick={() => openEditMarkModal(student.id, mark)} className="p-2 text-slate-400 hover:text-blue-600 transition bg-slate-50 hover:bg-blue-50 rounded-lg inline-flex">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteMark(student.id, mark)} className="p-2 text-slate-400 hover:text-red-600 transition bg-slate-50 hover:bg-red-50 rounded-lg inline-flex">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openAddMarkForStudent(student.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#1B3A8C] text-[#1B3A8C] hover:bg-[#1B3A8C] hover:text-white transition-colors text-xs font-bold flex items-center gap-1 ml-auto"
                        >
                          <Plus size={14} />
                          {isSinhala ? 'ලකුණු එකතු කරන්න' : 'Add Mark'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {isSinhala ? 'සිසුන් හමු නොවීය.' : 'No students found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Entry Modal for specific student */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-[#1B3A8C]" />
                {editingMark ? (isSinhala ? 'සංස්කරණය' : 'Edit Mark') : (isSinhala ? 'ලකුණු එකතු කිරීම' : 'Enter Mark')}
              </h3>
              <button onClick={() => setShowMarkModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {classStudents.find(s => s.id === formStudentId)?.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{classStudents.find(s => s.id === formStudentId)?.name}</div>
                  <div className="text-xs text-slate-500 uppercase">{classStudents.find(s => s.id === formStudentId)?.index}</div>
                </div>
              </div>

              <div>
                <label className={labelClass}>{isSinhala ? 'ලකුණු %' : 'Marks %'}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    className={`${inputClass} text-xl py-3 pl-4 pr-10`} 
                    value={formMarkValue} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setFormMarkValue('');
                        return;
                      }
                      const num = Number(val);
                      if (num < 0) {
                        setFormMarkValue('0');
                      } else if (num > 100) {
                        setFormMarkValue('100');
                      } else {
                        setFormMarkValue(val);
                      }
                    }} 
                    placeholder="0" 
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowMarkModal(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {isSinhala ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>
              <button 
                onClick={handleSaveMark}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[#1B3A8C] text-white hover:bg-[#152C6A] transition-colors shadow-sm"
              >
                {isSinhala ? 'සුරකින්න' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
