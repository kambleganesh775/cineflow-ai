import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/firestore';
import { omniDirectorService } from '../services/omniDirector';
import { calculateVeoCost, Scene } from '@cineflow/shared';

export const omniRouter = Router();

// POST /api/omni/storyboard - Generate multi-scene storyboard from story concept
omniRouter.post('/storyboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, concept, genre, sceneCount, applyToProject, omniModelId, videoModelId } = req.body;

    if (!concept || typeof concept !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Concept string is required.' },
      });
      return;
    }

    const storyboard = await omniDirectorService.generateStoryboard(
      concept.trim(),
      genre || 'Cinematic Sci-Fi',
      sceneCount ? parseInt(sceneCount, 10) : 4,
      omniModelId
    );

    // If applyToProject is true and projectId is given, append these scenes to the project directly!
    let createdScenes: Scene[] = [];
    if (applyToProject && projectId) {
      const project = await dbService.getProject(projectId);
      if (project) {
        const existingScenes = await dbService.listScenesByProject(projectId);
        let startIndex = existingScenes.length;
        const targetModelId = videoModelId || project.settings.defaultModelId;

        for (const genScene of storyboard.scenes) {
          const cost = calculateVeoCost(
            targetModelId,
            genScene.durationSeconds,
            project.settings.defaultResolution
          );

          const newScene: Scene = {
            id: uuidv4(),
            projectId,
            title: genScene.title,
            orderIndex: startIndex++,
            prompt: genScene.prompt,
            negativePrompt: genScene.negativePrompt,
            cameraMovement: genScene.cameraMovement,
            lighting: genScene.lighting,
            visualStyle: genScene.visualStyle,
            aspectRatio: project.settings.defaultAspectRatio,
            durationSeconds: genScene.durationSeconds,
            resolution: project.settings.defaultResolution,
            modelId: targetModelId,
            status: 'draft',
            estimatedCostUsd: cost.estimatedCostUsd,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await dbService.saveScene(newScene);
          createdScenes.push(newScene);
        }

        // Update project summary
        const allScenes = await dbService.listScenesByProject(projectId);
        project.sceneCount = allScenes.length;
        project.totalDurationSeconds = allScenes.reduce((acc, s) => acc + s.durationSeconds, 0);
        project.updatedAt = new Date().toISOString();
        await dbService.saveProject(project);
      }
    }

    res.json({
      success: true,
      data: {
        storyboard,
        createdScenes,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/omni/enhance - Enhance a prompt with cinematic terminology
omniRouter.post('/enhance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, cameraMovement, lighting, visualStyle, omniModelId } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Prompt string is required.' },
      });
      return;
    }

    const enhanced = await omniDirectorService.enhancePrompt(
      prompt.trim(),
      cameraMovement,
      lighting,
      visualStyle,
      omniModelId
    );

    res.json({
      success: true,
      data: enhanced,
    });
  } catch (err) {
    next(err);
  }
});
