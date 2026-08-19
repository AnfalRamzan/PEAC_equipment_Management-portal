// backend/routes/errors.js
// ✅ COMPLETE FIXED VERSION - With Engineer ID filtering
// ✅ REMOVED: Priority from all queries
// ✅ REMOVED: Completed status - Only Pending, In Progress, Resolved
// ✅ ADDED: resolved_at column support
// ✅ FIXED: Engineer report filtering
// ✅ FIXED: Status update with resolved_at
// ✅ FIXED: DELETE route with cascade delete for linked repairs and spare parts
// ✅ ADDED: Support for custom resolution date from frontend

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
                   el.attachments, el.created_at, el.updated_at, el.status,
                   el.resolved_at,
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
                   el.attachments, el.created_at, el.updated_at, el.status,
                   el.resolved_at,
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
// ✅ CREATE ERROR - Priority removed
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id,
            error_code,
            error_title,
            error_description,
            error_date,
            attachments
        } = req.body;

        console.log('📤 Creating error:', { error_title, equipment_id });

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

        const finalErrorDate = error_date || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await query(
            `INSERT INTO error_logs 
             (equipment_id, error_code, error_title, error_description, 
              reported_by, error_date, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(equipment_id),
                error_code || null,
                error_title.trim(),
                error_description || '',
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
// ✅ UPDATE ERROR - With resolved_at support
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            error_code,
            error_title,
            error_description,
            status,
            attachments,
            resolved_at  // ✅ NEW: Accept resolution date from frontend
        } = req.body;

        console.log('🔄 Updating error ID:', id);
        console.log('📌 User role:', req.user.role_name);
        console.log('📌 User ID:', req.user.id);
        console.log('📌 Status:', status);
        console.log('📌 Resolved At:', resolved_at);

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
        if (attachments !== undefined) {
            updateFields.push('attachments = ?');
            updateValues.push(attachments || '');
        }

        // ✅ STATUS - Only 3 statuses: Pending, In Progress, Resolved
        if (status !== undefined) {
            const validStatuses = ['Pending', 'In Progress', 'Resolved'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Allowed: Pending, In Progress, Resolved'
                });
            }

            // All allowed roles can change status
            if (isSuperAdmin || isHospitalAdmin || isEngineer) {
                updateFields.push('status = ?');
                updateValues.push(status);
                console.log('✅ Updating status to:', status);

                // ✅ Set resolved_at when status is Resolved
                if (status === 'Resolved') {
                    // ✅ Use custom resolution date if provided, otherwise NOW()
                    if (resolved_at) {
                        updateFields.push('resolved_at = ?');
                        updateValues.push(resolved_at);
                        console.log('✅ Setting resolved_at to custom date:', resolved_at);
                    } else {
                        updateFields.push('resolved_at = NOW()');
                        console.log('✅ Setting resolved_at to NOW()');
                    }
                } else {
                    // If status changes away from Resolved, clear resolved_at
                    updateFields.push('resolved_at = NULL');
                    console.log('✅ Clearing resolved_at');
                }
            } else {
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
                    el.attachments, el.created_at, el.updated_at, el.status,
                    el.resolved_at,
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
// ✅ PATCH STATUS - With resolved_at support
// ============================================
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolved_at } = req.body;  // ✅ Accept resolved_at from frontend

        const validStatuses = ['Pending', 'In Progress', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Allowed: Pending, In Progress, Resolved'
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
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (!isSuperAdmin && !isHospitalAdmin && !isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Super Admin, Hospital Admin, or Engineer can change status' 
            });
        }

        if (isEngineer && errorHospitalId !== req.user.hospital_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: You can only update errors in your hospital' 
            });
        }

        if (isHospitalAdmin && errorHospitalId !== req.user.hospital_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: You can only update errors in your hospital' 
            });
        }

        // ✅ Build update query with resolved_at
        let updateQuery = 'UPDATE error_logs SET status = ?, updated_at = NOW()';
        let updateParams = [status];

        // ✅ Set resolved_at when status is Resolved
        if (status === 'Resolved') {
            // ✅ Use custom resolution date if provided, otherwise NOW()
            if (resolved_at) {
                updateQuery += ', resolved_at = ?';
                updateParams.push(resolved_at);
                console.log('✅ Setting resolved_at to custom date:', resolved_at);
            } else {
                updateQuery += ', resolved_at = NOW()';
                console.log('✅ Setting resolved_at to NOW()');
            }
        } else {
            // If status changes away from Resolved, clear resolved_at
            updateQuery += ', resolved_at = NULL';
            console.log('✅ Clearing resolved_at');
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(id);

        await query(updateQuery, updateParams);

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
// ✅ DELETE ERROR - ONLY SUPER ADMIN with Cascade Delete
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Deleting error ID:', id);
        
        // ✅ Check if error exists
        const existing = await query(
            'SELECT id, equipment_id, error_title FROM error_logs WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error not found' 
            });
        }
        
        console.log(`📌 Error: "${existing[0].error_title}" (ID: ${id})`);
        
        // ✅ Find linked repairs
        const repairs = await query(
            'SELECT id FROM repairs WHERE error_log_id = ?',
            [id]
        );
        
        if (repairs.length > 0) {
            console.log(`🔗 Found ${repairs.length} linked repairs, deleting them...`);
            
            // ✅ Delete spare parts linked to each repair
            for (const repair of repairs) {
                await query('DELETE FROM spare_parts WHERE repair_id = ?', [repair.id]);
                console.log(`   🗑️ Deleted spare parts for repair ID: ${repair.id}`);
            }
            
            // ✅ Delete repairs
            await query('DELETE FROM repairs WHERE error_log_id = ?', [id]);
            console.log(`   🗑️ Deleted ${repairs.length} repairs`);
        }
        
        // ✅ Delete the error
        await query('DELETE FROM error_logs WHERE id = ?', [id]);
        
        console.log('✅ Error deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Error deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete error error:', error);
        console.error('❌ SQL:', error.sql);
        console.error('❌ Message:', error.message);
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
            SELECT el.id, el.equipment_id, el.error_code, el.error_title, 
                   el.error_description, el.error_date, el.reported_by, 
                   el.attachments, el.created_at, el.updated_at, el.status,
                   el.resolved_at,
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
                   el.attachments, el.created_at, el.updated_at, el.status,
                   el.resolved_at,
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
// ✅ GET ERRORS STATISTICS - Only 3 statuses
// ============================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
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