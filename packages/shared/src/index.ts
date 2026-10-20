/**
 * CineFlow AI — Shared Definitions, Types, and Constants
 * Strictly Private Personal AI Video Studio
 */

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Resolution = '720p' | '1080p';
export type SceneStatus = 'draft' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ProjectStatus = 'draft' | 'ready' | 'rendering' | 'completed';

export interface VeoModelMeta {
  id: string;
  name: string;
  version: string;
  description: string;
  costPerSecond720pUsd: number;
  costPerSecond1080pUsd: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  supportedAspectRatios: AspectRatio[];
  supportedResolutions: Resolution[];
  supportsImageToVideo: boolean;
}

export const VEO_MODELS: Record<string, VeoModelMeta> = {
  'veo-2.0-generate-001': {
    id: 'veo-2.0-generate-001',
    name: 'Veo 2.0 (High Cinematic Quality)',
    version: '2.0',
    description: 'Google Vertex AI Veo 2 production video generation model with cinematic motion and realism.',
    costPerSecond720pUsd: 0.15,
    costPerSecond1080pUsd: 0.30,
    minDurationSeconds: 5,
    maxDurationSeconds: 8,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['720p', '1080p'],
    supportsImageToVideo: true,
  },
  'veo-3.0-generate-001': {
    id: 'veo-3.0-generate-001',
    name: 'Veo 3.0 / 3.1 (Next-Gen)',
    version: '3.0',
    description: 'Advanced temporal coherence, nuanced lighting, and audio-reactive framing support.',
    costPerSecond720pUsd: 0.20,
    costPerSecond1080pUsd: 0.40,
    minDurationSeconds: 5,
    maxDurationSeconds: 8,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['720p', '1080p'],
    supportsImageToVideo: true,
  },
};

export const DEFAULT_VEO_MODEL = 'veo-2.0-generate-001';

export const CAMERA_MOVEMENTS = [
  'Static (Fixed Camera)',
  'Slow Pan Left',
  'Slow Pan Right',
  'Smooth Tilt Up',
  'Smooth Tilt Down',
  'Slow Zoom In',
  'Slow Zoom Out',
  'Dolly Forward',
  'Dolly Backward',
  'Cinematic Drone Orbit',
  'Low Angle Tracking',
  'Handheld Subtle Jitter',
  'FPV High-Speed Flythrough'
] as const;

export const LIGHTING_STYLES = [
  'Golden Hour Sunlight',
  'Cyberpunk Neon Ambient',
  'Moody Noir High Contrast',
  'Soft Diffused Studio Key',
  'Overcast Dramatic Skies',
  'Ethereal Moonlight',
  'Bioluminescent Glow',
  'Warm Candlelight',
  'Volumetric Fog & God Rays'
] as const;

export const VISUAL_STYLES = [
  'Cinematic Photorealistic 35mm',
  'Anamorphic Film Grain',
  'Hyperrealistic IMAX Nature',
  'Sci-Fi Blade Runner Aesthetic',
  'Vintage 1970s Kodachrome',
  'Atmospheric Anime Film Style',
  'Abstract Surrealist Art'
] as const;

export interface ProjectSettings {
  defaultModelId: string;
  defaultAspectRatio: AspectRatio;
  defaultResolution: Resolution;
  defaultDurationSeconds: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerEmail: string;
  status: ProjectStatus;
  settings: ProjectSettings;
  sceneCount: number;
  totalDurationSeconds: number;
  thumbnailUrl?: string;
  finalRenderUrl?: string;
  finalRenderStorageUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  prompt: string;
  negativePrompt?: string;
  cameraMovement?: string;
  lighting?: string;
  visualStyle?: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  resolution: Resolution;
  modelId: string;
  referenceImageUrl?: string;
  referenceImageBase64?: string;
  status: SceneStatus;
  jobId?: string;
  videoStorageUri?: string;
  playbackUrl?: string;
  downloadUrl?: string;
  errorMessage?: string;
  estimatedCostUsd: number;
  actualCostUsd?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJob {
  id: string;
  sceneId: string;
  projectId: string;
  status: SceneStatus;
  progressPercent: number;
  modelId: string;
  operationName?: string;
  videoStorageUri?: string;
  playbackUrl?: string;
  downloadUrl?: string;
  errorMessage?: string;
  estimatedCostUsd: number;
  actualCostUsd?: number;
  confirmedBillable: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  sceneIds: string[];
  progressPercent: number;
  outputStorageUri?: string;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CostEstimate {
  modelId: string;
  durationSeconds: number;
  resolution: Resolution;
  ratePerSecondUsd: number;
  estimatedCostUsd: number;
}

export interface ProjectCostSummary {
  sceneCount: number;
  totalDurationSeconds: number;
  totalEstimatedCostUsd: number;
  scenesBreakdown: {
    sceneId: string;
    title: string;
    durationSeconds: number;
    resolution: Resolution;
    costUsd: number;
    status: SceneStatus;
  }[];
}

export interface UserIdentity {
  email: string;
  name?: string;
  picture?: string;
  isAuthorizedOwner: boolean;
}

export interface OmniStoryboardRequest {
  projectId: string;
  concept: string;
  genre?: string;
  sceneCount?: number;
  aspectRatio?: AspectRatio;
}

export interface OmniGeneratedScene {
  title: string;
  prompt: string;
  negativePrompt?: string;
  cameraMovement: string;
  lighting: string;
  visualStyle: string;
  durationSeconds: number;
}

export interface OmniStoryboardResult {
  title: string;
  synopsis: string;
  scenes: OmniGeneratedScene[];
}

export interface OmniEnhancePromptRequest {
  prompt: string;
  cameraMovement?: string;
  lighting?: string;
  visualStyle?: string;
}

export interface OmniEnhancePromptResult {
  enhancedPrompt: string;
  suggestedCamera: string;
  suggestedLighting: string;
  suggestedStyle: string;
}

/**
 * Calculates the estimated cost in USD for a given Veo generation request
 */
export function calculateVeoCost(
  modelId: string,
  durationSeconds: number,
  resolution: Resolution
): CostEstimate {
  const model = VEO_MODELS[modelId] || VEO_MODELS[DEFAULT_VEO_MODEL];
  const rate = resolution === '1080p' ? model.costPerSecond1080pUsd : model.costPerSecond720pUsd;
  const estimatedCostUsd = parseFloat((durationSeconds * rate).toFixed(2));
  return {
    modelId: model.id,
    durationSeconds,
    resolution,
    ratePerSecondUsd: rate,
    estimatedCostUsd
  };
}
