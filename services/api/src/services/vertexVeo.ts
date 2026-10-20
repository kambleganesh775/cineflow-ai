import { GoogleAuth } from 'google-auth-library';
import { config } from '../config';
import { calculateVeoCost, Resolution, AspectRatio } from '@cineflow/shared';
import { storageService } from './storage';
import path from 'path';
import fs from 'fs';

export interface GenerateVeoParams {
  projectId: string;
  sceneId: string;
  prompt: string;
  negativePrompt?: string;
  cameraMovement?: string;
  lighting?: string;
  visualStyle?: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  resolution: Resolution;
  modelId: string;
  referenceImageBase64?: string;
  confirmedBillable: boolean;
}

export interface VeoOperationResult {
  done: boolean;
  operationName: string;
  videoStorageUri?: string;
  error?: string;
  progressPercent?: number;
}

export class VertexVeoService {
  private auth: GoogleAuth;
  private isAuthReady = false;

  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: config.googleCloudProject,
    });
  }

  /**
   * Diagnostic check: verifies whether Vertex AI Veo can be contacted
   */
  async checkVeoAvailability(): Promise<{
    available: boolean;
    project: string;
    location: string;
    modelId: string;
    authStatus: string;
    details?: string;
  }> {
    try {
      const client = await this.auth.getClient();
      const token = await client.getAccessToken();

      if (!token.token) {
        return {
          available: false,
          project: config.googleCloudProject,
          location: config.googleCloudLocation,
          modelId: config.veoModelId,
          authStatus: 'NO_TOKEN',
          details: 'Application Default Credentials did not return an access token. Run `gcloud auth application-default login`.',
        };
      }

      // Check model endpoint metadata
      const endpoint = `https://${config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config.googleCloudProject}/locations/${config.googleCloudLocation}/publishers/google/models/${config.veoModelId}`;
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      });

      if (res.status === 200) {
        return {
          available: true,
          project: config.googleCloudProject,
          location: config.googleCloudLocation,
          modelId: config.veoModelId,
          authStatus: 'AUTHENTICATED_AND_VERIFIED',
          details: 'Vertex AI Veo model endpoint is reachable and authorized.',
        };
      } else if (res.status === 403) {
        return {
          available: false,
          project: config.googleCloudProject,
          location: config.googleCloudLocation,
          modelId: config.veoModelId,
          authStatus: 'PERMISSION_DENIED',
          details: `HTTP 403: Vertex AI API may need to be enabled or Veo model access granted for project "${config.googleCloudProject}".`,
        };
      } else {
        const body = await res.text();
        return {
          available: false,
          project: config.googleCloudProject,
          location: config.googleCloudLocation,
          modelId: config.veoModelId,
          authStatus: `HTTP_${res.status}`,
          details: body,
        };
      }
    } catch (err: any) {
      return {
        available: false,
        project: config.googleCloudProject,
        location: config.googleCloudLocation,
        modelId: config.veoModelId,
        authStatus: 'ERROR',
        details: err.message,
      };
    }
  }

  /**
   * Starts a Veo video generation job using the official Vertex AI predictLongRunning endpoint
   */
  async startGeneration(params: GenerateVeoParams): Promise<{
    operationName: string;
    estimatedCostUsd: number;
    mocked?: boolean;
  }> {
    const costEstimate = calculateVeoCost(params.modelId, params.durationSeconds, params.resolution);

    // Safeguard: Billing confirmation is strictly required unless in mock mode
    if (config.requireBillingConfirmation && !params.confirmedBillable && !config.mockVertexAi) {
      throw new Error(
        `Billing confirmation required before generating video. Estimated cost: $${costEstimate.estimatedCostUsd} USD.`
      );
    }

    // MOCK MODE: For testing & development without billing Google Cloud
    if (config.mockVertexAi) {
      console.log(`[VertexVeo] Mock generation started for scene ${params.sceneId}`);
      return {
        operationName: `mock-op-${params.sceneId}-${Date.now()}`,
        estimatedCostUsd: costEstimate.estimatedCostUsd,
        mocked: true,
      };
    }

    // REAL VERTEX AI CALL
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();

    if (!token.token) {
      throw new Error('Google Cloud access token could not be acquired. Check Application Default Credentials.');
    }

    // Enrich prompt with stylistic controls
    let enrichedPrompt = params.prompt.trim();
    if (params.cameraMovement) {
      enrichedPrompt += `, camera movement: ${params.cameraMovement}`;
    }
    if (params.lighting) {
      enrichedPrompt += `, lighting: ${params.lighting}`;
    }
    if (params.visualStyle) {
      enrichedPrompt += `, visual style: ${params.visualStyle}`;
    }

    const instance: Record<string, any> = {
      prompt: enrichedPrompt,
    };

    if (params.referenceImageBase64) {
      // Clean data URI prefix if present
      const cleanB64 = params.referenceImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      instance.image = {
        bytesBase64Encoded: cleanB64,
      };
    }

    const payload = {
      instances: [instance],
      parameters: {
        sampleCount: 1,
        aspectRatio: params.aspectRatio,
        durationSeconds: params.durationSeconds,
        resolution: params.resolution,
        negativePrompt: params.negativePrompt || undefined,
        storageUri: `gs://${config.googleCloudStorageBucket}/projects/${params.projectId}/scenes/${params.sceneId}/`,
      },
    };

    const endpoint = `https://${config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config.googleCloudProject}/locations/${config.googleCloudLocation}/publishers/google/models/${params.modelId}:predictLongRunning`;

    console.log(`[VertexVeo] Invoking predictLongRunning for model ${params.modelId}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (_) {}

      const msg = errorJson?.error?.message || errorText;
      console.error(`[VertexVeo] API Error (${response.status}):`, msg);
      throw new Error(`Vertex AI Veo generation failed (${response.status}): ${msg}`);
    }

    const data = await response.json();
    if (!data.name) {
      throw new Error('Vertex AI response missing operation name: ' + JSON.stringify(data));
    }

    return {
      operationName: data.name,
      estimatedCostUsd: costEstimate.estimatedCostUsd,
    };
  }

  /**
   * Polls the long-running operation status
   */
  async pollOperation(operationName: string): Promise<VeoOperationResult> {
    // MOCK MODE POLLING
    if (operationName.startsWith('mock-op-')) {
      const elapsed = Date.now() - parseInt(operationName.split('-').pop() || '0', 10);
      if (elapsed < 3000) {
        return { done: false, operationName, progressPercent: 30 };
      }
      if (elapsed < 6000) {
        return { done: false, operationName, progressPercent: 70 };
      }

      // Generate a valid mock mp4 video using ffmpeg or a generated sample clip
      const samplePath = path.resolve(config.localTempDir, 'mock_sample.mp4');
      fs.mkdirSync(path.dirname(samplePath), { recursive: true });

      // If mock video doesn't exist, create an empty or simple valid mp4 placeholder
      if (!fs.existsSync(samplePath)) {
        fs.writeFileSync(samplePath, Buffer.from('MOCK_VIDEO_BINARY_DATA'));
      }

      const storageUri = `gs://${config.googleCloudStorageBucket}/mock/${operationName}.mp4`;
      return {
        done: true,
        operationName,
        videoStorageUri: storageUri,
        progressPercent: 100,
      };
    }

    // REAL POLLING
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();

    const endpoint = `https://${config.googleCloudLocation}-aiplatform.googleapis.com/v1/${operationName}`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token?.token}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to poll operation (${response.status}): ${errText}`);
    }

    const op = await response.json();

    if (!op.done) {
      return {
        done: false,
        operationName,
        progressPercent: op.metadata?.progressPercent || 50,
      };
    }

    if (op.error) {
      return {
        done: true,
        operationName,
        error: op.error.message || 'Generation operation failed',
      };
    }

    // Output video URI is in response.generatedSamples[0].video.uri
    const outputUri =
      op.response?.generatedSamples?.[0]?.video?.uri ||
      op.response?.videos?.[0]?.uri ||
      op.response?.outputUri;

    if (!outputUri) {
      return {
        done: true,
        operationName,
        error: 'Operation completed but no video URI was returned in response payload.',
      };
    }

    return {
      done: true,
      operationName,
      videoStorageUri: outputUri,
      progressPercent: 100,
    };
  }
}

export const vertexVeoService = new VertexVeoService();
