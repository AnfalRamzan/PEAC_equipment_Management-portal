// backend/routes/errors.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// ✅ HELPER: CREATE NOTIFICATION
// ============================================
const createNotification = async (userId, title, message, type, relatedId = null, relatedModule = null) => {
    try {
        const result = await query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_module, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, title, message, type, relatedId, relatedModule]
        );
        return result;
    } catch (error) {
        console.error('❌ Notification error:', error);
        return null;
    }
};

// ============================================
// ✅ GET ALL ERRORS
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT el.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   h.name as hospital_name,
                   d.name as department_name,
                   u.full_name as reported_by_name,
                   u2.full_name as assigned_to_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON el.reported_by = u.id
            LEFT JOIN users u2 ON el.assigned_to = u2.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY el.created_at DESC';
        
        const errors = await query(sql, params);
        res.json({ success: true, errors });
    } catch (error) {
        console.error('Get errors error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch errors' });
    }
});

// ============================================
// ✅ GET SINGLE ERROR
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT el.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   h.name as hospital_name,
                   d.name as department_name,
                   u.full_name as reported_by_name,
                   u2.full_name as assigned_to_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON el.reported_by = u.id
            LEFT JOIN users u2 ON el.assigned_to = u2.id
            WHERE el.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const errors = await query(sql, params);
        if (errors.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error not found' 
            });
        }
        res.json({ success: true, error: errors[0] });
    } catch (error) {
        console.error('Get error error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch error' });
    }
});

// ============================================
// ✅ CREATE ERROR (WITH NOTIFICATIONS)
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id,
            error_code,
            error_title,
            error_description,
            error_date,
            severity,
            priority,
            status,
            assigned_to,
            images,
            videos,
            documents,
            attachments
        } = req.body;

        console.log('📤 Creating error:', { error_title, equipment_id, severity, status });

        // Validate
        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }
        if (!error_title || error_title.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Error title is required' 
            });
        }

        // Check equipment access
        let sql = 'SELECT * FROM equipment WHERE id = ?';
        let params = [equipment_id];
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        const equipment = await query(sql, params);
        if (equipment.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found or access denied' 
            });
        }

        const finalStatus = status || 'Pending';
        const finalSeverity = severity || 'Medium';
        const finalPriority = priority || 'Medium';

        const result = await query(
            `INSERT INTO error_logs 
             (equipment_id, error_code, error_title, error_description,
              error_date, severity, priority, status, reported_by, assigned_to,
              images, videos, documents, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                equipment_id, 
                error_code || null, 
                error_title.trim(), 
                error_description || null,
                error_date || new Date().toISOString().split('T')[0],
                finalSeverity, 
                finalPriority,
                finalStatus, 
                req.user.id,
                assigned_to || null, 
                images || null, 
                videos || null, 
                documents || null,
                attachments || null
            ]
        );

        const errorId = result.insertId;
        const equipmentName = equipment[0].name;
        const hospitalId = equipment[0].hospital_id;
        const reportedBy = req.user.full_name || 'Engineer';

        console.log('✅ Error created successfully. ID:', errorId);

        // ============================================
        // ✅ NOTIFICATIONS
        // ============================================

        // 1. Notify Super Admin
        await createNotification(
            1,
            '🚨 New Error Reported',
            `Error "${error_title}" reported for ${equipmentName} by ${reportedBy}`,
            'error',
            errorId,
            'errors'
        );

        // 2. Notify Hospital Admins
        const admins = await query(
            `SELECT id, full_name FROM users 
             WHERE role_id = 2 
             AND hospital_id = ? 
             AND is_active = 1`,
            [hospitalId]
        );
        
        for (const admin of admins) {
            await createNotification(
                admin.id,
                '🚨 New Error Reported',
                `Error "${error_title}" reported for ${equipmentName} in your hospital by ${reportedBy}`,
                'error',
                errorId,
                'errors'
            );
        }

        // 3. Notify Assigned Engineer
        if (assigned_to) {
            await createNotification(
                parseInt(assigned_to),
                '📋 New Error Assigned to You',
                `Error "${error_title}" for ${equipmentName} has been assigned to you.`,
                'error',
                errorId,
                'errors'
            );
        }

        // 4. Notify All Engineers in Hospital
        const engineers = await query(
            `SELECT id, full_name FROM users 
             WHERE role_id = 3 
             AND hospital_id = ? 
             AND is_active = 1
             AND id != ?`,
            [hospitalId, req.user.id]
        );
        
        for (const engineer of engineers) {
            await createNotification(
                engineer.id,
                '📋 New Error Available',
                `New error "${error_title}" reported for ${equipmentName}. Please check if you can help.`,
                'error',
                errorId,
                'errors'
            );
        }

        // 5. Notify Reporter (if not already notified)
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.role_name !== 'HOSPITAL_ADMIN') {
            await createNotification(
                req.user.id,
                '✅ Error Reported Successfully',
                `Your error "${error_title}" for ${equipmentName} has been reported and is pending review.`,
                'error',
                errorId,
                'errors'
            );
        }

        // Get the created error with details
        const newError = await query(
            `SELECT el.*, 
                    e.name as equipment_name,
                    h.name as hospital_name,
                    u.full_name as reported_by_name,
                    u2.full_name as assigned_to_name
             FROM error_logs el
             LEFT JOIN equipment e ON el.equipment_id = e.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             LEFT JOIN users u ON el.reported_by = u.id
             LEFT JOIN users u2 ON el.assigned_to = u2.id
             WHERE el.id = ?`,
            [errorId]
        );

        res.status(201).json({
            success: true,
            message: 'Error reported successfully',
            error: newError[0]
        });
    } catch (error) {
        console.error('❌ Create error error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to report error: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE ERROR - WITH PROPER PERMISSIONS
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            error_code,
            error_title,
            error_description,
            severity,
            priority,
            status,
            assigned_to,
            images,
            videos,
            documents,
            attachments
        } = req.body;

        console.log('🔄 Updating error ID:', id);
        console.log('📌 User role:', req.user.role_name);
        console.log('📌 User ID:', req.user.id);

        // ✅ Check if error exists
        let sql = `
            SELECT el.*, e.hospital_id, e.name as equipment_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE el.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error not found' 
            });
        }

        const errorData = existing[0];

        // ============================================
        // ✅ PERMISSION CHECK
        // ============================================
        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';
        const isAssignedToMe = errorData.assigned_to === req.user.id;
        const isReportedByMe = errorData.reported_by === req.user.id;

        // ✅ SUPER ADMIN - Can update everything EXCEPT status (status via PATCH)
        if (isSuperAdmin) {
            console.log('✅ Super Admin updating error');
        }
        // ✅ HOSPITAL ADMIN - Can update errors in their hospital
        else if (isHospitalAdmin) {
            if (errorData.hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied: You can only update errors in your hospital' 
                });
            }
        }
        // ✅ ENGINEER - Can only update assigned errors
        else if (isEngineer) {
            if (!isAssignedToMe && !isReportedByMe) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied: You can only update errors assigned to you or reported by you' 
                });
            }
        }
        // ❌ No permission
        else {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }

        // ============================================
        // ✅ BUILD UPDATE QUERY
        // ============================================
        const updateFields = [];
        const updateValues = [];

        // ✅ Basic fields (all can update)
        if (error_code !== undefined) {
            updateFields.push('error_code = ?');
            updateValues.push(error_code || null);
        }
        if (error_title !== undefined && error_title.trim() !== '') {
            updateFields.push('error_title = ?');
            updateValues.push(error_title.trim());
        }
        if (error_description !== undefined) {
            updateFields.push('error_description = ?');
            updateValues.push(error_description || null);
        }
        if (severity !== undefined) {
            updateFields.push('severity = ?');
            updateValues.push(severity || 'Medium');
        }
        if (priority !== undefined) {
            updateFields.push('priority = ?');
            updateValues.push(priority || 'Medium');
        }
        if (assigned_to !== undefined) {
            updateFields.push('assigned_to = ?');
            updateValues.push(assigned_to || null);
        }
        if (images !== undefined) {
            updateFields.push('images = ?');
            updateValues.push(images || null);
        }
        if (videos !== undefined) {
            updateFields.push('videos = ?');
            updateValues.push(videos || null);
        }
        if (documents !== undefined) {
            updateFields.push('documents = ?');
            updateValues.push(documents || null);
        }
        if (attachments !== undefined) {
            updateFields.push('attachments = ?');
            updateValues.push(attachments || null);
        }

        // ✅ STATUS - Permission based
        if (status !== undefined) {
            // Super Admin can change status
            if (isSuperAdmin) {
                updateFields.push('status = ?');
                updateValues.push(status);
                console.log('✅ Super Admin changing status to:', status);
            }
            // Hospital Admin can only set to In Progress or Completed
            else if (isHospitalAdmin && ['In Progress', 'Completed'].includes(status)) {
                updateFields.push('status = ?');
                updateValues.push(status);
                console.log('✅ Hospital Admin changing status to:', status);
            }
            // Engineer can only set to Completed
            else if (isEngineer && status === 'Completed' && errorData.status === 'In Progress') {
                updateFields.push('status = ?');
                updateValues.push(status);
                console.log('✅ Engineer completing error');
            }
            // Status change not allowed
            else {
                console.log('⚠️ Status change not allowed for this role. Keeping original:', errorData.status);
                updateFields.push('status = ?');
                updateValues.push(errorData.status);
            }
        } else {
            // Keep original status
            updateFields.push('status = ?');
            updateValues.push(errorData.status);
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(id);

        // ✅ Execute update
        await query(
            `UPDATE error_logs SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        console.log('✅ Error updated successfully:', id);

        // ============================================
        // ✅ NOTIFICATIONS ON STATUS CHANGE
        // ============================================
        if (status && status !== errorData.status) {
            const statusMessages = {
                'In Progress': '🔄 Error is being worked on',
                'Completed': '✅ Error has been completed',
                'Resolved': '✅ Error has been resolved',
                'Closed': '🔒 Error has been closed'
            };
            
            const message = statusMessages[status] || `Status changed to ${status}`;
            
            // Notify assigned engineer
            if (errorData.assigned_to) {
                await createNotification(
                    errorData.assigned_to,
                    '📋 Error Status Updated',
                    `${message} for "${errorData.error_title}"`,
                    'error',
                    id,
                    'errors'
                );
            }

            // Notify reporter
            if (errorData.reported_by && errorData.reported_by !== errorData.assigned_to) {
                await createNotification(
                    errorData.reported_by,
                    '📋 Error Status Updated',
                    `${message} for "${errorData.error_title}"`,
                    'error',
                    id,
                    'errors'
                );
            }

            // Notify Super Admin on completion
            if (status === 'Completed' || status === 'Resolved') {
                await createNotification(
                    1,
                    '✅ Error Status Updated',
                    `${message} for "${errorData.error_title}"`,
                    'error',
                    id,
                    'errors'
                );
            }
        }

        // ============================================
        // ✅ NOTIFICATION ON ASSIGNMENT CHANGE
        // ============================================
        if (assigned_to !== undefined && assigned_to !== errorData.assigned_to && assigned_to) {
            await createNotification(
                parseInt(assigned_to),
                '📋 Error Assigned to You',
                `Error "${errorData.error_title}" has been assigned to you.`,
                'error',
                id,
                'errors'
            );
        }

        // ✅ Get updated error
        const updatedError = await query(
            `SELECT el.*, 
                    e.name as equipment_name,
                    h.name as hospital_name,
                    u.full_name as reported_by_name,
                    u2.full_name as assigned_to_name
             FROM error_logs el
             LEFT JOIN equipment e ON el.equipment_id = e.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             LEFT JOIN users u ON el.reported_by = u.id
             LEFT JOIN users u2 ON el.assigned_to = u2.id
             WHERE el.id = ?`,
            [id]
        );

        res.json({ 
            success: true, 
            message: 'Error updated successfully',
            error: updatedError[0]
        });
    } catch (error) {
        console.error('❌ Update error error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update error: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE ERROR STATUS (PATCH) - ONLY SUPER ADMIN
// ============================================
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('📌 Status update - Error ID:', id, 'New Status:', status);

        const existing = await query('SELECT * FROM error_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error not found' 
            });
        }

        const validStatuses = ['Pending', 'In Progress', 'Completed', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        await query('UPDATE error_logs SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

        console.log('✅ Error status updated:', id, '->', status);
        
        // Send notification
        const error = await query(
            `SELECT el.*, eq.name as equipment_name 
             FROM error_logs el
             LEFT JOIN equipment eq ON el.equipment_id = eq.id
             WHERE el.id = ?`,
            [id]
        );
        
        if (error.length > 0) {
            // Notify assigned engineer
            if (error[0].assigned_to) {
                await createNotification(
                    error[0].assigned_to,
                    '📋 Error Status Updated',
                    `Error "${error[0].error_title}" status changed to ${status}`,
                    'error',
                    id,
                    'errors'
                );
            }

            // Notify reporter
            if (error[0].reported_by && error[0].reported_by !== error[0].assigned_to) {
                await createNotification(
                    error[0].reported_by,
                    '📋 Error Status Updated',
                    `Your reported error "${error[0].error_title}" status changed to ${status}`,
                    'error',
                    id,
                    'errors'
                );
            }
        }

        res.json({ 
            success: true, 
            message: 'Status updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update status: ' + error.message 
        });
    }
});

// ============================================
// ✅ DELETE ERROR - ONLY SUPER ADMIN
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Deleting error ID:', id);

        // Check access
        let sql = `
            SELECT el.*, e.hospital_id
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE el.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error not found' 
            });
        }

        await query('DELETE FROM error_logs WHERE id = ?', [id]);
        
        console.log('✅ Error deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Error deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete error error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete error: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET ERRORS BY EQUIPMENT
// ============================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        let sql = `
            SELECT el.*, 
                   u.full_name as reported_by_name,
                   u2.full_name as assigned_to_name
            FROM error_logs el
            LEFT JOIN users u ON el.reported_by = u.id
            LEFT JOIN users u2 ON el.assigned_to = u2.id
            WHERE el.equipment_id = ?
        `;
        const params = [equipmentId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND EXISTS (SELECT 1 FROM equipment e WHERE e.id = el.equipment_id AND e.hospital_id = ?)';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY el.created_at DESC';
        
        const errors = await query(sql, params);
        res.json({ success: true, errors });
    } catch (error) {
        console.error('Get errors by equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch errors' });
    }
});

// ============================================
// ✅ GET ERRORS BY ENGINEER
// ============================================
router.get('/engineer/:engineerId', authenticate, async (req, res) => {
    try {
        const { engineerId } = req.params;
        
        let sql = `
            SELECT el.*, 
                   e.name as equipment_name,
                   h.name as hospital_name,
                   u.full_name as reported_by_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON el.reported_by = u.id
            WHERE el.assigned_to = ?
        `;
        const params = [engineerId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY el.created_at DESC';
        
        const errors = await query(sql, params);
        res.json({ success: true, errors });
    } catch (error) {
        console.error('Get errors by engineer error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch errors' });
    }
});

// ============================================
// ✅ GET ERRORS STATISTICS
// ============================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ success: true, stats: stats[0] || {} });
    } catch (error) {
        console.error('Get error stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

// ============================================
// ✅ GET MY ERRORS (For Engineer)
// ============================================
router.get('/my-errors', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let sql = `
            SELECT el.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name,
                   u.full_name as reported_by_name,
                   u2.full_name as assigned_to_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON el.reported_by = u.id
            LEFT JOIN users u2 ON el.assigned_to = u2.id
            WHERE el.reported_by = ? OR el.assigned_to = ?
        `;
        const params = [userId, userId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY el.created_at DESC';
        
        const errors = await query(sql, params);
        res.json({ success: true, errors });
    } catch (error) {
        console.error('Get my errors error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch errors' });
    }
});

module.exports = router;