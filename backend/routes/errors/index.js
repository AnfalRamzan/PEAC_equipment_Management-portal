const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../../middleware/auth');

// Get all errors
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT el.*, 
                   e.name as equipment_name,
                   h.name as hospital_name,
                   d.name as department_name,
                   ru.full_name as reported_by_name,
                   au.full_name as assigned_to_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users ru ON el.reported_by = ru.id
            LEFT JOIN users au ON el.assigned_to = au.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by hospital for non-super admins
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        // Search filters
        const { search, status, severity, start_date, end_date } = req.query;
        
        if (search) {
            sql += ' AND (el.error_title LIKE ? OR el.error_code LIKE ? OR e.name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (status) {
            sql += ' AND el.status = ?';
            params.push(status);
        }
        
        if (severity) {
            sql += ' AND el.severity = ?';
            params.push(severity);
        }
        
        if (start_date) {
            sql += ' AND DATE(el.error_date) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            sql += ' AND DATE(el.error_date) <= ?';
            params.push(end_date);
        }

        sql += ' ORDER BY el.created_at DESC';

        const errors = await query(sql, params);

        res.json({
            success: true,
            errors
        });
    } catch (error) {
        console.error('Get errors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch errors'
        });
    }
});

// Get single error
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const errors = await query(`
            SELECT el.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number as equipment_serial,
                   h.name as hospital_name,
                   d.name as department_name,
                   ru.full_name as reported_by_name,
                   au.full_name as assigned_to_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users ru ON el.reported_by = ru.id
            LEFT JOIN users au ON el.assigned_to = au.id
            WHERE el.id = ?
        `, [id]);

        if (errors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Error not found'
            });
        }

        // Check permissions
        const error = errors[0];
        if (req.user.role_name !== 'SUPER_ADMIN') {
            // Get hospital_id from equipment
            const equipment = await query(
                'SELECT hospital_id FROM equipment WHERE id = ?',
                [error.equipment_id]
            );
            if (equipment.length > 0 && equipment[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        // Get repair details if exists
        const repairs = await query(
            `SELECT * FROM repairs WHERE error_log_id = ? ORDER BY created_at DESC`,
            [id]
        );

        // Get spare parts if repair exists
        let spareParts = [];
        if (repairs.length > 0) {
            spareParts = await query(
                `SELECT * FROM spare_parts WHERE repair_id = ?`,
                [repairs[0].id]
            );
        }

        res.json({
            success: true,
            error: error,
            repair: repairs.length > 0 ? repairs[0] : null,
            spare_parts: spareParts
        });
    } catch (error) {
        console.error('Get error error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch error'
        });
    }
});

// Create error report
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id, error_code, error_title, error_description,
            severity, images, videos, documents
        } = req.body;

        if (!equipment_id || !error_title) {
            return res.status(400).json({
                success: false,
                message: 'Equipment ID and error title are required'
            });
        }

        // Check if equipment exists and user has access
        const equipment = await query(
            'SELECT * FROM equipment WHERE id = ?',
            [equipment_id]
        );
        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        if (req.user.role_name !== 'SUPER_ADMIN' && 
            equipment[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const result = await query(
            `INSERT INTO error_logs 
             (equipment_id, error_code, error_title, error_description, 
              severity, reported_by, status, images, videos, documents) 
             VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
            [equipment_id, error_code, error_title, error_description,
             severity || 'Medium', req.user.id, images || null, videos || null, documents || null]
        );

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'CREATE', 'Error', `Reported error: ${error_title}`, req.ip]
        );

        // TODO: Send notifications

        res.status(201).json({
            success: true,
            message: 'Error reported successfully',
            error_id: result.insertId
        });
    } catch (error) {
        console.error('Create error error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report error'
        });
    }
});

// Update error
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            error_code, error_title, error_description,
            severity, status, assigned_to
        } = req.body;

        // Check if error exists
        const existing = await query('SELECT * FROM error_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Error not found'
            });
        }

        // Check permissions
        const error = existing[0];
        const equipment = await query(
            'SELECT hospital_id FROM equipment WHERE id = ?',
            [error.equipment_id]
        );
        
        if (req.user.role_name !== 'SUPER_ADMIN' && 
            equipment.length > 0 && equipment[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await query(
            `UPDATE error_logs 
             SET error_code = ?, error_title = ?, error_description = ?,
                 severity = ?, status = ?, assigned_to = ?
             WHERE id = ?`,
            [error_code, error_title, error_description,
             severity, status, assigned_to, id]
        );

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'UPDATE', 'Error', `Updated error: ${error_title}`, req.ip]
        );

        res.json({
            success: true,
            message: 'Error updated successfully'
        });
    } catch (error) {
        console.error('Update error error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update error'
        });
    }
});

// Update error status
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

        const existing = await query('SELECT * FROM error_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Error not found'
            });
        }

        const error = existing[0];
        const equipment = await query(
            'SELECT hospital_id FROM equipment WHERE id = ?',
            [error.equipment_id]
        );
        
        if (req.user.role_name !== 'SUPER_ADMIN' && 
            equipment.length > 0 && equipment[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await query(
            'UPDATE error_logs SET status = ? WHERE id = ?',
            [status, id]
        );

        res.json({
            success: true,
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status'
        });
    }
});

// Delete error (Super Admin only)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query('SELECT * FROM error_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Error not found'
            });
        }

        await query('DELETE FROM error_logs WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Error deleted successfully'
        });
    } catch (error) {
        console.error('Delete error error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete error'
        });
    }
});

module.exports = router;