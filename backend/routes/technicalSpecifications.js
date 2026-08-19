// backend/routes/technicalSpecifications.js
// ✅ COMPLETE CRUD ROUTES FOR TECHNICAL SPECIFICATIONS

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================
// ✅ GET ALL TECHNICAL SPECIFICATIONS
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('📊 Fetching technical specifications...');
        
        let sql = `
            SELECT 
                ts.*,
                u.full_name as uploaded_by_name
            FROM technical_specifications ts
            LEFT JOIN users u ON ts.uploaded_by = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // ✅ Filter by hospital for non-super admins
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.role_name !== 'ENGINEER') {
            sql += ' AND ts.hospital = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY ts.created_at DESC';
        
        const specifications = await query(sql, params);
        
        console.log(`📊 Found ${specifications.length} specifications`);
        
        res.json({ 
            success: true, 
            specifications,
            count: specifications.length 
        });
        
    } catch (error) {
        console.error('❌ Get specifications error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch specifications: ' + error.message 
        });
    }
});

// ============================================================
// ✅ GET SINGLE TECHNICAL SPECIFICATION
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                ts.*,
                u.full_name as uploaded_by_name
            FROM technical_specifications ts
            LEFT JOIN users u ON ts.uploaded_by = u.id
            WHERE ts.id = ?
        `;
        
        const specifications = await query(sql, [id]);
        
        if (specifications.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Technical specification not found' 
            });
        }
        
        res.json({ success: true, specification: specifications[0] });
        
    } catch (error) {
        console.error('❌ Get specification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch specification: ' + error.message 
        });
    }
});

// ============================================================
// ✅ CREATE TECHNICAL SPECIFICATION
// ============================================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            title,
            hospital,
            equipment,
            specification_date,
            description,
            file_url,
            file_name,
            file_size,
            document_type
        } = req.body;
        
        console.log('📝 Creating technical specification...');
        console.log('📦 Title:', title);
        console.log('🏥 Hospital:', hospital);
        console.log('🔧 Equipment:', equipment);
        
        // ✅ Validation
        if (!title || title.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Title is required' 
            });
        }
        
        if (!hospital || hospital.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Hospital is required' 
            });
        }
        
        if (!equipment || equipment.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }
        
        // ✅ INSERT
        const result = await query(
            `INSERT INTO technical_specifications (
                title,
                hospital,
                equipment,
                specification_date,
                description,
                file_url,
                file_name,
                file_size,
                document_type,
                uploaded_by,
                uploaded_by_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                hospital.trim(),
                equipment.trim(),
                specification_date || null,
                description || null,
                file_url || null,
                file_name || null,
                file_size || null,
                document_type || 'PDF',
                req.user.id,
                req.user.full_name
            ]
        );
        
        console.log('✅ Technical specification created. ID:', result.insertId);
        
        // ✅ Fetch created specification
        const newSpec = await query(
            `SELECT 
                ts.*,
                u.full_name as uploaded_by_name
            FROM technical_specifications ts
            LEFT JOIN users u ON ts.uploaded_by = u.id
            WHERE ts.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Technical specification created successfully',
            specification: newSpec[0]
        });
        
    } catch (error) {
        console.error('❌ Create specification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create specification: ' + error.message 
        });
    }
});

// ============================================================
// ✅ UPDATE TECHNICAL SPECIFICATION
// ============================================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            hospital,
            equipment,
            specification_date,
            description,
            file_url,
            file_name,
            file_size,
            document_type
        } = req.body;
        
        console.log('🔄 Updating technical specification:', id);
        
        // ✅ Check if exists
        const existing = await query(
            'SELECT * FROM technical_specifications WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Technical specification not found' 
            });
        }
        
        // ✅ Permission check - Only creator can update
        if (existing[0].uploaded_by !== req.user.id && req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only update your own specifications' 
            });
        }
        
        // ✅ UPDATE
        await query(
            `UPDATE technical_specifications SET
                title = ?,
                hospital = ?,
                equipment = ?,
                specification_date = ?,
                description = ?,
                file_url = ?,
                file_name = ?,
                file_size = ?,
                document_type = ?
            WHERE id = ?`,
            [
                title || existing[0].title,
                hospital || existing[0].hospital,
                equipment || existing[0].equipment,
                specification_date !== undefined ? specification_date : existing[0].specification_date,
                description !== undefined ? description : existing[0].description,
                file_url !== undefined ? file_url : existing[0].file_url,
                file_name !== undefined ? file_name : existing[0].file_name,
                file_size !== undefined ? file_size : existing[0].file_size,
                document_type || existing[0].document_type,
                id
            ]
        );
        
        console.log('✅ Technical specification updated:', id);
        
        // ✅ Fetch updated specification
        const updatedSpec = await query(
            `SELECT 
                ts.*,
                u.full_name as uploaded_by_name
            FROM technical_specifications ts
            LEFT JOIN users u ON ts.uploaded_by = u.id
            WHERE ts.id = ?`,
            [id]
        );
        
        res.json({
            success: true,
            message: 'Technical specification updated successfully',
            specification: updatedSpec[0]
        });
        
    } catch (error) {
        console.error('❌ Update specification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update specification: ' + error.message 
        });
    }
});

// ============================================================
// ✅ DELETE TECHNICAL SPECIFICATION
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Deleting technical specification:', id);
        
        // ✅ Check if exists
        const existing = await query(
            'SELECT * FROM technical_specifications WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Technical specification not found' 
            });
        }
        
        // ✅ Permission check - Only creator can delete
        if (existing[0].uploaded_by !== req.user.id && req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only delete your own specifications' 
            });
        }
        
        // ✅ DELETE
        await query('DELETE FROM technical_specifications WHERE id = ?', [id]);
        
        console.log('✅ Technical specification deleted:', id);
        
        res.json({
            success: true,
            message: 'Technical specification deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete specification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete specification: ' + error.message 
        });
    }
});

// ============================================================
// ✅ SEARCH TECHNICAL SPECIFICATIONS
// ============================================================
router.get('/search', authenticate, async (req, res) => {
    try {
        const { q, hospital, equipment } = req.query;
        
        let sql = `
            SELECT 
                ts.*,
                u.full_name as uploaded_by_name
            FROM technical_specifications ts
            LEFT JOIN users u ON ts.uploaded_by = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (q) {
            sql += ' AND (ts.title LIKE ? OR ts.description LIKE ? OR ts.equipment LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (hospital) {
            sql += ' AND ts.hospital = ?';
            params.push(hospital);
        }
        
        if (equipment) {
            sql += ' AND ts.equipment LIKE ?';
            params.push(`%${equipment}%`);
        }
        
        sql += ' ORDER BY ts.created_at DESC';
        
        const specifications = await query(sql, params);
        
        res.json({ 
            success: true, 
            specifications,
            count: specifications.length 
        });
        
    } catch (error) {
        console.error('❌ Search specifications error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search specifications: ' + error.message 
        });
    }
});

module.exports = router;