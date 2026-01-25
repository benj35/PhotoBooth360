/**
 * Status Route - Check processing job status
 *
 * GET /status/:jobId
 * Returns current status, progress, and output info when complete
 */

import { Router, Request, Response } from 'express';
import { jobQueue } from '../services/queue';
import { StatusResponse } from '../types';

const router = Router();

// GET /status/:jobId
router.get('/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId,
    });
  }

  const response: StatusResponse = {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    inputFilename: job.inputFilename,
    outputFilename: job.outputFilename,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
  };

  return res.json(response);
});

// GET /status - Get all jobs (for debugging)
router.get('/', (req: Request, res: Response) => {
  const jobs = jobQueue.getAllJobs();

  const response = jobs.map((job) => ({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    inputFilename: job.inputFilename,
    outputFilename: job.outputFilename,
    createdAt: job.createdAt.toISOString(),
  }));

  return res.json({ jobs: response });
});

export default router;
