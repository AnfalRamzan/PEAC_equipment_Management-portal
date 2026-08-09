const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all AMC contracts
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT a.*, e.name as equipment_name, 
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   u.full_name as created_by_name
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON a.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY a.created_at DESC';
        const contracts = await query(sql, params);
        res.json({ success: true, contracts });
    } catch (error) {
        console.error('Get AMC contracts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch AMC contracts' });
    }
});

// Get single AMC contract
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT a.*, e.name as equipment_name,
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   u.full_name as created_by_name
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users u ON a.created_by = u.id
            WHERE a.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const contracts = await query(sql, params);
        
        if (contracts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'AMC contract not found'
            });
        }

        res.json({ success: true, contract: contracts[0] });
    } catch (error) {
        console.error('Get AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch AMC contract' });
    }
});

// Create AMC contract
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const {
            equipment_id, vendor_name, contract_number,
            start_date, end_date, cost,
            contact_person, contact_phone, status,
            notes, attachments
        } = req.body;

        // Validate required fields
        if (!equipment_id) {
            return res.status(400).json({
                success: false,
                message: 'Equipment is required'
            });
        }
        if (!vendor_name) {
            return res.status(400).json({
                success: false,
                message: 'Vendor name is required'
            });
        }

        // Check equipment access
        let checkSql = 'SELECT * FROM equipment WHERE id = ?';
        let checkParams = [equipment_id];
        if (req.user.role_name !== 'SUPER_ADMIN') {
            checkSql += ' AND hospital_id = ?';
            checkParams.push(req.user.hospital_id);
        }
        const equipment = await query(checkSql, checkParams);
        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or access denied'
            });
        }

        // Validate dates
        if (start_date && end_date) {
            if (new Date(start_date) > new Date(end_date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date cannot be after end date'
                });
            }
        }

        const result = await query(
            `INSERT INTO amc_contracts 
             (equipment_id, vendor_name, contract_number,
              start_date, end_date, cost,
              contact_person, contact_phone, status,
              notes, attachments, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipment_id, vendor_name, contract_number || null,
             start_date || null, end_date || null, cost || null,
             contact_person || null, contact_phone || null,
             status || 'Active', notes || null,
             attachments || null, req.user.id]
        );

        // Create notification for hospital admin
        await query(
            `INSERT INTO notifications (user_id, title, message, type)
             SELECT u.id, 'New AMC Contract', 
                    CONCAT('New AMC contract added for equipment: ', ?), 'System'
             FROM users u
             WHERE u.role_id = 2 
               AND u.hospital_id = ?
               AND u.is_active = TRUE`,
            [equipment[0].name, equipment[0].hospital_id]
        );

        res.status(201).json({
            success: true,
            message: 'AMC contract created successfully',
            contract_id: result.insertId
        });
    } catch (error) {
        console.error('Create AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to create AMC contract' });
    }
});

// Update AMC contract
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_id, vendor_name, contract_number,
            start_date, end_date, cost,
            contact_person, contact_phone, status,
            notes, attachments
        } = req.body;

        // Check if contract exists and user has access
        let checkSql = `
            SELECT a.*, e.id as equipment_id, e.hospital_id
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            WHERE a.id = ?
        `;
        const existing = await query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'AMC contract not found'
            });
        }

        // Check hospital access
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only edit contracts for your hospital'
                });
            }
        }

        // If equipment is being changed, validate access to new equipment
        if (equipment_id && equipment_id !== existing[0].equipment_id) {
            let eqCheckSql = 'SELECT * FROM equipment WHERE id = ?';
            let eqParams = [equipment_id];
            if (req.user.role_name !== 'SUPER_ADMIN') {
                eqCheckSql += ' AND hospital_id = ?';
                eqParams.push(req.user.hospital_id);
            }
            const newEquipment = await query(eqCheckSql, eqParams);
            if (newEquipment.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'New equipment not found or access denied'
                });
            }
        }

        // Validate dates
        if (start_date && end_date) {
            if (new Date(start_date) > new Date(end_date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date cannot be after end date'
                });
            }
        }

        // Get current status for notification
        const currentStatus = existing[0].status;

        await query(
            `UPDATE amc_contracts SET 
             equipment_id = ?, vendor_name = ?,
             contract_number = ?, start_date = ?,
             end_date = ?, cost = ?,
             contact_person = ?, contact_phone = ?,
             status = ?, notes = ?, attachments = ?
             WHERE id = ?`,
            [equipment_id || existing[0].equipment_id,
             vendor_name, contract_number || null,
             start_date || null, end_date || null,
             cost || null, contact_person || null,
             contact_phone || null, status || 'Active',
             notes || null, attachments || null, id]
        );

        // Send notification if status changed
        if (status && status !== currentStatus) {
            await query(
                `INSERT INTO notifications (user_id, title, message, type)
                 SELECT u.id, 'AMC Contract Status Updated', 
                        CONCAT('AMC contract status changed from ', ?, ' to ', ?), 'System'
                 FROM users u
                 LEFT JOIN amc_contracts a ON a.id = ?
                 LEFT JOIN equipment e ON a.equipment_id = e.id
                 WHERE u.role_id = 2 
                   AND u.hospital_id = e.hospital_id
                   AND u.is_active = TRUE`,
                [currentStatus, status, id]
            );
        }

        res.json({
            success: true,
            message: 'AMC contract updated successfully'
        });
    } catch (error) {
        console.error('Update AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to update AMC contract' });
    }
});

// ✅ UPDATED - Delete AMC contract (Super Admin only)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if contract exists and get details for notification
        const existing = await query(
            `SELECT a.*, e.name as equipment_name, e.hospital_id
             FROM amc_contracts a
             LEFT JOIN equipment e ON a.equipment_id = e.id
             WHERE a.id = ?`,
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'AMC contract not found'
            });
        }

        // Check if contract can be deleted (optional - only allow if status is not 'Active')
        // Uncomment if you want to restrict deletion of active contracts
        // if (existing[0].status === 'Active') {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Cannot delete active AMC contract. Please expire it first.'
        //     });
        // }

        await query('DELETE FROM amc_contracts WHERE id = ?', [id]);

        // Create notification for hospital admin
        await query(
            `INSERT INTO notifications (user_id, title, message, type)
             SELECT u.id, 'AMC Contract Deleted', 
                    CONCAT('AMC contract for ', ?, ' has been deleted'), 'System'
             FROM users u
             WHERE u.role_id = 2 
               AND u.hospital_id = ?
               AND u.is_active = TRUE`,
            [existing[0].equipment_name || 'equipment', existing[0].hospital_id]
        );

        res.json({
            success: true,
            message: 'AMC contract deleted successfully'
        });
    } catch (error) {
        console.error('Delete AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete AMC contract' });
    }
});

// ✅ NEW - Renew AMC contract
router.put('/:id/renew', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { new_end_date, renewal_cost, notes } = req.body;

        // Check if contract exists and user has access
        let checkSql = `
            SELECT a.*, e.hospital_id
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            WHERE a.id = ?
        `;
        const existing = await query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'AMC contract not found'
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

        // Validate new end date
        if (!new_end_date) {
            return res.status(400).json({
                success: false,
                message: 'New end date is required'
            });
        }

        if (new Date(new_end_date) <= new Date(existing[0].end_date)) {
            return res.status(400).json({
                success: false,
                message: 'New end date must be after current end date'
            });
        }

        // Get renewal history
        const renewalCount = await query(
            'SELECT COUNT(*) as count FROM amc_renewal_history WHERE contract_id = ?',
            [id]
        );

        await query(
            `UPDATE amc_contracts SET 
             end_date = ?,
             cost = ?,
             notes = CONCAT(notes, ?)
             WHERE id = ?`,
            [new_end_date, renewal_cost || existing[0].cost,
             `\nRenewed on ${new Date().toISOString().split('T')[0]}: ${notes || 'Renewed'}`,
             id]
        );

        // Log renewal history
        await query(
            `INSERT INTO amc_renewal_history 
             (contract_id, previous_end_date, new_end_date, 
              previous_cost, new_cost, renewed_by, renewal_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, existing[0].end_date, new_end_date,
             existing[0].cost, renewal_cost || existing[0].cost,
             req.user.id, notes || null]
        );

        res.json({
            success: true,
            message: 'AMC contract renewed successfully',
            renewal_number: renewalCount[0].count + 1
        });
    } catch (error) {
        console.error('Renew AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to renew AMC contract' });
    }
});

// ✅ NEW - Get AMC renewal history
router.get('/:id/history', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if contract exists and user has access
        let checkSql = `
            SELECT a.*, e.hospital_id
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            WHERE a.id = ?
        `;
        const existing = await query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'AMC contract not found'
            });
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        const history = await query(
            `SELECT h.*, u.full_name as renewed_by_name
             FROM amc_renewal_history h
             LEFT JOIN users u ON h.renewed_by = u.id
             WHERE h.contract_id = ?
             ORDER BY h.renewed_at DESC`,
            [id]
        );

        res.json({ success: true, history });
    } catch (error) {
        console.error('Get renewal history error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch renewal history' });
    }
});

// ✅ NEW - Get AMC statistics
router.get('/stats/overview', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total_contracts,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_contracts,
                SUM(CASE WHEN status = 'Expired' THEN 1 ELSE 0 END) as expired_contracts,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_contracts,
                SUM(CASE WHEN DATEDIFF(end_date, NOW()) <= 30 AND DATEDIFF(end_date, NOW()) > 0 AND status = 'Active' THEN 1 ELSE 0 END) as expiring_soon,
                AVG(cost) as average_cost,
                SUM(cost) as total_cost
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ success: true, stats: stats[0] });
    } catch (error) {
        console.error('Get AMC stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch AMC statistics' });
    }
});

module.exports = router;