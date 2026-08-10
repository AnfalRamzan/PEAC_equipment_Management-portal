// routes/serviceDocumentation.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { put, del } = require('@vercel/blob');
require('dotenv').config();

// ✅ Use memoryStorage for Vercel (no file system)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
            'image/svg+xml',
            'application/pdf', 
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
        }
    }
});

// ✅ UPLOAD ENDPOINT - Uses Vercel Blob
router.post('/upload', async (req, res) => {
    upload.single('file')(req, res, async function(err) {
        if (err) {
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Upload failed'
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            console.log('📤 Uploading file:', req.file.originalname);
            console.log('📤 File size:', req.file.size);
            console.log('📤 File type:', req.file.mimetype);

            // ✅ Generate unique filename
            const ext = path.extname(req.file.originalname);
            const filename = `doc-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
            
            // ✅ Upload to Vercel Blob
            const blob = await put(`service-documentation/${filename}`, req.file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            console.log('✅ Uploaded to Vercel Blob:', blob.url);

            res.json({
                success: true,
                message: 'File uploaded successfully',
                file: {
                    url: blob.url,
                    name: req.file.originalname,
                    size: req.file.size,
                    type: req.file.mimetype.startsWith('image/') ? 'image' :
                          req.file.mimetype.startsWith('video/') ? 'video' : 'document',
                    mimetype: req.file.mimetype
                }
            });
        } catch (error) {
            console.error('❌ Upload processing error:', error);
            res.status(500).json({
                success: false,
                message: 'Upload failed: ' + error.message
            });
        }
    });
});

// ✅ DELETE ENDPOINT - Uses Vercel Blob
router.delete('/upload', async (req, res) => {
    try {
        const { fileUrl } = req.body;
        
        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'File URL is required'
            });
        }

        console.log('🗑️ Deleting file:', fileUrl);

        // ✅ Delete from Vercel Blob
        await del(fileUrl, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        console.log('✅ File deleted successfully');

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file: ' + error.message
        });
    }
});

module.exports = router;