const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all procurement requests
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                p.*, 
                h.name as hospital_name, 
                u.full_name as requested_by_name,
                u2.full_name as approved_by_name,
                u3.full_name as rejected_by_name,
                u4.full_name as reviewed_by_name
            FROM equipment_procurement p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.requested_by = u.id
            LEFT JOIN users u2 ON p.approved_by = u2.id
            LEFT JOIN users u3 ON p.rejected_by = u3.id
            LEFT JOIN users u4 ON p.reviewed_by = u4.id
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

// ✅ Create procurement request - ENGINEER can also create
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'), async (req, res) => {
    try {
        const {
            hospital_id, 
            equipment_name, 
            category_name,  // ✅ Manual category name (not ID)
            manufacturer, 
            model, 
            quantity, 
            estimated_cost,
            justification, 
            priority, 
            requested_by, 
            department_name,  // ✅ department_name
            attachments
        } = req.body;

        console.log('📤 Create procurement request - User:', req.user.role_name, 'ID:', req.user.id);
        console.log('📤 Request data:', req.body);

        // Validate hospital access
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only create requests for your hospital'
                });
            }
        }

        // Validate required fields
        if (!hospital_id || !equipment_name) {
            return res.status(400).json({
                success: false,
                message: 'Hospital ID and Equipment Name are required'
            });
        }

        const result = await query(
            `INSERT INTO equipment_procurement 
             (hospital_id, equipment_name, category_name,
              manufacturer, model, quantity, estimated_cost,
              justification, priority, requested_by, department_name, attachments, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                hospital_id, 
                equipment_name, 
                category_name || '',  // ✅ Manual category
                manufacturer || '', 
                model || '', 
                quantity || 1, 
                estimated_cost || 0,
                justification || '', 
                priority || 'Medium', 
                requested_by || req.user.id, 
                department_name || '',  // ✅ department_name
                attachments || '', 
                'Requested'
            ]
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

// ✅ Update procurement request - ONLY SUPER_ADMIN can update
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_name, 
            category_name,  // ✅ Manual category
            manufacturer,
            model, 
            quantity, 
            estimated_cost, 
            justification, 
            priority, 
            status,
            department_name,  // ✅ department_name
            attachments
        } = req.body;

        // Check if request exists
        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        // Only allow editing if status is 'Requested' or 'Under Review'
        if (!['Requested', 'Under Review'].includes(existing[0].status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit request that is already Approved, Rejected, or Procured'
            });
        }

        await query(
            `UPDATE equipment_procurement SET 
             equipment_name = ?, 
             category_name = ?,
             manufacturer = ?, 
             model = ?,
             quantity = ?, 
             estimated_cost = ?,
             justification = ?, 
             priority = ?, 
             status = ?,
             department_name = ?, 
             attachments = ?
             WHERE id = ?`,
            [
                equipment_name, 
                category_name || '', 
                manufacturer || '',
                model || '', 
                quantity || 1, 
                estimated_cost || 0,
                justification || '', 
                priority || 'Medium', 
                status || 'Requested',
                department_name || '', 
                attachments || '', 
                id
            ]
        );

        res.json({ success: true, message: 'Procurement request updated' });
    } catch (error) {
        console.error('Update procurement request error:', error);
        res.status(500).json({ success: false, message: 'Failed to update procurement request' });
    }
});

// ✅ Delete procurement request - ONLY SUPER_ADMIN can delete
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        if (!['Requested', 'Under Review'].includes(existing[0].status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete request that is already Approved, Rejected, or Procured'
            });
        }

        await query('DELETE FROM equipment_procurement WHERE id = ?', [id]);
        res.json({ success: true, message: 'Procurement request deleted successfully' });
    } catch (error) {
        console.error('Delete procurement error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete procurement request' });
    }
});

// ✅ Approve procurement request - ONLY SUPER_ADMIN
router.put('/:id/approve', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        if (existing[0].status !== 'Under Review') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve request with status: ${existing[0].status}. Request must be 'Under Review'`
            });
        }

        await query(
            `UPDATE equipment_procurement SET 
             status = 'Approved',
             approved_by = ?,
             approved_at = NOW()
             WHERE id = ?`,
            [req.user.id, id]
        );

        res.json({ success: true, message: 'Procurement request approved' });
    } catch (error) {
        console.error('Approve procurement error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve procurement request' });
    }
});

// ✅ Reject procurement request - ONLY SUPER_ADMIN
router.put('/:id/reject', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;

        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        if (existing[0].status !== 'Under Review') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject request with status: ${existing[0].status}. Request must be 'Under Review'`
            });
        }

        await query(
            `UPDATE equipment_procurement SET 
             status = 'Rejected',
             rejected_by = ?,
             rejected_at = NOW(),
             rejection_reason = ?
             WHERE id = ?`,
            [req.user.id, rejection_reason || 'No reason provided', id]
        );

        res.json({ success: true, message: 'Procurement request rejected' });
    } catch (error) {
        console.error('Reject procurement error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject procurement request' });
    }
});

// ✅ Mark as Procured - SUPER_ADMIN and HOSPITAL_ADMIN
router.put('/:id/procured', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        let checkSql = `
            SELECT p.*, h.id as hospital_id
            FROM equipment_procurement p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            WHERE p.id = ?
        `;
        const existing = await query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only mark requests for your hospital as procured'
                });
            }
        }

        if (existing[0].status !== 'Approved') {
            return res.status(400).json({
                success: false,
                message: `Cannot mark request as procured with status: ${existing[0].status}. Request must be 'Approved'`
            });
        }

        await query(
            `UPDATE equipment_procurement SET 
             status = 'Procured',
             procured_at = NOW()
             WHERE id = ?`,
            [id]
        );

        res.json({ success: true, message: 'Procurement request marked as procured' });
    } catch (error) {
        console.error('Mark procured error:', error);
        res.status(500).json({ success: false, message: 'Failed to update procurement request' });
    }
});

// ✅ Start Review - SUPER_ADMIN and HOSPITAL_ADMIN
router.put('/:id/review', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        let checkSql = `
            SELECT p.*, h.id as hospital_id
            FROM equipment_procurement p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            WHERE p.id = ?
        `;
        const existing = await query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only review requests for your hospital'
                });
            }
        }

        if (existing[0].status !== 'Requested') {
            return res.status(400).json({
                success: false,
                message: `Cannot review request with status: ${existing[0].status}. Request must be 'Requested'`
            });
        }

        await query(
            `UPDATE equipment_procurement SET 
             status = 'Under Review',
             reviewed_by = ?,
             reviewed_at = NOW()
             WHERE id = ?`,
            [req.user.id, id]
        );

        res.json({ success: true, message: 'Request moved to Under Review' });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ success: false, message: 'Failed to update review status' });
    }
});

module.exports = router;