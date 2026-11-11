import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes.js';
import { getMongoDb, closeMongoConnection, isMongoConfigured } from './server/mongodb.js';
import { db } from './server/db.js';

const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function startServer() {
  const app = express();

  // Startup Database Hydration from MongoDB (BUG-02)
  if (isMongoConfigured()) {
    try {
      await getMongoDb();
      await db.hydrateFromMongo();
    } catch (mongoErr) {
      console.warn('[Trackd Server] Startup Mongo hydration notice:', mongoErr);
    }
  }

  // Basic middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads directory for PDF downloads, view with inline headers, and images
  app.use('/uploads', express.static(UPLOADS_DIR, {
    setHeaders: (res, filePath) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
      } else if (lower.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (lower.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    }
  }));

  // Intercept missing files in /uploads so they NEVER reach Vite SPA fallback
  app.use('/uploads', (_req, res) => {
    res.status(404).type('text/plain').send('File not found in uploads directory');
  });

  // Direct alias for standalone PDF links: /pdf/:id/:versionId
  app.get('/pdf/:id/:versionId', (req, res) => {
    res.redirect(`/api/resumes/${req.params.id}/versions/${req.params.versionId}/file`);
  });

  // Intercept any unhandled .pdf requests to guarantee application/pdf or 404 text/plain (NEVER index.html)
  app.all(/\.pdf$/i, (_req, res) => {
    res.status(404).type('text/plain').send('PDF file not found');
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Trackd ResumeHub', timestamp: new Date().toISOString() });
  });

  // API router
  app.use('/api', apiRouter);

  // Catch unmatched /api routes so they return JSON 404 and never SPA index.html
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Trackd Server] Running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Trackd Server] Port ${PORT} is already in use. Retrying or shutting down...`);
    } else {
      console.error('[Trackd Server] Server error:', err);
    }
  });

  const shutdown = async () => {
    console.log('[Trackd Server] Shutting down gracefully...');
    await closeMongoConnection().catch(() => {});
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}


startServer().catch(err => {
  console.error('[Trackd Server] Fatal startup error:', err);
  process.exit(1);
});
