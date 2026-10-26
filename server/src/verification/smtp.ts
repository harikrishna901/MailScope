import net from 'node:net';
import { SmtpProbeResult, SmtpProber, SmtpStatus, VerificationConfig } from './types.ts';

/**
 * Checks if response text or code indicates a policy block / reputation issue
 */
export function isPolicyBlocked(code: number, message: string): boolean {
  const msgLower = message.toLowerCase();
  if (msgLower.includes('5.7.') || msgLower.includes('5.7.1') || msgLower.includes('5.7.0')) {
    return true;
  }
  const policyKeywords = [
    'blocked',
    'blacklist',
    'denied',
    'spam',
    'policy',
    'reputation',
    'abuse',
    'spamhaus',
    'surbl',
    'barracuda',
    'rbl',
    'dnsbl',
    'rate limit',
    'too many connections',
  ];
  return policyKeywords.some((kw) => msgLower.includes(kw));
}

/**
 * Maps an SMTP response code and message to an SmtpStatus enum.
 */
export function mapSmtpResponse(code: number, message: string): { status: SmtpStatus; reason: string } {
  if (code >= 200 && code < 300) {
    return {
      status: 'accepted',
      reason: `Recipient accepted by mail exchange (${code}: ${message.trim()})`,
    };
  }

  if (code >= 400 && code < 500) {
    return {
      status: 'temporary_failure',
      reason: `Temporary server failure or greylisting encountered (${code}: ${message.trim()})`,
    };
  }

  if (code >= 500 && code < 600) {
    if (isPolicyBlocked(code, message)) {
      return {
        status: 'policy_blocked',
        reason: `Connection or recipient probe blocked by server policy or reputation filter (${code}: ${message.trim()})`,
      };
    }

    // Check for permanent recipient rejection
    // Enhanced status codes 5.1.1 (bad destination mailbox), 5.1.2 (bad dest sys), 5.1.3 (bad dest mailbox address syntax)
    // Or standard 550, 551, 552, 553, 554
    return {
      status: 'rejected_permanent',
      reason: `Recipient address was explicitly and permanently rejected by host (${code}: ${message.trim()})`,
    };
  }

  return {
    status: 'temporary_failure',
    reason: `Unexpected SMTP response code ${code}: ${message.trim()}`,
  };
}

/**
 * Low-level SMTP client using raw socket on port 25.
 * Strictly adheres to probe-only flow:
 * Connect -> Greeting -> EHLO -> MAIL FROM -> RCPT TO -> QUIT
 * Never sends DATA.
 */
export const defaultSmtpProber: SmtpProber = async (
  email: string,
  mxHost: string,
  config: VerificationConfig
): Promise<SmtpProbeResult> => {
  return new Promise<SmtpProbeResult>((resolve) => {
    let resolved = false;
    const finish = (result: SmtpProbeResult) => {
      if (!resolved) {
        resolved = true;
        try {
          if (!socket.destroyed) {
            socket.write('QUIT\r\n');
            socket.end();
            socket.destroy();
          }
        } catch {
          // ignore cleanup errors
        }
        resolve(result);
      }
    };

    const timeoutMs = config.smtpTimeoutMs || 8000;
    const socket = new net.Socket();

    let buffer = '';
    let step: 'greeting' | 'ehlo' | 'mail_from' | 'rcpt_to' | 'quit' = 'greeting';

    socket.setTimeout(timeoutMs);

    socket.on('timeout', () => {
      finish({
        status: 'unreachable',
        reason: `SMTP connection to ${mxHost}:25 timed out after ${timeoutMs}ms`,
      });
    });

    socket.on('error', (err: any) => {
      const msg = err?.message || 'Socket connection failed';
      finish({
        status: 'unreachable',
        reason: `Failed to connect to ${mxHost}:25 (${msg})`,
      });
    });

    socket.on('close', () => {
      if (!resolved) {
        finish({
          status: 'unreachable',
          reason: `SMTP connection to ${mxHost}:25 closed unexpectedly`,
        });
      }
    });

    socket.connect(25, mxHost, () => {
      // Wait for server 220 banner
    });

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf-8');

      // Process multi-line SMTP responses:
      // "250-line1\r\n250-line2\r\n250 final line\r\n"
      // Terminal lines start with 3 digits followed by a space ' '
      const lines = buffer.split(/\r?\n/);
      // Last element might be incomplete buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Check if line is terminal response: e.g. "250 OK" or "550 User not found"
        const match = trimmedLine.match(/^(\d{3})(?: (.*))?$/);
        if (match) {
          const code = parseInt(match[1], 10);
          const text = match[2] || '';

          if (step === 'greeting') {
            if (code !== 220) {
              return finish({
                status: isPolicyBlocked(code, text) ? 'policy_blocked' : 'unreachable',
                code,
                message: text,
                reason: `Initial server banner rejected connection: ${code} ${text}`,
              });
            }
            step = 'ehlo';
            socket.write(`EHLO ${config.smtpHeloHost || 'mailcheck.pro'}\r\n`);
          } else if (step === 'ehlo') {
            if (code >= 400) {
              return finish({
                status: isPolicyBlocked(code, text) ? 'policy_blocked' : 'temporary_failure',
                code,
                message: text,
                reason: `EHLO command rejected by mail server: ${code} ${text}`,
              });
            }
            step = 'mail_from';
            socket.write(`MAIL FROM:<${config.smtpMailFrom || 'probe@mailcheck.pro'}>\r\n`);
          } else if (step === 'mail_from') {
            if (code >= 400) {
              return finish({
                status: isPolicyBlocked(code, text) ? 'policy_blocked' : 'temporary_failure',
                code,
                message: text,
                reason: `MAIL FROM probe sender rejected: ${code} ${text}`,
              });
            }
            step = 'rcpt_to';
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else if (step === 'rcpt_to') {
            const mapped = mapSmtpResponse(code, text);
            return finish({
              status: mapped.status,
              code,
              message: text,
              reason: mapped.reason,
            });
          }
        }
      }
    });
  });
};
