import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import {
  adminController,
  studentSchema,
  classSchema,
  enrollmentSchema,
  teacherSchema,
  classTeacherSchema,
  markSchema,
  bulkMarksSchema,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireRoles('admin', 'super-admin'));

router.get('/meta', asyncHandler(adminController.getMeta));
router.get('/students', asyncHandler(adminController.getStudents));
router.get('/users', asyncHandler(adminController.getUsers));
router.delete('/users/:userId', asyncHandler(adminController.deleteUser));
router.post('/classes', validateBody(classSchema), asyncHandler(adminController.createClass));
router.patch('/classes/:classId/teacher', validateBody(classTeacherSchema), asyncHandler(adminController.setClassTeacher));
router.delete('/classes/:classId', asyncHandler(adminController.deleteClass));
router.post('/enrollments', validateBody(enrollmentSchema), asyncHandler(adminController.enrollStudent));
router.delete('/enrollments', asyncHandler(adminController.deleteEnrollment));
router.post('/students', validateBody(studentSchema), asyncHandler(adminController.createStudent));
router.delete('/students/:studentId', asyncHandler(adminController.deleteStudent));
router.get('/teachers', asyncHandler(adminController.getTeachers));
router.post('/teachers', validateBody(teacherSchema), asyncHandler(adminController.createTeacher));
router.delete('/teachers/:teacherId', asyncHandler(adminController.deleteTeacher));
router.get('/marks', asyncHandler(adminController.getMarks));
router.post('/marks', validateBody(markSchema), asyncHandler(adminController.upsertMark));
router.delete('/marks', asyncHandler(adminController.deleteMark));
router.post('/marks/bulk', validateBody(bulkMarksSchema), asyncHandler(adminController.bulkUpsertMarks));
router.patch('/users/:userId/promote', asyncHandler(adminController.promoteUser));

export default router;
