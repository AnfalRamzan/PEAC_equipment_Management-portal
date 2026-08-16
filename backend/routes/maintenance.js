// backend/routes/maintenance.js
// ✅ COMPLETE FIXED VERSION
// ✅ AMC Integration
// ✅ Calendar Integration
// ✅ Engineer Performance Tracking
// ✅ Status Management

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// ✅ GET ALL MAINTENANCE SCHEDULES
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   e.hospital_id,
                   h.name as hospital_name,
                   h.city as hospital_city,
                   d.name as department_name,
                   u.full_name as engineer_full_name,
                   u.email as engineer_email
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON LOWER(u.full_name) = LOWER(m.engineer_name)
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC, m.created_at DESC';
        
        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance schedules' 
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
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name,
                   u.full_name as engineer_full_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON LOWER(u.full_name) = LOWER(m.engineer_name)
            WHERE m.equipment_id = ?
        `;
        const params = [equipmentId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC, m.created_at DESC';

        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get equipment maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance for equipment' 
        });
    }
});

// ============================================
// ✅ GET MAINTENANCE BY ENGINEER (FIXED)
// ============================================
router.get('/engineer/:engineerId', authenticate, async (req, res) => {
    try {
        const { engineerId } = req.params;
        
        // Get engineer name and details
        const user = await query('SELECT id, full_name, email, hospital_id FROM users WHERE id = ?', [engineerId]);
        if (user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Engineer not found' 
            });
        }
        
        const engineer = user[0];
        
        let sql = `
            SELECT m.*, 
                   e.id as equipment_id,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   e.installation_year,
                   h.id as hospital_id,
                   h.name as hospital_name,
                   h.city as hospital_city,
                   d.id as department_id,
                   d.name as department_name,
                   u.full_name as engineer_full_name,
                   u.email as engineer_email
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON u.id = ?
            WHERE LOWER(m.engineer_name) = LOWER(?)
        `;
        const params = [engineer.id, engineer.full_name];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY m.next_due_date ASC, m.priority DESC';
        
        const schedules = await query(sql, params);
        
        // ✅ Add engineer info to response
        res.json({ 
            success: true, 
            schedules,
            engineer: {
                id: engineer.id,
                full_name: engineer.full_name,
                email: engineer.email
            }
        });
    } catch (error) {
        console.error('❌ Get engineer maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance for engineer' 
        });
    }
});

// ============================================
// ✅ GET MAINTENANCE BY HOSPITAL
// ============================================
router.get('/hospital/:hospitalId', authenticate, async (req, res) => {
    try {
        const { hospitalId } = req.params;

        if (req.user.role_name !== 'SUPER_ADMIN' && 
            req.user.hospital_id != hospitalId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   h.name as hospital_name,
                   u.full_name as engineer_full_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON LOWER(u.full_name) = LOWER(m.engineer_name)
            WHERE e.hospital_id = ?
            ORDER BY m.next_due_date ASC, m.priority DESC
        `;

        const schedules = await query(sql, [hospitalId]);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get hospital maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance for hospital' 
        });
    }
});

// ============================================
// ✅ GET MAINTENANCE STATS
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
                SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN next_due_date < CURDATE() AND status != 'Completed' AND status != 'Cancelled' THEN 1 ELSE 0 END) as past_due,
                SUM(CASE WHEN next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status != 'Completed' AND status != 'Cancelled' THEN 1 ELSE 0 END) as due_this_week,
                SUM(CASE WHEN next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status != 'Completed' AND status != 'Cancelled' THEN 1 ELSE 0 END) as due_this_month
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ success: true, stats: stats[0] || {} });
    } catch (error) {
        console.error('❌ Get maintenance stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch stats' 
        });
    }
});

// ============================================
// ✅ GET MAINTENANCE BY DATE RANGE
// ============================================
router.get('/date-range', authenticate, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   h.name as hospital_name,
                   u.full_name as engineer_full_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON LOWER(u.full_name) = LOWER(m.engineer_name)
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            sql += ' AND DATE(m.next_due_date) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND DATE(m.next_due_date) <= ?';
            params.push(endDate);
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC';

        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get maintenance by date range error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance by date range' 
        });
    }
});

// ============================================
// ✅ GET MAINTENANCE CALENDAR EVENTS
// ============================================
router.get('/calendar', authenticate, async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let sql = `
            SELECT 
                m.id,
                m.equipment_id,
                m.maintenance_type,
                m.frequency,
                m.last_maintenance_date,
                m.next_due_date,
                m.calibration_date,
                m.warranty_expiry,
                m.amc_details,
                m.status,
                m.priority,
                m.engineer_name,
                m.description,
                m.maintenance_checklist,
                e.name as equipment_name,
                e.model as equipment_model,
                e.serial_number,
                h.name as hospital_name,
                h.id as hospital_id
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];

        if (year && month) {
            sql += ` AND (
                YEAR(next_due_date) = ? AND MONTH(next_due_date) = ?
            )`;
            params.push(year, month);
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC';

        const schedules = await query(sql, params);
        
        // ✅ Format for calendar
        const events = schedules.map(s => ({
            id: s.id,
            title: `${s.equipment_name || 'Unknown'} - ${s.maintenance_type || 'Maintenance'}`,
            start: s.next_due_date,
            end: s.next_due_date,
            status: s.status,
            priority: s.priority,
            equipment_id: s.equipment_id,
            equipment_name: s.equipment_name,
            hospital_name: s.hospital_name,
            engineer_name: s.engineer_name,
            description: s.description,
            allDay: true,
            extendedProps: {
                maintenance_type: s.maintenance_type,
                frequency: s.frequency,
                last_maintenance_date: s.last_maintenance_date,
                amc_details: s.amc_details,
                calibration_date: s.calibration_date,
                warranty_expiry: s.warranty_expiry,
                maintenance_checklist: s.maintenance_checklist
            }
        }));

        res.json({ success: true, events });
    } catch (error) {
        console.error('❌ Get maintenance calendar error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch calendar events' 
        });
    }
});

// ============================================
// ✅ GET UPCOMING MAINTENANCE
// ============================================
router.get('/upcoming', authenticate, async (req, res) => {
    try {
        const { days } = req.query;
        const daysAhead = parseInt(days) || 30;

        let sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   h.name as hospital_name,
                   h.city as hospital_city,
                   u.full_name as engineer_full_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON LOWER(u.full_name) = LOWER(m.engineer_name)
            WHERE DATE(m.next_due_date) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            AND m.status IN ('Scheduled', 'In Progress')
        `;
        const params = [daysAhead];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC, m.priority DESC';

        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get upcoming maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch upcoming maintenance' 
        });
    }
});

// ============================================
// ✅ GET SINGLE MAINTENANCE
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT m.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   e.installation_year,
                   e.status as equipment_status,
                   h.name as hospital_name,
                   h.city as hospital_city,
                   h.phone as hospital_phone,
                   d.name as department_name,
                   u.full_name as engineer_full_name,
                   u.email as engineer_email,
                   u.phone as engineer_phone
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON LOWER(u.full_name) = LOWER(m.engineer_name)
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
        console.error('❌ Get maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance' 
        });
    }
});

// ============================================
// ✅ CREATE MAINTENANCE
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
            engineer_name,
            description,
            priority
        } = req.body;

        console.log('📅 Creating maintenance schedule...');

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (!isSuperAdmin && !isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Engineers and Super Admin can create maintenance' 
            });
        }

        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }

        // ✅ Validate equipment exists and user has access
        let equipSql = 'SELECT * FROM equipment WHERE id = ?';
        const equipParams = [equipment_id];
        
        if (!isSuperAdmin) {
            equipSql += ' AND hospital_id = ?';
            equipParams.push(req.user.hospital_id);
        }
        
        const equipment = await query(equipSql, equipParams);
        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or access denied'
            });
        }

        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
        const finalStatus = validStatuses.includes(status) ? status : 'Scheduled';

        const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
        const finalPriority = validPriorities.includes(priority) ? priority : 'Medium';

        const result = await query(
            `INSERT INTO maintenance_schedule 
             (equipment_id, maintenance_type, frequency,
              last_maintenance_date, next_due_date,
              maintenance_checklist, calibration_date,
              warranty_expiry, amc_details, status,
              engineer_name, description, priority, created_by)
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
                finalStatus,
                engineer_name || req.user.full_name || null,
                description || null,
                finalPriority,
                req.user.id
            ]
        );

        console.log('✅ Maintenance created. ID:', result.insertId);
        res.status(201).json({
            success: true,
            message: 'Maintenance schedule created successfully',
            schedule: { id: result.insertId }
        });
    } catch (error) {
        console.error('❌ Create maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create maintenance: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE MAINTENANCE
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
            engineer_name,
            description,
            priority
        } = req.body;

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        // ✅ Check if maintenance exists and user has access
        let checkSql = `
            SELECT m.*, e.hospital_id 
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE m.id = ?
        `;
        const checkParams = [id];
        
        const existing = await query(checkSql, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        // ✅ Engineers can only update their own maintenance
        if (isEngineer) {
            const engineerMatch = existing[0].engineer_name && 
                existing[0].engineer_name.toLowerCase() === req.user.full_name.toLowerCase();
            if (!engineerMatch) {
                return res.status(403).json({
                    success: false,
                    message: 'Engineers can only update their own maintenance tasks'
                });
            }
        }

        // ✅ Super Admin can update all, others need hospital access
        if (!isSuperAdmin) {
            const hospitalMatch = existing[0].hospital_id == req.user.hospital_id;
            if (!hospitalMatch) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
        const finalStatus = validStatuses.includes(status) ? status : existing[0].status;

        const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
        const finalPriority = validPriorities.includes(priority) ? priority : existing[0].priority;

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
             engineer_name = ?,
             description = ?,
             priority = ?,
             updated_at = NOW(),
             updated_by = ?
             WHERE id = ?`,
            [
                maintenance_type || existing[0].maintenance_type,
                frequency || existing[0].frequency,
                last_maintenance_date || existing[0].last_maintenance_date,
                next_due_date || existing[0].next_due_date,
                maintenance_checklist || existing[0].maintenance_checklist,
                calibration_date || existing[0].calibration_date,
                warranty_expiry || existing[0].warranty_expiry,
                amc_details || existing[0].amc_details,
                finalStatus,
                engineer_name || existing[0].engineer_name,
                description || existing[0].description,
                finalPriority,
                req.user.id,
                id
            ]
        );

        res.json({ 
            success: true, 
            message: 'Maintenance schedule updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update maintenance: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE MAINTENANCE STATUS ONLY
// ============================================
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // ✅ Check if maintenance exists and user has access
        let checkSql = `
            SELECT m.*, e.hospital_id 
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE m.id = ?
        `;
        const checkParams = [id];
        
        const existing = await query(checkSql, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        // ✅ Engineers can only update their own maintenance
        if (isEngineer) {
            const engineerMatch = existing[0].engineer_name && 
                existing[0].engineer_name.toLowerCase() === req.user.full_name.toLowerCase();
            if (!engineerMatch) {
                return res.status(403).json({
                    success: false,
                    message: 'Engineers can only update their own maintenance tasks'
                });
            }
        }

        // ✅ Super Admin can update all, others need hospital access
        if (!isSuperAdmin) {
            const hospitalMatch = existing[0].hospital_id == req.user.hospital_id;
            if (!hospitalMatch) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        await query(
            'UPDATE maintenance_schedule SET status = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
            [status, req.user.id, id]
        );

        res.json({ 
            success: true, 
            message: 'Maintenance status updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update maintenance status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update status: ' + error.message 
        });
    }
});

// ============================================
// ✅ DELETE MAINTENANCE
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query('SELECT * FROM maintenance_schedule WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        await query('DELETE FROM maintenance_schedule WHERE id = ?', [id]);

        res.json({ 
            success: true, 
            message: 'Maintenance schedule deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete maintenance: ' + error.message 
        });
    }
});

// ============================================
// ✅ BULK CREATE MAINTENANCE SCHEDULES
// ============================================
router.post('/bulk', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { schedules } = req.body;

        if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Schedules array is required'
            });
        }

        const results = [];
        const errors = [];

        for (const schedule of schedules) {
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
                    engineer_name,
                    description,
                    priority
                } = schedule;

                if (!equipment_id) {
                    errors.push({ equipment_id, error: 'Equipment ID is required' });
                    continue;
                }

                const result = await query(
                    `INSERT INTO maintenance_schedule 
                     (equipment_id, maintenance_type, frequency,
                      last_maintenance_date, next_due_date,
                      maintenance_checklist, calibration_date,
                      warranty_expiry, amc_details, status,
                      engineer_name, description, priority, created_by)
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
                        engineer_name || null,
                        description || null,
                        priority || 'Medium',
                        req.user.id
                    ]
                );

                results.push({ id: result.insertId, equipment_id });
            } catch (error) {
                errors.push({ equipment_id: schedule.equipment_id, error: error.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `Created ${results.length} maintenance schedules`,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('❌ Bulk create maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to bulk create maintenance: ' + error.message 
        });
    }
});

module.exports = router;