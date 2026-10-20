import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/firestore';
import { createProjectSchema, updateProjectSchema } from '../validators';
import { Project, DEFAULT_VEO_MODEL } from '@cineflow/shared';

export const projectsRouter = Router();

// GET /api/projects - List all projects for authenticated owner
projectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerEmail = req.user!.email;
    const projects = await dbService.listProjects(ownerEmail);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - Create a new project
projectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createProjectSchema.parse(req.body);
    const ownerEmail = req.user!.email;

    const project: Project = {
      id: uuidv4(),
      name: parsed.name.trim(),
      description: parsed.description?.trim(),
      ownerEmail,
      status: 'draft',
      settings: {
        defaultModelId: parsed.settings?.defaultModelId || DEFAULT_VEO_MODEL,
        defaultAspectRatio: parsed.settings?.defaultAspectRatio || '16:9',
        defaultResolution: parsed.settings?.defaultResolution || '720p',
        defaultDurationSeconds: parsed.settings?.defaultDurationSeconds || 5,
      },
      sceneCount: 0,
      totalDurationSeconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveProject(project);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - Get project by ID along with its scenes
projectsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await dbService.getProject(req.params.id);
    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    const scenes = await dbService.listScenesByProject(project.id);
    res.json({
      success: true,
      data: {
        ...project,
        scenes,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:id - Update project name/description/settings
projectsRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateProjectSchema.parse(req.body);
    const project = await dbService.getProject(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    if (parsed.name) project.name = parsed.name.trim();
    if (parsed.description !== undefined) project.description = parsed.description.trim();
    if (parsed.settings) {
      project.settings = {
        ...project.settings,
        ...parsed.settings,
      };
    }
    project.updatedAt = new Date().toISOString();

    await dbService.saveProject(project);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id - Delete project and all associated scenes
projectsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await dbService.getProject(req.params.id);
    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    await dbService.deleteProject(project.id);
    res.json({ success: true, data: { deletedId: project.id } });
  } catch (err) {
    next(err);
  }
});
