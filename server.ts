import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { handleApiRequest } from './src/server/apiHandler.ts';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing with generous limit for photo attachments
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Allow iframe embedding and CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Route /api/* and /open311/* requests to API handler
app.use(['/api', '/open311'], async (req, res, next) => {
  try {
    const handled = await handleApiRequest(req, res, next);
    if (!handled && !res.headersSent) {
      next();
    }
  } catch (err) {
    next(err);
  }
});

// Serve frontend dist assets if built
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(
      'Development mode: Run "npm run dev" to start Vite dev server on port 3000.'
    );
  });
}

app.listen(PORT, () => {
  console.log(`Rental E-Scooter issue reporting server listening on port ${PORT}`);
});
