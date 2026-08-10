import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { dashboardController, studentProfileUpdateSchema } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/student', requireRoles('student', 'admin', 'super-admin'), asyncHandler(dashboardController.getStudentDashboard));

router.patch('/student/profile', requireRoles('student'), validateBody(studentProfileUpdateSchema), asyncHandler(dashboardController.updateStudentProfile));

router.get('/subjects', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(dashboardController.getSubjects));

router.get('/subjects/:subjectId', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(dashboardController.getSubjectById));

router.get('/subjects/:subjectId/results', requireRoles('student'), asyncHandler(dashboardController.getSubjectResults));

router.get('/subjects/:subjectId/modules', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(dashboardController.getSubjectModules));

router.get('/subjects/:subjectId/homework', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(dashboardController.getSubjectHomework));

router.get('/subjects/:subjectId/leaderboard', requireRoles('student', 'teacher', 'admin', 'super-admin'), asyncHandler(dashboardController.getSubjectLeaderboard));

export default router;
