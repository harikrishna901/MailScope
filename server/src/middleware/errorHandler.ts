
import type {
  Request,
  Response,
  NextFunction,
} from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return error.message;
  }

  return '';
}

function getErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const status =
    typeof error.statusCode === 'number'
      ? error.statusCode
      : typeof error.status === 'number'
        ? error.status
        : undefined;

  if (
    status !== undefined &&
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 599
  ) {
    return status;
  }

  return undefined;
}

function getErrorType(error: unknown): string | undefined {
  if (isRecord(error) && typeof error.type === 'string') {
    return error.type;
  }

  return undefined;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Let Express handle errors if headers were already sent.
  if (res.headersSent) {
    next(err);
    return;
  }

  const message = getErrorMessage(err);
  const errorType = getErrorType(err);

  // Invalid JSON sent to express.json().
  if (
    err instanceof SyntaxError &&
    isRecord(err) &&
    'body' in err
  ) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
    return;
  }

  // Body-parser request size limit.
  if (errorType === 'entity.too.large') {
    res.status(413).json({
      ok: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds the allowed size',
      },
    });
    return;
  }

  // Known application errors are safe to return to the client.
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Handle recognized parser/body errors without exposing internals.
  const status = getErrorStatus(err);

  if (status === 400) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'The request could not be processed',
      },
    });
    return;
  }

  if (status === 413) {
    res.status(413).json({
      ok: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds the allowed size',
      },
    });
    return;
  }

  // Log the internal error on the server, not in the API response.
  console.error(
    '[Mailscope] Unhandled request error:',
    message || 'Unknown error'
  );

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred',
    },
  });
}
