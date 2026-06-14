import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { repo } from '../data/repository.js';

const router = Router();

router.get('/marksheet', asyncHandler(async (req, res) => {
  const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId.trim() : '';
  const examType = typeof req.query.examType === 'string' ? req.query.examType.trim() : '';
  const examName = typeof req.query.examName === 'string' ? req.query.examName.trim() : '';
  const examDate = typeof req.query.examDate === 'string' ? req.query.examDate.trim() : '';
  const username = typeof req.query.username === 'string' ? req.query.username.trim() : undefined;

  if (!subjectId || !examType || !examName || !examDate) {
    res.status(400).json({ message: 'subjectId, examType, examName, and examDate are required.' });
    return;
  }

  const marksheet = await repo.getPublicMarksheet({ subjectId, examType, examName, examDate, username });

  if (!marksheet) {
    res.status(404).json({ message: 'Assignment or student not found.' });
    return;
  }

  res.json(marksheet);
}));

export default router;