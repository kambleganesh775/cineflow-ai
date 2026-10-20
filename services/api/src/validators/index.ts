import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  settings: z
    .object({
      defaultModelId: z.string().default('veo-2.0-generate-001'),
      defaultAspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
      defaultResolution: z.enum(['720p', '1080p']).default('720p'),
      defaultDurationSeconds: z.number().int().min(5).max(8).default(5),
    })
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z
    .object({
      defaultModelId: z.string().optional(),
      defaultAspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
      defaultResolution: z.enum(['720p', '1080p']).optional(),
      defaultDurationSeconds: z.number().int().min(5).max(8).optional(),
    })
    .optional(),
});

export const createSceneSchema = z.object({
  title: z.string().min(1).max(100).default('New Scene'),
  orderIndex: z.number().int().nonnegative().optional(),
  prompt: z.string().min(1, 'Prompt is required').max(2000),
  negativePrompt: z.string().max(1000).optional(),
  cameraMovement: z.string().max(100).optional(),
  lighting: z.string().max(100).optional(),
  visualStyle: z.string().max(100).optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  durationSeconds: z.number().int().min(5).max(8).default(5),
  resolution: z.enum(['720p', '1080p']).default('720p'),
  modelId: z.string().default('veo-2.0-generate-001'),
  referenceImageBase64: z.string().optional(),
});

export const updateSceneSchema = createSceneSchema.partial();

export const reorderScenesSchema = z.object({
  sceneIds: z.array(z.string()).min(1),
});

export const generateSceneSchema = z.object({
  confirmedBillable: z.boolean().default(false),
});

export const generateAllScenesSchema = z.object({
  confirmedBillable: z.boolean().default(false),
  sceneIds: z.array(z.string()).optional(),
});

export const renderProjectSchema = z.object({
  sceneIds: z.array(z.string()).optional(),
});
