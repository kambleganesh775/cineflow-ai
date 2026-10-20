import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/firestore';
import { jobQueueService } from '../services/jobQueue';
import { generateSceneSchema, generateAllScenesSchema } from '../validators';
import { GenerationJob, calculateVeoCost } from '@cineflow/shared';
import { generationRateLimiter } from '../middleware/rateLimiter';
import { config } from '../config';

export const jobsRouter = Router();

// POST /api/scenes/:id/generate - Trigger generation for a single scene
jobsRouter.post('/scenes/:id/generate', generationRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { confirmedBillable } = generateSceneSchema.parse(req.body);
    const scene = await dbService.getScene(req.params.id);

    if (!scene) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scene not found' },
      });
      return;
    }

    if (scene.status === 'running' || scene.status === 'queued') {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Scene generation is already in progress or queued.' },
      });
      return;
    }

    const cost = calculateVeoCost(scene.modelId, scene.durationSeconds, scene.resolution);

    if (config.requireBillingConfirmation && !confirmedBillable && !config.mockVertexAi) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BILLING_CONFIRMATION_REQUIRED',
          message: `Billing confirmation required before generating video. Estimated cost: $${cost.estimatedCostUsd} USD.`,
        },
      });
      return;
    }

    const job: GenerationJob = {
      id: uuidv4(),
      sceneId: scene.id,
      projectId: scene.projectId,
      status: 'queued',
      progressPercent: 0,
      modelId: scene.modelId,
      estimatedCostUsd: cost.estimatedCostUsd,
      confirmedBillable,
      createdAt: new Date().toISOString(),
    };

    scene.status = 'queued';
    scene.jobId = job.id;
    scene.errorMessage = undefined;
    await dbService.saveScene(scene);
    await dbService.saveJob(job);

    await jobQueueService.enqueueJob(job.id);

    res.status(202).json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/generate-all - Queue all or selected uncompleted scenes
jobsRouter.post('/projects/:id/generate-all', generationRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { confirmedBillable, sceneIds } = generateAllScenesSchema.parse(req.body);
    const project = await dbService.getProject(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    const allScenes = await dbService.listScenesByProject(project.id);
    const targetScenes = allScenes.filter((s) => {
      if (sceneIds && sceneIds.length > 0) {
        return sceneIds.includes(s.id);
      }
      return s.status !== 'completed' && s.status !== 'running' && s.status !== 'queued';
    });

    if (targetScenes.length === 0) {
      res.json({
        success: true,
        data: { message: 'No eligible scenes to generate', queuedJobs: [] },
      });
      return;
    }

    const queuedJobs: GenerationJob[] = [];

    for (const scene of targetScenes) {
      const cost = calculateVeoCost(scene.modelId, scene.durationSeconds, scene.resolution);
      const job: GenerationJob = {
        id: uuidv4(),
        sceneId: scene.id,
        projectId: scene.projectId,
        status: 'queued',
        progressPercent: 0,
        modelId: scene.modelId,
        estimatedCostUsd: cost.estimatedCostUsd,
        confirmedBillable,
        createdAt: new Date().toISOString(),
      };

      scene.status = 'queued';
      scene.jobId = job.id;
      scene.errorMessage = undefined;

      await dbService.saveScene(scene);
      await dbService.saveJob(job);
      await jobQueueService.enqueueJob(job.id);
      queuedJobs.push(job);
    }

    res.status(202).json({
      success: true,
      data: {
        queuedCount: queuedJobs.length,
        jobs: queuedJobs,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs - List jobs for a project
jobsRouter.get('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Query parameter projectId is required.' },
      });
      return;
    }

    const jobs = await dbService.listJobsByProject(projectId);
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id - Get status of a specific job
jobsRouter.get('/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await dbService.getJob(req.params.id);
    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found' },
      });
      return;
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/retry - Retry a failed job
jobsRouter.post('/jobs/:id/retry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await dbService.getJob(req.params.id);
    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found' },
      });
      return;
    }

    if (job.status !== 'failed') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only failed jobs can be retried.' },
      });
      return;
    }

    job.status = 'queued';
    job.progressPercent = 0;
    job.errorMessage = undefined;
    job.operationName = undefined;
    job.createdAt = new Date().toISOString();
    await dbService.saveJob(job);

    const scene = await dbService.getScene(job.sceneId);
    if (scene) {
      scene.status = 'queued';
      scene.errorMessage = undefined;
      await dbService.saveScene(scene);
    }

    await jobQueueService.enqueueJob(job.id);
    res.status(202).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});
