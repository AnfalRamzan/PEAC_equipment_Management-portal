const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all purchase orders
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, h.name as hospital_name, 
                   u.full_name as created_by_name,
                   u2.full_name as approved_by_name
            FROM purchase_orders p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN users u2 ON p.approved_by = u2.id
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
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const {
            hospital_id, vendor_name, vendor_contact,
            vendor_email, vendor_phone, vendor_address,
            po_number, order_date, delivery_date,
            total_amount, notes, status, items
        } = req.body;

        // Validate hospital access
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only create orders for your hospital'
                });
            }
        }

        // Start transaction
        const connection = await require('../config/database').getConnection();
        await connection.beginTransaction();

        try {
            // Insert purchase order
            const result = await connection.query(
                `INSERT INTO purchase_orders 
                 (hospital_id, vendor_name, vendor_contact,
                  vendor_email, vendor_phone, vendor_address,
                  po_number, order_date, delivery_date,
                  total_amount, notes, status, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [hospital_id, vendor_name, vendor_contact || null,
                 vendor_email || null, vendor_phone || null, vendor_address || null,
                 po_number || `PO-${Date.now().toString().slice(-8)}`,
                 order_date || new Date().toISOString().split('T')[0],
                 delivery_date || null, total_amount || 0,
                 notes || null, status || 'Draft', req.user.id]
            );

            const orderId = result.insertId;

            // Insert order items if provided
            if (items && Array.isArray(items) && items.length > 0) {
                for (const item of items) {
                    await connection.query(
                        `INSERT INTO purchase_order_items 
                         (purchase_order_id, description, quantity, unit_price, total)
                         VALUES (?, ?, ?, ?, ?)`,
                        [orderId, item.description, item.quantity || 1,
                         item.unit_price || 0, item.total || 0]
                    );
                }
            }

            await connection.commit();

            // Fetch the created order with items
            const [newOrder] = await query(
                `SELECT p.*, h.name as hospital_name 
                 FROM purchase_orders p
                 LEFT JOIN hospitals h ON p.hospital_id = h.id
                 WHERE p.id = ?`,
                [orderId]
            );

            const orderItems = await query(
                'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
                [orderId]
            );

            res.status(201).json({
                success: true,
                message: 'Purchase order created successfully',
                order: { ...newOrder, items: orderItems }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Create purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create purchase order' });
    }
});

// Update purchase order
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            vendor_name, vendor_contact, vendor_email,
            vendor_phone, vendor_address, po_number,
            order_date, delivery_date, total_amount,
            notes, status, items
        } = req.body;

        // Check if order exists and user has access
        let checkSql = `
            SELECT p.*, h.id as hospital_id
            FROM purchase_orders p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            WHERE p.id = ?
        `;
        const existing = await query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Check hospital access
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only edit orders for your hospital'
                });
            }
        }

        // Only allow editing if status is 'Draft'
        if (existing[0].status !== 'Draft' && status !== existing[0].status) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit order that is not in Draft status'
            });
        }

        // Start transaction
        const connection = await require('../config/database').getConnection();
        await connection.beginTransaction();

        try {
            // Update purchase order
            await connection.query(
                `UPDATE purchase_orders SET 
                 vendor_name = ?, vendor_contact = ?,
                 vendor_email = ?, vendor_phone = ?,
                 vendor_address = ?, po_number = ?,
                 order_date = ?, delivery_date = ?,
                 total_amount = ?, notes = ?, status = ?
                 WHERE id = ?`,
                [vendor_name, vendor_contact || null,
                 vendor_email || null, vendor_phone || null,
                 vendor_address || null, po_number,
                 order_date, delivery_date,
                 total_amount || 0, notes || null,
                 status || 'Draft', id]
            );

            // Update items if provided
            if (items && Array.isArray(items)) {
                // Delete existing items
                await connection.query(
                    'DELETE FROM purchase_order_items WHERE purchase_order_id = ?',
                    [id]
                );

                // Insert new items
                for (const item of items) {
                    if (item.description) {
                        await connection.query(
                            `INSERT INTO purchase_order_items 
                             (purchase_order_id, description, quantity, unit_price, total)
                             VALUES (?, ?, ?, ?, ?)`,
                            [id, item.description, item.quantity || 1,
                             item.unit_price || 0, item.total || 0]
                        );
                    }
                }
            }

            await connection.commit();

            // Fetch updated order
            const [updatedOrder] = await query(
                `SELECT p.*, h.name as hospital_name 
                 FROM purchase_orders p
                 LEFT JOIN hospitals h ON p.hospital_id = h.id
                 WHERE p.id = ?`,
                [id]
            );

            const orderItems = await query(
                'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
                [id]
            );

            res.json({
                success: true,
                message: 'Purchase order updated successfully',
                order: { ...updatedOrder, items: orderItems }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to update purchase order' });
    }
});

// ✅ UPDATED - Delete purchase order (Super Admin only)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if order exists
        const existing = await query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Only allow deletion if status is 'Draft'
        if (existing[0].status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete order that is not in Draft status'
            });
        }

        // Start transaction
        const connection = await require('../config/database').getConnection();
        await connection.beginTransaction();

        try {
            // Delete order items first
            await connection.query(
                'DELETE FROM purchase_order_items WHERE purchase_order_id = ?',
                [id]
            );

            // Delete purchase order
            await connection.query(
                'DELETE FROM purchase_orders WHERE id = ?',
                [id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Purchase order deleted successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete purchase order' });
    }
});

// ✅ NEW - Approve purchase order (Super Admin only)
router.put('/:id/approve', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if order exists
        const existing = await query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Check if order is in valid status for approval
        if (existing[0].status !== 'Pending Approval') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve order with status: ${existing[0].status}. Order must be 'Pending Approval'`
            });
        }

        await query(
            `UPDATE purchase_orders SET 
             status = 'Approved',
             approved_by = ?,
             approved_at = NOW()
             WHERE id = ?`,
            [req.user.id, id]
        );

        res.json({
            success: true,
            message: 'Purchase order approved successfully'
        });
    } catch (error) {
        console.error('Approve purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve purchase order' });
    }
});

// ✅ NEW - Reject purchase order (Super Admin only)
router.put('/:id/reject', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;

        // Check if order exists
        const existing = await query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Check if order is in valid status for rejection
        if (existing[0].status !== 'Pending Approval') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject order with status: ${existing[0].status}. Order must be 'Pending Approval'`
            });
        }

        await query(
            `UPDATE purchase_orders SET 
             status = 'Cancelled',
             rejection_reason = ?,
             rejected_at = NOW()
             WHERE id = ?`,
            [rejection_reason || 'No reason provided', id]
        );

        res.json({
            success: true,
            message: 'Purchase order rejected successfully'
        });
    } catch (error) {
        console.error('Reject purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject purchase order' });
    }
});

// ✅ NEW - Update purchase order status
router.put('/:id/status', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Received', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Check if order exists and user has access
        let checkSql = `
            SELECT p.*, h.id as hospital_id
            FROM purchase_orders p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            WHERE p.id = ?
        `;
        const existing = await query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Check hospital access
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        // Status transition validation
        const currentStatus = existing[0].status;
        const allowedTransitions = {
            'Draft': ['Pending Approval'],
            'Pending Approval': ['Approved', 'Cancelled'],
            'Approved': ['Ordered'],
            'Ordered': ['Received'],
            'Received': [],
            'Cancelled': []
        };

        if (!allowedTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${currentStatus}' to '${status}'`
            });
        }

        // Special handling for approval/rejection
        if (status === 'Approved' && req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can approve orders'
            });
        }

        if (status === 'Cancelled' && currentStatus === 'Pending Approval' && req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can reject orders'
            });
        }

        let updateFields = 'status = ?';
        const updateParams = [status];

        if (status === 'Approved') {
            updateFields += ', approved_by = ?, approved_at = NOW()';
            updateParams.push(req.user.id);
        } else if (status === 'Cancelled' && currentStatus === 'Pending Approval') {
            updateFields += ', rejected_at = NOW()';
        } else if (status === 'Ordered') {
            updateFields += ', ordered_at = NOW()';
        } else if (status === 'Received') {
            updateFields += ', received_at = NOW()';
        }

        updateParams.push(id);
        await query(`UPDATE purchase_orders SET ${updateFields} WHERE id = ?`, updateParams);

        res.json({
            success: true,
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// ✅ NEW - Get purchase order by ID with items
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        let sql = `
            SELECT p.*, h.name as hospital_name,
                   u.full_name as created_by_name,
                   u2.full_name as approved_by_name
            FROM purchase_orders p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN users u2 ON p.approved_by = u2.id
            WHERE p.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND p.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const orders = await query(sql, params);
        
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Get order items
        const items = await query(
            'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
            [id]
        );

        res.json({
            success: true,
            order: { ...orders[0], items }
        });
    } catch (error) {
        console.error('Get purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase order' });
    }
});

module.exports = router;