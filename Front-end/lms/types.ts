export type View =
  | { page: 'dashboard' }
  | { page: 'classes' }
  | { page: 'class-detail'; classId: string }
  | { page: 'marks' }
