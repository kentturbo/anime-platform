import express from 'express';
import { authenticateToken, requireVerified, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

router.get('/list', authenticateToken, requireVerified, requireSubscription, async (req, res) => {
  try {
    const files = [
      {
        id: 1,
        name: 'Season 1',
        type: 'folder',
        children: [
          { id: 2, name: 'Episode 01.mp4', type: 'file', size: '450MB', url: '/files/download/2' },
          { id: 3, name: 'Episode 02.mp4', type: 'file', size: '445MB', url: '/files/download/3' }
        ]
      },
      {
        id: 4,
        name: 'Season 2',
        type: 'folder',
        children: [
          { id: 5, name: 'Episode 01.mp4', type: 'file', size: '460MB', url: '/files/download/5' }
        ]
      }
    ];

    res.json({ files });
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

router.get('/download/:id', authenticateToken, requireVerified, requireSubscription, async (req, res) => {
  try {
    res.json({ 
      message: 'File streaming not implemented',
      downloadUrl: '#'
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
