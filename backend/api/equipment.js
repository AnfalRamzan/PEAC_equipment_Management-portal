// backend/routes/maintenance.js
// ✅ FIXED: Engineer ID filter for GET all maintenance schedules
// ✅ ADDED: Status, Date range, Equipment filters
// ✅ ADDED: My Maintenance route for engineers
// ✅ ADDED: Maintenance statistics route

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
// ✅ GET ALL MAINTENANCE SCHEDULES - WITH ENGINEER ID FILTER
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name,
                   u.full_name as engineer_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON m.engineer_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ ADD: Engineer ID filter - for engineer reports
        if (req.query.engineer_id) {
            sql += ' AND m.engineer_id = ?';
            params.push(req.query.engineer_id);
            console.log('🔍 Filtering maintenance for engineer_id:', req.query.engineer_id);
        }

        // ✅ ADD: Status filter
        if (req.query.status) {
            sql += ' AND m.status = ?';
            params.push(req.query.status);
            console.log('🔍 Filtering maintenance by status:', req.query.status);
        }

        // ✅ ADD: Equipment filter
        if (req.query.equipment_id) {
            sql += ' AND m.equipment_id = ?';
            params.push(req.query.equipment_id);
            console.log('🔍 Filtering maintenance for equipment_id:', req.query.equipment_id);
        }

        // ✅ ADD: Date range filter
        if (req.query.start_date) {
            sql += ' AND DATE(m.created_at) >= ?';
            params.push(req.query.start_date);
            console.log('🔍 Filtering maintenance from start_date:', req.query.start_date);
        }
        if (req.query.end_date) {
            sql += ' AND DATE(m.created_at) <= ?';
            params.push(req.query.end_date);
            console.log('🔍 Filtering maintenance until end_date:', req.query.end_date);
        }

        // ✅ Hospital filter for non-super-admin
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC';
        const schedules = await query(sql, params);
        console.log('✅ Found', schedules.length, 'maintenance schedules');
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get maintenance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance schedules' });
    }
});

// ============================================
// ✅ GET SINGLE MAINTENANCE SCHEDULE
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name,
                   u.full_name as engineer_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON m.engineer_id = u.id
            WHERE m.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const schedules = await query(sql, params);
        if (schedules.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        res.json({ success: true, schedule: schedules[0] });
    } catch (error) {
        console.error('❌ Get maintenance schedule error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance schedule' });
    }
});

// ============================================
// ✅ CREATE MAINTENANCE SCHEDULE
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const { 
            equipment_id, 
            maintenance_type, 
            frequency, 
            last_maintenance_date, 
            next_due_date,
            maintenance_checklist, 
            calibration_date, 
            warranty_expiry, 
            amc_details, 
            status,
            engineer_id,
            engineer_name,
            description, 
            priority 
        } = req.body;

        console.log('📅 Creating maintenance schedule for equipment:', equipment_id);
        console.log('👷 Engineer ID:', engineer_id);
        console.log('📌 User role:', req.user.role_name);

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        // Permission check
        if (!isSuperAdmin && !isHospitalAdmin && !isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions to create maintenance schedules' 
            });
        }

        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }

        // Check equipment access
        let checkSql = 'SELECT e.*, h.name as hospital_name FROM equipment e LEFT JOIN hospitals h ON e.hospital_id = h.id WHERE e.id = ?';
        let checkParams = [equipment_id];
        
        if (!isSuperAdmin) {
            checkSql += ' AND e.hospital_id = ?';
            checkParams.push(req.user.hospital_id);
        }
        
        const equipment = await query(checkSql, checkParams);
        if (equipment.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found or access denied' 
            });
        }

        // Check if engineer exists (if provided)
        let finalEngineerId = engineer_id || null;
        if (engineer_id) {
            const engineerCheck = await query(
                'SELECT id, full_name FROM users WHERE id = ? AND is_active = 1 AND role_id = 3',
                [engineer_id]
            );
            if (engineerCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Engineer not found or inactive'
                });
            }
            // If engineer_name not provided, use from database
            if (!engineer_name && engineerCheck.length > 0) {
                // We'll use the provided engineer_name or get from DB
            }
        }

        // If engineer is creating, assign to themselves
        if (isEngineer && !engineer_id) {
            finalEngineerId = req.user.id;
        }

        const result = await query(
            `INSERT INTO maintenance_schedule 
             (equipment_id, maintenance_type, frequency,
              last_maintenance_date, next_due_date,
              maintenance_checklist, calibration_date,
              warranty_expiry, amc_details, status,
              engineer_id, engineer_name, description, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                equipment_id,
                maintenance_type || 'Preventive',
                frequency || 'Monthly',
                last_maintenance_date || null,
                next_due_date || null,
                maintenance_checklist || null,
                calibration_date || null,
                warranty_expiry || null,
                amc_details || null,
                status || 'Scheduled',
                finalEngineerId,
                engineer_name || null,
                description || null,
                priority || 'Medium'
            ]
        );

        console.log('✅ Maintenance schedule created. ID:', result.insertId);

        // ✅ Notifications
        const equipmentName = equipment[0].name || 'Equipment';
        const hospitalId = equipment[0].hospital_id;

        await createNotification(
            1,
            '📋 New Maintenance Schedule',
            `Maintenance schedule created for "${equipmentName}"`,
            'maintenance',
            result.insertId,
            'maintenance'
        );

        // Notify assigned engineer
        if (finalEngineerId) {
            await createNotification(
                finalEngineerId,
                '🔧 New Maintenance Task',
                `You have been assigned a maintenance task for "${equipmentName}"`,
                'maintenance',
                result.insertId,
                'maintenance'
            );
        }

        // Notify hospital admins
        await query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_module)
             SELECT u.id, '📋 New Maintenance Schedule', 
                    CONCAT('Maintenance schedule created for ', ?), 'maintenance', ?, 'maintenance'
             FROM users u
             WHERE u.role_id = 2 
               AND u.hospital_id = ?
               AND u.is_active = TRUE`,
            [equipmentName, result.insertId, hospitalId]
        );

        const newSchedule = await query(
            `SELECT m.*, e.name as equipment_name, h.name as hospital_name
             FROM maintenance_schedule m
             LEFT JOIN equipment e ON m.equipment_id = e.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             WHERE m.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Maintenance schedule created successfully',
            schedule: newSchedule[0]
        });
    } catch (error) {
        console.error('❌ Create maintenance error:', error);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create maintenance schedule: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE MAINTENANCE SCHEDULE
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            maintenance_type, 
            frequency, 
            last_maintenance_date, 
            next_due_date,
            maintenance_checklist, 
            calibration_date,
            warranty_expiry, 
            amc_details, 
            status,
            engineer_id,
            engineer_name,
            description, 
            priority 
        } = req.body;

        console.log('🔄 Updating maintenance schedule. ID:', id);
        console.log('📌 User role:', req.user.role_name);

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        // Check access
        let sql = `
            SELECT m.*, e.hospital_id, e.name as equipment_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE m.id = ?
        `;
        const existing = await query(sql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        // Permission check
        if (!isSuperAdmin) {
            if (isHospitalAdmin && existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied: You can only update maintenance in your hospital' 
                });
            }
            if (isEngineer) {
                // Engineer can update only if assigned to them
                if (existing[0].engineer_id !== req.user.id) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Access denied: You can only update maintenance assigned to you' 
                    });
                }
            }
            if (!isHospitalAdmin && !isEngineer) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Insufficient permissions' 
                });
            }
        }

        // Check if engineer exists (if provided)
        let finalEngineerId = engineer_id || existing[0].engineer_id;
        if (engineer_id) {
            const engineerCheck = await query(
                'SELECT id, full_name FROM users WHERE id = ? AND is_active = 1 AND role_id = 3',
                [engineer_id]
            );
            if (engineerCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Engineer not found or inactive'
                });
            }
        }

        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
        const finalStatus = validStatuses.includes(status) ? status : existing[0].status;

        const oldStatus = existing[0].status;

        await query(
            `UPDATE maintenance_schedule SET 
             maintenance_type = ?,
             frequency = ?,
             last_maintenance_date = ?,
             next_due_date = ?,
             maintenance_checklist = ?,
             calibration_date = ?,
             warranty_expiry = ?,
             amc_details = ?,
             status = ?,
             engineer_id = ?,
             engineer_name = ?,
             description = ?,
             priority = ?
             WHERE id = ?`,
            [
                maintenance_type || existing[0].maintenance_type,
                frequency || existing[0].frequency,
                last_maintenance_date !== undefined ? last_maintenance_date : existing[0].last_maintenance_date,
                next_due_date !== undefined ? next_due_date : existing[0].next_due_date,
                maintenance_checklist !== undefined ? maintenance_checklist : existing[0].maintenance_checklist,
                calibration_date !== undefined ? calibration_date : existing[0].calibration_date,
                warranty_expiry !== undefined ? warranty_expiry : existing[0].warranty_expiry,
                amc_details !== undefined ? amc_details : existing[0].amc_details,
                finalStatus,
                finalEngineerId,
                engineer_name !== undefined ? engineer_name : existing[0].engineer_name,
                description !== undefined ? description : existing[0].description,
                priority || existing[0].priority,
                id
            ]
        );

        console.log('✅ Maintenance schedule updated:', id);

        // ✅ Notify on status change
        if (status && status !== oldStatus) {
            const equipmentName = existing[0].equipment_name || 'Equipment';
            
            if (status === 'Completed') {
                await createNotification(
                    1,
                    '✅ Maintenance Completed',
                    `Maintenance completed for "${equipmentName}"`,
                    'maintenance',
                    id,
                    'maintenance'
                );
            }

            if (finalEngineerId && finalEngineerId !== existing[0].engineer_id) {
                await createNotification(
                    finalEngineerId,
                    '🔧 Maintenance Task Assigned',
                    `You have been assigned a maintenance task for "${equipmentName}"`,
                    'maintenance',
                    id,
                    'maintenance'
                );
            }
        }

        const updatedSchedule = await query(
            `SELECT m.*, e.name as equipment_name, h.name as hospital_name
             FROM maintenance_schedule m
             LEFT JOIN equipment e ON m.equipment_id = e.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             WHERE m.id = ?`,
            [id]
        );

        res.json({ 
            success: true, 
            message: 'Maintenance schedule updated successfully',
            schedule: updatedSchedule[0]
        });
    } catch (error) {
        console.error('❌ Update maintenance error:', error);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update maintenance schedule: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET MAINTENANCE BY EQUIPMENT
// ============================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        let sql = `
            SELECT m.*, 
                   u.full_name as engineer_name
            FROM maintenance_schedule m
            LEFT JOIN users u ON m.engineer_id = u.id
            WHERE m.equipment_id = ?
        `;
        const params = [equipmentId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND EXISTS (SELECT 1 FROM equipment e WHERE e.id = m.equipment_id AND e.hospital_id = ?)';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC';
        
        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get maintenance by equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance schedules' });
    }
});

// ============================================
// ✅ GET MY MAINTENANCE TASKS (For Engineer)
// ============================================
router.get('/my-maintenance', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE m.engineer_id = ?
        `;
        const params = [userId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC';
        
        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get my maintenance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance tasks' });
    }
});

// ============================================
// ✅ GET MAINTENANCE STATISTICS
// ============================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high_priority,
                SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as medium_priority,
                SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as low_priority
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ ADD: Engineer ID filter
        if (req.query.engineer_id) {
            sql += ' AND m.engineer_id = ?';
            params.push(req.query.engineer_id);
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ success: true, stats: stats[0] || {} });
    } catch (error) {
        console.error('❌ Get maintenance stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

// ============================================
// ✅ DELETE MAINTENANCE SCHEDULE
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting maintenance schedule. ID:', id);

        // Check access
        let sql = `
            SELECT m.*, e.hospital_id
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE m.id = ?
        `;
        const existing = await query(sql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
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

        await query('DELETE FROM maintenance_schedule WHERE id = ?', [id]);

        console.log('✅ Maintenance schedule deleted:', id);
        res.json({ 
            success: true, 
            message: 'Maintenance schedule deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete maintenance schedule: ' + error.message 
        });
    }
});

module.exports = router;