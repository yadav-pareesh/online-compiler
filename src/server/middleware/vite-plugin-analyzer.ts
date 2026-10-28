import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import { complexityService } from '../services/complexity.service';
import type { IncomingMessage, ServerResponse } from 'node:http';

function setupApiMiddleware(server: ViteDevServer | PreviewServer) {
  server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    // Only intercept POST /api/analyze-complexity
    const url = req.url?.split('?')[0];
    if (url !== '/api/analyze-complexity') {
      return next();
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' },
        })
      );
      return;
    }

    // Read body safely with max size protection
    const chunks: Buffer[] = [];
    let bytesReceived = 0;
    const MAX_BODY_BYTES = 50 * 1024; // 50 KB limit

    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_BODY_BYTES) {
        req.destroy();
        res.statusCode = 413;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            error: {
              code: 'PAYLOAD_TOO_LARGE',
              message: 'Request payload exceeded 50KB limit.',
            },
          })
        );
      } else {
        chunks.push(chunk);
      }
    });

    req.on('end', async () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf-8');
        let parsedBody = {};
        if (bodyStr.trim().length > 0) {
          try {
            parsedBody = JSON.parse(bodyStr);
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

        const clientIp =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
          req.socket.remoteAddress ||
          '127.0.0.1';

        const { status, body } = await complexityService.handleRequest(parsedBody, clientIp);

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
              code: 'INTERNAL_ERROR',
              message: 'Internal server error processing complexity analysis.',
            },
          })
        );
      }
    });
  });
}

/**
 * Vite plugin that mounts the /api/analyze-complexity endpoint directly in local dev & preview server
 */
export function complexityApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-complexity-analyzer',
    configureServer(server: ViteDevServer) {
      setupApiMiddleware(server);
    },
    configurePreviewServer(server: PreviewServer) {
      setupApiMiddleware(server);
    },
  };
}
