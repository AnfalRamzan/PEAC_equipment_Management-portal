// backend/routes/repairs.js
// ✅ COMPLETE FIX - NO engineer_id references
// ✅ FIXED: Uses equipment_id instead of error_log_id
// ✅ FIXED: All routes updated for new schema
// ✅ FIXED: DELETE with CASCADE support (database handles it)
// ✅ FIXED: Proper error handling and logging
// ✅ ADDED: hospital_id support in CREATE and UPDATE

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// ✅ HELPER: CREATE NOTIFICATION
// ============================================
const createNotification = async (userId, title, message, type, relatedId = null, relatedModule = null) => {
    try {
        const result = await query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_module, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, title, message, type, relatedId, relatedModule]
        );
        return result;
    } catch (error) {
        console.error('❌ Notification error:', error);
        return null;
    }
};

// ============================================
// ✅ GET ALL REPAIRS - UPDATED: WITH hospital_name
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT r.id, r.equipment_id, r.hospital_id,
                   r.engineer_name,
                   r.problem_analysis, r.repair_procedure,
                   r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                   r.created_at, r.updated_at,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name
            FROM repairs r
            LEFT JOIN equipment e ON r.equipment_id = e.id
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];

        if (req.query.start_date) {
            sql += ' AND DATE(r.created_at) >= ?';
            params.push(req.query.start_date);
        }
        if (req.query.end_date) {
            sql += ' AND DATE(r.created_at) <= ?';
            params.push(req.query.end_date);
        }

        // ✅ Hospital filter for non-super admins
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND r.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY r.created_at DESC';
        
        const repairs = await query(sql, params);
        res.json({ success: true, repairs });
    } catch (error) {
        console.error('❌ Get repairs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repairs' });
    }
});

// ============================================
// ✅ GET SINGLE REPAIR - UPDATED: WITH hospital_name
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT r.id, r.equipment_id, r.hospital_id,
                   r.engineer_name,
                   r.problem_analysis, r.repair_procedure,
                   r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                   r.created_at, r.updated_at,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name
            FROM repairs r
            LEFT JOIN equipment e ON r.equipment_id = e.id
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            WHERE r.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND r.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const repairs = await query(sql, params);
        
        if (repairs.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Repair not found' 
            });
        }

        const spareParts = await query(
            'SELECT * FROM repair_spare_parts WHERE repair_id = ?',
            [id]
        );

        res.json({
            success: true,
            repair: repairs[0],
            spare_parts: spareParts
        });
    } catch (error) {
        console.error('❌ Get repair error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repair' });
    }
});

// ============================================
// ✅ CREATE REPAIR - UPDATED: WITH hospital_id support
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id,
            hospital_id,        // ✅ NEW: Accept hospital_id from frontend
            engineer_name,
            problem_analysis,
            repair_procedure,
            spare_part_used,
            remarks,
            repair_date,
            attachments
        } = req.body;

        console.log('🛠️ Creating repair for equipment:', equipment_id);
        console.log('🏥 Hospital ID:', hospital_id);
        console.log('👤 Engineer:', engineer_name || req.user.full_name);

        // ✅ Check if equipment exists
        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }

        const equipment = await query(
            'SELECT id, name, hospital_id FROM equipment WHERE id = ?',
            [equipment_id]
        );

        if (equipment.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }

        // ✅ Determine final hospital_id
        // Priority: 1. From request body, 2. From equipment, 3. From user
        let finalHospitalId = hospital_id || equipment[0].hospital_id || req.user.hospital_id || null;
        
        if (finalHospitalId) {
            finalHospitalId = parseInt(finalHospitalId);
        }

        // Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            // If user is not super admin, they can only create repairs for their hospital
            if (finalHospitalId !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only create repairs for your hospital' 
                });
            }
        }

        // ✅ Engineers can create repairs
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.role_name !== 'ENGINEER') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Engineers and Super Admin can create repairs' 
            });
        }

        let finalEngineerName = engineer_name || req.user.full_name || '';
        if (!finalEngineerName.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Engineer name is required' 
            });
        }

        const spareUsed = spare_part_used === 'Yes' ? 1 : 0;
        const finalRepairDate = repair_date || new Date().toISOString().slice(0, 19).replace('T', ' ');

        // ✅ INSERT - WITH hospital_id
        const result = await query(
            `INSERT INTO repairs 
             (equipment_id, hospital_id, engineer_name, problem_analysis,
              repair_procedure, spare_part_used, remarks, repair_date, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(equipment_id),
                finalHospitalId,
                finalEngineerName.trim(),
                problem_analysis || null,
                repair_procedure || null,
                spareUsed,
                remarks || null,
                finalRepairDate,
                attachments || null
            ]
        );

        console.log('✅ Repair created successfully. ID:', result.insertId);

        // ✅ Save spare parts if any
        if (req.body.spare_parts && Array.isArray(req.body.spare_parts) && req.body.spare_parts.length > 0) {
            for (const part of req.body.spare_parts) {
                await query(
                    `INSERT INTO repair_spare_parts 
                     (repair_id, part_name, part_number, brand, quantity, unit_cost, total_cost, installation_notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        result.insertId,
                        part.part_name || '',
                        part.part_number || '',
                        part.brand || '',
                        part.quantity || 1,
                        part.unit_cost || 0,
                        part.total_cost || 0,
                        part.installation_notes || ''
                    ]
                );
            }
            console.log(`✅ Added ${req.body.spare_parts.length} spare parts`);
        }

        // Notifications
        const equipmentName = equipment[0].name || 'Equipment';
        const hospitalName = await query(
            'SELECT name FROM hospitals WHERE id = ?',
            [finalHospitalId]
        );
        const hospitalNameStr = hospitalName.length > 0 ? hospitalName[0].name : 'Hospital';

        await createNotification(
            1,
            '🔧 New Repair Started',
            `Repair started for "${equipmentName}" at ${hospitalNameStr}`,
            'repair',
            result.insertId,
            'repairs'
        );

        // Notify hospital admins
        if (finalHospitalId) {
            await query(
                `INSERT INTO notifications (user_id, title, message, type, related_id, related_module, created_at)
                 SELECT u.id, '🔧 Repair Started', 
                        CONCAT('Repair started for "', ?, '" at ', ?), 'repair', ?, 'repairs', NOW()
                 FROM users u
                 WHERE u.role_id = 2 
                   AND u.hospital_id = ?
                   AND u.is_active = 1`,
                [equipmentName, hospitalNameStr, result.insertId, finalHospitalId]
            );
        }

        const newRepair = await query(
            `SELECT r.id, r.equipment_id, r.hospital_id,
                    r.engineer_name,
                    r.problem_analysis, r.repair_procedure,
                    r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                    r.created_at, r.updated_at,
                    e.name as equipment_name,
                    h.name as hospital_name
             FROM repairs r
             LEFT JOIN equipment e ON r.equipment_id = e.id
             LEFT JOIN hospitals h ON r.hospital_id = h.id
             WHERE r.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Repair record created successfully',
            repair: newRepair[0]
        });
    } catch (error) {
        console.error('❌ Create repair error:', error);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create repair: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE REPAIR - UPDATED: WITH hospital_id support
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_id,
            hospital_id,        // ✅ NEW: Accept hospital_id
            engineer_name,
            problem_analysis,
            repair_procedure,
            spare_part_used,
            remarks,
            repair_date,
            attachments
        } = req.body;

        console.log('🔄 Updating repair ID:', id);

        let sql = `
            SELECT r.*, e.hospital_id as equipment_hospital_id
            FROM repairs r
            LEFT JOIN equipment e ON r.equipment_id = e.id
            WHERE r.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Repair not found' 
            });
        }

        // Only Super Admin can update repairs
        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Super Admin can update repairs' 
            });
        }

        const spareUsed = spare_part_used === 'Yes' ? 1 : 0;
        let finalEquipmentId = equipment_id || existing[0].equipment_id || null;
        if (finalEquipmentId) {
            finalEquipmentId = parseInt(finalEquipmentId);
        }

        // ✅ Determine final hospital_id for update
        let finalHospitalId = hospital_id !== undefined ? hospital_id : existing[0].hospital_id;
        if (finalHospitalId) {
            finalHospitalId = parseInt(finalHospitalId);
        }

        // ✅ UPDATE - WITH hospital_id
        await query(
            `UPDATE repairs SET 
             equipment_id = ?,
             hospital_id = ?,
             engineer_name = ?,
             problem_analysis = ?,
             repair_procedure = ?,
             spare_part_used = ?,
             remarks = ?,
             repair_date = ?,
             attachments = ?
             WHERE id = ?`,
            [
                finalEquipmentId,
                finalHospitalId,
                engineer_name || existing[0].engineer_name,
                problem_analysis || existing[0].problem_analysis,
                repair_procedure || existing[0].repair_procedure,
                spareUsed,
                remarks || existing[0].remarks,
                repair_date || existing[0].repair_date,
                attachments !== undefined ? attachments : existing[0].attachments,
                id
            ]
        );

        console.log('✅ Repair updated successfully:', id);
        res.json({ 
            success: true, 
            message: 'Repair updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update repair error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update repair: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET REPAIRS BY EQUIPMENT - UPDATED
// ============================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        let sql = `
            SELECT r.id, r.equipment_id, r.hospital_id,
                    r.engineer_name,
                    r.problem_analysis, r.repair_procedure,
                    r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                    r.created_at, r.updated_at,
                    h.name as hospital_name
            FROM repairs r
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            WHERE r.equipment_id = ?
        `;
        const params = [equipmentId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND r.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY r.created_at DESC';
        
        const repairs = await query(sql, params);
        res.json({ success: true, repairs });
    } catch (error) {
        console.error('❌ Get repairs by equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repairs' });
    }
});

// ============================================
// ✅ GET MY REPAIRS (For Engineer) - UPDATED
// ============================================
router.get('/my-repairs', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT r.id, r.equipment_id, r.hospital_id,
                   r.engineer_name,
                   r.problem_analysis, r.repair_procedure,
                   r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                   r.created_at, r.updated_at,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name
            FROM repairs r
            LEFT JOIN equipment e ON r.equipment_id = e.id
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            WHERE LOWER(r.engineer_name) = LOWER(?)
        `;
        const params = [req.user.full_name];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND r.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY r.created_at DESC';
        
        const repairs = await query(sql, params);
        res.json({ success: true, repairs });
    } catch (error) {
        console.error('❌ Get my repairs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repairs' });
    }
});

// ============================================
// ✅ DELETE REPAIR - FIXED: Database handles CASCADE automatically
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Deleting repair ID:', id);

        // Check if repair exists
        const existing = await query('SELECT * FROM repairs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Repair not found' 
            });
        }

        // Only Super Admin can delete
        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Super Admin can delete repairs' 
            });
        }

        // ✅ Database will automatically delete spare parts via ON DELETE CASCADE
        await query('DELETE FROM repairs WHERE id = ?', [id]);

        console.log('✅ Repair deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Repair deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete repair error:', error);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete repair: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET REPAIR STATISTICS - UPDATED
// ============================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN spare_part_used = 1 THEN 1 ELSE 0 END) as with_spare_parts,
                COUNT(DISTINCT engineer_name) as unique_engineers,
                COUNT(DISTINCT r.equipment_id) as unique_equipment
            FROM repairs r
            LEFT JOIN equipment e ON r.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND r.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ success: true, stats: stats[0] || {} });
    } catch (error) {
        console.error('❌ Get repair stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

module.exports = router;