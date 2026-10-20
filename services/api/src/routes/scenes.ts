import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/firestore';
import {
  createSceneSchema,
  updateSceneSchema,
  reorderScenesSchema,
} from '../validators';
import { Scene, calculateVeoCost, DEFAULT_VEO_MODEL } from '@cineflow/shared';

export const scenesRouter = Router();

async function updateProjectSummary(projectId: string): Promise<void> {
  const project = await dbService.getProject(projectId);
  if (!project) return;

  const scenes = await dbService.listScenesByProject(projectId);
  project.sceneCount = scenes.length;
  project.totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
  project.updatedAt = new Date().toISOString();
  await dbService.saveProject(project);
}

// POST /api/projects/:projectId/scenes - Create a new scene
scenesRouter.post('/projects/:projectId/scenes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const project = await dbService.getProject(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    const parsed = createSceneSchema.parse(req.body);
    const existingScenes = await dbService.listScenesByProject(projectId);

    const costEstimate = calculateVeoCost(
      parsed.modelId || project.settings.defaultModelId,
      parsed.durationSeconds || project.settings.defaultDurationSeconds,
      parsed.resolution || project.settings.defaultResolution
    );

    const newScene: Scene = {
      id: uuidv4(),
      projectId,
      title: parsed.title || `Scene ${existingScenes.length + 1}`,
      orderIndex: parsed.orderIndex !== undefined ? parsed.orderIndex : existingScenes.length,
      prompt: parsed.prompt,
      negativePrompt: parsed.negativePrompt,
      cameraMovement: parsed.cameraMovement,
      lighting: parsed.lighting,
      visualStyle: parsed.visualStyle,
      aspectRatio: parsed.aspectRatio || project.settings.defaultAspectRatio,
      durationSeconds: parsed.durationSeconds || project.settings.defaultDurationSeconds,
      resolution: parsed.resolution || project.settings.defaultResolution,
      modelId: parsed.modelId || project.settings.defaultModelId,
      referenceImageBase64: parsed.referenceImageBase64,
      status: 'draft',
      estimatedCostUsd: costEstimate.estimatedCostUsd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveScene(newScene);
    await updateProjectSummary(projectId);

    res.status(201).json({ success: true, data: newScene });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/scenes/:id - Update scene parameters
scenesRouter.patch('/scenes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateSceneSchema.parse(req.body);
    const scene = await dbService.getScene(req.params.id);

    if (!scene) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scene not found' },
      });
      return;
    }

    if (parsed.title !== undefined) scene.title = parsed.title;
    if (parsed.prompt !== undefined) scene.prompt = parsed.prompt;
    if (parsed.negativePrompt !== undefined) scene.negativePrompt = parsed.negativePrompt;
    if (parsed.cameraMovement !== undefined) scene.cameraMovement = parsed.cameraMovement;
    if (parsed.lighting !== undefined) scene.lighting = parsed.lighting;
    if (parsed.visualStyle !== undefined) scene.visualStyle = parsed.visualStyle;
    if (parsed.aspectRatio !== undefined) scene.aspectRatio = parsed.aspectRatio;
    if (parsed.durationSeconds !== undefined) scene.durationSeconds = parsed.durationSeconds;
    if (parsed.resolution !== undefined) scene.resolution = parsed.resolution;
    if (parsed.modelId !== undefined) scene.modelId = parsed.modelId;
    if (parsed.referenceImageBase64 !== undefined) scene.referenceImageBase64 = parsed.referenceImageBase64;

    // Recalculate cost estimate
    const cost = calculateVeoCost(scene.modelId, scene.durationSeconds, scene.resolution);
    scene.estimatedCostUsd = cost.estimatedCostUsd;
    scene.updatedAt = new Date().toISOString();

    await dbService.saveScene(scene);
    await updateProjectSummary(scene.projectId);

    res.json({ success: true, data: scene });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:projectId/scenes/reorder - Reorder scenes
scenesRouter.post('/projects/:projectId/scenes/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { sceneIds } = reorderScenesSchema.parse(req.body);

    const scenes = await dbService.listScenesByProject(projectId);
    const sceneMap = new Map(scenes.map((s) => [s.id, s]));

    for (let i = 0; i < sceneIds.length; i++) {
      const scene = sceneMap.get(sceneIds[i]);
      if (scene) {
        scene.orderIndex = i;
        scene.updatedAt = new Date().toISOString();
        await dbService.saveScene(scene);
      }
    }

    const updatedScenes = await dbService.listScenesByProject(projectId);
    res.json({ success: true, data: updatedScenes });
  } catch (err) {
    next(err);
  }
});

// POST /api/scenes/:id/duplicate - Duplicate scene
scenesRouter.post('/scenes/:id/duplicate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const original = await dbService.getScene(req.params.id);
    if (!original) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scene not found' },
      });
      return;
    }

    const existingScenes = await dbService.listScenesByProject(original.projectId);

    const duplicated: Scene = {
      ...original,
      id: uuidv4(),
      title: `${original.title} (Copy)`,
      orderIndex: existingScenes.length,
      status: 'draft',
      jobId: undefined,
      videoStorageUri: undefined,
      playbackUrl: undefined,
      downloadUrl: undefined,
      errorMessage: undefined,
      actualCostUsd: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveScene(duplicated);
    await updateProjectSummary(original.projectId);

    res.status(201).json({ success: true, data: duplicated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/scenes/:id - Delete a scene
scenesRouter.delete('/scenes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scene = await dbService.getScene(req.params.id);
    if (!scene) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scene not found' },
      });
      return;
    }

    await dbService.deleteScene(scene.id);
    await updateProjectSummary(scene.projectId);

    res.json({ success: true, data: { deletedId: scene.id } });
  } catch (err) {
    next(err);
  }
});
