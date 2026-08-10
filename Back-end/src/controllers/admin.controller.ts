import { Request, Response } from 'express';
import { z } from 'zod';
import { adminService } from '../services/admin.service.js';

const studentSchema = z.object({
  name: z.string().min(1),
  index: z.string().min(1),
  classId: z.string().min(1),
  dateOfBirth: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
});

const classSchema = z.object({
  grade: z.string().min(1),
  name: z.string().min(1),
  medium: z.string().min(1),
  subjectName: z.string().min(1),
  teacherId: z.string().optional(),
  academicYear: z.number().int().min(2000).max(2100).optional(),
  schedule: z.string().optional(),
  fee: z.number().min(0).optional(),
});

const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
});

const teacherAssignmentSchema = z.object({
  subject: z.string().min(1),
  grade: z.string().min(1),
  classId: z.string().min(1),
  medium: z.string().min(1),
});

const teacherSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional().default(''),
  grade: z.string().optional().default(''),
  username: z.string().min(1),
  password: z.string().min(6),
  email: z.string().email(),
  phone: z.string().min(1),
  assignments: z.array(teacherAssignmentSchema).optional().default([]),
});

const classTeacherSchema = z.object({
  teacherId: z.string().min(1).nullable().optional(),
});

const markSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  classId: z.string().optional(),
  examType: z.string().min(1),
  examName: z.string().min(1),
  examDate: z.string().min(1),
  mark: z.number().min(0).max(100),
  note: z.string().optional(),
});

const bulkMarksSchema = z.object({
  csvText: z.string().min(1),
});

export const adminController = {
  async getMeta(req: Request, res: Response) {
    const grade = typeof req.query.grade === 'string' ? req.query.grade : '';
    const classId = typeof req.query.classId === 'string' ? req.query.classId : '';
    const result = await adminService.getMeta(grade, classId);
    res.json(result);
  },

  async getStudents(req: Request, res: Response) {
    const grade = typeof req.query.grade === 'string' ? req.query.grade : undefined;
    const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined;
    const query = typeof req.query.query === 'string' ? req.query.query : undefined;
    
    const result = await adminService.getStudents({ grade, classId, query });
    res.json(result);
  },

  async getUsers(req: Request, res: Response) {
    const result = await adminService.getUsers();
    res.json(result);
  },

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId ?? '');
      const result = await adminService.deleteUser(userId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'User not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async createClass(req: Request, res: Response) {
    try {
      const result = await adminService.createClass(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === 'This class/batch already exists.') {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async setClassTeacher(req: Request, res: Response) {
    try {
      const classId = String(req.params.classId ?? '');
      const result = await adminService.setClassTeacher(classId, req.body.teacherId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Class or teacher not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async deleteClass(req: Request, res: Response) {
    try {
      const classId = String(req.params.classId ?? '');
      const result = await adminService.deleteClass(classId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Class not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async enrollStudent(req: Request, res: Response) {
    try {
      const result = await adminService.enrollStudent(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === 'Class or subject not found for enrollment.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async deleteEnrollment(req: Request, res: Response) {
    try {
      const studentId = String(req.query.studentId ?? '');
      const classId = String(req.query.classId ?? '');

      if (!studentId || !classId) {
        res.status(400).json({ message: 'studentId and classId are required.' });
        return;
      }
      const result = await adminService.deleteEnrollment(studentId, classId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Enrollment not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async createStudent(req: Request, res: Response) {
    try {
      const result = await adminService.createStudent(req.body);
      res.status(201).json(result); // Will be 200 in the client intercept if existing, but 201 is fine here.
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ message: error.message });
      } else if (error.message.includes('Invalid')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async deleteStudent(req: Request, res: Response) {
    try {
      const studentId = String(req.params.studentId ?? '');
      const result = await adminService.deleteStudent(studentId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Student not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async getTeachers(req: Request, res: Response) {
    const result = await adminService.getTeachers();
    res.json(result);
  },

  async createTeacher(req: Request, res: Response) {
    try {
      const result = await adminService.createTeacher(req.body);
      res.status(result.existing ? 200 : 201).json({ teacher: result.teacher, user: result.user });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async deleteTeacher(req: Request, res: Response) {
    try {
      const teacherId = String(req.params.teacherId ?? '');
      const result = await adminService.deleteTeacher(teacherId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Teacher not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async getMarks(req: Request, res: Response) {
    try {
      const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : '';
      const result = await adminService.getMarks(studentId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Student not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async upsertMark(req: Request, res: Response) {
    try {
      const result = await adminService.upsertMark(req.body);
      res.status(result.action === 'created' ? 201 : 200).json(result);
    } catch (error: any) {
      if (error.message === 'Student not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async deleteMark(req: Request, res: Response) {
    try {
      const params = {
        studentId: String(req.query.studentId ?? ''),
        subjectId: String(req.query.subjectId ?? ''),
        examType: String(req.query.examType ?? ''),
        examName: String(req.query.examName ?? ''),
        examDate: String(req.query.examDate ?? '') || undefined,
      };

      if (!params.studentId || !params.subjectId || !params.examType || !params.examName) {
        res.status(400).json({ message: 'studentId, subjectId, examType, and examName are required.' });
        return;
      }

      const result = await adminService.deleteMark(params);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Student not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async bulkUpsertMarks(req: Request, res: Response) {
    try {
      const result = await adminService.bulkUpsertMarks(req.body.csvText);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  async promoteUser(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId ?? '');
      const result = await adminService.promoteUser(userId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'User not found.' || error.message === 'Failed to promote user.') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Only teachers can be promoted to admin.') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  }
};

export {
  studentSchema,
  classSchema,
  enrollmentSchema,
  teacherSchema,
  classTeacherSchema,
  markSchema,
  bulkMarksSchema,
};
