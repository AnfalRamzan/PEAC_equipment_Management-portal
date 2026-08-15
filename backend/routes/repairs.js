// backend/routes/repairs.js
// ✅ FIXED: Engineer ID filter for GET all repairs
// ✅ WITH NOTIFICATIONS & KNOWLEDGE BASE AUTO-SAVE
// ✅ ADDED: Status, Date range filters
// ✅ ADDED: My Repairs route for engineers

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
        if (engineer_id) {
            const engineerCheck = await query(
                'SELECT id FROM users WHERE id = ? AND is_active = 1',
                [engineer_id]
            );
            if (engineerCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Engineer not found or inactive'
                });
            }
        }

        const result = await query(
            `INSERT INTO repairs 
             (error_log_id, engineer_id, root_cause, problem_analysis,
              corrective_action, repair_procedure, solution_description,
              time_taken, spare_part_used, remarks, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                error_log_id, 
                finalEngineerId, 
                root_cause || null, 
                problem_analysis || null,
                corrective_action || null, 
                repair_procedure || null, 
                solution_description || null,
                time_taken ? parseInt(time_taken) : null, 
                spare_part_used === 'Yes' ? 1 : 0, 
                remarks || null, 
                status || 'In Progress'
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
        if (engineer_id) {
            const engineerCheck = await query(
                'SELECT id FROM users WHERE id = ? AND is_active = 1',
                [engineer_id]
            );
            if (engineerCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Engineer not found or inactive'
                });
            }
        }

        const oldStatus = existing[0].status;
        const finalStatus = status || 'In Progress';
        const spareUsed = spare_part_used === 'Yes' ? 1 : 0;

        await query(
            `UPDATE repairs SET 
             engineer_id = ?, root_cause = ?, problem_analysis = ?,
             corrective_action = ?, repair_procedure = ?, solution_description = ?,
             time_taken = ?, spare_part_used = ?, remarks = ?, status = ?
             WHERE id = ?`,
            [
                finalEngineerId, 
                root_cause || existing[0].root_cause, 
                problem_analysis || existing[0].problem_analysis,
                corrective_action || existing[0].corrective_action, 
                repair_procedure || existing[0].repair_procedure, 
                solution_description || existing[0].solution_description,
                time_taken ? parseInt(time_taken) : existing[0].time_taken,
                spareUsed,
                remarks || existing[0].remarks, 
                finalStatus, 
                id
            ]
        );

        console.log('✅ Repair updated successfully:', id);

        // Update error log status if repair is completed
        const isCompleted = ['Completed', 'Verified', 'Resolved', 'Closed'].includes(finalStatus);
        if (isCompleted && oldStatus !== finalStatus) {
            await query(
                'UPDATE error_logs SET status = "Resolved" WHERE id = ?',
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

            // ✅ Auto-save to knowledge base
            try {
                // Check if already exists
                const existingKB = await query(
                    `SELECT id FROM knowledge_base 
                     WHERE equipment_id = ? AND error_title LIKE ?`,
                    [
                        existing[0].equipment_id,
                        `%${(existing[0].error_title || '').substring(0, 30)}%`
                    ]
                );

                if (existingKB.length === 0) {
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
                         WHERE r.id = ?`,
                        [id]
                    );
                    console.log('📚 Auto-saved to knowledge base from repair:', id);
                }
            } catch (kbError) {
                console.log('⚠️ Knowledge base auto-save warning:', kbError.message);
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
            SELECT r.*, 
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
            SELECT r.*, 
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
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
                AVG(time_taken) as avg_time_taken
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