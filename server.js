import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory with proper configuration
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set proper MIME types for JavaScript modules
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
  }
}));

// SPA fallback - send all requests to index.html ONLY for non-file requests
app.get('*', (req, res) => {
  // Don't serve index.html for asset requests
  if (req.path.includes('.')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
