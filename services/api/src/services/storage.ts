import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

export class VideoStorageService {
  private storage: Storage | null = null;
  private bucketName: string;
  private isGcsAvailable = false;
  private localDir: string;

  constructor() {
    this.bucketName = config.googleCloudStorageBucket;
    this.localDir = path.resolve(config.localTempDir, 'storage');

    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }

    try {
      this.storage = new Storage({
        projectId: config.googleCloudProject,
      });
      this.isGcsAvailable = true;
    } catch (err) {
      console.warn('[Storage] Google Cloud Storage client init failed, using local storage fallback.', err);
      this.isGcsAvailable = false;
    }
  }

  /**
   * Generates a unique private storage path for a video clip or render
   */
  getStoragePath(projectId: string, sceneId: string, filename = 'output.mp4'): string {
    return `projects/${projectId}/scenes/${sceneId}/${Date.now()}_${filename}`;
  }

  getRenderStoragePath(projectId: string, filename = 'final_render.mp4'): string {
    return `projects/${projectId}/exports/${Date.now()}_${filename}`;
  }

  /**
   * Generates a temporary signed URL (default 60 minutes) for private playback or download
   */
  async getSignedUrl(storageUriOrPath: string, action: 'read' = 'read', expiresInMinutes = 60): Promise<string> {
    const cleanPath = storageUriOrPath.replace(`gs://${this.bucketName}/`, '').replace(/^\/+/, '');

    if (this.isGcsAvailable && this.storage) {
      try {
        const bucket = this.storage.bucket(this.bucketName);
        const file = bucket.file(cleanPath);
        const [url] = await file.getSignedUrl({
          version: 'v4',
          action,
          expires: Date.now() + expiresInMinutes * 60 * 1000,
        });
        return url;
      } catch (err) {
        console.warn(`[Storage] GCS getSignedUrl failed for ${cleanPath}, checking local fallback:`, err);
      }
    }

    // Local signed URL fallback
    return `${config.apiBaseUrl}/api/assets/stream?path=${encodeURIComponent(cleanPath)}&exp=${Date.now() + expiresInMinutes * 60 * 1000}`;
  }

  /**
   * Uploads a local file buffer or file path to private storage
   */
  async uploadFile(localFilePath: string, destinationPath: string, contentType = 'video/mp4'): Promise<string> {
    const cleanDest = destinationPath.replace(/^\/+/, '');

    if (this.isGcsAvailable && this.storage) {
      try {
        const bucket = this.storage.bucket(this.bucketName);
        await bucket.upload(localFilePath, {
          destination: cleanDest,
          metadata: {
            contentType,
            cacheControl: 'private, max-age=3600',
          },
        });
        return `gs://${this.bucketName}/${cleanDest}`;
      } catch (err) {
        console.warn(`[Storage] GCS upload failed for ${cleanDest}, saving locally:`, err);
      }
    }

    // Local fallback copy
    const targetLocalPath = path.resolve(this.localDir, cleanDest);
    fs.mkdirSync(path.dirname(targetLocalPath), { recursive: true });
    fs.copyFileSync(localFilePath, targetLocalPath);
    return `local://${cleanDest}`;
  }

  /**
   * Reads a file buffer from storage (for assembling final video)
   */
  async downloadToLocal(storageUriOrPath: string, localDestinationPath: string): Promise<string> {
    const cleanPath = storageUriOrPath.replace(`gs://${this.bucketName}/`, '').replace('local://', '').replace(/^\/+/, '');
    fs.mkdirSync(path.dirname(localDestinationPath), { recursive: true });

    // Check if it's already in local fallback storage
    const localSaved = path.resolve(this.localDir, cleanPath);
    if (fs.existsSync(localSaved)) {
      fs.copyFileSync(localSaved, localDestinationPath);
      return localDestinationPath;
    }

    if (this.isGcsAvailable && this.storage) {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(cleanPath);
      await file.download({ destination: localDestinationPath });
      return localDestinationPath;
    }

    throw new Error(`File not found in storage: ${storageUriOrPath}`);
  }

  getLocalFilePath(relativePath: string): string | null {
    const fullPath = path.resolve(this.localDir, relativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }
}

export const storageService = new VideoStorageService();
