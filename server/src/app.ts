
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import {
  VerificationService,
  type VerificationServiceDependencies,
} from './verification/service.ts';

import { createApiRouter } from './routes/api.ts';
import { errorHandler } from './middleware/errorHandler.ts';

export interface CreateAppOptions {
  enableRateLimit?: boolean;
  rateLimitMax?: number;
  corsOrigin?: string;
}

export function createApp(
  deps: VerificationServiceDependencies = {},
  options: CreateAppOptions = {}
): { app: Express; service: VerificationService } {
  const app = express();
  const service = new VerificationService(deps);

  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Production should provide an explicit frontend origin.
  // Development can continue using the existing localhost setup.
  const corsOrigin =
    options.corsOrigin ??
    process.env.CORS_ORIGIN ??
    'http://localhost:3000';

  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '64kb' }));

  if (options.enableRateLimit !== false) {
    const checkLimiter = rateLimit({
      windowMs: 60 * 1000,
      limit: options.rateLimitMax ?? 15,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          ok: false,
          error: {
            code: 'RATE_LIMITED',
            message:
              'Too many verification requests from this IP. Please try again after 60 seconds.',
          },
        });
      },
    });

    app.use('/api/check', checkLimiter);
  }

  app.use('/api', createApiRouter(service));

  // Consistent JSON response for requests to unknown endpoints.
  app.use((_req, res) => {
    res.status(404).json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint was not found',
      },
    });
  });

  // Error middleware must remain last.
  app.use(errorHandler);

  return { app, service };
}
