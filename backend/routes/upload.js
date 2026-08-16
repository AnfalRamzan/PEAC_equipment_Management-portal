// backend/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { put, del, head } = require('@vercel/blob');
const { authenticate } = require('../middleware/auth');

// ✅ Use memory storage (no disk writes)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4', 'video/webm'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// ✅ POST /api/upload - Single File
router.post('/', authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('📤 Uploading to Vercel Blob:', req.file.originalname);

        // ✅ Upload to Vercel Blob
        const blob = await put(
            `uploads/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            {
                access: 'public',
                contentType: req.file.mimetype,
                addRandomSuffix: false
            }
        );

        console.log('✅ Uploaded to Vercel Blob:', blob.url);

        res.json({
            success: true,
            file: {
                url: blob.url,
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype,
                downloadUrl: blob.downloadUrl,
                pathname: blob.pathname
            },
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Upload failed'
        });
    }
});

// ✅ POST /api/upload/multiple - Multiple Files
router.post('/multiple', authenticate, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        console.log(`📤 Uploading ${req.files.length} files to Vercel Blob...`);

        // ✅ Upload all files to Vercel Blob
        const uploadPromises = req.files.map(file => {
            return put(
                `uploads/${Date.now()}-${file.originalname}`,
                file.buffer,
                {
                    access: 'public',
                    contentType: file.mimetype,
                    addRandomSuffix: false
                }
            );
        });

        const results = await Promise.all(uploadPromises);

        const files = results.map(result => ({
            url: result.url,
            name: result.pathname.split('/').pop(),
            size: result.size || 0,
            type: result.contentType || 'auto',
            downloadUrl: result.downloadUrl
        }));

        console.log(`✅ ${files.length} files uploaded to Vercel Blob`);

        res.json({
            success: true,
            files: files,
            message: `${files.length} files uploaded successfully`
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Upload failed'
        });
    }
});

// ✅ DELETE - Delete from Vercel Blob
router.delete('/:pathname', authenticate, async (req, res) => {
    try {
        const { pathname } = req.params;
        
        // Decode URL pathname
        const decodedPathname = decodeURIComponent(pathname);
        
        await del(decodedPathname);
        
        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Delete failed'
        });
    }
});

module.exports = router;