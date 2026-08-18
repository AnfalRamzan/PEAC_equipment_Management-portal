// backend/routes/purchaseOrders.js
// ✅ FIXED: Permissions set correctly
// ✅ Anyone can VIEW
// ✅ Anyone can CREATE
// ✅ Only SUPER_ADMIN can EDIT
// ✅ Only SUPER_ADMIN can DELETE

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================
// ✅ GET ALL PURCHASE ORDERS - ANY AUTHENTICATED USER
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, 
                   u.full_name as created_by_name
            FROM purchase_orders p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ Filter by hospital for non-super admins
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.hospital_id) {
            const hospitalResult = await query('SELECT name FROM hospitals WHERE id = ?', [req.user.hospital_id]);
            if (hospitalResult.length > 0) {
                sql += ' AND p.hospital = ?';
                params.push(hospitalResult[0].name);
            }
        }

        sql += ' ORDER BY p.created_at DESC';
        
        const orders = await query(sql, params);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get purchase orders error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase orders' });
    }
});

// ============================================
// ✅ GET SINGLE PURCHASE ORDER - ANY AUTHENTICATED USER
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT p.*, u.full_name as created_by_name
            FROM purchase_orders p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        `;
        const params = [id];

        const orders = await query(sql, params);
        if (orders.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        const items = await query(
            'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
            [id]
        );

        res.json({
            success: true,
            order: { ...orders[0], items: items || [] }
        });
    } catch (error) {
        console.error('Get purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase order' });
    }
});

// ============================================
// ✅ CREATE PURCHASE ORDER - ANY AUTHENTICATED USER
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const { 
            hospital,
            equipment,
            vendor_name,
            vendor_contact,
            vendor_email,
            vendor_address,
            vendor_phone,
            po_number,
            order_date,
            delivery_date,
            total_amount,
            notes,
            items,
            documents,
            currency
        } = req.body;

        console.log('📦 Creating purchase order with data:', { 
            hospital, equipment, vendor_name, po_number, currency 
        });

        // ✅ Validate required fields
        if (!hospital || hospital.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Hospital is required' 
            });
        }
        if (!equipment || equipment.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }
        if (!vendor_name || vendor_name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Vendor name is required' 
            });
        }
        if (!po_number || po_number.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'PO number is required' 
            });
        }

        // ✅ Check if PO number already exists
        const existingPO = await query('SELECT id FROM purchase_orders WHERE po_number = ?', [po_number.trim()]);
        if (existingPO.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'PO number already exists. Please use a unique PO number.'
            });
        }

        // ✅ Insert purchase order
        const result = await query(
            `INSERT INTO purchase_orders (
                hospital,
                equipment,
                vendor_name,
                vendor_contact,
                vendor_email,
                vendor_address,
                vendor_phone,
                po_number,
                order_date,
                delivery_date,
                total_amount,
                currency,
                notes,
                documents,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                hospital.trim(),
                equipment.trim(),
                vendor_name.trim(),
                vendor_contact || '',
                vendor_email || '',
                vendor_address || '',
                vendor_phone || '',
                po_number.trim(),
                order_date || null,
                delivery_date || null,
                total_amount || 0,
                currency || 'PKR',
                notes || '',
                documents || '',
                req.user.id
            ]
        );

        const orderId = result.insertId;
        console.log('✅ Purchase order created. ID:', orderId);

        // ✅ Insert items
        if (items && Array.isArray(items) && items.length > 0) {
            try {
                for (const item of items) {
                    if (item.description && item.description.trim() !== '') {
                        await query(
                            `INSERT INTO purchase_order_items 
                             (purchase_order_id, description, quantity, unit_price, total)
                             VALUES (?, ?, ?, ?, ?)`,
                            [
                                orderId,
                                item.description.trim(),
                                parseInt(item.quantity) || 1,
                                parseFloat(item.unit_price) || 0,
                                parseFloat(item.total) || 0
                            ]
                        );
                    }
                }
                console.log('✅ Items inserted successfully');
            } catch (itemError) {
                console.log('⚠️ Items error (non-critical):', itemError.message);
            }
        }

        // ✅ Get created order
        const newOrder = await query(
            `SELECT p.*, u.full_name as created_by_name 
             FROM purchase_orders p
             LEFT JOIN users u ON p.created_by = u.id
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
            order: { 
                ...newOrder[0], 
                items: orderItems 
            }
        });

    } catch (error) {
        console.error('❌ Create purchase order error:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'PO number already exists. Please use a unique PO number.'
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message
        });
    }
});

// ============================================
// ✅ UPDATE PURCHASE ORDER - ONLY SUPER_ADMIN
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            hospital,
            equipment,
            vendor_name,
            vendor_contact,
            vendor_email,
            vendor_address,
            vendor_phone,
            po_number,
            order_date,
            delivery_date,
            total_amount,
            currency,
            notes,
            items,
            documents
        } = req.body;

        console.log('🔄 Updating purchase order:', id);

        // ✅ Only Super Admin can edit
        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can edit purchase orders'
            });
        }

        const existing = await query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        // ✅ Update purchase order
        await query(
            `UPDATE purchase_orders SET 
                hospital = ?,
                equipment = ?,
                vendor_name = ?,
                vendor_contact = ?,
                vendor_email = ?,
                vendor_address = ?,
                vendor_phone = ?,
                po_number = ?,
                order_date = ?,
                delivery_date = ?,
                total_amount = ?,
                currency = ?,
                notes = ?,
                documents = ?
            WHERE id = ?`,
            [
                hospital || existing[0].hospital,
                equipment || existing[0].equipment,
                vendor_name || existing[0].vendor_name,
                vendor_contact || '',
                vendor_email || '',
                vendor_address || '',
                vendor_phone || '',
                po_number || existing[0].po_number,
                order_date || existing[0].order_date,
                delivery_date || existing[0].delivery_date,
                total_amount || existing[0].total_amount,
                currency || existing[0].currency || 'PKR',
                notes || existing[0].notes,
                documents || existing[0].documents,
                id
            ]
        );

        // ✅ Update items (delete old, insert new)
        await query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
        
        if (items && Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                if (item.description && item.description.trim() !== '') {
                    await query(
                        `INSERT INTO purchase_order_items 
                         (purchase_order_id, description, quantity, unit_price, total)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            id,
                            item.description.trim(),
                            parseInt(item.quantity) || 1,
                            parseFloat(item.unit_price) || 0,
                            parseFloat(item.total) || 0
                        ]
                    );
                }
            }
        }

        console.log('✅ Purchase order updated:', id);

        const updatedOrder = await query(
            `SELECT p.*, u.full_name as created_by_name 
             FROM purchase_orders p
             LEFT JOIN users u ON p.created_by = u.id
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
            order: { ...updatedOrder[0], items: orderItems }
        });

    } catch (error) {
        console.error('❌ Update purchase order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update purchase order: ' + error.message 
        });
    }
});

// ============================================
// ✅ DELETE PURCHASE ORDER - ONLY SUPER_ADMIN
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // ✅ Only Super Admin can delete
        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can delete purchase orders'
            });
        }

        const existing = await query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        await query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
        await query('DELETE FROM purchase_orders WHERE id = ?', [id]);

        console.log('✅ Purchase order deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Purchase order deleted successfully' 
        });

    } catch (error) {
        console.error('❌ Purchase order DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET PURCHASE ORDER ITEMS - ANY AUTHENTICATED USER
// ============================================
router.get('/:id/items', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const items = await query(
            'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
            [id]
        );
        
        res.json({ success: true, items });
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch items' 
        });
    }
});

module.exports = router;