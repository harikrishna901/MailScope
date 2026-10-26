
import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  corsOrigin: string;
  smtpEnabled: boolean;
  smtpTimeoutMs: number;
  smtpHeloHost: string;
  smtpMailFrom: string;
  maxBatch: number;
  domainAuthEnabled: boolean;
}

export function loadConfig(): AppConfig {
  const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);

  return {
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    smtpEnabled: process.env.SMTP_ENABLED === 'true',
    smtpTimeoutMs: Number.parseInt(
      process.env.SMTP_TIMEOUT_MS || '8000',
      10
    ),
    smtpHeloHost: process.env.SMTP_HELO_HOST || 'mailscope.app',
    smtpMailFrom: process.env.SMTP_MAIL_FROM || 'probe@mailscope.app',
    maxBatch: Number.parseInt(process.env.MAX_BATCH || '100', 10),
    domainAuthEnabled: process.env.DOMAIN_AUTH_ENABLED !== 'false',
  };
}
