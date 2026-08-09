const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================
// ✅ GET ALL KNOWLEDGE BASE ENTRIES
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT kb.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   u.full_name as created_by_name,
                   d.name as department_name
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON kb.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY kb.created_at DESC';
        
        const entries = await query(sql, params);
        res.json({ success: true, entries });
    } catch (error) {
        console.error('Get knowledge base error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch knowledge base' 
        });
    }
});

// ============================================================
// ✅ GET KNOWLEDGE BASE BY EQUIPMENT
// ============================================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        let sql = `
            SELECT kb.*, 
                   u.full_name as created_by_name,
                   e.name as equipment_name
            FROM knowledge_base kb
            LEFT JOIN users u ON kb.created_by = u.id
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            WHERE kb.equipment_id = ?
        `;
        const params = [equipmentId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY kb.created_at DESC';
        
        const entries = await query(sql, params);
        res.json({ success: true, entries });
    } catch (error) {
        console.error('Get knowledge base by equipment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch knowledge base' 
        });
    }
});

// ============================================================
// ✅ CREATE KNOWLEDGE BASE ENTRY - FIXED
// ============================================================
router.post('/', authenticate, async (req, res) => {
    try {
        console.log('📤 Received knowledge base data:', req.body);
        
        const {
            equipment_id,
            error_code,
            error_title,
            error_description,
            root_cause,
            solution,
            repair_procedure,
            time_taken,
            spare_parts_used,
            spare_part_images,
            before_repair_images,
            after_repair_images,
            attachments,
            repair_date,
            remarks,
            reported_by,
            engineer_name,
            hospital_name,
            department_name
        } = req.body;

        // ✅ VALIDATION - REQUIRED FIELDS
        if (!equipment_id) {
            console.log('❌ Missing equipment_id');
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }
        if (!error_title) {
            console.log('❌ Missing error_title');
            return res.status(400).json({ 
                success: false, 
                message: 'Error title is required' 
            });
        }

        // ✅ CHECK EQUIPMENT EXISTS
        let sql = 'SELECT * FROM equipment WHERE id = ?';
        let params = [equipment_id];
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        const equipment = await query(sql, params);
        if (equipment.length === 0) {
            console.log('❌ Equipment not found or access denied');
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found or access denied' 
            });
        }

        // ✅ Get hospital_id from equipment
        const hospitalId = equipment[0].hospital_id;

        // ✅ INSERT QUERY - WITH ALL FIELDS
        const result = await query(
            `INSERT INTO knowledge_base 
             (equipment_id, error_code, error_title, error_description,
              root_cause, solution, repair_procedure, time_taken,
              spare_parts_used, spare_part_images, before_repair_images,
              after_repair_images, attachments, repair_date, remarks,
              reported_by, engineer_name, hospital_name, department_name,
              created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                equipment_id,
                error_code || null,
                error_title,
                error_description || null,
                root_cause || null,
                solution || null,
                repair_procedure || null,
                time_taken ? parseInt(time_taken) : null,
                spare_parts_used || null,
                spare_part_images || null,
                before_repair_images || null,
                after_repair_images || null,
                attachments || null,
                repair_date || null,
                remarks || null,
                reported_by || req.user.full_name || null,
                engineer_name || null,
                hospital_name || equipment[0].hospital_name || null,
                department_name || null,
                req.user.id
            ]
        );

        console.log('✅ Knowledge base entry created. ID:', result.insertId);

        // ✅ GET THE NEW ENTRY
        const newEntry = await query(
            `SELECT kb.*, 
                    u.full_name as created_by_name,
                    e.name as equipment_name,
                    h.name as hospital_name
             FROM knowledge_base kb
             LEFT JOIN users u ON kb.created_by = u.id
             LEFT JOIN equipment e ON kb.equipment_id = e.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             WHERE kb.id = ?`,
            [result.insertId]
        );

        // ✅ CREATE NOTIFICATION
        await query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_module)
             SELECT u.id, 'New Knowledge Base Entry', 
                    CONCAT('New solution added for: ', ?), 'System', ?, 'knowledge-base'
             FROM users u
             WHERE u.role_id = 2 
               AND u.hospital_id = ?
               AND u.is_active = TRUE`,
            [equipment[0].name, result.insertId, hospitalId]
        );

        res.status(201).json({
            success: true,
            message: 'Knowledge base entry created successfully',
            entry: newEntry[0]
        });
    } catch (error) {
        console.error('❌ Create knowledge base error:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ SQL:', error.sql);
        console.error('❌ Stack:', error.stack);
        
        // ✅ Send detailed error response
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create knowledge base entry: ' + error.message,
            details: error.sql || null
        });
    }
});

// ============================================================
// ✅ UPDATE KNOWLEDGE BASE ENTRY
// ============================================================
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            error_code,
            error_title,
            error_description,
            root_cause,
            solution,
            repair_procedure,
            time_taken,
            spare_parts_used,
            spare_part_images,
            before_repair_images,
            after_repair_images,
            attachments,
            repair_date,
            remarks,
            reported_by,
            engineer_name,
            hospital_name,
            department_name
        } = req.body;

        // ✅ Check if entry exists
        let sql = `
            SELECT kb.*, e.hospital_id 
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            WHERE kb.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Knowledge base entry not found' 
            });
        }

        // ✅ Update query
        await query(
            `UPDATE knowledge_base SET 
             error_code = ?, 
             error_title = ?, 
             error_description = ?,
             root_cause = ?, 
             solution = ?, 
             repair_procedure = ?,
             time_taken = ?, 
             spare_parts_used = ?,
             spare_part_images = ?,
             before_repair_images = ?,
             after_repair_images = ?,
             attachments = ?,
             repair_date = ?,
             remarks = ?,
             reported_by = ?,
             engineer_name = ?,
             hospital_name = ?,
             department_name = ?
             WHERE id = ?`,
            [
                error_code || null,
                error_title,
                error_description || null,
                root_cause || null,
                solution || null,
                repair_procedure || null,
                time_taken ? parseInt(time_taken) : null,
                spare_parts_used || null,
                spare_part_images || null,
                before_repair_images || null,
                after_repair_images || null,
                attachments || null,
                repair_date || null,
                remarks || null,
                reported_by || null,
                engineer_name || null,
                hospital_name || null,
                department_name || null,
                id
            ]
        );

        res.json({ 
            success: true, 
            message: 'Knowledge base entry updated successfully' 
        });
    } catch (error) {
        console.error('Update knowledge base error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update knowledge base entry' 
        });
    }
});

// ============================================================
// ✅ DELETE KNOWLEDGE BASE ENTRY
// ============================================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        let sql = `
            SELECT kb.*, e.hospital_id 
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            WHERE kb.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Knowledge base entry not found' 
            });
        }

        await query('DELETE FROM knowledge_base WHERE id = ?', [id]);
        res.json({ 
            success: true, 
            message: 'Knowledge base entry deleted successfully' 
        });
    } catch (error) {
        console.error('Delete knowledge base error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete knowledge base entry' 
        });
    }
});

module.exports = router;