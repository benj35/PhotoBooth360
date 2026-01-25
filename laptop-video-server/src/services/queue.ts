/**
 * Job Queue Service - Manages video processing jobs
 *
 * In-memory queue with limited parallel processing for laptop operation.
 * Processes up to MAX_CONCURRENT_JOBS videos simultaneously.
 */

import { ProcessingJob, VideoMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { processVideo } from './processor';

// Configuration: Number of videos to process in parallel
// Laptop-safe default is 2, can increase to 3-4 on powerful laptops
// Set to 1 for sequential processing (safest for low-end laptops)
const MAX_CONCURRENT_JOBS = 2;

class JobQueue {
  private jobs: Map<string, ProcessingJob> = new Map();
  private queue: string[] = []; // Job IDs waiting to be processed
  private processingJobs: Set<string> = new Set(); // Currently processing job IDs

  /**
   * Add a new job to the queue
   */
  addJob(inputPath: string, inputFilename: string, metadata: VideoMetadata): ProcessingJob {
    const jobId = uuidv4();

    const job: ProcessingJob = {
      jobId,
      status: 'queued',
      progress: 0,
      inputFilename,
      inputPath,
      metadata,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    console.log(`[Queue] Added job ${jobId} - ${inputFilename}`);
    console.log(`[Queue] Queue length: ${this.queue.length}`);

    // Start processing if not already running
    this.processNext();

    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ProcessingJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { queueLength: number; processingCount: number; maxConcurrent: number } {
    return {
      queueLength: this.queue.length,
      processingCount: this.processingJobs.size,
      maxConcurrent: MAX_CONCURRENT_JOBS,
    };
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
    }
  }

  /**
   * Process next job in queue
   * Supports parallel processing up to MAX_CONCURRENT_JOBS
   */
  private async processNext(): Promise<void> {
    // Start as many jobs as we can (up to MAX_CONCURRENT_JOBS)
    while (
      this.processingJobs.size < MAX_CONCURRENT_JOBS &&
      this.queue.length > 0
    ) {
      const jobId = this.queue.shift()!;
      this.processingJobs.add(jobId);

      const job = this.jobs.get(jobId);
      if (!job) {
        console.error(`[Queue] Job ${jobId} not found`);
        this.processingJobs.delete(jobId);
        continue;
      }

      console.log(
        `[Queue] Starting to process job ${jobId} (${this.processingJobs.size}/${MAX_CONCURRENT_JOBS} slots)`
      );
      job.status = 'processing';
      job.startedAt = new Date();

      // Process job asynchronously (don't await here - we want parallel execution)
      this.processJob(jobId, job).catch((error) => {
        console.error(`[Queue] Unexpected error processing job ${jobId}:`, error);
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(jobId: string, job: ProcessingJob): Promise<void> {
    try {
      const result = await processVideo(job, (progress) => {
        this.updateProgress(jobId, progress);
      });

      job.status = 'completed';
      job.progress = 100;
      job.outputFilename = result.outputFilename;
      job.outputPath = result.outputPath;
      job.completedAt = new Date();

      console.log(`[Queue] Job ${jobId} completed successfully`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.completedAt = new Date();

      console.error(`[Queue] Job ${jobId} failed:`, job.error);
    } finally {
      // Remove from processing set and try to start next job
      this.processingJobs.delete(jobId);
      this.processNext();
    }
  }

  /**
   * Clean up old completed/failed jobs (older than 24 hours)
   */
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [jobId, job] of this.jobs) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < oneDayAgo
      ) {
        this.jobs.delete(jobId);
        console.log(`[Queue] Cleaned up old job ${jobId}`);
      }
    }
  }
}

// Export singleton instance
export const jobQueue = new JobQueue();

// Run cleanup every hour
setInterval(() => {
  jobQueue.cleanup();
}, 60 * 60 * 1000);
