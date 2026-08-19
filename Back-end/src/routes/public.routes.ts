import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { publicController } from '../controllers/public.controller.js';

const router = Router();

router.get('/marksheet', asyncHandler(publicController.getMarksheet));

export default router;