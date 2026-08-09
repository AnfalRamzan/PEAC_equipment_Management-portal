const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// ✅ GET ALL REPAIRS
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT r.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.hospital_id,
                   u.full_name as engineer_name,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN users u ON r.engineer_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY r.created_at DESC';
        
        const repairs = await query(sql, params);
        res.json({ success: true, repairs });
    } catch (error) {
        console.error('Get repairs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repairs' });
    }
});

// ============================================
// ✅ GET SINGLE REPAIR
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT r.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   u.full_name as engineer_name,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN users u ON r.engineer_id = u.id
            WHERE r.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
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
            'SELECT * FROM spare_parts WHERE repair_id = ?',
            [id]
        );

        res.json({
            success: true,
            repair: repairs[0],
            spare_parts: spareParts
        });
    } catch (error) {
        console.error('Get repair error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repair' });
    }
});

// ============================================
// ✅ CREATE REPAIR (WITH NOTIFICATION)
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            error_log_id,
            engineer_id,
            root_cause,
            problem_analysis,
            corrective_action,
            repair_procedure,
            solution_description,
            time_taken,
            spare_part_used,
            remarks,
            status
        } = req.body;

        // Validate
        if (!error_log_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Error log is required' 
            });
        }

        // Check error log exists and get equipment info
        const errorLog = await query(`
            SELECT el.*, e.id as equipment_id, e.name as equipment_name, e.hospital_id
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE el.id = ?
        `, [error_log_id]);

        if (errorLog.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error log not found' 
            });
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (errorLog[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        const result = await query(
            `INSERT INTO repairs 
             (error_log_id, engineer_id, root_cause, problem_analysis,
              corrective_action, repair_procedure, solution_description,
              time_taken, spare_part_used, remarks, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [error_log_id, engineer_id || req.user.id, root_cause || null, problem_analysis || null,
             corrective_action || null, repair_procedure || null, solution_description || null,
             time_taken ? parseInt(time_taken) : null, 
             spare_part_used === 'Yes' ? 1 : 0, 
             remarks || null, 
             status || 'In Progress']
        );

        // Update error log status
        await query(
            'UPDATE error_logs SET status = "In Progress" WHERE id = ?',
            [error_log_id]
        );

        // ✅ NEW: Notifications
        const equipmentName = errorLog[0].equipment_name;
        const hospitalId = errorLog[0].hospital_id;

        // Notify hospital admins
        await query(
            `INSERT INTO notifications (user_id, title, message, type)
             SELECT u.id, 'Repair Started', 
                    CONCAT('Repair started for ', ?), 'Repair'
             FROM users u
             WHERE u.role_id = 2 
               AND u.hospital_id = ?
               AND u.is_active = TRUE`,
            [equipmentName, hospitalId]
        );

        // Notify reported user
        if (errorLog[0].reported_by) {
            await query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, 'Repair Started for Your Error', 
                         CONCAT('Repair started for ', ?), 'Repair')`,
                [errorLog[0].reported_by, equipmentName]
            );
        }

        const newRepair = await query(
            `SELECT r.*, 
                    e.name as equipment_name,
                    u.full_name as engineer_name
             FROM repairs r
             LEFT JOIN error_logs el ON r.error_log_id = el.id
             LEFT JOIN equipment e ON el.equipment_id = e.id
             LEFT JOIN users u ON r.engineer_id = u.id
             WHERE r.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Repair record created successfully',
            repair: newRepair[0]
        });
    } catch (error) {
        console.error('Create repair error:', error);
        res.status(500).json({ success: false, message: 'Failed to create repair' });
    }
});

// ============================================
// ✅ UPDATE REPAIR (WITH STATUS CHANGE NOTIFICATION)
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            engineer_id,
            root_cause,
            problem_analysis,
            corrective_action,
            repair_procedure,
            solution_description,
            time_taken,
            spare_part_used,
            remarks,
            status
        } = req.body;

        // Check access
        let sql = `
            SELECT r.*, el.equipment_id, e.name as equipment_name, e.hospital_id
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
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

        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        await query(
            `UPDATE repairs SET 
             engineer_id = ?, root_cause = ?, problem_analysis = ?,
             corrective_action = ?, repair_procedure = ?, solution_description = ?,
             time_taken = ?, spare_part_used = ?, remarks = ?, status = ?
             WHERE id = ?`,
            [engineer_id || req.user.id, root_cause || null, problem_analysis || null,
             corrective_action || null, repair_procedure || null, solution_description || null,
             time_taken ? parseInt(time_taken) : null,
             spare_part_used === 'Yes' ? 1 : 0,
             remarks || null, status || 'In Progress', id]
        );

        // Update error log status if repair is completed
        if (status === 'Completed' || status === 'Verified') {
            await query(
                'UPDATE error_logs SET status = "Resolved" WHERE id = ?',
                [existing[0].error_log_id]
            );

            // ✅ NEW: Notify on completion
            const equipmentName = existing[0].equipment_name;
            const hospitalId = existing[0].hospital_id;

            // Notify hospital admins
            await query(
                `INSERT INTO notifications (user_id, title, message, type)
                 SELECT u.id, 'Repair Completed', 
                        CONCAT('Repair completed for ', ?), 'Repair'
                 FROM users u
                 WHERE u.role_id = 2 
                   AND u.hospital_id = ?
                   AND u.is_active = TRUE`,
                [equipmentName, hospitalId]
            );

            // Notify reported user
            const errorLog = await query(
                'SELECT reported_by FROM error_logs WHERE id = ?',
                [existing[0].error_log_id]
            );
            if (errorLog.length > 0 && errorLog[0].reported_by) {
                await query(
                    `INSERT INTO notifications (user_id, title, message, type)
                     VALUES (?, 'Your Error is Resolved', 
                             CONCAT('Error for ', ?, ' has been resolved'), 'Repair')`,
                    [errorLog[0].reported_by, equipmentName]
                );
            }

            // ✅ NEW: Auto-save to knowledge base
            await query(
                `INSERT INTO knowledge_base 
                 (equipment_id, error_code, error_title, error_description,
                  root_cause, solution, repair_procedure, time_taken,
                  spare_parts_used, created_by)
                 SELECT el.equipment_id, el.error_code, el.error_title, 
                        el.error_description, r.root_cause, 
                        r.solution_description, r.repair_procedure, 
                        r.time_taken,
                        CASE WHEN r.spare_part_used = 1 THEN 'Yes' ELSE 'No' END,
                        r.engineer_id
                 FROM repairs r
                 LEFT JOIN error_logs el ON r.error_log_id = el.id
                 WHERE r.id = ?
                 ON DUPLICATE KEY UPDATE 
                   root_cause = VALUES(root_cause),
                   solution = VALUES(solution)`,
                [id]
            );
        }

        res.json({ 
            success: true, 
            message: 'Repair updated successfully' 
        });
    } catch (error) {
        console.error('Update repair error:', error);
        res.status(500).json({ success: false, message: 'Failed to update repair' });
    }
});

// ============================================
// ✅ DELETE REPAIR
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check access
        let sql = `
            SELECT r.*, e.hospital_id
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
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

        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        // Delete spare parts first
        await query('DELETE FROM spare_parts WHERE repair_id = ?', [id]);
        await query('DELETE FROM repairs WHERE id = ?', [id]);

        res.json({ 
            success: true, 
            message: 'Repair deleted successfully' 
        });
    } catch (error) {
        console.error('Delete repair error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete repair' });
    }
});

module.exports = router;