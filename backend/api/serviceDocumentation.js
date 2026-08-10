// routes/serviceDocumentation.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { put, del } = require('@vercel/blob');
require('dotenv').config();

// ✅ Use memoryStorage for Vercel
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// ✅ Upload endpoint
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

            const filename = `doc-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
            
            const blob = await put(`service-documentation/${filename}`, req.file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

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

// ✅ Delete endpoint
router.delete('/upload', async (req, res) => {
    try {
        const { fileUrl } = req.body;
        
        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'File URL is required'
            });
        }

        await del(fileUrl, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

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