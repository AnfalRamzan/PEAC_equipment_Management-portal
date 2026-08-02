const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../../middleware/auth');

// Get all equipment
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT e.*, 
                   c.name as category_name,
                   h.name as hospital_name,
                   d.name as department_name
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.status != 'Retired'
        `;
        const params = [];

        // Filter by hospital for non-super admins
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        // Search filters
        const { search, category_id, manufacturer, model, status } = req.query;
        
        if (search) {
            sql += ' AND (e.name LIKE ? OR e.model LIKE ? OR e.serial_number LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (category_id) {
            sql += ' AND e.category_id = ?';
            params.push(category_id);
        }
        
        if (manufacturer) {
            sql += ' AND e.manufacturer LIKE ?';
            params.push(`%${manufacturer}%`);
        }
        
        if (model) {
            sql += ' AND e.model LIKE ?';
            params.push(`%${model}%`);
        }
        
        if (status) {
            sql += ' AND e.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY e.name';

        const equipment = await query(sql, params);

        res.json({
            success: true,
            equipment
        });
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment'
        });
    }
});

// Get single equipment
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const equipment = await query(`
            SELECT e.*, 
                   c.name as category_name,
                   h.name as hospital_name,
                   d.name as department_name
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.id = ?
        `, [id]);

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Check permissions
        if (req.user.role_name !== 'SUPER_ADMIN' && 
            equipment[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get error history
        const errors = await query(`
            SELECT el.*, u.full_name as reported_by_name
            FROM error_logs el
            LEFT JOIN users u ON el.reported_by = u.id
            WHERE el.equipment_id = ?
            ORDER BY el.created_at DESC
            LIMIT 10
        `, [id]);

        res.json({
            success: true,
            equipment: equipment[0],
            error_history: errors
        });
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment'
        });
    }
});

// Create equipment
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            name, category_id, manufacturer, model, serial_number,
            installation_year, hospital_id, department_id, location,
            warranty_expiry, amc_details, calibration_date
        } = req.body;

        // Check permissions
        if (req.user.role_name !== 'SUPER_ADMIN' && 
            hospital_id !== req.user.hospital_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!name || !category_id || !hospital_id) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, and hospital are required'
            });
        }

        // Check if serial number is unique
        if (serial_number) {
            const existing = await query(
                'SELECT id FROM equipment WHERE serial_number = ?',
                [serial_number]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Serial number already exists'
                });
            }
        }

        const result = await query(
            `INSERT INTO equipment 
             (name, category_id, manufacturer, model, serial_number, 
              installation_year, hospital_id, department_id, location,
              warranty_expiry, amc_details, calibration_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id, manufacturer, model, serial_number,
             installation_year, hospital_id, department_id, location,
             warranty_expiry, amc_details, calibration_date]
        );

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'CREATE', 'Equipment', `Created equipment: ${name}`, req.ip]
        );

        res.status(201).json({
            success: true,
            message: 'Equipment created successfully',
            equipment_id: result.insertId
        });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create equipment'
        });
    }
});

// Update equipment
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, category_id, manufacturer, model, serial_number,
            installation_year, department_id, location, status,
            warranty_expiry, amc_details, calibration_date
        } = req.body;

        // Check if equipment exists and get hospital_id
        const existing = await query('SELECT * FROM equipment WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Check permissions
        if (req.user.role_name !== 'SUPER_ADMIN' && 
            existing[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await query(
            `UPDATE equipment 
             SET name = ?, category_id = ?, manufacturer = ?, model = ?, 
                 serial_number = ?, installation_year = ?, department_id = ?, 
                 location = ?, status = ?, warranty_expiry = ?, 
                 amc_details = ?, calibration_date = ?
             WHERE id = ?`,
            [name, category_id, manufacturer, model, serial_number,
             installation_year, department_id, location, status,
             warranty_expiry, amc_details, calibration_date, id]
        );

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'UPDATE', 'Equipment', `Updated equipment: ${name}`, req.ip]
        );

        res.json({
            success: true,
            message: 'Equipment updated successfully'
        });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update equipment'
        });
    }
});

// Delete equipment (soft delete)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query('SELECT * FROM equipment WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        await query('UPDATE equipment SET status = "Retired" WHERE id = ?', [id]);

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'DELETE', 'Equipment', `Retired equipment: ${existing[0].name}`, req.ip]
        );

        res.json({
            success: true,
            message: 'Equipment retired successfully'
        });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete equipment'
        });
    }
});

// Get equipment categories
router.get('/categories/all', authenticate, async (req, res) => {
    try {
        const categories = await query(
            'SELECT * FROM equipment_categories ORDER BY name'
        );
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

module.exports = router;