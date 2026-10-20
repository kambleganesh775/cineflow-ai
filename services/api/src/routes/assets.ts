import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { storageService } from '../services/storage';

export const assetsRouter = Router();

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max image size
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  },
});

// GET /api/assets/stream - Stream video securely with HTTP 206 partial content support
assetsRouter.get('/stream', (req: Request, res: Response): void => {
  try {
    const rawPath = req.query.path as string;
    const exp = parseInt(req.query.exp as string, 10);

    if (!rawPath) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing path parameter' } });
      return;
    }

    // Check expiration timestamp
    if (exp && Date.now() > exp) {
      res.status(403).json({ success: false, error: { code: 'EXPIRED_URL', message: 'Signed streaming URL has expired' } });
      return;
    }

    // Path traversal defense
    const normalized = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
    const localFilePath = storageService.getLocalFilePath(normalized);

    if (!localFilePath || !fs.existsSync(localFilePath)) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } });
      return;
    }

    const stat = fs.statSync(localFilePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(localFilePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(localFilePath).pipe(res);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'STREAM_ERROR', message: err.message } });
  }
});

// POST /api/assets/upload-image - Upload reference image for image-to-video prompt
assetsRouter.post('/upload-image', upload.single('image'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No image file uploaded' },
    });
    return;
  }

  const base64 = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64}`;

  res.json({
    success: true,
    data: {
      dataUri,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});
