const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all repairs
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT r.*, e.name as equipment_name, u.full_name as engineer_name,
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

// Get single repair
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const repairs = await query(`
            SELECT r.*, e.name as equipment_name, u.full_name as engineer_name
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN users u ON r.engineer_id = u.id
            WHERE r.id = ?
        `, [id]);

        if (repairs.length === 0) {
            return res.status(404).json({ success: false, message: 'Repair not found' });
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

// Create repair
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            error_log_id, engineer_id, root_cause, problem_analysis,
            corrective_action, repair_procedure, solution_description,
            time_taken, spare_part_used, remarks
        } = req.body;

        const result = await query(
            `INSERT INTO repairs 
             (error_log_id, engineer_id, root_cause, problem_analysis,
              corrective_action, repair_procedure, solution_description,
              time_taken, spare_part_used, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [error_log_id, engineer_id, root_cause, problem_analysis,
             corrective_action, repair_procedure, solution_description,
             time_taken, spare_part_used || false, remarks]
        );

        // Update error log status
        await query(
            'UPDATE error_logs SET status = "Resolved" WHERE id = ?',
            [error_log_id]
        );

        res.status(201).json({
            success: true,
            message: 'Repair record created',
            repair_id: result.insertId
        });
    } catch (error) {
        console.error('Create repair error:', error);
        res.status(500).json({ success: false, message: 'Failed to create repair' });
    }
});

module.exports = router;