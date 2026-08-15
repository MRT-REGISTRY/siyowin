export type UserRole = 'student' | 'teacher' | 'admin' | 'super-admin';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  studentId?: string;
  teacherId?: string;
  isActive?: boolean;
};

// Express Request augmentation — req.user and req.context are available on
// every route handler without additional imports.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      context: import('./context/RequestContext.js').RequestContext;
    }
  }
}


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

export type SubjectModule = {
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

export type LeaderboardEntry = {
  rank: number;
  name: string;
  marks: number;
  avatar?: string;
  badge?: 'gold' | 'silver' | 'bronze' | null;
  isYou?: boolean;
};

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
  address?: string;
  school?: string;
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

export type TeacherClassAssignment = {
  id: string;
  teacherId: string;
  classId: string;
  subjectId?: string;
  role: 'primary' | 'assistant';
  activeFrom?: string;
  activeTo?: string;
  isActive: boolean;
};

export type RegisteredUser = Omit<AuthUser, 'studentId' | 'teacherId'> & {
  studentId?: string;
  teacherId?: string;
  linkedName?: string;
};

export type DashboardOverview = {
  averageMark: number;
  bestSubject: string;
  subjectsEnrolled: number;
  homeworkCompletion: number;
  classRank: number;
};
