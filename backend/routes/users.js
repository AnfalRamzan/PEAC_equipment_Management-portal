const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const canManageUsers = (req) => {
    return req.user?.role_name === 'SUPER_ADMIN' || req.user?.role_name === 'HOSPITAL_ADMIN';
};

const getHospitalScopedUsers = (req) => {
    if (req.user?.role_name === 'HOSPITAL_ADMIN') {
        return `AND u.hospital_id = ${req.user.hospital_id}`;
    }
    return '';
};

// Get all users
router.get('/', authenticate, async (req, res) => {
    try {
        if (!canManageUsers(req)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }

        const hospitalFilter = getHospitalScopedUsers(req);
        const users = await query(`
            SELECT u.*, r.name as role_name, h.name as hospital_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN hospitals h ON u.hospital_id = h.id
            WHERE u.is_active = TRUE ${hospitalFilter}
            ORDER BY u.full_name
        `);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Create user
router.post('/', authenticate, async (req, res) => {
    try {
        if (!canManageUsers(req)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }

        const { username, email, full_name, password, role_id, hospital_id, phone } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Full name, email and password are required' });
        }

        const normalizedRoleId = Number(role_id || 3);
        const normalizedHospitalId = Number(hospital_id ?? req.user.hospital_id ?? null);

        if (req.user.role_name === 'HOSPITAL_ADMIN') {
            if (normalizedRoleId !== 3) {
                return res.status(403).json({ success: false, message: 'Hospital admins can only create ENGINEER accounts' });
            }
            if (req.user.hospital_id !== normalizedHospitalId) {
                return res.status(403).json({ success: false, message: 'You can only create users for your own hospital' });
            }
        }

        const existingUser = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO users (username, email, password_hash, full_name, role_id, hospital_id, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username || email.split('@')[0], email, hashedPassword, full_name, normalizedRoleId, normalizedHospitalId, phone || '']
        );

        res.status(201).json({ success: true, message: 'User created successfully', user_id: result.insertId });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
    try {
        if (!canManageUsers(req)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }

        const { id } = req.params;
        const { username, email, full_name, role_id, hospital_id, phone, is_active } = req.body;

        const existingUser = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.user.role_name === 'HOSPITAL_ADMIN') {
            if (existingUser[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ success: false, message: 'You can only update users in your hospital' });
            }
            if (Number(role_id || existingUser[0].role_id) !== 3) {
                return res.status(403).json({ success: false, message: 'Hospital admins can only manage ENGINEER accounts' });
            }
        }

        await query(
            `UPDATE users SET username = ?, email = ?, full_name = ?, role_id = ?, 
             hospital_id = ?, phone = ?, is_active = ? WHERE id = ?`,
            [username || existingUser[0].username, email || existingUser[0].email, full_name || existingUser[0].full_name, role_id || existingUser[0].role_id, hospital_id || existingUser[0].hospital_id, phone || existingUser[0].phone, is_active !== undefined ? is_active : existingUser[0].is_active, id]
        );

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

// Delete user
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (!canManageUsers(req)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }

        const { id } = req.params;
        const existingUser = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.user.role_name === 'HOSPITAL_ADMIN' && existingUser[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({ success: false, message: 'You can only delete users in your hospital' });
        }

        await query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// Reset password
router.post('/:id/reset-password', authenticate, async (req, res) => {
    try {
        if (!canManageUsers(req)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }

        const { id } = req.params;
        const existingUser = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.user.role_name === 'HOSPITAL_ADMIN' && existingUser[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({ success: false, message: 'You can only reset passwords for your hospital users' });
        }

        const tempPassword = 'Password123!';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, id]);
        res.json({ success: true, message: 'Password reset successfully', tempPassword });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});

// Get roles
router.get('/roles', authenticate, async (req, res) => {
    try {
        const roles = await query('SELECT * FROM roles ORDER BY name');
        res.json({ success: true, roles });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch roles' });
    }
});

module.exports = router;