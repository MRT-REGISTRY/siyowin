import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  teacherController,
  teacherMarkSchema,
  resourceSchema,
  topicSchema,
  homeworkSchema,
  homeworkCompletionSchema
} from '../controllers/teacher.controller.js';

const router = Router();

router.use(requireAuth, requireRoles('teacher'));

router.get('/dashboard', asyncHandler(teacherController.getDashboard));
router.post('/marks', validateBody(teacherMarkSchema), asyncHandler(teacherController.addMark));
router.post('/resources', validateBody(resourceSchema), asyncHandler(teacherController.addResource));
router.post('/topics', validateBody(topicSchema), asyncHandler(teacherController.addTopic));
router.delete('/resources/:classId/:resourceId', asyncHandler(teacherController.deleteResource));
router.delete('/topics/:classId/:moduleId', asyncHandler(teacherController.deleteTopic));
router.get('/homework/:classId', asyncHandler(teacherController.getHomework));
router.post('/homework', validateBody(homeworkSchema), asyncHandler(teacherController.addHomework));
router.patch('/homework/completion', validateBody(homeworkCompletionSchema), asyncHandler(teacherController.completeHomework));
router.delete('/homework/:classId/:homeworkId', asyncHandler(teacherController.deleteHomework));
router.get('/students/:studentId/progress', asyncHandler(teacherController.getStudentProgress));
router.delete('/marks', asyncHandler(teacherController.deleteMark));
router.post('/assignment', asyncHandler(teacherController.createAssignment));
router.put('/marks/assignment', asyncHandler(teacherController.updateAssignmentMarks));
router.delete('/marks/assignment', asyncHandler(teacherController.deleteAssignmentMarks));

export default router;
