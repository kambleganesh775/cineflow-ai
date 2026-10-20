import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/firestore';
import { videoAssemblerService } from '../services/videoAssembler';
import { renderProjectSchema } from '../validators';
import { RenderJob } from '@cineflow/shared';

export const renderRouter = Router();

// POST /api/projects/:id/render - Assemble scenes into final video
renderRouter.post('/projects/:id/render', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sceneIds } = renderProjectSchema.parse(req.body);
    const project = await dbService.getProject(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    const scenes = await dbService.listScenesByProject(project.id);
    const completedScenes = scenes.filter((s) => s.status === 'completed' && s.videoStorageUri);

    if (completedScenes.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_COMPLETED_SCENES',
          message: 'Cannot render video: No completed scenes with generated video clips are available.',
        },
      });
      return;
    }

    const targetSceneIds = sceneIds || completedScenes.map((s) => s.id);

    const renderJob: RenderJob = {
      id: uuidv4(),
      projectId: project.id,
      status: 'rendering',
      sceneIds: targetSceneIds,
      progressPercent: 5,
      createdAt: new Date().toISOString(),
    };

    await dbService.saveRenderJob(renderJob);

    // Asynchronously run video assembly
    videoAssemblerService
      .assembleProject(project.id, renderJob.id, async (percent) => {
        renderJob.progressPercent = percent;
        await dbService.saveRenderJob(renderJob);
      })
      .then(async (result) => {
        renderJob.status = 'completed';
        renderJob.progressPercent = 100;
        renderJob.outputStorageUri = result.outputStorageUri;
        renderJob.downloadUrl = result.downloadUrl;
        renderJob.completedAt = new Date().toISOString();
        await dbService.saveRenderJob(renderJob);

        // Update project final render fields
        project.finalRenderStorageUri = result.outputStorageUri;
        project.finalRenderUrl = result.downloadUrl;
        project.status = 'completed';
        project.updatedAt = new Date().toISOString();
        await dbService.saveProject(project);

        console.log(`[Render] Completed assembly for project ${project.id}: ${result.outputStorageUri}`);
      })
      .catch(async (err) => {
        console.error(`[Render] Assembly failed for project ${project.id}:`, err);
        renderJob.status = 'failed';
        renderJob.errorMessage = err.message;
        renderJob.completedAt = new Date().toISOString();
        await dbService.saveRenderJob(renderJob);
      });

    res.status(202).json({
      success: true,
      data: renderJob,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/render/:renderId - Get render status
renderRouter.get('/projects/:id/render/:renderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const renderJob = await dbService.getRenderJob(req.params.renderId);
    if (!renderJob) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Render job not found' },
      });
      return;
    }
    res.json({ success: true, data: renderJob });
  } catch (err) {
    next(err);
  }
});
