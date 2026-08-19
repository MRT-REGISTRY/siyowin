import { ApiSubjectRecord, SubjectRecord } from '@/types';

const gradeLabelFromId = (gradeId?: string | null) => {
  if (!gradeId) return 'Current grade';
  const match = gradeId.match(/grade-(\d+)/i);
  return match ? `Grade ${match[1]}` : gradeId;
};

const subjectEmojiFromSubject = (subjectName?: string | null, id?: string) => {
  const label = (subjectName ?? id ?? '').trim();
  if (!label) return 'S';
  return label.charAt(0).toUpperCase();
};

const subjectColorFromId = (id: string) => {
  const palette = ['#D9232D', '#F47920', '#1B3A8C', '#2C55C7', '#A761DD', '#16A34A'];
  const hash = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

const subjectProgressFromHomework = (done: number, total: number) => {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
};

export const normalizeSubject = (
  subject: ApiSubjectRecord,
  homework: Array<{
    id: string;
    subjectId: string;
    subjectName?: string;
    title: string;
    dueDate: string;
    completedDate?: string;
    createdAt?: string | null;
    status: 'completed' | 'pending';
    color?: string;
  }> = [],
): SubjectRecord => {
  const subjectHomework = homework.filter((item) => item.subjectId === subject.id);
  const done = subjectHomework.filter((item) => item.status === 'completed').length;
  const total = subjectHomework.length;
  const progress = subjectProgressFromHomework(done, total);
  const subjectName = subject.subject_name ?? subject.id;
  const classLabel = subject.class_label ?? `${gradeLabelFromId(subject.grade ?? subject.grade_id)} - ${subjectName}`;
  const currentMark = subject.current_mark ?? progress;
  const classAvg = subject.class_avg ?? currentMark;

  return {
    id: subject.id,
    name: subjectName,
    emoji: subjectEmojiFromSubject(subjectName, subject.id),
    color: subjectHomework[0]?.color ?? subjectColorFromId(subject.id),
    teacher: subject.teacher_name ?? 'Unassigned',
    classLabel,
    rank: subject.rank ?? 0,
    trend: currentMark >= classAvg ? 'up' : currentMark > 0 ? 'down' : 'neutral',
    currentMark,
    classAvg,
    nextExam: '',
    termTest: progress,
    dayPaper: progress,
    monthTest: progress,
    history: [],
    homeworkDoneThisMonth: done,
    homeworkTargetThisMonth: total,
    recentHomeworks: subjectHomework.map(({ subjectId: _subjectId, subjectName: _subjectName, color: _color, ...item }) => item),
    teacherId: subject.teacher_id,
    gradeId: subject.grade ?? subject.grade_id,
    subjectName,
    medium: subject.medium,
    schedule: subject.schedule,
    fee: subject.fee,
    year: subject.year,
    isActive: subject.is_active,
    createdAt: subject.created_at,
  };
};

export const normalizeSubjects = (
  subjects: ApiSubjectRecord[],
  homework: Array<{
    id: string;
    subjectId: string;
    subjectName?: string;
    title: string;
    dueDate: string;
    completedDate?: string;
    createdAt?: string | null;
    status: 'completed' | 'pending';
    color?: string;
  }> = [],
) => subjects.map((subject) => normalizeSubject(subject, homework));
