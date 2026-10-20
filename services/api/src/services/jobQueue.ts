import { config } from '../config';
import { dbService } from './firestore';
import { vertexVeoService } from './vertexVeo';
import { storageService } from './storage';
import { GenerationJob, Scene } from '@cineflow/shared';

export class JobQueueService {
  private activeJobsCount = 0;
  private queue: string[] = []; // Job IDs waiting in queue
  private isProcessing = false;

  /**
   * Enqueues a generation job
   */
  async enqueueJob(jobId: string): Promise<void> {
    if (!this.queue.includes(jobId)) {
      this.queue.push(jobId);
    }
    this.processQueue();
  }

  /**
   * Main queue processor with concurrency throttle
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && this.activeJobsCount < config.maxConcurrentJobs) {
        const jobId = this.queue.shift();
        if (!jobId) break;

        const job = await dbService.getJob(jobId);
        if (!job || job.status !== 'queued') continue;

        this.activeJobsCount++;
        this.runJob(job).finally(() => {
          this.activeJobsCount--;
          this.processQueue();
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Executes a single generation job
   */
  private async runJob(job: GenerationJob): Promise<void> {
    const scene = await dbService.getScene(job.sceneId);
    if (!scene) {
      job.status = 'failed';
      job.errorMessage = 'Associated scene not found';
      await dbService.saveJob(job);
      return;
    }

    try {
      // 1. Mark running
      job.status = 'running';
      job.progressPercent = 10;
      await dbService.saveJob(job);

      scene.status = 'running';
      await dbService.saveScene(scene);

      // 2. Start generation on Vertex AI Veo
      const genResult = await vertexVeoService.startGeneration({
        projectId: job.projectId,
        sceneId: job.sceneId,
        prompt: scene.prompt,
        negativePrompt: scene.negativePrompt,
        cameraMovement: scene.cameraMovement,
        lighting: scene.lighting,
        visualStyle: scene.visualStyle,
        aspectRatio: scene.aspectRatio,
        durationSeconds: scene.durationSeconds,
        resolution: scene.resolution,
        modelId: job.modelId,
        referenceImageBase64: scene.referenceImageBase64,
        confirmedBillable: job.confirmedBillable,
      });

      job.operationName = genResult.operationName;
      job.estimatedCostUsd = genResult.estimatedCostUsd;
      job.progressPercent = 25;
      await dbService.saveJob(job);

      // 3. Poll operation until complete (with max timeout e.g. 10 minutes)
      const startTime = Date.now();
      const timeoutMs = 10 * 60 * 1000;
      let isDone = false;

      while (!isDone && Date.now() - startTime < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Poll every 3 seconds

        const pollRes = await vertexVeoService.pollOperation(job.operationName!);

        if (pollRes.progressPercent) {
          job.progressPercent = Math.min(95, Math.max(job.progressPercent, pollRes.progressPercent));
          await dbService.saveJob(job);
        }

        if (pollRes.done) {
          isDone = true;

          if (pollRes.error) {
            throw new Error(pollRes.error);
          }

          if (!pollRes.videoStorageUri) {
            throw new Error('Video generation completed without output URI');
          }

          // Complete job
          job.status = 'completed';
          job.progressPercent = 100;
          job.videoStorageUri = pollRes.videoStorageUri;
          job.completedAt = new Date().toISOString();
          job.playbackUrl = await storageService.getSignedUrl(job.videoStorageUri, 'read', 120);
          job.downloadUrl = await storageService.getSignedUrl(job.videoStorageUri, 'read', 120);
          job.actualCostUsd = job.estimatedCostUsd;
          await dbService.saveJob(job);

          // Update Scene
          scene.status = 'completed';
          scene.videoStorageUri = job.videoStorageUri;
          scene.playbackUrl = job.playbackUrl;
          scene.downloadUrl = job.downloadUrl;
          scene.errorMessage = undefined;
          scene.actualCostUsd = job.actualCostUsd;
          await dbService.saveScene(scene);

          // Update Project summary
          const project = await dbService.getProject(job.projectId);
          if (project) {
            project.updatedAt = new Date().toISOString();
            if (!project.thumbnailUrl && scene.playbackUrl) {
              project.thumbnailUrl = scene.playbackUrl;
            }
            await dbService.saveProject(project);
          }

          console.log(`[JobQueue] Job ${job.id} for scene ${job.sceneId} completed successfully.`);
        }
      }

      if (!isDone) {
        throw new Error('Generation timed out after 10 minutes.');
      }
    } catch (err: any) {
      console.error(`[JobQueue] Job ${job.id} failed:`, err.message);
      job.status = 'failed';
      job.errorMessage = err.message;
      job.completedAt = new Date().toISOString();
      await dbService.saveJob(job);

      scene.status = 'failed';
      scene.errorMessage = err.message;
      await dbService.saveScene(scene);
    }
  }

  getActiveCount(): number {
    return this.activeJobsCount;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const jobQueueService = new JobQueueService();
