const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all purchase orders
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, h.name as hospital_name, u.full_name as created_by_name
            FROM purchase_orders p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND p.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY p.created_at DESC';
        const orders = await query(sql, params);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get purchase orders error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase orders' });
    }
});

// Create purchase order
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            hospital_id, vendor_name, po_number,
            order_date, delivery_date, total_amount, notes, status
        } = req.body;

        const result = await query(
            `INSERT INTO purchase_orders 
             (hospital_id, vendor_name, po_number,
              order_date, delivery_date, total_amount,
              notes, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [hospital_id, vendor_name, po_number,
             order_date, delivery_date, total_amount,
             notes, status || 'Draft', req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Purchase order created',
            order_id: result.insertId
        });
    } catch (error) {
        console.error('Create purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create purchase order' });
    }
});

// Update purchase order
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            vendor_name, po_number, order_date,
            delivery_date, total_amount, notes, status
        } = req.body;

        await query(
            `UPDATE purchase_orders SET 
             vendor_name = ?, po_number = ?,
             order_date = ?, delivery_date = ?,
             total_amount = ?, notes = ?, status = ?
             WHERE id = ?`,
            [vendor_name, po_number, order_date,
             delivery_date, total_amount, notes, status, id]
        );

        res.json({ success: true, message: 'Purchase order updated' });
    } catch (error) {
        console.error('Update purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to update purchase order' });
    }
});

// Delete purchase order
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM purchase_orders WHERE id = ?', [id]);
        res.json({ success: true, message: 'Purchase order deleted' });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete purchase order' });
    }
});

module.exports = router;