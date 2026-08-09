const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

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
// ✅ SERVICE DOCUMENTATION - MULTER CONFIGURATION (FIXED PATH)
// ============================================================
const serviceDocStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // ✅ FIX: Use correct path from backend folder
        // Since server.js is in backend/, uploads is at same level
        const uploadPath = path.join(__dirname, '..', 'uploads', 'service-documentation');
        console.log('📁 Upload destination:', uploadPath);
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log('📁 Created directory:', uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'doc-' + uniqueSuffix + ext;
        console.log('📎 Generated filename:', filename);
        cb(null, filename);
    }
});

const serviceDocUpload = multer({
    storage: serviceDocStorage,
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
// ✅ DOWNLOAD file
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

        const filename = doc.file_url.split('/').pop();
        console.log('📎 Filename:', filename);
        
        // ✅ Check correct path
        const filePath = path.join(__dirname, '..', 'uploads', 'service-documentation', filename);
        console.log('🔍 Checking path:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.log('❌ File not found:', filePath);
            return res.status(404).json({ 
                success: false, 
                message: 'File not found on server' 
            });
        }

        console.log('✅ File found, sending download...');
        res.download(filePath, doc.file_name || filename, (err) => {
            if (err) {
                console.error('❌ Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        success: false, 
                        message: 'Error downloading file' 
                    });
                }
            }
        });

    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to download file: ' + error.message 
        });
    }
});

// ============================================================
// ✅ UPLOAD file
// ============================================================
router.post('/upload', authenticate, (req, res) => {
    console.log('📤 Upload request received');
    
    serviceDocUpload.single('file')(req, res, function(err) {
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

        console.log('✅ File uploaded successfully:');
        console.log('   📎 Filename:', req.file.filename);
        console.log('   📁 Path:', req.file.path);
        console.log('   📏 Size:', req.file.size, 'bytes');

        const fileUrl = `/uploads/service-documentation/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                url: fileUrl,
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            }
        });
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
// ✅ DELETE service documentation
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

        if (existing[0].file_url) {
            try {
                const filename = existing[0].file_url.split('/').pop();
                const filePath = path.join(__dirname, '..', 'uploads', 'service-documentation', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ File deleted:', filePath);
                }
            } catch (fileError) {
                console.log('⚠️ Could not delete file:', fileError.message);
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