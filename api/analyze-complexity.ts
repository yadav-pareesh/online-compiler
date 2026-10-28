import type { IncomingMessage, ServerResponse } from 'node:http';
import { complexityService } from '../src/server/services/complexity.service';

/**
 * Serverless Function Handler for Vercel / Node.js
 * Route: POST /api/analyze-complexity
 */
export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST requests are supported.' },
      })
    );
    return;
  }

  try {
    let payload = req.body;

    // In some serverless runtimes, body needs to be buffered
    if (!payload) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (raw.trim()) {
        try {
          payload = JSON.parse(raw);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: false,
              error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' },
            })
          );
          return;
        }
      }
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const { status, body } = await complexityService.handleRequest(payload, clientIp);

    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  } catch {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected server error occurred.',
        },
      })
    );
  }
}
