const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../../middleware/auth');

// Get all hospitals (Super Admin sees all, Hospital Admin sees only own hospital)
router.get('/', authenticate, async (req, res) => {
    try {
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.role_name !== 'HOSPITAL_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        const hospitalFilter = req.user.role_name === 'HOSPITAL_ADMIN'
            ? 'WHERE h.is_active = TRUE AND h.id = ?'
            : 'WHERE h.is_active = TRUE';

        const params = req.user.role_name === 'HOSPITAL_ADMIN'
            ? [req.user.hospital_id]
            : [];

        const hospitals = await query(`
            SELECT h.*, 
                   COUNT(DISTINCT u.id) as engineer_count,
                   COUNT(DISTINCT e.id) as equipment_count
            FROM hospitals h
            LEFT JOIN users u ON u.hospital_id = h.id AND u.is_active = TRUE
            LEFT JOIN equipment e ON e.hospital_id = h.id
            ${hospitalFilter}
            GROUP BY h.id
            ORDER BY h.name
        `, params);
        
        res.json({
            success: true,
            hospitals
        });
    } catch (error) {
        console.error('Get hospitals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hospitals'
        });
    }
});

// Get single hospital
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check permissions
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.hospital_id != id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const hospitals = await query(`
            SELECT h.*,
                   COUNT(DISTINCT u.id) as engineer_count,
                   COUNT(DISTINCT e.id) as equipment_count
            FROM hospitals h
            LEFT JOIN users u ON u.hospital_id = h.id AND u.is_active = TRUE
            LEFT JOIN equipment e ON e.hospital_id = h.id
            WHERE h.id = ?
            GROUP BY h.id
        `, [id]);

        if (hospitals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Get departments
        const departments = await query(
            'SELECT * FROM departments WHERE hospital_id = ?',
            [id]
        );

        // Get biomedical engineers
        const engineers = await query(
            `SELECT u.* FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.hospital_id = ? AND r.name = 'ENGINEER' AND u.is_active = TRUE`,
            [id]
        );

        res.json({
            success: true,
            hospital: hospitals[0],
            departments,
            engineers
        });
    } catch (error) {
        console.error('Get hospital error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hospital'
        });
    }
});

// Create hospital (Super Admin only)
router.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const {
            name, address, city, state, country, postal_code,
            phone, email, website, biomedical_head
        } = req.body;

        if (!name || !address) {
            return res.status(400).json({
                success: false,
                message: 'Name and address are required'
            });
        }

        const result = await query(
            `INSERT INTO hospitals 
             (name, address, city, state, country, postal_code, phone, email, website, biomedical_head) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, address, city, state, country, postal_code, phone, email, website, biomedical_head]
        );

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'CREATE', 'Hospital', `Created hospital: ${name}`, req.ip]
        );

        res.status(201).json({
            success: true,
            message: 'Hospital created successfully',
            hospital_id: result.insertId
        });
    } catch (error) {
        console.error('Create hospital error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create hospital'
        });
    }
});

// Update hospital
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check permissions
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.hospital_id != id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const {
            name, address, city, state, country, postal_code,
            phone, email, website, biomedical_head, is_active
        } = req.body;

        // Check if hospital exists
        const existing = await query('SELECT * FROM hospitals WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        await query(
            `UPDATE hospitals 
             SET name = ?, address = ?, city = ?, state = ?, country = ?, 
                 postal_code = ?, phone = ?, email = ?, website = ?, 
                 biomedical_head = ?, is_active = ?
             WHERE id = ?`,
            [name, address, city, state, country, postal_code, 
             phone, email, website, biomedical_head, is_active, id]
        );

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'UPDATE', 'Hospital', `Updated hospital: ${name}`, req.ip]
        );

        res.json({
            success: true,
            message: 'Hospital updated successfully'
        });
    } catch (error) {
        console.error('Update hospital error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hospital'
        });
    }
});

// Delete hospital (Super Admin only)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if hospital exists
        const existing = await query('SELECT * FROM hospitals WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Soft delete
        await query('UPDATE hospitals SET is_active = FALSE WHERE id = ?', [id]);

        // Log activity
        await query(
            `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'DELETE', 'Hospital', `Deleted hospital: ${existing[0].name}`, req.ip]
        );

        res.json({
            success: true,
            message: 'Hospital deleted successfully'
        });
    } catch (error) {
        console.error('Delete hospital error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete hospital'
        });
    }
});

// Get hospital engineers
router.get('/:id/engineers', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check permissions
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.hospital_id != id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const engineers = await query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.hospital_id = ? AND r.name = 'ENGINEER' AND u.is_active = TRUE`,
            [id]
        );

        res.json({
            success: true,
            engineers
        });
    } catch (error) {
        console.error('Get engineers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch engineers'
        });
    }
});

module.exports = router;