
import { Router } from 'express';
import { z } from 'zod';
import { VerificationService } from '../verification/service.ts';
import { normalizeAndDeduplicate } from '../verification/syntax.ts';
import { AppError } from '../middleware/errorHandler.ts';

const checkOptionsSchema = z
  .object({
    domainAuth: z.boolean().optional(),
  })
  .strict();

const checkRequestSchema = z
  .object({
    emails: z
      .array(z.string())
      .min(1, 'At least one email address must be provided'),
    options: checkOptionsSchema.optional(),
  })
  .strict();

export function createApiRouter(
  service: VerificationService
): Router {
  const router = Router();
  const config = service.getConfig();

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      data: {
        status: 'healthy',
      },
    });
  });

  router.get('/config', (_req, res) => {
    res.json({
      ok: true,
      data: {
        maxBatch: config.maxBatch,
        smtpEnabled: config.smtpEnabled,
        domainAuthEnabled: config.domainAuthEnabled ?? true,
      },
    });
  });

  router.post('/check', async (req, res, next) => {
    try {
      const parsed = checkRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        const issue = parsed.error.issues[0];

        throw new AppError(
          400,
          'INVALID_REQUEST',
          issue?.message ?? 'Invalid verification request'
        );
      }

      const { emails, options } = parsed.data;

      // Protect against huge arrays containing mostly duplicates.
      // This limit is separate from the unique-address limit below.
      const rawBatchLimit = Math.max(config.maxBatch, 1000);

      if (emails.length > rawBatchLimit) {
        throw new AppError(
          413,
          'BATCH_TOO_LARGE',
          `Too many email entries. Maximum raw batch size is ${rawBatchLimit}.`
        );
      }

      const normalized = normalizeAndDeduplicate(emails);

      if (normalized.uniqueEmails.length === 0) {
        throw new AppError(
          400,
          'INVALID_REQUEST',
          'No non-empty email addresses were provided'
        );
      }

      if (normalized.uniqueEmails.length > config.maxBatch) {
        throw new AppError(
  413,
  'BATCH_TOO_LARGE',
  `Email batch exceeds the maximum allowed limit of ${config.maxBatch}`
);
      }

      const result = await service.verifyBatch(emails, options);

      res.json({
        ok: true,
        data: {
          results: result.results,
          duplicatesRemoved: result.duplicatesRemoved,
          originalCount: result.originalCount,
          smtpEnabled: result.smtpEnabled,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  });

  return router;
}
