const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ✅ Workflow steps (must match frontend)
const STEPS = [
  'PURCHASE CASE INITIATED',
  'CASE APPROVED',
  'P.O ISSUED',
  'SHIPMENT ARRIVED',
  'EQUIPMENT INSTALLED',
  'EQUIPMENT TESTED & COMMISSIONED FOR USE'
];

// ============================================================
// GET all procurement requests
// ============================================================
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

// ============================================================
// CREATE procurement request
// ============================================================
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'), async (req, res) => {
  try {
    const {
      hospital_id,
      equipment_name,
      category_name,
      manufacturer_options, // array
      model_options,        // array
      quantity,
      estimated_cost,
      justification,
      priority,
      requested_by,
      department_name,
      attachments,
      currency
    } = req.body;

    // Access control
    if (req.user.role_name !== 'SUPER_ADMIN') {
      if (hospital_id !== req.user.hospital_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only create requests for your hospital'
        });
      }
    }

    if (!hospital_id || !equipment_name) {
      return res.status(400).json({
        success: false,
        message: 'Hospital ID and Equipment Name are required'
      });
    }

    const manOpts = JSON.stringify(manufacturer_options || []);
    const modOpts = JSON.stringify(model_options || []);

    const result = await query(
      `INSERT INTO equipment_procurement 
       (hospital_id, equipment_name, category_name,
        manufacturer_options, model_options,
        quantity, estimated_cost,
        justification, priority, requested_by, department_name, attachments,
        currency, status, step_comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hospital_id,
        equipment_name,
        category_name || '',
        manOpts,
        modOpts,
        quantity || 1,
        estimated_cost || 0,
        justification || '',
        priority || 'Medium',
        requested_by || req.user.id,
        department_name || '',
        attachments || '',
        currency || 'PKR',
        'PURCHASE CASE INITIATED',
        JSON.stringify({}) // empty comments
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

// ============================================================
// UPDATE procurement request (only SUPER_ADMIN, not rejected)
// ✅ Allow edit for completed status too
// ============================================================
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      equipment_name,
      category_name,
      manufacturer_options,
      model_options,
      quantity,
      estimated_cost,
      justification,
      priority,
      department_name,
      attachments,
      currency
    } = req.body;

    const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Procurement request not found' });
    }

    // ❌ Only disallow edit if rejected
    // ✅ Allow edit for completed/commissioned status
    if (existing[0].status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a request that is already rejected'
      });
    }

    const manOpts = JSON.stringify(manufacturer_options || []);
    const modOpts = JSON.stringify(model_options || []);

    await query(
      `UPDATE equipment_procurement SET 
        equipment_name = ?,
        category_name = ?,
        manufacturer_options = ?,
        model_options = ?,
        quantity = ?,
        estimated_cost = ?,
        justification = ?,
        priority = ?,
        department_name = ?,
        attachments = ?,
        currency = ?
       WHERE id = ?`,
      [
        equipment_name,
        category_name || '',
        manOpts,
        modOpts,
        quantity || 1,
        estimated_cost || 0,
        justification || '',
        priority || 'Medium',
        department_name || '',
        attachments || '',
        currency || 'PKR',
        id
      ]
    );

    res.json({ success: true, message: 'Procurement request updated' });
  } catch (error) {
    console.error('Update procurement request error:', error);
    res.status(500).json({ success: false, message: 'Failed to update procurement request' });
  }
});

// ============================================================
// DELETE procurement request (only SUPER_ADMIN)
// ✅ Allow delete for completed status too
// ============================================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Procurement request not found' });
    }

    // ❌ Only disallow delete if rejected
    // ✅ Allow delete for completed/commissioned status
    if (existing[0].status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a request that is already rejected'
      });
    }

    await query('DELETE FROM equipment_procurement WHERE id = ?', [id]);
    res.json({ success: true, message: 'Procurement request deleted' });
  } catch (error) {
    console.error('Delete procurement error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete procurement request' });
  }
});

// ============================================================
// STATUS TRANSITION (main endpoint)
// ============================================================
router.put('/:id/status', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    // Validate status
    const allowed = [...STEPS, 'REJECTED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(', ')}`
      });
    }

    const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Procurement request not found' });
    }

    // If already REJECTED, cannot change
    if (existing[0].status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a rejected request'
      });
    }

    // If already commissioned, cannot change (final state)
    if (existing[0].status === 'EQUIPMENT TESTED & COMMISSIONED FOR USE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a commissioned request'
      });
    }

    // Prevent moving backwards (except to REJECTED)
    if (status !== 'REJECTED') {
      const currentIndex = STEPS.indexOf(existing[0].status);
      const newIndex = STEPS.indexOf(status);
      if (newIndex <= currentIndex) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move to a previous or same step'
        });
      }
    }

    // Build update object
    const updates = { status };
    const now = new Date();

    // Set specific timestamps
    if (status === 'CASE APPROVED') {
      updates.approved_by = req.user.id;
      updates.approved_at = now;
    } else if (status === 'REJECTED') {
      updates.rejected_by = req.user.id;
      updates.rejected_at = now;
    } else if (status === 'P.O ISSUED') {
      updates.po_issued_at = now;
    } else if (status === 'SHIPMENT ARRIVED') {
      updates.shipment_arrived_at = now;
    } else if (status === 'EQUIPMENT INSTALLED') {
      updates.equipment_installed_at = now;
    } else if (status === 'EQUIPMENT TESTED & COMMISSIONED FOR USE') {
      updates.commissioned_at = now;
    }

    // Handle comment for the new status
    if (comment) {
      let stepComments = existing[0].step_comments || {};
      if (typeof stepComments === 'string') {
        try { stepComments = JSON.parse(stepComments); } catch { stepComments = {}; }
      }
      stepComments[status] = comment.trim();
      updates.step_comments = JSON.stringify(stepComments);
    }

    // Build SET clause
    const setClauses = [];
    const values = [];
    Object.keys(updates).forEach(key => {
      setClauses.push(`${key} = ?`);
      values.push(updates[key]);
    });
    values.push(id);

    await query(`UPDATE equipment_procurement SET ${setClauses.join(', ')} WHERE id = ?`, values);

    // Return updated step_comments for frontend
    const updated = await query('SELECT step_comments FROM equipment_procurement WHERE id = ?', [id]);
    const comments = updated[0]?.step_comments || {};

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      step_comments: typeof comments === 'string' ? JSON.parse(comments) : comments
    });
  } catch (error) {
    console.error('Status transition error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// ============================================================
// ADD COMMENT TO CURRENT STEP
// ============================================================
router.post('/:id/comment', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { step, comment } = req.body;

    if (!step || !comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Step and comment are required'
      });
    }

    const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Procurement request not found' });
    }

    // Only allow commenting on the current step
    if (step !== existing[0].status) {
      return res.status(400).json({
        success: false,
        message: `Comment can only be added to the current step (${existing[0].status})`
      });
    }

    let stepComments = existing[0].step_comments || {};
    if (typeof stepComments === 'string') {
      try { stepComments = JSON.parse(stepComments); } catch { stepComments = {}; }
    }

    // Overwrite comment for that step
    stepComments[step] = comment.trim();

    await query(
      `UPDATE equipment_procurement SET step_comments = ? WHERE id = ?`,
      [JSON.stringify(stepComments), id]
    );

    res.json({
      success: true,
      message: 'Comment added',
      step_comments: stepComments
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// ============================================================
// Legacy endpoints (now redirect to /status)
// ============================================================
router.put('/:id/approve', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  req.body.status = 'CASE APPROVED';
  req.body.comment = req.body.comment || 'Approved';
  return router.handle(req, res, '/:id/status');
});

router.put('/:id/reject', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  req.body.status = 'REJECTED';
  req.body.comment = req.body.rejection_reason || 'Rejected';
  return router.handle(req, res, '/:id/status');
});

router.put('/:id/procured', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  req.body.status = 'EQUIPMENT TESTED & COMMISSIONED FOR USE';
  req.body.comment = 'Commissioned';
  return router.handle(req, res, '/:id/status');
});

router.put('/:id/review', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  req.body.status = 'CASE APPROVED';
  req.body.comment = req.body.comment || 'Under review';
  return router.handle(req, res, '/:id/status');
});

module.exports = router;