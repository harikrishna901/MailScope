import { createApp } from './app.ts';
import { loadConfig } from './config.ts';

const config = loadConfig();
const { app } = createApp({
  config: {
    smtpEnabled: config.smtpEnabled,
    smtpTimeoutMs: config.smtpTimeoutMs,
    smtpHeloHost: config.smtpHeloHost,
    smtpMailFrom: config.smtpMailFrom,
    maxBatch: config.maxBatch,
  },
});

const port = config.port || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`[Mailscope API] Running on port ${port}`);
});

export { app };
