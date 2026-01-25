/**
 * PhotoBooth360 Video Processing Server
 *
 * Local server that runs on Windows laptop at events.
 * Receives raw videos from phone, processes with FFmpeg, returns edited videos.
 *
 * Usage:
 *   npm run dev     - Development with hot reload
 *   npm run build   - Build for production
 *   npm start       - Run production build
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Routes
import uploadRouter from './routes/upload';
import statusRouter from './routes/status';
import downloadRouter from './routes/download';
import healthRouter from './routes/health';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure required directories exist
const dirs = [
  path.join(__dirname, '../input'),
  path.join(__dirname, '../output'),
  path.join(__dirname, '../templates'),
  path.join(__dirname, '../assets/overlays'),
  path.join(__dirname, '../assets/music'),
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Middleware
app.use(cors()); // Allow requests from phone app
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/upload', uploadRouter);
app.use('/status', statusRouter);
app.use('/download', downloadRouter);
app.use('/health', healthRouter);
app.use('/templates', healthRouter); // Reuse health router for /templates

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PhotoBooth360 Video Processing Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      templates: 'GET /health/templates',
      upload: 'POST /upload',
      status: 'GET /status/:jobId',
      download: 'GET /download/:jobId',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     PhotoBooth360 Video Processing Server                  ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Server running on http://localhost:${PORT}                    ║`);
  console.log(`║  Also accessible at http://<your-ip>:${PORT}                   ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                                ║');
  console.log('║    GET  /health          - Check server status             ║');
  console.log('║    GET  /health/templates - List available templates       ║');
  console.log('║    POST /upload          - Upload video for processing     ║');
  console.log('║    GET  /status/:jobId   - Check processing status         ║');
  console.log('║    GET  /download/:jobId - Download processed video        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Waiting for video uploads from PhotoBooth360 app...');
  console.log('');
});
