import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Dev-only plugin. Vite's dev server does not run Vercel `/api` functions, so
 * this middleware loads `api/<name>.ts` on demand and invokes its default
 * export with Vercel-compatible `req` / `res` shims. The exact same files run
 * natively on Vercel in production — no separate code path.
 */
export function apiDevPlugin(): Plugin {
  return {
    name: 'cosmos-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const rawUrl = req.url ?? '';
        if (!rawUrl.startsWith('/api/')) return next();

        const url = new URL(rawUrl, 'http://localhost');
        const name = url.pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
        const file = resolve(process.cwd(), 'api', `${name}.ts`);

        if (!name || !existsSync(file)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Unknown API route: /api/${name}` }));
          return;
        }

        try {
          // Collect a JSON body for non-GET requests.
          let body: unknown;
          if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);
            const raw = Buffer.concat(chunks).toString('utf-8');
            body = raw ? JSON.parse(raw) : {};
          }

          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });

          // Vercel-style request additions.
          Object.assign(req, { query, body });

          // Vercel-style response helpers.
          const vRes = res as ServerResponse & {
            status: (code: number) => typeof vRes;
            json: (data: unknown) => typeof vRes;
            send: (data: unknown) => typeof vRes;
          };
          vRes.status = (code: number) => {
            res.statusCode = code;
            return vRes;
          };
          vRes.json = (data: unknown) => {
            if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return vRes;
          };
          vRes.send = (data: unknown) => {
            if (typeof data === 'object' && data !== null) {
              if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } else {
              res.end(String(data));
            }
            return vRes;
          };

          const mod = await server.ssrLoadModule(file);
          const handler = mod.default as (rq: unknown, rs: unknown) => unknown;
          await handler(req, res);
        } catch (err) {
          server.config.logger.error(`[api/${name}] ${(err as Error).stack ?? String(err)}`);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: (err as Error).message }));
          }
        }
      });
    },
  };
}
