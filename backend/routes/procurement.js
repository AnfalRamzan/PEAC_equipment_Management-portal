const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all procurement requests
// ✅ All authenticated users can view
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, h.name as hospital_name, u.full_name as requested_by_name,
                   c.name as category_name
            FROM equipment_procurement p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.requested_by = u.id
            LEFT JOIN equipment_categories c ON p.category_id = c.id
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

// ✅ FIXED: Create procurement request - ENGINEER can also create
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'), async (req, res) => {
    try {
        const {
            hospital_id, equipment_name, category_id,
            manufacturer, model, quantity, estimated_cost,
            justification, priority, requested_by, department, attachments
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

        const result = await query(
            `INSERT INTO equipment_procurement 
             (hospital_id, equipment_name, category_id,
              manufacturer, model, quantity, estimated_cost,
              justification, priority, requested_by, department, attachments, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [hospital_id, equipment_name, category_id,
             manufacturer, model, quantity, estimated_cost,
             justification, priority || 'Medium', req.user.id, department || '', attachments || '', 'Requested']
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

// ✅ FIXED: Update procurement request - ONLY SUPER_ADMIN can update
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_name, category_id, manufacturer,
            model, quantity, estimated_cost, justification, priority, status,
            department, attachments
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
             equipment_name = ?, category_id = ?,
             manufacturer = ?, model = ?,
             quantity = ?, estimated_cost = ?,
             justification = ?, priority = ?, status = ?,
             department = ?, attachments = ?
             WHERE id = ?`,
            [equipment_name, category_id, manufacturer,
             model, quantity, estimated_cost,
             justification, priority, status,
             department || '', attachments || '', id]
        );

        res.json({ success: true, message: 'Procurement request updated' });
    } catch (error) {
        console.error('Update procurement request error:', error);
        res.status(500).json({ success: false, message: 'Failed to update procurement request' });
    }
});

// ✅ FIXED: Delete procurement request - ONLY SUPER_ADMIN can delete
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if request exists
        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        // Only allow deletion if status is 'Requested' or 'Under Review'
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

// ✅ FIXED: Approve procurement request - ONLY SUPER_ADMIN can approve
router.put('/:id/approve', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if request exists
        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        // Check if request is in valid status for approval
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

// ✅ FIXED: Reject procurement request - ONLY SUPER_ADMIN can reject
router.put('/:id/reject', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;

        // Check if request exists
        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement request not found'
            });
        }

        // Check if request is in valid status for rejection
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

// ✅ FIXED: Mark as Procured - SUPER_ADMIN and HOSPITAL_ADMIN can mark as procured
router.put('/:id/procured', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if request exists and user has access
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

        // Check hospital access for Hospital Admin
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only mark requests for your hospital as procured'
                });
            }
        }

        // Check if request is in valid status
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

// ✅ FIXED: Start Review - SUPER_ADMIN and HOSPITAL_ADMIN can start review
router.put('/:id/review', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if request exists and user has access
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

        // Check hospital access for Hospital Admin
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only review requests for your hospital'
                });
            }
        }

        // Check if request is in valid status
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

// ✅ FIXED: General status update - with role-based restrictions
router.put('/:id/status', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Procured'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Check if request exists and user has access
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

        // Check hospital access for Hospital Admin
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
            'Requested': ['Under Review'],
            'Under Review': ['Approved', 'Rejected'],
            'Approved': ['Procured'],
            'Rejected': [],
            'Procured': []
        };

        if (!allowedTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${currentStatus}' to '${status}'`
            });
        }

        // ✅ Only SUPER_ADMIN can approve or reject
        if ((status === 'Approved' || status === 'Rejected') && req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can approve or reject requests'
            });
        }

        // ✅ Hospital Admin can only move to Under Review
        if (req.user.role_name === 'HOSPITAL_ADMIN' && status !== 'Under Review') {
            return res.status(403).json({
                success: false,
                message: 'Hospital Admin can only move requests to Under Review status'
            });
        }

        let updateFields = 'status = ?';
        const updateParams = [status];

        if (status === 'Approved') {
            updateFields += ', approved_by = ?, approved_at = NOW()';
            updateParams.push(req.user.id);
        } else if (status === 'Rejected') {
            updateFields += ', rejected_by = ?, rejected_at = NOW()';
            updateParams.push(req.user.id);
        } else if (status === 'Procured') {
            updateFields += ', procured_at = NOW()';
        }

        updateParams.push(id);
        await query(`UPDATE equipment_procurement SET ${updateFields} WHERE id = ?`, updateParams);

        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

module.exports = router;