// backend/routes/serviceDocumentation.js
// ✅ COMPLETE FIXED VERSION - Uses Vercel Blob

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { put, del } = require('@vercel/blob');
const { query } = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-2024';

// ============================================================
// ✅ AUTHENTICATION MIDDLEWARE
// ============================================================
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authorization header' 
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }

        const users = await query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ? AND u.is_active = 1`,
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found or inactive' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - No user found' 
            });
        }
        if (!allowedRoles.includes(req.user.role_name)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }
        next();
    };
};

// ============================================================
// ✅ HELPER: Get Blob Token
// ============================================================
const getBlobToken = () => {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const oidcToken = process.env.VERCEL_OIDC_TOKEN;
    const storeId = process.env.BLOB_STORE_ID || 'default';
    
    if (token) {
        console.log('✅ ServiceDoc: Using BLOB_READ_WRITE_TOKEN');
        return { token, storeId };
    }
    
    if (oidcToken) {
        console.log('✅ ServiceDoc: Using VERCEL_OIDC_TOKEN');
        return { oidcToken, storeId };
    }
    
    console.error('❌ ServiceDoc: No blob credentials found!');
    return null;
};

// ============================================================
// ✅ FIXED: Use memoryStorage for Vercel
// ============================================================
const upload = multer({
    storage: multer.memoryStorage(),  // ✅ Memory storage - Vercel compatible
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'video/mp4', 'video/webm'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// ============================================================
// ✅ GET all service documentation
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT sd.*, 
                   e.name as equipment_name,
                   h.name as hospital_name,
                   u.full_name as uploaded_by_name
            FROM service_documentation sd
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            LEFT JOIN hospitals h ON sd.hospital_id = h.id
            LEFT JOIN users u ON sd.uploaded_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND sd.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY sd.created_at DESC';
        const documents = await query(sql, params);
        res.json({ success: true, documents });
    } catch (error) {
        console.error('❌ Get error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch service documentation' });
    }
});

// ============================================================
// ✅ GET single service documentation
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT sd.*, 
                   e.name as equipment_name,
                   h.name as hospital_name,
                   u.full_name as uploaded_by_name
            FROM service_documentation sd
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            LEFT JOIN hospitals h ON sd.hospital_id = h.id
            LEFT JOIN users u ON sd.uploaded_by = u.id
            WHERE sd.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND sd.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const documents = await query(sql, params);
        if (documents.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Service documentation not found' 
            });
        }

        res.json({ success: true, document: documents[0] });
    } catch (error) {
        console.error('❌ Get single error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch service documentation' });
    }
});

// ============================================================
// ✅ DOWNLOAD file - Redirect to Vercel Blob
// ============================================================
router.get('/:id/download', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📥 Download request for ID:', id);
        
        const documents = await query(
            'SELECT * FROM service_documentation WHERE id = ?',
            [id]
        );
        
        if (documents.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Document not found' 
            });
        }

        const doc = documents[0];
        console.log('📄 Document:', doc.title);
        console.log('📎 File URL:', doc.file_url);
        
        if (!doc.file_url) {
            return res.status(404).json({ 
                success: false, 
                message: 'File URL not found' 
            });
        }

        // ✅ If it's a Vercel Blob URL, redirect to it
        if (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://')) {
            console.log('✅ Redirecting to Vercel Blob URL:', doc.file_url);
            return res.redirect(doc.file_url);
        }

        // ✅ Fallback for local development
        const filename = doc.file_url.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', 'service-documentation', filename);
        
        if (!require('fs').existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'File not found on server' 
            });
        }

        res.download(filePath, doc.file_name || filename);

    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to download file: ' + error.message 
        });
    }
});

// ============================================================
// ✅ FIXED: UPLOAD file - Vercel Blob
// ============================================================
router.post('/upload', authenticate, (req, res) => {
    console.log('📤 ServiceDoc Upload request received');
    
    upload.single('file')(req, res, async function(err) {
        if (err) {
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Upload failed'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        try {
            console.log('📎 File:', req.file.originalname);
            console.log('📏 Size:', req.file.size, 'bytes');
            console.log('📁 Type:', req.file.mimetype);

            // ✅ Get credentials
            const credentials = getBlobToken();
            if (!credentials) {
                return res.status(500).json({
                    success: false,
                    message: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN in .env file.'
                });
            }

            // ✅ Upload to Vercel Blob
            const ext = path.extname(req.file.originalname);
            const filename = `doc-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
            
            const blob = await put(`service-documentation/${filename}`, req.file.buffer, {
                access: 'public',
                ...credentials,
            });

            console.log('✅ ServiceDoc uploaded to Vercel Blob:', blob.url);

            res.json({
                success: true,
                message: 'File uploaded successfully',
                file: {
                    url: blob.url,
                    name: req.file.originalname,
                    size: req.file.size,
                    type: req.file.mimetype
                }
            });
        } catch (error) {
            console.error('❌ Upload processing error:', error);
            console.error('❌ Error details:', error.message);
            
            let errorMessage = 'Upload failed';
            if (error.message.includes('blob credentials')) {
                errorMessage = 'Blob storage not configured. Please check environment variables.';
            } else {
                errorMessage = error.message;
            }
            
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    });
});

// ============================================================
// ✅ POST create service documentation
// ============================================================
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const {
            title,
            document_type,
            category,
            equipment_id,
            equipment,
            description,
            file_url,
            file_name,
            file_size,
            version,
            hospital_id
        } = req.body;

        console.log('📄 Creating service documentation:', title);
        console.log('📎 File URL:', file_url);

        if (!title || title.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Title is required' 
            });
        }

        const finalHospitalId = hospital_id || req.user.hospital_id;

        const result = await query(
            `INSERT INTO service_documentation (
                title,
                document_type,
                category,
                equipment_id,
                equipment,
                description,
                file_url,
                file_name,
                file_size,
                version,
                uploaded_by,
                hospital_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                document_type || 'PDF',
                category || 'Other',
                equipment_id || null,
                equipment || '',
                description || null,
                file_url || null,
                file_name || '',
                file_size || '',
                version || '1.0',
                req.user.id,
                finalHospitalId
            ]
        );

        console.log('✅ Service documentation created. ID:', result.insertId);

        const newDocument = await query(
            `SELECT sd.*, 
                    e.name as equipment_name,
                    u.full_name as uploaded_by_name
             FROM service_documentation sd
             LEFT JOIN equipment e ON sd.equipment_id = e.id
             LEFT JOIN users u ON sd.uploaded_by = u.id
             WHERE sd.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Service documentation created successfully',
            document: newDocument[0] || { id: result.insertId }
        });

    } catch (error) {
        console.error('❌ Create error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create service documentation: ' + error.message 
        });
    }
});

// ============================================================
// ✅ DELETE service documentation - with Vercel Blob delete
// ============================================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query('SELECT * FROM service_documentation WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Service documentation not found' 
            });
        }

        // ✅ Delete from Vercel Blob if URL is a Blob URL
        if (existing[0].file_url && existing[0].file_url.includes('blob.vercel-storage.com')) {
            try {
                const credentials = getBlobToken();
                if (credentials) {
                    await del(existing[0].file_url, {
                        ...credentials,
                    });
                    console.log('🗑️ Deleted from Vercel Blob:', existing[0].file_url);
                }
            } catch (fileError) {
                console.log('⚠️ Could not delete from Vercel Blob:', fileError.message);
            }
        }

        await query('DELETE FROM service_documentation WHERE id = ?', [id]);

        res.json({ 
            success: true, 
            message: 'Service documentation deleted successfully' 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete service documentation: ' + error.message 
        });
    }
});

module.exports = router;