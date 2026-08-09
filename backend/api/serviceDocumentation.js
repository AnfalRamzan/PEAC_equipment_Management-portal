// backend/routes/serviceDocumentation.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// ✅ MULTER CONFIGURATION - FIXED
// ============================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'documents');
        console.log('📁 Upload path:', uploadPath);
        
        // ✅ Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            console.log('📁 Creating upload directory...');
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'doc-' + uniqueSuffix + path.extname(file.originalname);
        console.log('📄 Generated filename:', filename);
        cb(null, filename);
    }
});

// ✅ File filter with better error messages
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'video/mp4', 'video/webm'
    ];
    
    console.log('📄 File type:', file.mimetype);
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log('❌ File type not allowed:', file.mimetype);
        cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: PDF, Word, Excel, Images, MP4, WEBM`), false);
    }
};

// ✅ Multer instance with error handling
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 1
    },
    fileFilter: fileFilter
});

// ============================================================
// ✅ UPLOAD FILE (POST) - FIXED WITH BETTER ERROR HANDLING
// ============================================================
router.post('/upload', authenticate, (req, res) => {
    console.log('📤 Upload request received');
    console.log('📤 User:', req.user?.id, req.user?.email);
    
    // ✅ Use multer with error handling
    upload.single('file')(req, res, function(err) {
        // ✅ Handle multer errors
        if (err instanceof multer.MulterError) {
            console.error('❌ Multer error:', err);
            
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 50MB.'
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Only one file allowed.'
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field. Please use "file".'
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Upload error: ' + err.message
            });
        }
        
        // ✅ Handle other errors
        if (err) {
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Upload failed'
            });
        }
        
        // ✅ No file
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // ✅ Success
        console.log('✅ File uploaded successfully:', req.file.filename);
        console.log('✅ File size:', req.file.size);
        console.log('✅ File type:', req.file.mimetype);

        const fileUrl = `/uploads/documents/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                url: fileUrl,
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype,
                filename: req.file.filename
            }
        });
    });
});

// ============================================================
// ✅ GET ALL DOCUMENTS
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('📋 Fetching documents for user:', req.user.id, 'Role:', req.user.role_name);
        
        let sql = `
            SELECT sd.*, 
                   u.full_name as uploaded_by_name,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name
            FROM service_documents sd
            LEFT JOIN users u ON sd.uploaded_by = u.id
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            LEFT JOIN hospitals h ON COALESCE(e.hospital_id, sd.hospital_id) = h.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ Filter by hospital for non-SUPER_ADMIN
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND (e.hospital_id = ? OR sd.hospital_id = ?)';
            params.push(req.user.hospital_id, req.user.hospital_id);
        }

        sql += ' ORDER BY sd.created_at DESC';
        
        const documents = await query(sql, params);
        console.log(`✅ Found ${documents.length} documents`);
        
        res.json({ success: true, documents });
    } catch (error) {
        console.error('❌ Get documents error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch documents',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET SINGLE DOCUMENT
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT sd.*, 
                   u.full_name as uploaded_by_name,
                   e.name as equipment_name,
                   h.name as hospital_name
            FROM service_documents sd
            LEFT JOIN users u ON sd.uploaded_by = u.id
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            LEFT JOIN hospitals h ON COALESCE(e.hospital_id, sd.hospital_id) = h.id
            WHERE sd.id = ?
        `;
        const params = [id];

        // ✅ Filter by hospital for non-SUPER_ADMIN
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND (e.hospital_id = ? OR sd.hospital_id = ?)';
            params.push(req.user.hospital_id, req.user.hospital_id);
        }

        const documents = await query(sql, params);
        
        if (documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document not found or access denied'
            });
        }

        res.json({ success: true, document: documents[0] });
    } catch (error) {
        console.error('❌ Get document error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch document' });
    }
});

// ============================================================
// ✅ CREATE DOCUMENT (POST) - FIXED
// ============================================================
router.post('/', authenticate, async (req, res) => {
    try {
        console.log('📤 Received document data:', req.body);
        console.log('👤 User:', req.user.id, req.user.role_name);
        
        const {
            title,
            document_type,
            category,
            equipment_id,
            equipment,
            description,
            file_url,
            file_name,
            file_size
        } = req.body;

        // ✅ VALIDATION - Title is required
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Document title is required'
            });
        }

        // ✅ Process equipment_id - convert to integer or null
        const finalEquipmentId = equipment_id && equipment_id !== '' && equipment_id !== 'null' 
            ? parseInt(equipment_id) 
            : null;
        console.log('📌 Final equipment_id:', finalEquipmentId);

        // ✅ Get hospital_id from equipment if provided
        let hospitalId = null;
        if (finalEquipmentId) {
            const equipmentData = await query(
                'SELECT hospital_id FROM equipment WHERE id = ?',
                [finalEquipmentId]
            );
            console.log('📌 Equipment data:', equipmentData);
            if (equipmentData.length > 0) {
                hospitalId = equipmentData[0].hospital_id;
            }
        }

        // ✅ If no hospital_id from equipment, use user's hospital_id (for non-SUPER_ADMIN)
        if (!hospitalId && req.user.role_name !== 'SUPER_ADMIN') {
            hospitalId = req.user.hospital_id;
        }

        console.log('📌 Final hospital_id:', hospitalId);

        // ✅ INSERT DOCUMENT - uploaded_by is REQUIRED
        const result = await query(
            `INSERT INTO service_documents 
             (title, document_type, category, equipment_id, equipment,
              description, file_url, file_name, file_size,
              uploaded_by, hospital_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                title.trim(),
                document_type || 'PDF',
                category || 'Other',
                finalEquipmentId,
                equipment || null,
                description || null,
                file_url || null,
                file_name || null,
                file_size ? parseInt(file_size) : null,
                req.user.id,  // ✅ uploaded_by is REQUIRED
                hospitalId
            ]
        );

        console.log('✅ Document created. ID:', result.insertId);

        // ✅ GET THE NEW DOCUMENT
        const newDocument = await query(
            `SELECT sd.*, u.full_name as uploaded_by_name
             FROM service_documents sd
             LEFT JOIN users u ON sd.uploaded_by = u.id
             WHERE sd.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            document: newDocument[0] || { id: result.insertId }
        });
    } catch (error) {
        console.error('❌ Create document error:', error);
        console.error('❌ SQL Error:', error.sql);
        console.error('❌ SQL Message:', error.sqlMessage);
        console.error('❌ Error Code:', error.code);
        
        // ✅ Return more detailed error for debugging
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
            error: error.message,
            sqlError: error.sqlMessage || null,
            code: error.code || null
        });
    }
});

// ============================================================
// ✅ UPDATE DOCUMENT (PUT)
// ============================================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            document_type,
            category,
            equipment_id,
            equipment,
            description,
            file_url,
            file_name,
            file_size
        } = req.body;

        console.log('📤 Updating document:', id);
        console.log('📤 Data:', req.body);

        // ✅ Check if document exists and get permissions
        let sql = `
            SELECT sd.*, e.hospital_id 
            FROM service_documents sd
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            WHERE sd.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // ✅ Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            const docHospitalId = existing[0].hospital_id || existing[0].hospital_id;
            if (docHospitalId !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        // ✅ Process equipment_id
        const finalEquipmentId = equipment_id && equipment_id !== '' && equipment_id !== 'null'
            ? parseInt(equipment_id)
            : null;

        // ✅ UPDATE DOCUMENT
        await query(
            `UPDATE service_documents SET 
             title = ?, document_type = ?, category = ?,
             equipment_id = ?, equipment = ?, description = ?,
             file_url = ?, file_name = ?, file_size = ?,
             updated_at = NOW()
             WHERE id = ?`,
            [
                title || existing[0].title,
                document_type || existing[0].document_type,
                category || existing[0].category,
                finalEquipmentId,
                equipment || existing[0].equipment,
                description || existing[0].description,
                file_url || existing[0].file_url,
                file_name || existing[0].file_name,
                file_size || existing[0].file_size,
                id
            ]
        );

        console.log('✅ Document updated:', id);

        // ✅ Get updated document
        const updatedDoc = await query(
            `SELECT sd.*, u.full_name as uploaded_by_name
             FROM service_documents sd
             LEFT JOIN users u ON sd.uploaded_by = u.id
             WHERE sd.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Document updated successfully',
            document: updatedDoc[0]
        });
    } catch (error) {
        console.error('❌ Update document error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update document',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ DELETE DOCUMENT (DELETE)
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Deleting document:', id);

        // ✅ Check if document exists
        const existing = await query(
            `SELECT sd.*, e.hospital_id 
             FROM service_documents sd
             LEFT JOIN equipment e ON sd.equipment_id = e.id
             WHERE sd.id = ?`,
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // ✅ Permission check - Only SUPER_ADMIN can delete
        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can delete documents'
            });
        }

        // ✅ Delete physical file if exists
        if (existing[0].file_url) {
            const filePath = path.join(__dirname, '..', existing[0].file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️ File deleted:', filePath);
            }
        }

        // ✅ Delete from database
        await query('DELETE FROM service_documents WHERE id = ?', [id]);

        console.log('✅ Document deleted:', id);

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete document error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete document',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ DOWNLOAD DOCUMENT (GET)
// ============================================================
router.get('/:id/download', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        console.log('📥 Downloading document:', id);

        // ✅ Check if document exists
        let sql = `
            SELECT sd.*, e.hospital_id 
            FROM service_documents sd
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            WHERE sd.id = ?
        `;
        let params = [id];

        // ✅ Filter by hospital for non-SUPER_ADMIN
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND (e.hospital_id = ? OR sd.hospital_id = ?)';
            params.push(req.user.hospital_id, req.user.hospital_id);
        }

        const documents = await query(sql, params);
        
        if (documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document not found or access denied'
            });
        }

        const doc = documents[0];

        if (!doc.file_url) {
            return res.status(404).json({
                success: false,
                message: 'File URL not found'
            });
        }

        const filePath = path.join(__dirname, '..', doc.file_url);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // ✅ Get file extension for proper content-type
        const ext = path.extname(doc.file_name || 'document.pdf');
        let contentType = 'application/octet-stream';
        switch(ext.toLowerCase()) {
            case '.pdf': contentType = 'application/pdf'; break;
            case '.jpg':
            case '.jpeg': contentType = 'image/jpeg'; break;
            case '.png': contentType = 'image/png'; break;
            case '.gif': contentType = 'image/gif'; break;
            case '.mp4': contentType = 'video/mp4'; break;
            case '.webm': contentType = 'video/webm'; break;
            case '.doc': contentType = 'application/msword'; break;
            case '.docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
            case '.xls': contentType = 'application/vnd.ms-excel'; break;
            case '.xlsx': contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name || 'document.pdf')}"`);
        
        res.download(filePath, doc.file_name || 'document.pdf');
    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to download file',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET DOCUMENTS BY EQUIPMENT ID
// ============================================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        console.log('📋 Fetching documents for equipment:', equipmentId);
        
        let sql = `
            SELECT sd.*, 
                   u.full_name as uploaded_by_name,
                   e.name as equipment_name
            FROM service_documents sd
            LEFT JOIN users u ON sd.uploaded_by = u.id
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            WHERE sd.equipment_id = ?
            ORDER BY sd.created_at DESC
        `;
        const params = [equipmentId];

        // ✅ Filter by hospital for non-SUPER_ADMIN
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND (e.hospital_id = ? OR sd.hospital_id = ?)';
            params.push(req.user.hospital_id, req.user.hospital_id);
        }

        const documents = await query(sql, params);
        res.json({ success: true, documents });
    } catch (error) {
        console.error('❌ Get equipment documents error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch documents',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET DOCUMENTS STATS
// ============================================================
router.get('/stats', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN document_type = 'PDF' THEN 1 ELSE 0 END) as pdf_count,
                SUM(CASE WHEN document_type = 'Video' THEN 1 ELSE 0 END) as video_count,
                SUM(CASE WHEN document_type = 'Image' THEN 1 ELSE 0 END) as image_count,
                SUM(CASE WHEN document_type = 'Word' THEN 1 ELSE 0 END) as word_count,
                SUM(CASE WHEN document_type = 'Excel' THEN 1 ELSE 0 END) as excel_count,
                COUNT(DISTINCT equipment_id) as equipment_count
            FROM service_documents sd
            LEFT JOIN equipment e ON sd.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ Filter by hospital for non-SUPER_ADMIN
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND (e.hospital_id = ? OR sd.hospital_id = ?)';
            params.push(req.user.hospital_id, req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ success: true, stats: stats[0] });
    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch stats',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET CATEGORIES
// ============================================================
router.get('/categories', authenticate, async (req, res) => {
    try {
        const categories = [
            'Manual',
            'Schematic',
            'Service Guide',
            'Warranty',
            'Certificate',
            'Other'
        ];
        res.json({ success: true, categories });
    } catch (error) {
        console.error('❌ Get categories error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch categories',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET DOCUMENT TYPES
// ============================================================
router.get('/document-types', authenticate, async (req, res) => {
    try {
        const types = [
            'PDF',
            'Image',
            'Video',
            'Word',
            'Excel',
            'Other'
        ];
        res.json({ success: true, types });
    } catch (error) {
        console.error('❌ Get document types error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch document types',
            error: error.message 
        });
    }
});

module.exports = router;