import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { storageService } from './storage';
import { dbService } from './firestore';
import { RenderJob, Scene } from '@cineflow/shared';

// Configure fluent-ffmpeg to use installed binary
if (ffmpegInstaller.path) {
  try {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  } catch (err) {
    console.warn('[VideoAssembler] Could not set @ffmpeg-installer/ffmpeg path:', err);
  }
}

export class VideoAssemblerService {
  /**
   * Stitches multiple completed scene clips into a single continuous MP4 video
   */
  async assembleProject(
    projectId: string,
    renderJobId: string,
    onProgress?: (progressPercent: number) => void
  ): Promise<{ outputStorageUri: string; downloadUrl: string }> {
    const renderJob = await dbService.getRenderJob(renderJobId);
    if (!renderJob) {
      throw new Error(`Render job not found: ${renderJobId}`);
    }

    const scenes = await dbService.listScenesByProject(projectId);
    const validScenes = scenes
      .filter((s) => s.status === 'completed' && s.videoStorageUri)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (validScenes.length === 0) {
      throw new Error('No completed scenes available with valid video assets to assemble.');
    }

    const workDir = path.resolve(config.localTempDir, 'renders', renderJobId);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // Step 1: Download each scene video to a local temp folder
      const localClipPaths: string[] = [];
      const totalScenes = validScenes.length;

      for (let i = 0; i < totalScenes; i++) {
        const scene = validScenes[i];
        const clipDest = path.resolve(workDir, `clip_${i}.mp4`);
        await storageService.downloadToLocal(scene.videoStorageUri!, clipDest);
        localClipPaths.push(clipDest);

        if (onProgress) {
          const downloadProgress = Math.round(((i + 1) / totalScenes) * 20); // 0 to 20%
          onProgress(downloadProgress);
        }
      }

      // Step 2: Create FFmpeg concat file list
      const concatListPath = path.resolve(workDir, 'concat_list.txt');
      const concatContent = localClipPaths
        .map((p) => `file '${p.replace(/\\/g, '/')}'`)
        .join('\n');
      fs.writeFileSync(concatListPath, concatContent, 'utf8');

      const finalOutputLocalPath = path.resolve(workDir, `cineflow_final_${projectId}.mp4`);

      // Step 3: Run FFmpeg concatenation with normalization
      await new Promise<void>((resolve, reject) => {
        let command = ffmpeg();

        command
          .input(concatListPath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions([
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-preset medium',
            '-crf 22',
            '-movflags +faststart',
          ])
          .output(finalOutputLocalPath)
          .on('start', (cmdline) => {
            console.log(`[VideoAssembler] FFmpeg command started: ${cmdline}`);
          })
          .on('progress', (progress) => {
            if (progress.percent && onProgress) {
              const renderPercent = Math.min(90, Math.round(20 + progress.percent * 0.7));
              onProgress(renderPercent);
            }
          })
          .on('end', () => {
            console.log(`[VideoAssembler] Assembly finished: ${finalOutputLocalPath}`);
            resolve();
          })
          .on('error', (err, stdout, stderr) => {
            console.error('[VideoAssembler] FFmpeg error:', err.message, stderr);
            reject(new Error(`Video stitching failed: ${err.message}`));
          })
          .run();
      });

      if (onProgress) onProgress(95);

      // Step 4: Upload final stitched video to private storage
      const storageDest = storageService.getRenderStoragePath(projectId, `final_${projectId}.mp4`);
      const outputStorageUri = await storageService.uploadFile(finalOutputLocalPath, storageDest, 'video/mp4');
      const downloadUrl = await storageService.getSignedUrl(outputStorageUri, 'read', 120);

      if (onProgress) onProgress(100);

      // Step 5: Clean up local temp files
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (err) {
        console.warn('[VideoAssembler] Could not clean up render temp dir:', err);
      }

      return {
        outputStorageUri,
        downloadUrl,
      };
    } catch (err: any) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (_) {}
      throw err;
    }
  }
}

export const videoAssemblerService = new VideoAssemblerService();
