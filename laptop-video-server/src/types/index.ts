/**
 * Type definitions for PhotoBooth360 Video Processing Server
 */

export interface ProcessingJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100

  // Input metadata
  inputFilename: string;
  inputPath: string;
  metadata: VideoMetadata;

  // Output
  outputFilename?: string;
  outputPath?: string;
  error?: string;

  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface VideoMetadata {
  eventName: string;
  customerName: string;
  customerPhone: string;
  template: string; // 'corporate' | 'party' | etc.
}

export interface UploadResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface StatusResponse {
  jobId: string;
  status: ProcessingJob['status'];
  progress: number;
  inputFilename: string;
  outputFilename?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface HealthResponse {
  online: boolean;
  queueLength: number;
  processingCount: number;      // Number of videos currently being processed
  maxConcurrent: number;        // Maximum parallel jobs allowed
  ffmpegVersion: string;
  uptime: number;               // Seconds since server started
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  overlay: string;        // Path to overlay image
  music: string;          // Path to background music
  musicVolume: number;    // 0.0 - 1.0
  textPosition: 'top' | 'bottom' | 'center';
  textColor: string;      // Hex color
  textSize: number;       // Font size
  outputQuality: number;  // CRF value (18-28, lower = better)
}

export interface TemplatesResponse {
  templates: TemplateConfig[];
}
