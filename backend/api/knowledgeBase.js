// backend/routes/knowledgeBase.js
// ✅ FIXED: Remove hospital filter for GET /equipment/:equipmentId

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================
// ✅ GET KNOWLEDGE BASE BY EQUIPMENT - FIXED
// ✅ Remove hospital filter so ALL users can see ALL solutions
// ============================================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        // ✅ REMOVED hospital_id filter - all users can see all solutions
        const sql = `
            SELECT kb.*, 
                   u.full_name as created_by_name,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   d.name as department_name
            FROM knowledge_base kb
            LEFT JOIN users u ON kb.created_by = u.id
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE kb.equipment_id = ?
            ORDER BY kb.created_at DESC
        `;
        
        const entries = await query(sql, [equipmentId]);
        
        console.log(`📚 Found ${entries.length} solutions for equipment ${equipmentId}`);
        
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
// ✅ GET ALL KNOWLEDGE BASE - FIXED
// ✅ Remove hospital filter so ALL users can see ALL solutions
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        // ✅ REMOVED hospital_id filter - all users can see all solutions
        const sql = `
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
            ORDER BY kb.created_at DESC
        `;
        
        const entries = await query(sql);
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
// ✅ GET SINGLE KNOWLEDGE BASE ENTRY
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT kb.*, 
                   u.full_name as created_by_name,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   d.name as department_name
            FROM knowledge_base kb
            LEFT JOIN users u ON kb.created_by = u.id
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE kb.id = ?
        `;
        
        const entries = await query(sql, [id]);
        
        if (entries.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Knowledge base entry not found' 
            });
        }
        
        res.json({ success: true, entry: entries[0] });
    } catch (error) {
        console.error('Get knowledge base entry error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch knowledge base entry' 
        });
    }
});

// ============================================================
// ✅ CREATE KNOWLEDGE BASE ENTRY - (No changes needed)
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

        // ✅ VALIDATION
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
        const equipment = await query(
            'SELECT id, name, hospital_id FROM equipment WHERE id = ?',
            [equipment_id]
        );
        
        if (equipment.length === 0) {
            console.log('❌ Equipment not found');
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }

        // ✅ Get hospital_id from equipment
        const hospitalId = equipment[0].hospital_id;

        // ✅ INSERT QUERY
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
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create knowledge base entry: ' + error.message,
            details: error.sql || null
        });
    }
});

// ============================================================
// ✅ UPDATE KNOWLEDGE BASE ENTRY - (No changes needed)
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
        const existing = await query(
            'SELECT * FROM knowledge_base WHERE id = ?',
            [id]
        );
        
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
// ✅ DELETE KNOWLEDGE BASE ENTRY - (No changes needed)
// ============================================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Check if entry exists
        const existing = await query(
            'SELECT * FROM knowledge_base WHERE id = ?',
            [id]
        );
        
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