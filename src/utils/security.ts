/**
 * Security utilities: CORS, headers, sanitization
 */

export interface CORSOptions {
  allowOrigins?: string[];
  allowMethods?: string[];
  allowHeaders?: string[];
  exposeHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
}

const DEFAULT_CORS_OPTIONS: CORSOptions = {
  allowOrigins: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: false
};

/**
 * Apply CORS headers to a response
 */
export function applyCORS(
  response: Response,
  request: Request,
  options: CORSOptions = {}
): Response {
  const opts = { ...DEFAULT_CORS_OPTIONS, ...options };
  const headers = new Headers(response.headers);

  const origin = request.headers.get('Origin');
  if (origin && (opts.allowOrigins?.includes('*') || opts.allowOrigins?.includes(origin))) {
    headers.set('Access-Control-Allow-Origin', opts.allowOrigins?.includes('*') ? '*' : origin);
  }

  if (opts.allowMethods) {
    headers.set('Access-Control-Allow-Methods', opts.allowMethods.join(', '));
  }

  if (opts.allowHeaders) {
    headers.set('Access-Control-Allow-Headers', opts.allowHeaders.join(', '));
  }

  if (opts.exposeHeaders) {
    headers.set('Access-Control-Expose-Headers', opts.exposeHeaders.join(', '));
  }

  if (opts.maxAge) {
    headers.set('Access-Control-Max-Age', opts.maxAge.toString());
  }

  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Handle OPTIONS preflight requests
 */
export function handlePreflight(request: Request, options: CORSOptions = {}): Response {
  const opts = { ...DEFAULT_CORS_OPTIONS, ...options };
  const headers = new Headers();

  const origin = request.headers.get('Origin');
  if (origin && (opts.allowOrigins?.includes('*') || opts.allowOrigins?.includes(origin))) {
    headers.set('Access-Control-Allow-Origin', opts.allowOrigins?.includes('*') ? '*' : origin);
  }

  if (opts.allowMethods) {
    headers.set('Access-Control-Allow-Methods', opts.allowMethods.join(', '));
  }

  if (opts.allowHeaders) {
    headers.set('Access-Control-Allow-Headers', opts.allowHeaders.join(', '));
  }

  if (opts.maxAge) {
    headers.set('Access-Control-Max-Age', opts.maxAge.toString());
  }

  return new Response(null, { status: 204, headers });
}

/**
 * Apply security headers to all responses
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' wss: ws:",
      "frame-ancestors 'none'"
    ].join('; ')
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Sanitize text to prevent XSS
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize JSON for safe logging
 */
export function sanitizeJSON(obj: any): any {
  const sensitiveKeys = ['password', 'secret', 'token', 'api_key', 'apiKey', 'authorization'];

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJSON(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeJSON(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
