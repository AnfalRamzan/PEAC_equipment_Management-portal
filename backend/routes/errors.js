// backend/routes/errors.js
// ✅ COMPLETE FIXED VERSION - With Engineer ID filtering

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
// ✅ GET ALL ERRORS - WITH ENGINEER FILTER
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT el.id, el.equipment_id, el.error_code, el.error_title, 
                   el.error_description, el.error_date, el.reported_by, 
                   el.attachments, el.priority, el.images, el.videos, 
                   el.documents, el.created_at, el.updated_at, el.status,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   h.name as hospital_name,
                   d.name as department_name,
                   u.full_name as reported_by_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON el.reported_by = u.id
            WHERE 1=1
        `;
        const params = [];

        // ✅ ENGINEER ID FILTER - For engineer reports
        if (req.query.engineer_id) {
            const engineerId = parseInt(req.query.engineer_id);
            sql += ' AND el.reported_by = ?';
            params.push(engineerId);
            console.log('🔍 Filtering errors for engineer_id:', engineerId);
        }

        // ✅ Hospital filter for non-Super Admin
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY el.created_at DESC';
        
        console.log('📊 Fetching errors with params:', params);
        
        const errors = await query(sql, params);
        console.log('✅ Found', errors.length, 'errors');
        
        res.json({ success: true, errors });
    } catch (error) {
        console.error('❌ Get errors error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch errors',
            error: error.message 
        });
    }
});

// ============================================
// ✅ GET SINGLE ERROR
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT el.id, el.equipment_id, el.error_code, el.error_title, 
                   el.error_description, el.error_date, el.reported_by, 
                   el.attachments, el.priority, el.images, el.videos, 
                   el.documents, el.created_at, el.updated_at, el.status,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.serial_number,
                   h.name as hospital_name,
                   d.name as department_name,
                   u.full_name as reported_by_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON el.reported_by = u.id
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
        console.error('❌ Get error error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch error' });
    }
});

// ============================================
// ✅ CREATE ERROR
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id,
            error_code,
            error_title,
            error_description,
            error_date,
            priority,
            attachments
        } = req.body;

        console.log('📤 Creating error:', { error_title, equipment_id, priority });

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

        const finalPriority = priority || 'Medium';
        const finalErrorDate = error_date || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await query(
            `INSERT INTO error_logs 
             (equipment_id, error_code, error_title, error_description, 
              priority, reported_by, error_date, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(equipment_id),
                error_code || null,
                error_title.trim(),
                error_description || '',
                finalPriority,
                req.user.id,
                finalErrorDate,
                attachments || ''
            ]
        );

        console.log('✅ Error created successfully. ID:', result.insertId);

        // Notifications
        const equipmentName = equipment[0].name;
        await createNotification(
            1,
            '🚨 New Error Reported',
            `Error "${error_title}" reported for ${equipmentName}`,
            'error',
            result.insertId,
            'errors'
        );

        res.status(201).json({
            success: true,
            message: 'Error reported successfully',
            error: { 
                id: result.insertId,
                equipment_name: equipmentName
            }
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
// ✅ UPDATE ERROR
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            error_code,
            error_title,
            error_description,
            priority,
            status,
            attachments
        } = req.body;

        console.log('🔄 Updating error ID:', id);
        console.log('📌 User role:', req.user.role_name);
        console.log('📌 User ID:', req.user.id);

        // ✅ Check if error exists with equipment info
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
        const errorHospitalId = errorData.hospital_id;

        // ============================================
        // ✅ PERMISSION CHECK
        // ============================================
        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        console.log('📌 Error Hospital ID:', errorHospitalId);
        console.log('📌 User Hospital ID:', req.user.hospital_id);

        // ✅ SUPER ADMIN - Can update everything
        if (isSuperAdmin) {
            console.log('✅ Super Admin updating error');
        }
        // ✅ HOSPITAL ADMIN - Can update errors in their hospital
        else if (isHospitalAdmin) {
            if (errorHospitalId !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied: You can only update errors in your hospital' 
                });
            }
            console.log('✅ Hospital Admin updating error');
        }
        // ✅ ENGINEER - Can update ALL errors in their hospital
        else if (isEngineer) {
            if (errorHospitalId === req.user.hospital_id) {
                console.log('✅ Engineer updating error (same hospital)');
            } else {
                console.log('❌ Engineer access denied - Not in same hospital');
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied: You can only update errors in your hospital' 
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
            updateValues.push(error_description || '');
        }
        if (priority !== undefined) {
            updateFields.push('priority = ?');
            updateValues.push(priority || 'Medium');
        }
        if (attachments !== undefined) {
            updateFields.push('attachments = ?');
            updateValues.push(attachments || '');
        }

        // ✅ STATUS - Permission based
        if (status !== undefined) {
            const validStatuses = ['Pending', 'In Progress', 'Completed', 'Resolved'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Allowed: Pending, In Progress, Completed, Resolved'
                });
            }

            // Super Admin can change any status
            if (isSuperAdmin) {
                updateFields.push('status = ?');
                updateValues.push(status);
                console.log('✅ Super Admin changing status to:', status);
            }
            // Hospital Admin can set to In Progress, Completed, Resolved
            else if (isHospitalAdmin && ['In Progress', 'Completed', 'Resolved'].includes(status)) {
                updateFields.push('status = ?');
                updateValues.push(status);
                console.log('✅ Hospital Admin changing status to:', status);
            }
            // Engineer can change any status (same hospital)
            else if (isEngineer) {
                updateFields.push('status = ?');
                updateValues.push(status);
                console.log('✅ Engineer changing status to:', status);
            }
            // Status change not allowed
            else {
                console.log('⚠️ Status change not allowed. Keeping original:', errorData.status);
                updateFields.push('status = ?');
                updateValues.push(errorData.status);
            }
        } else {
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

        // ✅ Get updated error
        const updatedError = await query(
            `SELECT el.id, el.equipment_id, el.error_code, el.error_title, 
                    el.error_description, el.error_date, el.reported_by, 
                    el.attachments, el.priority, el.images, el.videos, 
                    el.documents, el.created_at, el.updated_at, el.status,
                    e.name as equipment_name,
                    h.name as hospital_name,
                    u.full_name as reported_by_name
             FROM error_logs el
             LEFT JOIN equipment e ON el.equipment_id = e.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             LEFT JOIN users u ON el.reported_by = u.id
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
// ✅ PATCH STATUS
// ============================================
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Pending', 'In Progress', 'Completed', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        // ✅ Check if error exists
        const existing = await query(
            `SELECT el.*, e.hospital_id 
             FROM error_logs el
             LEFT JOIN equipment e ON el.equipment_id = e.id
             WHERE el.id = ?`,
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error not found' 
            });
        }

        const errorHospitalId = existing[0].hospital_id;

        // ✅ Permission check
        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (!isSuperAdmin && !isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Super Admin or Engineer can change status' 
            });
        }

        if (isEngineer && errorHospitalId !== req.user.hospital_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: You can only update errors in your hospital' 
            });
        }

        await query(
            'UPDATE error_logs SET status = ?, updated_at = NOW() WHERE id = ?', 
            [status, id]
        );

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
        await query('DELETE FROM error_logs WHERE id = ?', [id]);
        res.json({ success: true, message: 'Error deleted successfully' });
    } catch (error) {
        console.error('❌ Delete error error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete error' });
    }
});

// ============================================
// ✅ GET ERRORS BY EQUIPMENT
// ============================================
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        let sql = `
            SELECT el.id, el.equipment_id, el.error_code, el.error_title, 
                   el.error_description, el.error_date, el.reported_by, 
                   el.attachments, el.priority, el.images, el.videos, 
                   el.documents, el.created_at, el.updated_at, el.status,
                   u.full_name as reported_by_name
            FROM error_logs el
            LEFT JOIN users u ON el.reported_by = u.id
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
// ✅ GET MY ERRORS (For Engineer)
// ============================================
router.get('/my-errors', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let sql = `
            SELECT el.id, el.equipment_id, el.error_code, el.error_title, 
                   el.error_description, el.error_date, el.reported_by, 
                   el.attachments, el.priority, el.images, el.videos, 
                   el.documents, el.created_at, el.updated_at, el.status,
                   e.name as equipment_name,
                   h.name as hospital_name,
                   u.full_name as reported_by_name
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON el.reported_by = u.id
            WHERE el.reported_by = ?
        `;
        const params = [userId];

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
                SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as low
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

module.exports = router;