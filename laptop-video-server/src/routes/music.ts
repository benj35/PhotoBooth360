/**
 * Music Route - Lists available music tracks from assets/music/
 *
 * GET /music - Returns list of MP3 files available for video processing
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const MUSIC_DIR = path.join(__dirname, '../../assets/music');

// GET /music
router.get('/', (req: Request, res: Response) => {
  try {
    // Ensure music directory exists
    if (!fs.existsSync(MUSIC_DIR)) {
      fs.mkdirSync(MUSIC_DIR, { recursive: true });
    }

    const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];
    const files = fs.readdirSync(MUSIC_DIR)
      .filter((f) => audioExtensions.some((ext) => f.toLowerCase().endsWith(ext)))
      .map((f) => ({
        filename: f,
        name: f.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      }));

    return res.json({ tracks: files });
  } catch (error) {
    console.error('[Music] Error listing tracks:', error);
    return res.status(500).json({
      error: 'Failed to list music tracks',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
