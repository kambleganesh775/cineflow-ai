import { Router, Request, Response, NextFunction } from 'express';
import { dbService } from '../services/firestore';
import { vertexVeoService } from '../services/vertexVeo';
import {
  VEO_MODELS,
  calculateVeoCost,
  ProjectCostSummary,
} from '@cineflow/shared';
import { config } from '../config';

export const costRouter = Router();

// GET /api/cost/models - List supported Veo models and pricing rates
costRouter.get('/models', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      defaultModel: config.veoModelId,
      models: Object.values(VEO_MODELS),
      pricingNotes:
        'Official Vertex AI pricing: Charged strictly per second of generated output video. Failed/filtered attempts are not billed.',
    },
  });
});

// GET /api/cost/projects/:id/estimate - Calculate cost breakdown for a project
costRouter.get('/projects/:id/estimate', async (req: Request, res: Response, next: NextFunction) => {
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

    let totalDurationSeconds = 0;
    let totalEstimatedCostUsd = 0;

    const scenesBreakdown = scenes.map((scene) => {
      const estimate = calculateVeoCost(scene.modelId, scene.durationSeconds, scene.resolution);
      totalDurationSeconds += scene.durationSeconds;
      totalEstimatedCostUsd += estimate.estimatedCostUsd;

      return {
        sceneId: scene.id,
        title: scene.title,
        durationSeconds: scene.durationSeconds,
        resolution: scene.resolution,
        costUsd: estimate.estimatedCostUsd,
        status: scene.status,
      };
    });

    const summary: ProjectCostSummary = {
      sceneCount: scenes.length,
      totalDurationSeconds,
      totalEstimatedCostUsd: parseFloat(totalEstimatedCostUsd.toFixed(2)),
      scenesBreakdown,
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/cost/diagnostic - Google Cloud Credits verification & Vertex AI Veo access diagnostic
costRouter.get('/diagnostic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const veoStatus = await vertexVeoService.checkVeoAvailability();

    const creditGuidance = {
      gcpProject: config.googleCloudProject,
      location: config.googleCloudLocation,
      authorizedOwner: config.authorizedOwnerEmail,
      mockMode: config.mockVertexAi,
      requireBillingConfirmation: config.requireBillingConfirmation,
      veoConnectivity: veoStatus,
      instructions: [
        '1. Check your Google Cloud credit balance: Visit https://console.cloud.google.com/billing/ and inspect your active promotional credits.',
        '2. Verify Credit Expiration Date: Confirm that your $300 trial credits are active and have not expired before running long generations.',
        '3. Check Vertex AI Eligibility: Google Cloud Free Trial and Startup credits cover eligible Google Cloud Platform services including Vertex AI. However, always review the promotion terms in your Billing account overview.',
        '4. Vertex AI Model Quota: Confirm that "Veo / Video Generation requests per minute" quota is approved in Cloud Console > IAM & Admin > Quotas.',
        '5. Safe Testing: Start with a single 5-second 720p scene (~$0.75 - $1.00 USD) and inspect the Google Cloud Billing reports tab within 2-4 hours to confirm promotional credits are offsetting the charges.',
      ],
    };

    res.json({ success: true, data: creditGuidance });
  } catch (err) {
    next(err);
  }
});
