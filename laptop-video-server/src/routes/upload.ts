/**
 * Upload Route - Handles video uploads from phone
 *
 * POST /upload
 * Content-Type: multipart/form-data
 *
 * Fields:
 * - file: Video file (required)
 * - eventName: Event name (required)
 * - customerName: Customer name (required)
 * - customerPhone: Customer phone (required)
 * - template: Template ID (required, e.g., 'corporate' or 'party')
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { jobQueue } from '../services/queue';
import { UploadResponse, VideoMetadata } from '../types';

const router = Router();

// Configure multer for file uploads
const INPUT_DIR = path.join(__dirname, '../../input');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, INPUT_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max (4K videos can be large)
  },
  fileFilter: (req, file, cb) => {
    // Only accept video files
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only video files are allowed.`));
    }
  },
});

// POST /upload
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    // Validate file was uploaded
    if (!req.file) {
      const response: UploadResponse = {
        success: false,
        jobId: '',
        message: 'No file uploaded',
      };
      return res.status(400).json(response);
    }

    // Validate required metadata fields
    const { eventName, customerName, customerPhone, template } = req.body;

    if (!eventName || !customerName || !customerPhone || !template) {
      const response: UploadResponse = {
        success: false,
        jobId: '',
        message: 'Missing required fields: eventName, customerName, customerPhone, template',
      };
      return res.status(400).json(response);
    }

    // Create metadata object
    const metadata: VideoMetadata = {
      eventName,
      customerName,
      customerPhone,
      template,
    };

    // Add job to queue
    const job = jobQueue.addJob(req.file.path, req.file.filename, metadata);

    console.log(`[Upload] Received file: ${req.file.filename}`);
    console.log(`[Upload] Metadata:`, metadata);
    console.log(`[Upload] Created job: ${job.jobId}`);

    const response: UploadResponse = {
      success: true,
      jobId: job.jobId,
      message: 'Video uploaded successfully, processing started',
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('[Upload] Error:', error);

    const response: UploadResponse = {
      success: false,
      jobId: '',
      message: error instanceof Error ? error.message : 'Upload failed',
    };

    return res.status(500).json(response);
  }
});

export default router;
