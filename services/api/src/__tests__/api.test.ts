import request from 'supertest';
import { app } from '../index';
import { config } from '../config';

describe('CineFlow AI — Security, Auth & API Tests', () => {
  let createdProjectId = '';
  let createdSceneId = '';

  it('GET /api/health - Public health check returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('cineflow-api');
    expect(res.body.owner).toBe(config.authorizedOwnerEmail);
  });

  it('Strict Owner Access: In local_dev mode, requests identify as the authorized owner', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAuthorizedOwner).toBe(true);
    expect(res.body.data.user.email.toLowerCase()).toBe(config.authorizedOwnerEmail.toLowerCase());
  });

  it('POST /api/projects - Creates a new cinematic project with defaults', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        name: 'Neo-Tokyo Noir',
        description: 'A cyberpunk thriller project set in rainy futuristic alleys',
        settings: {
          defaultModelId: 'veo-2.0-generate-001',
          defaultAspectRatio: '16:9',
          defaultResolution: '720p',
          defaultDurationSeconds: 5,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Neo-Tokyo Noir');
    expect(res.body.data.id).toBeDefined();
    createdProjectId = res.body.data.id;
  });

  it('GET /api/projects - Lists owner projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((p: any) => p.id === createdProjectId);
    expect(found).toBeDefined();
  });

  it('POST /api/projects/:id/scenes - Adds a new scene with style and camera parameters', async () => {
    const res = await request(app)
      .post(`/api/projects/${createdProjectId}/scenes`)
      .send({
        title: 'Opening Rain Shot',
        prompt: 'A hooded figure walks through neon-lit streets reflected in puddle ripples.',
        negativePrompt: 'blurry, cartoon, low resolution',
        cameraMovement: 'Low Angle Tracking',
        lighting: 'Cyberpunk Neon Ambient',
        visualStyle: 'Cinematic Photorealistic 35mm',
        aspectRatio: '16:9',
        durationSeconds: 5,
        resolution: '720p',
        modelId: 'veo-2.0-generate-001',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Opening Rain Shot');
    expect(res.body.data.estimatedCostUsd).toBeGreaterThan(0);
    createdSceneId = res.body.data.id;
  });

  it('GET /api/cost/projects/:id/estimate - Returns accurate scene cost breakdown', async () => {
    const res = await request(app).get(`/api/cost/projects/${createdProjectId}/estimate`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sceneCount).toBe(1);
    expect(res.body.data.totalEstimatedCostUsd).toBeGreaterThan(0);
    expect(res.body.data.scenesBreakdown.length).toBe(1);
  });

  it('POST /api/scenes/:id/generate - Rejects billable generation if confirmedBillable is false', async () => {
    // Temporarily ensure mock mode is off for this test to verify protection
    const originalMock = config.mockVertexAi;
    config.mockVertexAi = false;

    const res = await request(app)
      .post(`/api/scenes/${createdSceneId}/generate`)
      .send({ confirmedBillable: false });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Billing confirmation required');

    config.mockVertexAi = originalMock;
  });

  it('POST /api/scenes/:id/generate - Successfully queues generation with confirmation', async () => {
    const originalMock = config.mockVertexAi;
    config.mockVertexAi = true; // Use mock mode for automated test

    const res = await request(app)
      .post(`/api/scenes/${createdSceneId}/generate`)
      .send({ confirmedBillable: true });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('queued');
    expect(res.body.data.sceneId).toBe(createdSceneId);

    config.mockVertexAi = originalMock;
  });

  it('GET /api/cost/diagnostic - Returns credits verification checklist & Veo diagnostic', async () => {
    const res = await request(app).get('/api/cost/diagnostic');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gcpProject).toBe(config.googleCloudProject);
    expect(res.body.data.instructions.length).toBeGreaterThan(0);
  });

  it('DELETE /api/projects/:id - Cleans up project and associated data', async () => {
    const res = await request(app).delete(`/api/projects/${createdProjectId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(`/api/projects/${createdProjectId}`);
    expect(getRes.status).toBe(404);
  });
});
