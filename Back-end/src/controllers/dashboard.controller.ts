import { Request, Response } from 'express';
import { z } from 'zod';
import { dashboardService } from '../services/dashboard.service.js';

const studentProfileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required.').max(100),
  address: z.string().trim().max(300).optional().nullable(),
  school: z.string().trim().max(150).optional().nullable(),
  parentName: z.string().trim().max(100).optional().nullable(),
  parentPhone: z.string().trim().max(30).optional().nullable(),
});

export const dashboardController = {
  async getStudentDashboard(req: Request, res: Response) {
    try {
      const result = await dashboardService.getStudentDashboard(req.user?.studentId, req.user?.email ?? '');
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Student profile not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async updateStudentProfile(req: Request, res: Response) {
    try {
      const data = req.body as z.infer<typeof studentProfileUpdateSchema>;
      const result = await dashboardService.updateStudentProfile(req.user?.studentId, req.user?.email ?? '', data);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Student profile is required.') {
        res.status(400).json({ message: error.message });
      } else if (error.message === 'Student profile not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async getSubjects(req: Request, res: Response) {
    const result = await dashboardService.getSubjects(req.user?.studentId);
    res.json(result);
  },

  async getSubjectById(req: Request, res: Response) {
    try {
      const subjectId = req.params.subjectId;
      if (typeof subjectId !== 'string') {
        res.status(400).json({ message: 'subjectId is required.' });
        return;
      }
      const result = await dashboardService.getSubjectById(subjectId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Subject not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async getSubjectResults(req: Request, res: Response) {
    try {
      const subjectId = req.params.subjectId;
      if (typeof subjectId !== 'string') {
        res.status(400).json({ message: 'subjectId is required.' });
        return;
      }
      const result = await dashboardService.getSubjectResults(subjectId, req.user?.studentId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'subjectId is required.' || error.message === 'Student profile is required.') {
        res.status(400).json({ message: error.message });
      } else if (error.message === 'Subject not found.') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'You are not enrolled in this subject.') {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async getSubjectModules(req: Request, res: Response) {
    try {
      const subjectId = req.params.subjectId;
      if (typeof subjectId !== 'string') {
        res.status(400).json({ message: 'subjectId is required.' });
        return;
      }
      const result = await dashboardService.getSubjectModules(subjectId, req.user);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'subjectId is required.' || error.message === 'Student profile is required.') {
        res.status(400).json({ message: error.message });
      } else if (error.message === 'Subject not found.') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'You are not enrolled in this subject.') {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async getSubjectHomework(req: Request, res: Response) {
    try {
      const subjectId = req.params.subjectId;
      if (typeof subjectId !== 'string') {
        res.status(400).json({ message: 'subjectId is required.' });
        return;
      }
      const result = await dashboardService.getSubjectHomework(subjectId, req.user, req.query.limit);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'subjectId is required.' || error.message === 'Student profile is required.') {
        res.status(400).json({ message: error.message });
      } else if (error.message === 'Subject not found.') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'You are not enrolled in this subject.') {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  async getSubjectLeaderboard(req: Request, res: Response) {
    try {
      const subjectId = req.params.subjectId;
      if (typeof subjectId !== 'string') {
        res.status(400).json({ message: 'subjectId is required.' });
        return;
      }
      const result = await dashboardService.getSubjectLeaderboard(subjectId, req.query.classId, req.user?.studentId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'subjectId is required.' || error.message === 'classId is required for leaderboard lookups.') {
        res.status(400).json({ message: error.message });
      } else if (error.message === 'Subject not found.') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },
};

export { studentProfileUpdateSchema };
