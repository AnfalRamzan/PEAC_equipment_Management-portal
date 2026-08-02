const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all maintenance schedules
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT m.*, e.name as equipment_name, h.name as hospital_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC';
        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('Get maintenance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance schedules' });
    }
});

// Create maintenance schedule
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id, maintenance_type, frequency,
            last_maintenance_date, next_due_date,
            maintenance_checklist, calibration_date,
            warranty_expiry, amc_details
        } = req.body;

        const result = await query(
            `INSERT INTO maintenance_schedule 
             (equipment_id, maintenance_type, frequency,
              last_maintenance_date, next_due_date,
              maintenance_checklist, calibration_date,
              warranty_expiry, amc_details)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipment_id, maintenance_type || 'Preventive', frequency || 'Monthly',
             last_maintenance_date, next_due_date,
             maintenance_checklist, calibration_date,
             warranty_expiry, amc_details]
        );

        res.status(201).json({
            success: true,
            message: 'Maintenance schedule created',
            schedule_id: result.insertId
        });
    } catch (error) {
        console.error('Create maintenance error:', error);
        res.status(500).json({ success: false, message: 'Failed to create maintenance schedule' });
    }
});

// Update maintenance status
router.put('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await query(
            'UPDATE maintenance_schedule SET status = ? WHERE id = ?',
            [status, id]
        );

        res.json({ success: true, message: 'Maintenance status updated' });
    } catch (error) {
        console.error('Update maintenance status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

module.exports = router;