import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';
import path from 'path';
import { Project, Scene, GenerationJob, RenderJob } from '@cineflow/shared';
import { config } from '../config';

interface LocalDatabase {
  projects: Record<string, Project>;
  scenes: Record<string, Scene>;
  jobs: Record<string, GenerationJob>;
  renders: Record<string, RenderJob>;
}

export class DatabaseService {
  private firestore: Firestore | null = null;
  private isFirestoreAvailable = false;
  private localDbFile: string;
  private memoryDb: LocalDatabase = {
    projects: {},
    scenes: {},
    jobs: {},
    renders: {},
  };

  constructor() {
    this.localDbFile = path.resolve(config.localTempDir, 'local_db.json');
    this.loadLocalDb();

    try {
      this.firestore = new Firestore({
        projectId: config.firebaseProjectId,
      });
      // Test firestore ping asynchronously
      this.firestore
        .listCollections()
        .then(() => {
          this.isFirestoreAvailable = true;
          console.log('[Firestore] Successfully connected to Google Cloud Firestore.');
        })
        .catch((err) => {
          console.warn('[Firestore] Falling back to file-backed local database (no live Firestore connection):', err.message);
          this.isFirestoreAvailable = false;
        });
    } catch (err: any) {
      console.warn('[Firestore] Initialization error, using persistent local DB:', err.message);
      this.isFirestoreAvailable = false;
    }
  }

  private loadLocalDb() {
    try {
      if (fs.existsSync(this.localDbFile)) {
        const raw = fs.readFileSync(this.localDbFile, 'utf8');
        this.memoryDb = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[LocalDB] Could not load existing local db file, initializing empty:', err);
    }
  }

  private persistLocalDb() {
    try {
      fs.mkdirSync(path.dirname(this.localDbFile), { recursive: true });
      fs.writeFileSync(this.localDbFile, JSON.stringify(this.memoryDb, null, 2), 'utf8');
    } catch (err) {
      console.error('[LocalDB] Failed to persist local DB to disk:', err);
    }
  }

  // --- PROJECTS ---

  async listProjects(ownerEmail: string): Promise<Project[]> {
    if (this.isFirestoreAvailable && this.firestore) {
      try {
        const snapshot = await this.firestore
          .collection('projects')
          .where('ownerEmail', '==', ownerEmail.toLowerCase())
          .orderBy('updatedAt', 'desc')
          .get();
        return snapshot.docs.map((doc) => doc.data() as Project);
      } catch (err) {
        console.warn('[Firestore] listProjects error, using memory fallback:', err);
      }
    }

    return Object.values(this.memoryDb.projects)
      .filter((p) => p.ownerEmail.toLowerCase() === ownerEmail.toLowerCase())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getProject(id: string): Promise<Project | null> {
    if (this.isFirestoreAvailable && this.firestore) {
      try {
        const doc = await this.firestore.collection('projects').doc(id).get();
        if (doc.exists) return doc.data() as Project;
      } catch (err) {
        console.warn('[Firestore] getProject error, using memory fallback:', err);
      }
    }
    return this.memoryDb.projects[id] || null;
  }

  async saveProject(project: Project): Promise<void> {
    this.memoryDb.projects[project.id] = project;
    this.persistLocalDb();

    if (this.isFirestoreAvailable && this.firestore) {
      try {
        await this.firestore.collection('projects').doc(project.id).set(project, { merge: true });
      } catch (err) {
        console.warn('[Firestore] saveProject error:', err);
      }
    }
  }

  async deleteProject(id: string): Promise<void> {
    delete this.memoryDb.projects[id];
    // Also remove scenes belonging to this project
    for (const [sceneId, scene] of Object.entries(this.memoryDb.scenes)) {
      if (scene.projectId === id) {
        delete this.memoryDb.scenes[sceneId];
      }
    }
    this.persistLocalDb();

    if (this.isFirestoreAvailable && this.firestore) {
      try {
        await this.firestore.collection('projects').doc(id).delete();
      } catch (err) {
        console.warn('[Firestore] deleteProject error:', err);
      }
    }
  }

  // --- SCENES ---

  async listScenesByProject(projectId: string): Promise<Scene[]> {
    if (this.isFirestoreAvailable && this.firestore) {
      try {
        const snapshot = await this.firestore
          .collection('scenes')
          .where('projectId', '==', projectId)
          .orderBy('orderIndex', 'asc')
          .get();
        return snapshot.docs.map((doc) => doc.data() as Scene);
      } catch (err) {
        console.warn('[Firestore] listScenes error, using memory fallback:', err);
      }
    }

    return Object.values(this.memoryDb.scenes)
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getScene(id: string): Promise<Scene | null> {
    if (this.isFirestoreAvailable && this.firestore) {
      try {
        const doc = await this.firestore.collection('scenes').doc(id).get();
        if (doc.exists) return doc.data() as Scene;
      } catch (err) {
        console.warn('[Firestore] getScene error, using memory fallback:', err);
      }
    }
    return this.memoryDb.scenes[id] || null;
  }

  async saveScene(scene: Scene): Promise<void> {
    this.memoryDb.scenes[scene.id] = scene;
    this.persistLocalDb();

    if (this.isFirestoreAvailable && this.firestore) {
      try {
        await this.firestore.collection('scenes').doc(scene.id).set(scene, { merge: true });
      } catch (err) {
        console.warn('[Firestore] saveScene error:', err);
      }
    }
  }

  async deleteScene(id: string): Promise<void> {
    delete this.memoryDb.scenes[id];
    this.persistLocalDb();

    if (this.isFirestoreAvailable && this.firestore) {
      try {
        await this.firestore.collection('scenes').doc(id).delete();
      } catch (err) {
        console.warn('[Firestore] deleteScene error:', err);
      }
    }
  }

  // --- GENERATION JOBS ---

  async saveJob(job: GenerationJob): Promise<void> {
    this.memoryDb.jobs[job.id] = job;
    this.persistLocalDb();

    if (this.isFirestoreAvailable && this.firestore) {
      try {
        await this.firestore.collection('jobs').doc(job.id).set(job, { merge: true });
      } catch (err) {
        console.warn('[Firestore] saveJob error:', err);
      }
    }
  }

  async getJob(id: string): Promise<GenerationJob | null> {
    if (this.isFirestoreAvailable && this.firestore) {
      try {
        const doc = await this.firestore.collection('jobs').doc(id).get();
        if (doc.exists) return doc.data() as GenerationJob;
      } catch (err) {
        console.warn('[Firestore] getJob error, using memory fallback:', err);
      }
    }
    return this.memoryDb.jobs[id] || null;
  }

  async listJobsByProject(projectId: string): Promise<GenerationJob[]> {
    if (this.isFirestoreAvailable && this.firestore) {
      try {
        const snapshot = await this.firestore
          .collection('jobs')
          .where('projectId', '==', projectId)
          .orderBy('createdAt', 'desc')
          .get();
        return snapshot.docs.map((doc) => doc.data() as GenerationJob);
      } catch (err) {
        console.warn('[Firestore] listJobs error, using memory fallback:', err);
      }
    }

    return Object.values(this.memoryDb.jobs)
      .filter((j) => j.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- RENDER JOBS ---

  async saveRenderJob(render: RenderJob): Promise<void> {
    this.memoryDb.renders[render.id] = render;
    this.persistLocalDb();

    if (this.isFirestoreAvailable && this.firestore) {
      try {
        await this.firestore.collection('renders').doc(render.id).set(render, { merge: true });
      } catch (err) {
        console.warn('[Firestore] saveRenderJob error:', err);
      }
    }
  }

  async getRenderJob(id: string): Promise<RenderJob | null> {
    if (this.isFirestoreAvailable && this.firestore) {
      try {
        const doc = await this.firestore.collection('renders').doc(id).get();
        if (doc.exists) return doc.data() as RenderJob;
      } catch (err) {
        console.warn('[Firestore] getRenderJob error, using memory fallback:', err);
      }
    }
    return this.memoryDb.renders[id] || null;
  }
}

export const dbService = new DatabaseService();
