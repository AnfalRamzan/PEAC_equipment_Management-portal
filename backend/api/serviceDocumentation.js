// backend/routes/serviceDocumentation.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { put, del } = require('@vercel/blob'); // ✅ Add this
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// ✅ Use memory storage (NO disk writes)
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
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// ✅ POST /api/service-documentation/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
    try {
        console.log('📤 Service Documentation Upload Request');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { equipment_id, title, description } = req.body;
        
        if (!equipment_id || !title) {
            return res.status(400).json({
                success: false,
                message: 'Equipment ID and title are required'
            });
        }

        // ✅ Upload to Vercel Blob (NOT file system)
        const blob = await put(
            `service-documentation/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            {
                access: 'public',
                contentType: req.file.mimetype,
                addRandomSuffix: false
            }
        );

        console.log('✅ Uploaded to Vercel Blob:', blob.url);

        // ✅ Save to database
        const result = await db.query(
            `INSERT INTO service_documentation 
             (equipment_id, title, description, file_url, file_name, file_size, file_type, uploaded_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                equipment_id,
                title,
                description || '',
                blob.url, // ✅ Store blob URL
                req.file.originalname,
                req.file.size,
                req.file.mimetype,
                req.user.id
            ]
        );

        res.json({
            success: true,
            message: 'Documentation uploaded successfully',
            file: {
                url: blob.url,
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            },
            document_id: result.insertId
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Upload failed'
        });
    }
});

// ✅ GET all service documentation
router.get('/', authenticate, async (req, res) => {
    try {
        const { equipment_id } = req.query;
        
        let query = `
            SELECT sd.*, u.full_name as uploaded_by_name,
                   e.name as equipment_name
            FROM service_documentation sd
            LEFT JOIN users u ON sd.uploaded_by = u.id
            LEFT JOIN equipment e ON sd.equipment_id = e.id
        `;
        
        const params = [];
        if (equipment_id) {
            query += ` WHERE sd.equipment_id = ?`;
            params.push(equipment_id);
        }
        
        query += ` ORDER BY sd.created_at DESC`;
        
        const docs = await db.query(query, params);
        
        res.json({
            success: true,
            documents: docs
        });
    } catch (error) {
        console.error('Get docs error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ✅ DELETE service documentation
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get file URL from database
        const [doc] = await db.query(
            'SELECT file_url FROM service_documentation WHERE id = ?',
            [id]
        );
        
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // ✅ Delete from Vercel Blob
        if (doc.file_url) {
            try {
                // Extract pathname from URL
                const url = new URL(doc.file_url);
                const pathname = url.pathname.substring(1); // Remove leading /
                await del(pathname);
                console.log('✅ Deleted from Vercel Blob:', pathname);
            } catch (blobError) {
                console.error('Blob delete error:', blobError);
                // Continue with database deletion even if blob delete fails
            }
        }

        // ✅ Delete from database
        await db.query(
            'DELETE FROM service_documentation WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;