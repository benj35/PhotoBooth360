/**
 * FFmpeg Video Processor - Handles video editing with templates
 *
 * Applies overlays, music, text labels, and compression.
 */

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { ProcessingJob, TemplateConfig } from '../types';

// Paths
const TEMPLATES_DIR = path.join(__dirname, '../../templates');
const ASSETS_DIR = path.join(__dirname, '../../assets');
const OUTPUT_DIR = path.join(__dirname, '../../output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Load template configuration
 */
function loadTemplate(templateId: string): TemplateConfig {
  const templatePath = path.join(TEMPLATES_DIR, `${templateId}.json`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const templateData = fs.readFileSync(templatePath, 'utf-8');
  return JSON.parse(templateData) as TemplateConfig;
}

/**
 * Get all available templates
 */
export function getTemplates(): TemplateConfig[] {
  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));
  return files.map((f) => {
    const data = fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf-8');
    return JSON.parse(data) as TemplateConfig;
  });
}

/**
 * Process video with FFmpeg
 */
export function processVideo(
  job: ProcessingJob,
  onProgress: (progress: number) => void
): Promise<{ outputFilename: string; outputPath: string }> {
  return new Promise((resolve, reject) => {
    const template = loadTemplate(job.metadata.template);

    // Generate output filename
    const timestamp = new Date().toISOString().split('T')[0];
    const cleanCustomer = job.metadata.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanEvent = job.metadata.eventName.replace(/[^a-zA-Z0-9]/g, '_');
    const outputFilename = `${cleanCustomer}_${cleanEvent}_${timestamp}_PhotoBooth360_Edited.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Resolve asset paths
    const overlayPath = path.join(ASSETS_DIR, template.overlay);
    const musicPath = path.join(ASSETS_DIR, template.music);

    // Check if assets exist
    if (!fs.existsSync(overlayPath)) {
      console.warn(`[Processor] Overlay not found: ${overlayPath}, processing without overlay`);
    }
    if (!fs.existsSync(musicPath)) {
      console.warn(`[Processor] Music not found: ${musicPath}, processing without music`);
    }

    const hasOverlay = fs.existsSync(overlayPath);
    const hasMusic = fs.existsSync(musicPath);

    // Build filter complex based on available assets
    const textLabel = `${job.metadata.customerName} - ${job.metadata.eventName}`;
    const textY = template.textPosition === 'top' ? '50' : 'h-80';

    let filterComplex: string;
    let inputs: string[] = [job.inputPath];

    if (hasOverlay && hasMusic) {
      // Full processing: overlay + music + text
      inputs.push(overlayPath, musicPath);
      filterComplex = `
        [0:v][1:v]overlay=0:0[v_overlay];
        [v_overlay]drawtext=text='${escapeFFmpegText(textLabel)}':fontsize=${template.textSize}:fontcolor=${template.textColor}:x=(w-tw)/2:y=${textY}:box=1:boxcolor=black@0.5:boxborderw=10[vout];
        [0:a][2:a]amix=inputs=2:duration=first:weights=1 ${template.musicVolume}[aout]
      `;
    } else if (hasOverlay) {
      // Overlay + text only
      inputs.push(overlayPath);
      filterComplex = `
        [0:v][1:v]overlay=0:0[v_overlay];
        [v_overlay]drawtext=text='${escapeFFmpegText(textLabel)}':fontsize=${template.textSize}:fontcolor=${template.textColor}:x=(w-tw)/2:y=${textY}:box=1:boxcolor=black@0.5:boxborderw=10[vout]
      `;
    } else if (hasMusic) {
      // Music + text only
      inputs.push(musicPath);
      filterComplex = `
        [0:v]drawtext=text='${escapeFFmpegText(textLabel)}':fontsize=${template.textSize}:fontcolor=${template.textColor}:x=(w-tw)/2:y=${textY}:box=1:boxcolor=black@0.5:boxborderw=10[vout];
        [0:a][1:a]amix=inputs=2:duration=first:weights=1 ${template.musicVolume}[aout]
      `;
    } else {
      // Text only
      filterComplex = `
        [0:v]drawtext=text='${escapeFFmpegText(textLabel)}':fontsize=${template.textSize}:fontcolor=${template.textColor}:x=(w-tw)/2:y=${textY}:box=1:boxcolor=black@0.5:boxborderw=10[vout]
      `;
    }

    console.log(`[Processor] Starting FFmpeg for job ${job.jobId}`);
    console.log(`[Processor] Input: ${job.inputPath}`);
    console.log(`[Processor] Output: ${outputPath}`);
    console.log(`[Processor] Template: ${template.id}`);

    // Build FFmpeg command
    let command = ffmpeg();

    // Add all inputs
    inputs.forEach((input) => {
      command = command.input(input);
    });

    // Configure output
    command
      .complexFilter(filterComplex.trim())
      .outputOptions([
        '-map', '[vout]',
        '-map', hasMusic ? '[aout]' : '0:a',  // Only use [aout] if music exists
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', String(template.outputQuality),
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('start', (cmdLine) => {
        console.log(`[Processor] FFmpeg command: ${cmdLine}`);
      })
      .on('progress', (progress) => {
        // Progress.percent might be undefined, estimate based on time
        const percent = progress.percent ?? 0;
        onProgress(Math.min(Math.round(percent), 99));
      })
      .on('end', () => {
        console.log(`[Processor] FFmpeg completed for job ${job.jobId}`);
        resolve({ outputFilename, outputPath });
      })
      .on('error', (err) => {
        console.error(`[Processor] FFmpeg error for job ${job.jobId}:`, err.message);
        reject(new Error(`FFmpeg processing failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Escape special characters for FFmpeg drawtext filter
 */
function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Get FFmpeg version
 */
export function getFFmpegVersion(): Promise<string> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        resolve('unknown');
      } else {
        resolve('available');
      }
    });
  });
}
