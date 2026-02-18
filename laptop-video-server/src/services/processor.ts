/**
 * FFmpeg Video Processor - Handles video editing with templates
 *
 * Pipeline:
 * 1. Speed ramp (Fast 1.5x -> Slow 0.5x -> Fast 1.5x)
 * 2. Color boost (saturation + contrast)
 * 3. Vignette (darken edges)
 * 4. Fade in/out (0.5s black fades)
 * 5. Text label (customer name + event)
 * 6. Music mix (from selected track or template default)
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
 * Get video duration using ffprobe
 */
function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

/**
 * Process video with FFmpeg
 *
 * Applies: speed ramp, color boost, vignette, fade in/out, text label, music mix
 */
export function processVideo(
  job: ProcessingJob,
  onProgress: (progress: number) => void
): Promise<{ outputFilename: string; outputPath: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const template = loadTemplate(job.metadata.template);

      // Get video duration for speed ramp + fade calculations
      const duration = await getVideoDuration(job.inputPath);
      if (duration <= 0) {
        throw new Error('Could not determine video duration');
      }

      console.log(`[Processor] Video duration: ${duration}s`);

      // Generate output filename
      const timestamp = new Date().toISOString().split('T')[0];
      const cleanCustomer = job.metadata.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanEvent = job.metadata.eventName.replace(/[^a-zA-Z0-9]/g, '_');
      const outputFilename = `${cleanCustomer}_${cleanEvent}_${timestamp}_PhotoBooth360_Edited.mp4`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);

      // Resolve music path: use explicit musicFile from request, or fall back to template default
      let musicPath: string;
      if (job.metadata.musicFile) {
        musicPath = path.join(ASSETS_DIR, 'music', job.metadata.musicFile);
      } else {
        musicPath = path.join(ASSETS_DIR, template.music);
      }

      const hasMusic = fs.existsSync(musicPath);
      if (!hasMusic) {
        console.warn(`[Processor] Music not found: ${musicPath}, processing without music`);
      }

      // Speed ramp: Fast (2x) -> Slow (0.3x) -> Fast (2x)
      // Segment split calculated so output duration = input duration:
      //   fast portion = 41.1% each side, slow portion = 17.8% in the middle
      //   output = 0.411D/2 + 0.178D/0.3 + 0.411D/2 = 0.2055D + 0.593D + 0.2055D ≈ D
      const FAST_SPEED = 2.0;
      const SLOW_SPEED = 0.3;
      const fastFraction = 0.411; // each fast segment as fraction of total
      const T1 = duration * fastFraction;
      const T2 = duration * (1 - fastFraction);

      // Output duration = original duration (by design)
      const outDur = duration;
      const fadeOutStart = Math.max(0, outDur - 0.5);

      console.log(`[Processor] Speed ramp: T1=${T1.toFixed(2)}s, T2=${T2.toFixed(2)}s, outDur=${outDur.toFixed(2)}s`);
      console.log(`[Processor] Fast=${FAST_SPEED}x (0-${T1.toFixed(1)}s, ${T2.toFixed(1)}s-end), Slow=${SLOW_SPEED}x (${T1.toFixed(1)}s-${T2.toFixed(1)}s)`);

      // Build text label
      const textLabel = `${job.metadata.customerName} - ${job.metadata.eventName}`;
      const textY = template.textPosition === 'top' ? '50' : 'h-80';

      // Video filter chain: split -> speed ramp -> concat -> effects -> text
      const videoFilter = [
        `[0:v]split=3[v1][v2][v3]`,
        `[v1]trim=start=0:end=${T1.toFixed(4)},setpts=PTS/${FAST_SPEED}[seg1]`,
        `[v2]trim=start=${T1.toFixed(4)}:end=${T2.toFixed(4)},setpts=(PTS-STARTPTS)/${SLOW_SPEED}[seg2]`,
        `[v3]trim=start=${T2.toFixed(4)},setpts=(PTS-STARTPTS)/${FAST_SPEED}[seg3]`,
        `[seg1][seg2][seg3]concat=n=3:v=1:a=0[vspeed]`,
        `[vspeed]eq=brightness=0.06:saturation=1.6:contrast=1.2:gamma=1.1,vignette=PI/5,fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOutStart.toFixed(4)}:d=0.5,drawtext=text='${escapeFFmpegText(textLabel)}':fontsize=${template.textSize}:fontcolor=${template.textColor}:x=(w-tw)/2:y=${textY}:box=1:boxcolor=black@0.5:boxborderw=10[vout]`,
      ];

      let filterComplex: string;
      let inputs: string[] = [job.inputPath];
      let audioMap: string;

      if (hasMusic) {
        // Use music only (drop original video audio completely)
        inputs.push(musicPath);
        // Trim music to match output duration, fade out at the end
        const musicFadeOut = Math.max(0, outDur - 1.0);
        filterComplex = [
          ...videoFilter,
          `[1:a]atrim=start=0:end=${outDur.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=out:st=${musicFadeOut.toFixed(4)}:d=1.0,volume=${template.musicVolume}[aout]`,
        ].join(';');
        audioMap = '[aout]';
      } else {
        // No music - output silent audio
        filterComplex = [
          ...videoFilter,
          `anullsrc=r=44100:cl=stereo[aout]`,
        ].join(';');
        audioMap = '[aout]';
      }

      console.log(`[Processor] Starting FFmpeg for job ${job.jobId}`);
      console.log(`[Processor] Input: ${job.inputPath}`);
      console.log(`[Processor] Output: ${outputPath}`);
      console.log(`[Processor] Template: ${template.id}`);
      console.log(`[Processor] Music: ${hasMusic ? musicPath : 'none'}`);

      // Build FFmpeg command
      let command = ffmpeg();

      inputs.forEach((input) => {
        command = command.input(input);
      });

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[vout]',
          '-map', audioMap,
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
    } catch (err) {
      reject(err);
    }
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
