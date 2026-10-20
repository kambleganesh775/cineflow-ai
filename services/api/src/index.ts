import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { standardRateLimiter } from './middleware/rateLimiter';
import { projectsRouter } from './routes/projects';
import { scenesRouter } from './routes/scenes';
import { jobsRouter } from './routes/jobs';
import { renderRouter } from './routes/render';
import { costRouter } from './routes/cost';
import { authRouter } from './routes/auth';
import { assetsRouter } from './routes/assets';

export const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Handled by Next.js in production
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration - only allow requests from frontend app
app.use(
  cors({
    origin: [config.appBaseUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

// JSON body parser with increased limit for base64 reference image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Unauthenticated health check for Cloud Run liveness probe
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cineflow-api',
    authMode: config.authMode,
    owner: config.authorizedOwnerEmail,
    timestamp: new Date().toISOString(),
  });
});

// Stream endpoint handles its own signature verification
app.use('/api/assets', assetsRouter);

// Apply rate limiting and authentication to all protected routes
app.use('/api', standardRateLimiter);
app.use('/api/auth', requireAuth, authRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api', requireAuth, scenesRouter);
app.use('/api', requireAuth, jobsRouter);
app.use('/api', requireAuth, renderRouter);
app.use('/api/cost', requireAuth, costRouter);

// Central error handler
app.use(errorHandler);

// Start server if not running inside test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🎬 CineFlow AI API Service running on port ${config.port}`);
    console.log(`🔒 Strictly Private Mode: Authorized Owner -> ${config.authorizedOwnerEmail}`);
    console.log(`🛡️ Auth Mode: ${config.authMode}`);
    console.log(`📹 Veo Model: ${config.veoModelId} in ${config.googleCloudLocation}`);
    console.log(`☁️ Cloud Storage: ${config.googleCloudStorageBucket}`);
    console.log(`=======================================================`);
  });
}
