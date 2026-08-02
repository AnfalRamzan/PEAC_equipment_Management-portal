const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all users
router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const users = await query(`
            SELECT u.*, r.name as role_name, h.name as hospital_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN hospitals h ON u.hospital_id = h.id
            WHERE u.is_active = TRUE
            ORDER BY u.full_name
        `);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Create user
router.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { username, email, full_name, password, role_id, hospital_id, phone } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO users (username, email, password_hash, full_name, role_id, hospital_id, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, full_name, role_id, hospital_id, phone]
        );
        
        res.status(201).json({ success: true, message: 'User created successfully', user_id: result.insertId });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

// Update user
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, role_id, hospital_id, phone, is_active } = req.body;
        
        await query(
            `UPDATE users SET username = ?, email = ?, full_name = ?, role_id = ?, 
             hospital_id = ?, phone = ?, is_active = ? WHERE id = ?`,
            [username, email, full_name, role_id, hospital_id, phone, is_active, id]
        );
        
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

// Delete user
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// Reset password
router.post('/:id/reset-password', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
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