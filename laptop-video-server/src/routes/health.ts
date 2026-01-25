/**
 * Health Route - Check server status
 *
 * GET /health
 * Returns server status, queue info, and FFmpeg availability
 */

import { Router, Request, Response } from 'express';
import { jobQueue } from '../services/queue';
import { getFFmpegVersion, getTemplates } from '../services/processor';
import { HealthResponse, TemplatesResponse } from '../types';

const router = Router();
const startTime = Date.now();

// GET /health
router.get('/', async (req: Request, res: Response) => {
  const queueStatus = jobQueue.getQueueStatus();
  const ffmpegVersion = await getFFmpegVersion();

  const response: HealthResponse = {
    online: true,
    queueLength: queueStatus.queueLength,
    processingCount: queueStatus.processingCount,
    maxConcurrent: queueStatus.maxConcurrent,
    ffmpegVersion,
    uptime: Math.round((Date.now() - startTime) / 1000),
  };

  return res.json(response);
});

// GET /templates - List available templates
router.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = getTemplates();
    const response: TemplatesResponse = { templates };
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to load templates',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
