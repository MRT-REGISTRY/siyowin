// Centralized TypeScript types for the dashboard

export type SubjectHistoryItem = {
  label: string;
  date: string;
  mark: number;
  note: string;
};

export type SubjectHomeworkItem = {
  id: string;
  title: string;
  dueDate: string;
  completedDate?: string;
  createdAt?: string | null;
  status: 'completed' | 'pending';
};

export type SubjectModuleItemType = 'mark' | 'link' | 'text' | 'document' | 'video';

export type SubjectModuleItem =
  | {
      id: string;
      title: string;
      type: 'mark';
      moduleId?: string;
      classId?: string;
      createdAt?: string | null;
    }
  | {
      id: string;
      title: string;
      type: 'link' | 'document' | 'video';
      href: string;
      moduleId?: string;
      classId?: string;
      createdAt?: string | null;
    }
  | {
      id: string;
      title: string;
      type: 'text';
      moduleId?: string;
      classId?: string;
      createdAt?: string | null;
    };

export type ApiSubjectModule = {
  id: string;
  title: string;
  items: SubjectModuleItem[];
};

export type SubjectRecord = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  teacher: string;
  classLabel: string;
  rank: number;
  trend: 'up' | 'down' | 'neutral';
  currentMark: number;
  classAvg: number;
  nextExam: string;
  termTest: number;
  dayPaper: number;
  monthTest: number;
  history: SubjectHistoryItem[];
  homeworkDoneThisMonth: number;
  homeworkTargetThisMonth: number;
  recentHomeworks: SubjectHomeworkItem[];
  teacherId?: string | null;
  gradeId?: string | null;
  subjectName?: string | null;
  medium?: string | null;
  schedule?: string | null;
  fee?: number | null;
  year?: number | null;
  isActive?: boolean | null;
  createdAt?: string | null;
};

export type ApiSubjectRecord = {
  id: string;
  class_id?: string | null;
  class_label?: string | null;
  grade?: string | null;
  teacher_id: string | null;
  teacher_name?: string | null;
  grade_id: string | null;
  subject_name: string | null;
  medium?: string | null;
  schedule?: string | null;
  fee?: number | null;
  current_mark?: number | null;
  class_avg?: number | null;
  rank?: number | null;
  year: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type SubjectExamResult = {
  examId: string;
  examTitle: string;
  examType: string;
  examDate: string;
  totalMarks: number | null;
  marksObtained: number | null;
  isAbsent: boolean;
  status: 'present' | 'absent';
  createdAt: string | null;
  updatedAt: string | null;
};

export type SubjectResultsResponse = {
  subject: ApiSubjectRecord;
  results: SubjectExamResult[];
  recentResults: SubjectExamResult[];
  previousResults: SubjectExamResult[];
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  marks: number;
  avatar?: string;
  badge?: 'gold' | 'silver' | 'bronze' | null;
  isYou?: boolean;
};

export type DashboardOverview = {
  averageMark: number;
  bestSubject: string;
  subjectsEnrolled: number;
  homeworkCompletion: number;
  classRank: number;
};

export type StudentProfile = {
  id: string;
  name: string;
  index: string;
  grade: string;
  classId: string;
  email?: string;
  address?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string;
  term: string;
  year: number;
  avatar: string;
};

export type AdminRole = 'super-admin' | 'admin';
export type UserRole = 'student' | 'teacher' | 'admin' | 'super-admin';

export type AdminClassOption = {
  id: string;
  grade: string;
  name: string;
  label: string;
  medium: string;
  teacherId?: string | null;
  subjectId?: string;
  subjectName?: string;
  academicYear?: number;
  schedule?: string;
  fee?: number;
  isActive?: boolean;
};

export type AdminStudentClassOption = {
  id: string;
  grade: string;
  subjectName: string;
  teacherName: string;
  medium: string;
  subjectId?: string;
};

export type AdminSubjectOption = {
  id: string;
  name: string;
  teacher: string;
  classLabel?: string;
  grade?: string;
  medium?: string;
  schedule?: string;
  fee?: number;
  studentCount?: number;
};

export type AdminExamType = {
  id: string;
  label: string;
};

export type AdminStudentMark = {
  subjectId: string;
  subjectName: string;
  classId?: string;
  examType: string;
  examName: string;
  examDate: string;
  mark: number;
  note?: string;
};

export type AdminStudent = {
  id: string;
  name: string;
  index: string;
  dateOfBirth?: string;
  grade: string;
  classId: string;
  enrollments?: StudentEnrollment[];
  parentName?: string;
  parentPhone?: string;
  marks: AdminStudentMark[];
};

export type AdminTeacher = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  email: string;
  phone: string;
  assignments: TeacherAssignment[];
};

export type TeacherAssignment = {
  subject: string;
  grade: string;
  classId: string;
  medium: string;
};

export type StudentEnrollment = {
  id: string;
  studentId: string;
  classId: string;
  subjectId?: string;
  academicYear: number;
  status: 'active' | 'completed' | 'cancelled';
  enrolledAt: string;
};

export type RegisteredUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  studentId?: string;
  teacherId?: string;
  isActive?: boolean;
  linkedName?: string;
};
