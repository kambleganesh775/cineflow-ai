import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root if available, otherwise current directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export interface AppConfig {
  port: number;
  apiBaseUrl: string;
  appBaseUrl: string;
  googleCloudProject: string;
  googleCloudLocation: string;
  googleCloudStorageBucket: string;
  firebaseProjectId: string;
  veoModelId: string;
  authorizedOwnerEmail: string;
  authMode: 'local_dev' | 'google_oauth' | 'google_iap';
  googleClientId?: string;
  maxSceneDurationSeconds: number;
  maxScenesPerProject: number;
  maxConcurrentJobs: number;
  requireBillingConfirmation: boolean;
  mockVertexAi: boolean;
  localTempDir: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || process.env.API_PORT || '4000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || 'promptwars-494613',
  googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  googleCloudStorageBucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'cineflow-ai-private-videos-promptwars-494613',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'promptwars-494613',
  veoModelId: process.env.VEO_MODEL_ID || 'veo-2.0-generate-001',
  authorizedOwnerEmail: (process.env.AUTHORIZED_OWNER_EMAIL || 'official.topanalytica@gmail.com').trim().toLowerCase(),
  authMode: (process.env.AUTH_MODE as any) || 'local_dev',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  maxSceneDurationSeconds: parseInt(process.env.MAX_SCENE_DURATION_SECONDS || '8', 10),
  maxScenesPerProject: parseInt(process.env.MAX_SCENES_PER_PROJECT || '20', 10),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),
  requireBillingConfirmation: process.env.REQUIRE_BILLING_CONFIRMATION !== 'false',
  mockVertexAi: process.env.MOCK_VERTEX_AI === 'true',
  localTempDir: process.env.LOCAL_TEMP_DIR || path.resolve(process.cwd(), 'temp_renders'),
};
