import {
  Project,
  Scene,
  GenerationJob,
  RenderJob,
  ProjectCostSummary,
  VeoModelMeta,
  UserIdentity,
} from '@cineflow/shared';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    const errorMsg = json?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return json.data as T;
}

export const api = {
  // Auth
  async getAuthStatus(): Promise<{
    user: UserIdentity | null;
    authMode: string;
    authorizedOwnerEmail: string;
    isAuthorizedOwner: boolean;
  }> {
    return fetchJson(`${API_BASE}/auth/me`);
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return fetchJson<Project[]>(`${API_BASE}/projects`);
  },

  async getProject(id: string): Promise<Project & { scenes: Scene[] }> {
    return fetchJson<Project & { scenes: Scene[] }>(`${API_BASE}/projects/${id}`);
  },

  async createProject(data: {
    name: string;
    description?: string;
    settings?: Partial<Project['settings']>;
  }): Promise<Project> {
    return fetchJson<Project>(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(
    id: string,
    data: { name?: string; description?: string; settings?: Partial<Project['settings']> }
  ): Promise<Project> {
    return fetchJson<Project>(`${API_BASE}/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string): Promise<{ deletedId: string }> {
    return fetchJson<{ deletedId: string }>(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Scenes
  async createScene(
    projectId: string,
    data: Partial<Scene> & { prompt: string }
  ): Promise<Scene> {
    return fetchJson<Scene>(`${API_BASE}/projects/${projectId}/scenes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateScene(sceneId: string, data: Partial<Scene>): Promise<Scene> {
    return fetchJson<Scene>(`${API_BASE}/scenes/${sceneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async duplicateScene(sceneId: string): Promise<Scene> {
    return fetchJson<Scene>(`${API_BASE}/scenes/${sceneId}/duplicate`, {
      method: 'POST',
    });
  },

  async deleteScene(sceneId: string): Promise<{ deletedId: string }> {
    return fetchJson<{ deletedId: string }>(`${API_BASE}/scenes/${sceneId}`, {
      method: 'DELETE',
    });
  },

  async reorderScenes(projectId: string, sceneIds: string[]): Promise<Scene[]> {
    return fetchJson<Scene[]>(`${API_BASE}/projects/${projectId}/scenes/reorder`, {
      method: 'POST',
      body: JSON.stringify({ sceneIds }),
    });
  },

  // Generation & Jobs
  async generateScene(sceneId: string, confirmedBillable: boolean): Promise<GenerationJob> {
    return fetchJson<GenerationJob>(`${API_BASE}/scenes/${sceneId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ confirmedBillable }),
    });
  },

  async generateAllScenes(
    projectId: string,
    confirmedBillable: boolean,
    sceneIds?: string[]
  ): Promise<{ queuedCount: number; jobs: GenerationJob[] }> {
    return fetchJson<{ queuedCount: number; jobs: GenerationJob[] }>(
      `${API_BASE}/projects/${projectId}/generate-all`,
      {
        method: 'POST',
        body: JSON.stringify({ confirmedBillable, sceneIds }),
      }
    );
  },

  async getJobs(projectId: string): Promise<GenerationJob[]> {
    return fetchJson<GenerationJob[]>(`${API_BASE}/jobs?projectId=${encodeURIComponent(projectId)}`);
  },

  async getJob(jobId: string): Promise<GenerationJob> {
    return fetchJson<GenerationJob>(`${API_BASE}/jobs/${jobId}`);
  },

  async retryJob(jobId: string): Promise<GenerationJob> {
    return fetchJson<GenerationJob>(`${API_BASE}/jobs/${jobId}/retry`, {
      method: 'POST',
    });
  },

  // Render & Assembly
  async renderProject(projectId: string, sceneIds?: string[]): Promise<RenderJob> {
    return fetchJson<RenderJob>(`${API_BASE}/projects/${projectId}/render`, {
      method: 'POST',
      body: JSON.stringify({ sceneIds }),
    });
  },

  async getRenderJob(projectId: string, renderId: string): Promise<RenderJob> {
    return fetchJson<RenderJob>(`${API_BASE}/projects/${projectId}/render/${renderId}`);
  },

  // Cost & Credits
  async getCostModels(): Promise<{
    defaultModel: string;
    models: VeoModelMeta[];
    pricingNotes: string;
  }> {
    return fetchJson(`${API_BASE}/cost/models`);
  },

  async getProjectCostEstimate(projectId: string): Promise<ProjectCostSummary> {
    return fetchJson<ProjectCostSummary>(`${API_BASE}/cost/projects/${projectId}/estimate`);
  },

  async getCreditsDiagnostic(): Promise<{
    gcpProject: string;
    location: string;
    authorizedOwner: string;
    mockMode: boolean;
    requireBillingConfirmation: boolean;
    veoConnectivity: {
      available: boolean;
      authStatus: string;
      details?: string;
    };
    instructions: string[];
  }> {
    return fetchJson(`${API_BASE}/cost/diagnostic`);
  },

  // Assets upload
  async uploadReferenceImage(file: File): Promise<{ dataUri: string; mimeType: string; size: number }> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/assets/upload-image`, {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Image upload failed');
    }
    return json.data;
  },
};
