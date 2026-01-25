/**
 * Download Route - Download processed video
 *
 * GET /download/:jobId
 * Returns the processed video file for completed jobs
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { jobQueue } from '../services/queue';

const router = Router();

// GET /download/:jobId
router.get('/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId,
    });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({
      error: 'Job not completed yet',
      jobId,
      status: job.status,
      progress: job.progress,
    });
  }

  if (!job.outputPath || !fs.existsSync(job.outputPath)) {
    return res.status(404).json({
      error: 'Output file not found',
      jobId,
    });
  }

  // Get file stats for Content-Length header
  const stat = fs.statSync(job.outputPath);

  // Set headers for file download
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', stat.size);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${job.outputFilename}"`
  );

  // Stream the file
  const fileStream = fs.createReadStream(job.outputPath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
    console.error(`[Download] Stream error for job ${jobId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream file' });
    }
  });
});

export default router;
