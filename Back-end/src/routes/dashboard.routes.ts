import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { repo } from '../data/repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);

const toSubjectResponse = (subject: any) => ({
  id: subject.id,
  class_id: subject.id,
  class_label: subject.classLabel ?? subject.name ?? subject.id,
  grade: subject.gradeId ?? null,
  teacher_id: subject.teacherId ?? null,
  teacher_name: subject.teacher ?? null,
  grade_id: subject.gradeId ?? null,
  subject_name: subject.subjectName ?? subject.name ?? null,
  medium: subject.medium ?? null,
  schedule: subject.schedule ?? null,
  fee: subject.fee ?? null,
  current_mark: subject.currentMark ?? 0,
  class_avg: subject.classAvg ?? 0,
  rank: subject.rank ?? 0,
  year: subject.year ?? null,
  is_active: subject.isActive ?? null,
  created_at: subject.createdAt ?? null,
});

router.get('/student', requireRoles('student', 'admin', 'super-admin'), asyncHandler(async (req, res) => {
  const studentId = req.user?.studentId;
  const subjects = await repo.getEnrolledSubjects(studentId);
  const profile = await repo.getStudentProfile(studentId);
  if (!profile) {
    res.status(404).json({ message: 'Student profile not found.' });
    return;
  }

  res.json({
    profile: {
      ...profile,
      email: req.user?.email ?? '',
    },
    overview: await repo.getOverview(subjects),
    subjects: subjects.map(toSubjectResponse),
      latestModuleItems: await repo.getLatestModuleItemsForStudent(studentId),
      latestResults: await repo.getLatestResultsForStudent(studentId),
    progress: await repo.getStudentProgressSeries(studentId),
    homework: subjects.flatMap((subject) =>
      subject.recentHomeworks.map((homework) => ({
        ...homework,
        subjectId: subject.id,
        subjectName: subject.name,
        color: subject.color,
      })),
    ),
  });
}));

router.get('/subjects', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(async (req, res) => {
  const subjects = await repo.getEnrolledSubjects(req.user?.studentId);
  res.json({ subjects: subjects.map(toSubjectResponse) });
}));

router.get('/subjects/:subjectId', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(async (req, res) => {
  const subjectId = req.params.subjectId;
  if (typeof subjectId !== 'string') {
    res.status(400).json({ message: 'subjectId is required.' });
    return;
  }

  const subject = await repo.getSubjectById(subjectId);

  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  res.json({ subject: toSubjectResponse(subject) });
}));

router.get('/subjects/:subjectId/results', requireRoles('student'), asyncHandler(async (req, res) => {
  const subjectId = req.params.subjectId;
  if (typeof subjectId !== 'string') {
    res.status(400).json({ message: 'subjectId is required.' });
    return;
  }

  const subject = await repo.getSubjectById(subjectId);

  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  const studentId = req.user?.studentId;
  if (!studentId) {
    res.status(400).json({ message: 'Student profile is required.' });
    return;
  }

  const enrolledSubjects = await repo.getEnrolledSubjects(studentId);
  if (!enrolledSubjects.some((item) => item.id === subject.id)) {
    res.status(403).json({ message: 'You are not enrolled in this subject.' });
    return;
  }

  const results = await repo.getStudentSubjectResults(studentId, subject.id);

  if (!results.length) {
    res.json({
      subject: toSubjectResponse(subject),
      results: [],
      recentResults: [],
      previousResults: [],
    });
    return;
  }

  const recentResults = results.slice(0, 3);
  const previousResults = results.slice(3);

  res.json({
    subject: toSubjectResponse(subject),
    results,
    recentResults,
    previousResults,
  });
}));

router.get('/subjects/:subjectId/modules', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(async (req, res) => {
  const subjectId = req.params.subjectId;
  if (typeof subjectId !== 'string') {
    res.status(400).json({ message: 'subjectId is required.' });
    return;
  }

  const subject = await repo.getSubjectById(subjectId);

  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  if (req.user?.role === 'student') {
    const studentId = req.user.studentId;
    if (!studentId) {
      res.status(400).json({ message: 'Student profile is required.' });
      return;
    }

    const enrolledSubjects = await repo.getEnrolledSubjects(studentId);
    if (!enrolledSubjects.some((item) => item.id === subject.id)) {
      res.status(403).json({ message: 'You are not enrolled in this subject.' });
      return;
    }
  }

  const modules = await repo.getSubjectModules(subject.id);
  res.json({
    subjectId: subject.id,
    modules,
  });
}));

router.get('/subjects/:subjectId/homework', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(async (req, res) => {
  const subjectId = req.params.subjectId;
  if (typeof subjectId !== 'string') {
    res.status(400).json({ message: 'subjectId is required.' });
    return;
  }

  const subject = await repo.getSubjectById(subjectId);

  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  const limit = Number(req.query.limit ?? 5);
  res.json({
    subjectId: subject.id,
    homework: subject.recentHomeworks.slice(0, Number.isFinite(limit) ? limit : 5),
    summary: {
      completed: subject.homeworkDoneThisMonth,
      target: subject.homeworkTargetThisMonth,
      percent: subject.homeworkTargetThisMonth
        ? Math.round((subject.homeworkDoneThisMonth / subject.homeworkTargetThisMonth) * 100)
        : 0,
    },
  });
}));

router.get('/subjects/:subjectId/leaderboard', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(async (req, res) => {
  const subjectId = req.params.subjectId;
  if (typeof subjectId !== 'string') {
    res.status(400).json({ message: 'subjectId is required.' });
    return;
  }

  const subject = await repo.getSubjectById(subjectId);
  
  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  const classIdFromQuery = typeof req.query.classId === 'string' ? req.query.classId : undefined;
  const classId = classIdFromQuery ?? subject.id;
  if (!classId) {
    res.status(400).json({ message: 'classId is required for leaderboard lookups.' });
    return;
  }

  res.json({
    subjectId: subject.id,
    classId,
    leaderboard: await repo.getLeaderboardForSubject(subject.id, classId, req.user?.studentId),
  });
}));

export default router;
