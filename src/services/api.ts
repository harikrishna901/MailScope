import { AppConfig, VerificationBatchResponse, VerificationOptions } from '../types.ts';

export class ApiError extends Error {
  public code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export async function fetchServerConfig(): Promise<AppConfig> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.ok && data.data) {
      return data.data;
    }
    return { maxBatch: 100, smtpEnabled: false, domainAuthEnabled: true };
  } catch (err) {
    console.warn('[Mailscope] Could not load server config, using defaults:', err);
    return { maxBatch: 100, smtpEnabled: false, domainAuthEnabled: true };
  }
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return data.ok && data.data?.status === 'healthy';
  } catch {
    return false;
  }
}

export async function verifyEmailsApi(
  emails: string[],
  options?: VerificationOptions
): Promise<VerificationBatchResponse> {
  const payload: { emails: string[]; options?: VerificationOptions } = { emails };
  if (options && Object.keys(options).length > 0) {
    payload.options = options;
  }

  const res = await fetch('/api/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    const code = body?.error?.code || 'UNKNOWN_ERROR';
    const message = body?.error?.message || `Request failed with status ${res.status}`;
    throw new ApiError(code, message);
  }

  return body.data;
}
