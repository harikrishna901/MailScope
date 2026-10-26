
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Load environment variables before importing application modules
  dotenv.config({ path: path.resolve(__dirname, '.env') });

  // Dynamic imports ensure environment variables are loaded first
  const { loadConfig } = await import('./server/src/config.ts');
  const { createApp } = await import('./server/src/app.ts');

  const config = loadConfig();

  const { app } = createApp(
    {
      config: {
        smtpEnabled: config.smtpEnabled,
        smtpTimeoutMs: config.smtpTimeoutMs,
        smtpHeloHost: config.smtpHeloHost,
        smtpMailFrom: config.smtpMailFrom,
        maxBatch: config.maxBatch,
        domainAuthEnabled: config.domainAuthEnabled,
      },
    },
    {
      corsOrigin: config.corsOrigin,
      enableRateLimit: true,
      rateLimitMax: 30,
    }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const port = config.port || 3000;

  if (!isProduction) {
    // Development: serve the frontend using Vite middleware
    try {
      const { createServer: createViteServer } = await import('vite');

      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });

      app.use(vite.middlewares);
      console.log('[Mailscope] Running in DEVELOPMENT mode with Vite middlewares');
    } catch (err) {
      console.warn(
        '[Mailscope] Vite middleware init warning, falling back to static:',
        err
      );
    }
  } else {
    // Production: serve the built frontend
    const distPath = path.resolve(__dirname, 'dist');

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));

      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }

        res.sendFile(path.join(distPath, 'index.html'));
      });

      console.log('[Mailscope] Running in PRODUCTION mode serving /dist');
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Mailscope] Server listening on http://0.0.0.0:${port}`);
    console.log(
      `[Mailscope] Configuration: SMTP_ENABLED=${config.smtpEnabled}, MAX_BATCH=${config.maxBatch}, DOMAIN_AUTH=${config.domainAuthEnabled}`
    );
    console.log(
      `[Mailscope] DNS_SERVERS=${process.env.DNS_SERVERS || '(system default)'}`
    );
  });
}

startServer().catch((err) => {
  console.error('[Mailscope] Fatal error starting server:', err);
  process.exit(1);
});
