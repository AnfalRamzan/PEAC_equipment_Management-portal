// backend/routes/maintenance.js
// ✅ COMPLETE FIXED VERSION - WITH HOSPITAL & EQUIPMENT NAMES

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// ✅ GET ALL MAINTENANCE SCHEDULES - FIXED
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('📊 Fetching maintenance schedules...');
        
        // ✅ FIXED: Proper JOIN with equipment and hospitals
        let sql = `
            SELECT 
                ms.id,
                ms.equipment_id,
                ms.hospital_id,
                ms.maintenance_type,
                ms.frequency,
                ms.last_maintenance_date,
                ms.next_due_date,
                ms.maintenance_checklist,
                ms.calibration_date,
                ms.warranty_expiry,
                ms.amc_details,
                ms.status,
                ms.engineer_name,
                ms.description,
                ms.priority,
                ms.created_at,
                ms.updated_at,
                
                -- ✅ Equipment details
                e.name AS equipment_name,
                e.model AS equipment_model,
                e.serial_number AS equipment_serial,
                e.manufacturer AS equipment_manufacturer,
                
                -- ✅ Hospital details
                h.name AS hospital_name,
                h.address AS hospital_address,
                h.phone AS hospital_phone,
                h.email AS hospital_email,
                h.city AS hospital_city
                
            FROM maintenance_schedule ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN hospitals h ON ms.hospital_id = h.id
            WHERE 1=1
        `;
        
        const params = [];

        // ✅ Filter by hospital for non-super admins
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND ms.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY ms.next_due_date ASC';
        
        const schedules = await query(sql, params);
        
        console.log(`📊 Found ${schedules.length} maintenance schedules`);
        
        // ✅ Log first schedule for debugging
        if (schedules.length > 0) {
            console.log('🔍 Sample schedule:', {
                id: schedules[0].id,
                equipment_name: schedules[0].equipment_name || 'NULL',
                hospital_name: schedules[0].hospital_name || 'NULL',
                status: schedules[0].status
            });
        }
        
        res.json({ 
            success: true, 
            schedules: schedules,
            count: schedules.length 
        });
        
    } catch (error) {
        console.error('❌ Get maintenance schedules error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance schedules: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET SINGLE MAINTENANCE SCHEDULE - FIXED
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                ms.*,
                e.name AS equipment_name,
                e.model AS equipment_model,
                h.name AS hospital_name
            FROM maintenance_schedule ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN hospitals h ON ms.hospital_id = h.id
            WHERE ms.id = ?
        `;
        
        const params = [id];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND ms.hospital_id = ?';
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
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance schedule: ' + error.message 
        });
    }
});

// ============================================
// ✅ CREATE MAINTENANCE SCHEDULE - FIXED
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id,
            hospital_id,
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

        console.log('🛠️ Creating maintenance schedule');
        console.log('📦 Equipment ID:', equipment_id);
        console.log('🏥 Hospital ID:', hospital_id);

        // ✅ Validate required fields
        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }

        if (!hospital_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Hospital is required' 
            });
        }

        if (!next_due_date) {
            return res.status(400).json({ 
                success: false, 
                message: 'Next due date is required' 
            });
        }

        // ✅ Check if equipment exists and get its name
        const equipment = await query(
            'SELECT id, name, hospital_id FROM equipment WHERE id = ?',
            [equipment_id]
        );

        if (equipment.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found with ID: ' + equipment_id 
            });
        }

        // ✅ Check if hospital exists
        const hospital = await query(
            'SELECT id, name FROM hospitals WHERE id = ?',
            [hospital_id]
        );

        if (hospital.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Hospital not found with ID: ' + hospital_id 
            });
        }

        // ✅ Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (parseInt(hospital_id) !== parseInt(req.user.hospital_id)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only create schedules for your hospital' 
                });
            }
        }

        const finalEngineerName = engineer_name || req.user?.full_name || '';
        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
        const finalStatus = validStatuses.includes(status) ? status : 'Scheduled';

        // ✅ INSERT
        const result = await query(
            `INSERT INTO maintenance_schedule (
                equipment_id,
                hospital_id,
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(equipment_id),
                parseInt(hospital_id),
                maintenance_type || 'Preventive',
                frequency || 'Monthly',
                last_maintenance_date || null,
                next_due_date,
                maintenance_checklist || '',
                calibration_date || null,
                warranty_expiry || null,
                amc_details || '',
                finalStatus,
                finalEngineerName,
                description || null,
                priority || 'Medium'
            ]
        );

        console.log('✅ Maintenance schedule created. ID:', result.insertId);

        // ✅ Fetch created schedule with names
        const newSchedule = await query(
            `SELECT 
                ms.*,
                e.name AS equipment_name,
                h.name AS hospital_name
            FROM maintenance_schedule ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN hospitals h ON ms.hospital_id = h.id
            WHERE ms.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Maintenance schedule created successfully',
            schedule: newSchedule[0]
        });
    } catch (error) {
        console.error('❌ Create maintenance schedule error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create maintenance schedule: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE MAINTENANCE SCHEDULE - FIXED
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_id,
            hospital_id,
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

        console.log('🔄 Updating maintenance schedule:', id);

        // ✅ Check if schedule exists
        const existing = await query(
            'SELECT * FROM maintenance_schedule WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        // ✅ Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (req.user.role_name === 'ENGINEER') {
                if (existing[0].engineer_name !== req.user.full_name) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'You can only update your own schedules' 
                    });
                }
                if (status && status !== existing[0].status) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Engineers cannot change status' 
                    });
                }
            } else {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to update this schedule' 
                });
            }
        }

        // ✅ Verify equipment exists if being updated
        if (equipment_id) {
            const equipment = await query(
                'SELECT id FROM equipment WHERE id = ?',
                [equipment_id]
            );
            if (equipment.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Equipment not found' 
                });
            }
        }

        // ✅ Verify hospital exists if being updated
        if (hospital_id) {
            const hospital = await query(
                'SELECT id FROM hospitals WHERE id = ?',
                [hospital_id]
            );
            if (hospital.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Hospital not found' 
                });
            }
        }

        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
        const finalStatus = validStatuses.includes(status) ? status : existing[0].status;

        await query(
            `UPDATE maintenance_schedule SET
                equipment_id = ?,
                hospital_id = ?,
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
                priority = ?
            WHERE id = ?`,
            [
                equipment_id ? parseInt(equipment_id) : existing[0].equipment_id,
                hospital_id ? parseInt(hospital_id) : existing[0].hospital_id,
                maintenance_type || existing[0].maintenance_type,
                frequency || existing[0].frequency,
                last_maintenance_date !== undefined ? last_maintenance_date : existing[0].last_maintenance_date,
                next_due_date || existing[0].next_due_date,
                maintenance_checklist !== undefined ? maintenance_checklist : existing[0].maintenance_checklist,
                calibration_date !== undefined ? calibration_date : existing[0].calibration_date,
                warranty_expiry !== undefined ? warranty_expiry : existing[0].warranty_expiry,
                amc_details !== undefined ? amc_details : existing[0].amc_details,
                finalStatus,
                engineer_name || existing[0].engineer_name,
                description !== undefined ? description : existing[0].description,
                priority || existing[0].priority,
                id
            ]
        );

        console.log('✅ Maintenance schedule updated:', id);

        // ✅ Fetch updated schedule with names
        const updatedSchedule = await query(
            `SELECT 
                ms.*,
                e.name AS equipment_name,
                h.name AS hospital_name
            FROM maintenance_schedule ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN hospitals h ON ms.hospital_id = h.id
            WHERE ms.id = ?`,
            [id]
        );

        res.json({ 
            success: true, 
            message: 'Maintenance schedule updated successfully',
            schedule: updatedSchedule[0]
        });
    } catch (error) {
        console.error('❌ Update maintenance schedule error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update maintenance schedule: ' + error.message 
        });
    }
});

// ============================================
// ✅ DELETE MAINTENANCE SCHEDULE
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Deleting maintenance schedule:', id);

        const existing = await query(
            'SELECT * FROM maintenance_schedule WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        await query('DELETE FROM maintenance_schedule WHERE id = ?', [id]);

        console.log('✅ Maintenance schedule deleted:', id);
        res.json({ 
            success: true, 
            message: 'Maintenance schedule deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete maintenance schedule error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete maintenance schedule: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET OVERDUE MAINTENANCE SCHEDULES
// ============================================
router.get('/overdue', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                ms.*,
                e.name AS equipment_name,
                h.name AS hospital_name
            FROM maintenance_schedule ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN hospitals h ON ms.hospital_id = h.id
            WHERE ms.next_due_date < CURDATE()
              AND ms.status != 'Completed'
              AND ms.status != 'Cancelled'
        `;
        
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND ms.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY ms.next_due_date ASC';
        
        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get overdue schedules error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch overdue schedules: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET MAINTENANCE BY ENGINEER
// ============================================
router.get('/engineer/:engineerId', authenticate, async (req, res) => {
    try {
        const { engineerId } = req.params;
        
        const user = await query('SELECT id, full_name FROM users WHERE id = ?', [engineerId]);
        if (user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Engineer not found' 
            });
        }
        
        let sql = `
            SELECT 
                ms.*,
                e.name AS equipment_name,
                h.name AS hospital_name
            FROM maintenance_schedule ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN hospitals h ON ms.hospital_id = h.id
            WHERE ms.engineer_name = ?
        `;
        
        const params = [user[0].full_name];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND ms.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY ms.next_due_date ASC';
        
        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('❌ Get engineer maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch maintenance for engineer' 
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

        const existing = await query(
            'SELECT * FROM maintenance_schedule WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        // ✅ Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (req.user.role_name === 'ENGINEER') {
                if (existing[0].engineer_name !== req.user.full_name) {
                    return res.status(403).json({
                        success: false,
                        message: 'Engineers can only update their own maintenance tasks'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }
        }

        await query(
            'UPDATE maintenance_schedule SET status = ? WHERE id = ?',
            [status, id]
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

module.exports = router;