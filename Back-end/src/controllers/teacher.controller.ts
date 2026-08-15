import { Request, Response } from 'express';
import { z } from 'zod';
import { teacherService } from '../services/teacher.service.js';

const teacherMarkSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  examType: z.string().min(1),
  examName: z.string().min(1),
  examDate: z.string().min(1),
  mark: z.number().min(0).max(100),
  note: z.string().optional(),
});

const resourceSchema = z.object({
  classId: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(1).max(200),
  href: z.string().url(),
  type: z.enum(['document', 'video', 'link']),
});

const topicSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1).max(150),
});

const homeworkSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1).max(150),
  dueDate: z.string().min(1),
});

const homeworkCompletionSchema = z.object({
  classId: z.string().min(1),
  homeworkId: z.string().min(1),
  studentId: z.string().min(1),
  isDone: z.boolean(),
});

export const teacherController = {
  async getDashboard(req: Request, res: Response) {
    const result = await teacherService.getDashboard(req.user?.teacherId, req.context);
    res.json(result);
  },

  async addMark(req: Request, res: Response) {
    const result = await teacherService.addMark(req.user?.teacherId, req.body, req.context);
    res.status(result.action === 'created' ? 201 : 200).json(result);
  },

  async addResource(req: Request, res: Response) {
    const result = await teacherService.addResource(req.user?.teacherId, req.body, req.context);
    res.status(201).json(result);
  },

  async addTopic(req: Request, res: Response) {
    const result = await teacherService.addTopic(req.user?.teacherId, req.body, req.context);
    res.status(201).json(result);
  },

  async deleteResource(req: Request, res: Response) {
    const { classId, resourceId } = req.params;
    if (!classId || !resourceId) {
      res.status(400).json({ message: 'classId and resourceId are required.' });
      return;
    }
    const result = await teacherService.deleteResource(req.user?.teacherId, String(classId), String(resourceId), req.context);
    res.json(result);
  },

  async deleteTopic(req: Request, res: Response) {
    const { classId, moduleId } = req.params;
    if (!classId || !moduleId) {
      res.status(400).json({ message: 'classId and moduleId are required.' });
      return;
    }
    const result = await teacherService.deleteTopic(req.user?.teacherId, String(classId), String(moduleId), req.context);
    res.json(result);
  },

  async getHomework(req: Request, res: Response) {
    const { classId } = req.params;
    if (!classId) {
      res.status(400).json({ message: 'classId is required.' });
      return;
    }
    const result = await teacherService.getHomework(req.user?.teacherId, String(classId), req.context);
    res.json(result);
  },

  async addHomework(req: Request, res: Response) {
    const result = await teacherService.addHomework(req.user?.teacherId, req.user?.id, req.body, req.context);
    res.status(201).json(result);
  },

  async completeHomework(req: Request, res: Response) {
    const result = await teacherService.completeHomework(req.user?.teacherId, req.user?.id, req.body, req.context);
    res.json(result);
  },

  async deleteHomework(req: Request, res: Response) {
    const { classId, homeworkId } = req.params;
    if (!classId || !homeworkId) {
      res.status(400).json({ message: 'classId and homeworkId are required.' });
      return;
    }
    const result = await teacherService.deleteHomework(req.user?.teacherId, String(classId), String(homeworkId), req.context);
    res.json(result);
  },

  async getStudentProgress(req: Request, res: Response) {
    const { studentId } = req.params;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }
    const result = await teacherService.getStudentProgress(req.user?.teacherId, String(studentId), req.context);
    res.json(result);
  },

  async deleteMark(req: Request, res: Response) {
    const { studentId, subjectId, examType, examName } = req.body;
    if (!studentId || !subjectId || !examType || !examName) {
      res.status(400).json({ message: 'studentId, subjectId, examType, and examName are required.' });
      return;
    }
    const result = await teacherService.deleteMark(req.user?.teacherId, req.body, req.context);
    res.json(result);
  },

  async createAssignment(req: Request, res: Response) {
    const { subjectId, examType, examName, examDate } = req.body;
    if (!subjectId || !examType || !examName || !examDate) {
      res.status(400).json({ message: 'subjectId, examType, examName, and examDate are required.' });
      return;
    }
    const result = await teacherService.createAssignment(req.user?.teacherId, req.body, req.context);
    res.status(201).json(result);
  },

  async updateAssignmentMarks(req: Request, res: Response) {
    const { subjectId, oldExamName, newExamName } = req.body;
    if (!subjectId || !oldExamName || !newExamName) {
      res.status(400).json({ message: 'subjectId, oldExamName, and newExamName are required.' });
      return;
    }
    const result = await teacherService.updateAssignmentMarks(req.user?.teacherId, req.body, req.context);
    res.json(result);
  },

  async deleteAssignmentMarks(req: Request, res: Response) {
    const { subjectId, examName } = req.body;
    if (!subjectId || !examName) {
      res.status(400).json({ message: 'subjectId and examName are required.' });
      return;
    }
    const result = await teacherService.deleteAssignmentMarks(req.user?.teacherId, req.body, req.context);
    res.json(result);
  },
};

export { teacherMarkSchema, resourceSchema, topicSchema, homeworkSchema, homeworkCompletionSchema };
