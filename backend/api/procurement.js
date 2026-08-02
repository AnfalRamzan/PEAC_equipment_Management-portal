const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all procurement requests
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, h.name as hospital_name, u.full_name as requested_by_name
            FROM equipment_procurement p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.requested_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND p.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY p.created_at DESC';
        const requests = await query(sql, params);
        res.json({ success: true, requests });
    } catch (error) {
        console.error('Get procurement requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch procurement requests' });
    }
});

// Create procurement request
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            hospital_id, equipment_name, category_id,
            manufacturer, model, quantity, estimated_cost,
            justification, priority
        } = req.body;

        const result = await query(
            `INSERT INTO equipment_procurement 
             (hospital_id, equipment_name, category_id,
              manufacturer, model, quantity, estimated_cost,
              justification, priority, requested_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [hospital_id, equipment_name, category_id,
             manufacturer, model, quantity, estimated_cost,
             justification, priority || 'Medium', req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Procurement request created',
            request_id: result.insertId
        });
    } catch (error) {
        console.error('Create procurement request error:', error);
        res.status(500).json({ success: false, message: 'Failed to create procurement request' });
    }
});

// Update procurement request
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_name, category_id, manufacturer,
            model, quantity, estimated_cost, justification, priority, status
        } = req.body;

        await query(
            `UPDATE equipment_procurement SET 
             equipment_name = ?, category_id = ?,
             manufacturer = ?, model = ?,
             quantity = ?, estimated_cost = ?,
             justification = ?, priority = ?, status = ?
             WHERE id = ?`,
            [equipment_name, category_id, manufacturer,
             model, quantity, estimated_cost,
             justification, priority, status, id]
        );

        res.json({ success: true, message: 'Procurement request updated' });
    } catch (error) {
        console.error('Update procurement request error:', error);
        res.status(500).json({ success: false, message: 'Failed to update procurement request' });
    }
});

// Delete procurement request
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM equipment_procurement WHERE id = ?', [id]);
        res.json({ success: true, message: 'Procurement request deleted' });
    } catch (error) {
        console.error('Delete procurement request error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete procurement request' });
    }
});

module.exports = router;