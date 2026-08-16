// backend/routes/repairs.js
// ✅ FIXED: Engineer ID filter for GET all repairs
// ✅ WITH NOTIFICATIONS & KNOWLEDGE BASE AUTO-SAVE
// ✅ ADDED: Status, Date range filters
// ✅ ADDED: My Repairs route for engineers
// ✅ REMOVED: root_cause, corrective_action, solution_description, time_taken
// ✅ UPDATED: problem_analysis and repair_procedure only

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
// ✅ GET ALL REPAIRS - WITH ENGINEER ID FILTER
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT r.id, r.error_log_id, r.engineer_id, r.engineer_name,
                   r.status, r.problem_analysis, r.repair_procedure,
                   r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                   r.created_at, r.updated_at,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.hospital_id,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ ADD: Engineer ID filter - for engineer reports
        if (req.query.engineer_id) {
            sql += ' AND r.engineer_id = ?';
            params.push(req.query.engineer_id);
            console.log('🔍 Filtering repairs for engineer_id:', req.query.engineer_id);
        }

        // ✅ ADD: Status filter
        if (req.query.status) {
            sql += ' AND r.status = ?';
            params.push(req.query.status);
            console.log('🔍 Filtering repairs by status:', req.query.status);
        }

        // ✅ ADD: Date range filter
        if (req.query.start_date) {
            sql += ' AND DATE(r.created_at) >= ?';
            params.push(req.query.start_date);
            console.log('🔍 Filtering repairs from start_date:', req.query.start_date);
        }
        if (req.query.end_date) {
            sql += ' AND DATE(r.created_at) <= ?';
            params.push(req.query.end_date);
            console.log('🔍 Filtering repairs until end_date:', req.query.end_date);
        }

        // ✅ Hospital filter for non-super-admin
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY r.created_at DESC';
        
        const repairs = await query(sql, params);
        console.log('✅ Found', repairs.length, 'repairs');
        res.json({ success: true, repairs });
    } catch (error) {
        console.error('❌ Get repairs error:', error);
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
            SELECT r.id, r.error_log_id, r.engineer_id, r.engineer_name,
                   r.status, r.problem_analysis, r.repair_procedure,
                   r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                   r.created_at, r.updated_at,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
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
        console.error('❌ Get repair error:', error);
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
            problem_analysis,
            repair_procedure,
            spare_part_used,
            remarks,
            status,
            repair_date,
            attachments
        } = req.body;

        console.log('🛠️ Creating repair for error log:', error_log_id);
        console.log('👤 User ID:', req.user.id, 'Role:', req.user.role_name);

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

        // Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (errorLog[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        // Check if engineer exists (if provided)
        let finalEngineerId = engineer_id || req.user.id;
        let finalEngineerName = null;
        
        if (engineer_id) {
            const engineerCheck = await query(
                'SELECT id, full_name FROM users WHERE id = ? AND is_active = 1',
                [engineer_id]
            );
            if (engineerCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Engineer not found or inactive'
                });
            }
            finalEngineerName = engineerCheck[0].full_name;
        } else {
            // Get current user name
            const userCheck = await query(
                'SELECT full_name FROM users WHERE id = ?',
                [req.user.id]
            );
            if (userCheck.length > 0) {
                finalEngineerName = userCheck[0].full_name;
            }
        }

        const spareUsed = spare_part_used === 'Yes' ? 1 : 0;
        const finalStatus = status || 'In Progress';
        const finalRepairDate = repair_date || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await query(
            `INSERT INTO repairs 
             (error_log_id, engineer_id, engineer_name, problem_analysis,
              repair_procedure, spare_part_used, remarks, status, repair_date, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                error_log_id, 
                finalEngineerId,
                finalEngineerName,
                problem_analysis || null, 
                repair_procedure || null,
                spareUsed,
                remarks || null, 
                finalStatus,
                finalRepairDate,
                attachments || null
            ]
        );

        console.log('✅ Repair created successfully. ID:', result.insertId);

        // Update error log status
        await query(
            'UPDATE error_logs SET status = "In Progress" WHERE id = ?',
            [error_log_id]
        );

        // ✅ Notifications
        const equipmentName = errorLog[0].equipment_name || 'Equipment';
        const hospitalId = errorLog[0].hospital_id;

        // Notify Super Admin
        await createNotification(
            1,
            '🔧 New Repair Started',
            `Repair started for "${equipmentName}" - ${errorLog[0].error_title || 'Error'}`,
            'repair',
            result.insertId,
            'repairs'
        );

        // Notify hospital admins
        await query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_module)
             SELECT u.id, '🔧 Repair Started', 
                    CONCAT('Repair started for ', ?), 'repair', ?, 'repairs'
             FROM users u
             WHERE u.role_id = 2 
               AND u.hospital_id = ?
               AND u.is_active = TRUE`,
            [equipmentName, result.insertId, hospitalId]
        );

        // Notify reported user
        if (errorLog[0].reported_by) {
            await createNotification(
                errorLog[0].reported_by,
                '🔧 Repair Started for Your Error',
                `Repair started for "${equipmentName}"`,
                'repair',
                result.insertId,
                'repairs'
            );
        }

        const newRepair = await query(
            `SELECT r.id, r.error_log_id, r.engineer_id, r.engineer_name,
                    r.status, r.problem_analysis, r.repair_procedure,
                    r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                    r.created_at, r.updated_at,
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
        console.error('❌ Create repair error:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create repair: ' + error.message 
        });
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
            problem_analysis,
            repair_procedure,
            spare_part_used,
            remarks,
            status,
            repair_date,
            attachments
        } = req.body;

        console.log('🔄 Updating repair ID:', id);
        console.log('📌 User role:', req.user.role_name);

        // Check access
        let sql = `
            SELECT r.*, el.equipment_id, e.name as equipment_name, e.hospital_id, el.error_title
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

        // Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        // Check if engineer exists (if provided)
        let finalEngineerId = engineer_id || existing[0].engineer_id;
        let finalEngineerName = null;
        
        if (engineer_id) {
            const engineerCheck = await query(
                'SELECT id, full_name FROM users WHERE id = ? AND is_active = 1',
                [engineer_id]
            );
            if (engineerCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Engineer not found or inactive'
                });
            }
            finalEngineerName = engineerCheck[0].full_name;
        } else {
            // Get user name
            const userCheck = await query(
                'SELECT full_name FROM users WHERE id = ?',
                [existing[0].engineer_id]
            );
            if (userCheck.length > 0) {
                finalEngineerName = userCheck[0].full_name;
            }
        }

        const oldStatus = existing[0].status;
        const finalStatus = status || existing[0].status || 'In Progress';
        const spareUsed = spare_part_used === 'Yes' ? 1 : 0;

        await query(
            `UPDATE repairs SET 
             engineer_id = ?,
             engineer_name = ?,
             problem_analysis = ?,
             repair_procedure = ?,
             spare_part_used = ?,
             remarks = ?,
             status = ?,
             repair_date = ?,
             attachments = ?
             WHERE id = ?`,
            [
                finalEngineerId,
                finalEngineerName || existing[0].engineer_name,
                problem_analysis || existing[0].problem_analysis,
                repair_procedure || existing[0].repair_procedure,
                spareUsed,
                remarks || existing[0].remarks,
                finalStatus,
                repair_date || existing[0].repair_date,
                attachments !== undefined ? attachments : existing[0].attachments,
                id
            ]
        );

        console.log('✅ Repair updated successfully:', id);

        // Update error log status if repair is completed
        const isCompleted = ['Completed', 'Verified', 'Resolved', 'Closed'].includes(finalStatus);
        if (isCompleted && oldStatus !== finalStatus) {
            await query(
                'UPDATE error_logs SET status = "Resolved", resolved_at = NOW() WHERE id = ?',
                [existing[0].error_log_id]
            );

            // ✅ Notify on completion
            const equipmentName = existing[0].equipment_name || 'Equipment';
            const hospitalId = existing[0].hospital_id;

            // Notify Super Admin
            await createNotification(
                1,
                '✅ Repair Completed',
                `Repair completed for "${equipmentName}" - ${existing[0].error_title || 'Error'}`,
                'repair',
                id,
                'repairs'
            );

            // Notify hospital admins
            await query(
                `INSERT INTO notifications (user_id, title, message, type, related_id, related_module)
                 SELECT u.id, '✅ Repair Completed', 
                        CONCAT('Repair completed for ', ?), 'repair', ?, 'repairs'
                 FROM users u
                 WHERE u.role_id = 2 
                   AND u.hospital_id = ?
                   AND u.is_active = TRUE`,
                [equipmentName, id, hospitalId]
            );

            // Notify reported user
            const errorLog = await query(
                'SELECT reported_by FROM error_logs WHERE id = ?',
                [existing[0].error_log_id]
            );
            if (errorLog.length > 0 && errorLog[0].reported_by) {
                await createNotification(
                    errorLog[0].reported_by,
                    '✅ Your Error is Resolved',
                    `Error for "${equipmentName}" has been resolved`,
                    'repair',
                    id,
                    'repairs'
                );
            }
        }

        res.json({ 
            success: true, 
            message: 'Repair updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update repair error:', error);
        console.error('❌ Error details:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update repair: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET REPAIRS BY EQUIPMENT
// ============================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        let sql = `
            SELECT r.id, r.error_log_id, r.engineer_id, r.engineer_name,
                   r.status, r.problem_analysis, r.repair_procedure,
                   r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                   r.created_at, r.updated_at,
                   u.full_name as engineer_name,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN users u ON r.engineer_id = u.id
            WHERE el.equipment_id = ?
        `;
        const params = [equipmentId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND EXISTS (SELECT 1 FROM equipment e WHERE e.id = el.equipment_id AND e.hospital_id = ?)';
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
// ✅ GET MY REPAIRS (For Engineer)
// ============================================
router.get('/my-repairs', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let sql = `
            SELECT r.id, r.error_log_id, r.engineer_id, r.engineer_name,
                   r.status, r.problem_analysis, r.repair_procedure,
                   r.spare_part_used, r.remarks, r.repair_date, r.attachments,
                   r.created_at, r.updated_at,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE r.engineer_id = ?
        `;
        const params = [userId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
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
// ✅ DELETE REPAIR
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Deleting repair ID:', id);

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

        // Delete spare parts first (foreign key constraint)
        await query('DELETE FROM spare_parts WHERE repair_id = ?', [id]);
        await query('DELETE FROM repairs WHERE id = ?', [id]);

        console.log('✅ Repair deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Repair deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete repair error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete repair: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET REPAIR STATISTICS
// ============================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'Verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ ADD: Engineer ID filter
        if (req.query.engineer_id) {
            sql += ' AND r.engineer_id = ?';
            params.push(req.query.engineer_id);
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
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