// backend/routes/amc.js
// ✅ AMC Routes with Auto-Status Update (Pending, In Progress, Expired)

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// ✅ HELPER: Auto-update AMC status based on dates
// ============================================
const autoUpdateStatus = async (contractId = null) => {
    try {
        let sql = `
            UPDATE amc_contracts 
            SET status = CASE
                WHEN start_date > CURDATE() THEN 'Pending'
                WHEN end_date < CURDATE() THEN 'Expired'
                WHEN CURDATE() BETWEEN start_date AND end_date THEN 'In Progress'
                ELSE 'Pending'
            END,
            is_active = CASE
                WHEN end_date < CURDATE() THEN 0
                ELSE 1
            END
        `;
        let params = [];
        
        if (contractId) {
            sql += ' WHERE id = ?';
            params.push(contractId);
        }
        
        const result = await query(sql, params);
        console.log(`✅ Auto-updated ${result.affectedRows} AMC contract(s) status`);
        return result;
    } catch (error) {
        console.error('❌ Auto-update status error:', error);
        return null;
    }
};

// ============================================
// ✅ HELPER: Get status info
// ============================================
const getStatusInfo = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return { status: 'Pending', isActive: 1, label: 'Pending' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    if (end < today) {
        return { status: 'Expired', isActive: 0, label: 'Expired' };
    } else if (start > today) {
        return { status: 'Pending', isActive: 1, label: 'Pending' };
    } else if (today >= start && today <= end) {
        return { status: 'In Progress', isActive: 1, label: 'In Progress' };
    } else {
        return { status: 'Pending', isActive: 1, label: 'Pending' };
    }
};

// ============================================
// ✅ GET ALL AMC CONTRACTS
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        await autoUpdateStatus();
        
        let sql = `
            SELECT a.*, 
                   e.name as equipment_name, 
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   CASE
                       WHEN a.start_date > CURDATE() THEN 'Pending'
                       WHEN a.end_date < CURDATE() THEN 'Expired'
                       WHEN CURDATE() BETWEEN a.start_date AND a.end_date THEN 'In Progress'
                       ELSE 'Pending'
                   END as calculated_status
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY a.start_date ASC, a.created_at DESC';
        
        const contracts = await query(sql, params);
        res.json({ success: true, contracts });
    } catch (error) {
        console.error('Get AMC contracts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch AMC contracts' });
    }
});

// ============================================
// ✅ GET SINGLE AMC CONTRACT
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        await autoUpdateStatus(id);
        
        let sql = `
            SELECT a.*, 
                   e.name as equipment_name, 
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   CASE
                       WHEN a.start_date > CURDATE() THEN 'Pending'
                       WHEN a.end_date < CURDATE() THEN 'Expired'
                       WHEN CURDATE() BETWEEN a.start_date AND a.end_date THEN 'In Progress'
                       ELSE 'Pending'
                   END as calculated_status
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
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

// ============================================
// ✅ GET AMC CONTRACTS BY STATUS
// ============================================
router.get('/status/:status', authenticate, async (req, res) => {
    try {
        const { status } = req.params;
        
        await autoUpdateStatus();
        
        let sql = `
            SELECT a.*, 
                   e.name as equipment_name, 
                   e.model as equipment_model,
                   h.name as hospital_name
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];
        
        if (status === 'Pending') {
            sql += ' AND a.start_date > CURDATE()';
        } else if (status === 'In Progress') {
            sql += ' AND CURDATE() BETWEEN a.start_date AND a.end_date';
        } else if (status === 'Expired') {
            sql += ' AND a.end_date < CURDATE()';
        }
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY a.start_date ASC';
        
        const contracts = await query(sql, params);
        res.json({ success: true, contracts });
    } catch (error) {
        console.error('Get AMC contracts by status error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch AMC contracts' });
    }
});

// ============================================
// ✅ CREATE AMC CONTRACT
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id,
            vendor_name,
            contract_number,
            start_date,
            end_date,
            cost,
            contact_person,
            contact_phone,
            notes,
            document_url
        } = req.body;

        console.log('📤 Creating AMC contract:', { vendor_name, contract_number });

        if (!equipment_id) {
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

        // ✅ Auto-calculate status based on dates
        const statusInfo = getStatusInfo(start_date, end_date);

        const result = await query(
            `INSERT INTO amc_contracts 
             (equipment_id, vendor_name, contract_number, start_date, end_date, 
              cost, contact_person, contact_phone, notes, document_url, status, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                equipment_id,
                vendor_name.trim(),
                contract_number || null,
                start_date || null,
                end_date || null,
                cost || 0,
                contact_person || null,
                contact_phone || null,
                notes || null,
                document_url || null,
                statusInfo.status,
                statusInfo.isActive
            ]
        );

        console.log('✅ AMC contract created. ID:', result.insertId);

        const newContract = await query(
            `SELECT a.*, e.name as equipment_name 
             FROM amc_contracts a
             LEFT JOIN equipment e ON a.equipment_id = e.id
             WHERE a.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'AMC contract created successfully',
            contract: newContract[0]
        });
    } catch (error) {
        console.error('❌ Create AMC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create AMC contract: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE AMC CONTRACT
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_id,
            vendor_name,
            contract_number,
            start_date,
            end_date,
            cost,
            contact_person,
            contact_phone,
            notes,
            document_url
        } = req.body;

        console.log('🔄 Updating AMC contract:', id);

        const existing = await query('SELECT * FROM amc_contracts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'AMC contract not found' 
            });
        }

        // ✅ Auto-calculate status
        const finalStartDate = start_date || existing[0].start_date;
        const finalEndDate = end_date || existing[0].end_date;
        const statusInfo = getStatusInfo(finalStartDate, finalEndDate);

        await query(
            `UPDATE amc_contracts SET 
             equipment_id = ?,
             vendor_name = ?,
             contract_number = ?,
             start_date = ?,
             end_date = ?,
             cost = ?,
             contact_person = ?,
             contact_phone = ?,
             notes = ?,
             document_url = ?,
             status = ?,
             is_active = ?,
             updated_at = NOW()
             WHERE id = ?`,
            [
                equipment_id || existing[0].equipment_id,
                vendor_name || existing[0].vendor_name,
                contract_number || existing[0].contract_number,
                finalStartDate,
                finalEndDate,
                cost || existing[0].cost,
                contact_person || existing[0].contact_person,
                contact_phone || existing[0].contact_phone,
                notes || existing[0].notes,
                document_url || existing[0].document_url,
                statusInfo.status,
                statusInfo.isActive,
                id
            ]
        );

        console.log('✅ AMC contract updated:', id);

        // ✅ Auto-update status after update
        await autoUpdateStatus(id);

        const updatedContract = await query(
            `SELECT a.*, e.name as equipment_name 
             FROM amc_contracts a
             LEFT JOIN equipment e ON a.equipment_id = e.id
             WHERE a.id = ?`,
            [id]
        );

        res.json({ 
            success: true, 
            message: 'AMC contract updated successfully',
            contract: updatedContract[0]
        });
    } catch (error) {
        console.error('❌ Update AMC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update AMC contract: ' + error.message 
        });
    }
});

// ============================================
// ✅ DELETE AMC CONTRACT
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting AMC contract ID:', id);

        const existing = await query('SELECT * FROM amc_contracts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'AMC contract not found' 
            });
        }

        await query('DELETE FROM amc_contracts WHERE id = ?', [id]);

        console.log('✅ AMC contract deleted:', id);
        res.json({ 
            success: true, 
            message: 'AMC contract deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete AMC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete AMC contract: ' + error.message 
        });
    }
});

// ============================================
// ✅ RENEW AMC CONTRACT
// ============================================
router.post('/:id/renew', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { end_date, cost, notes, document_url } = req.body;

        console.log('🔄 Renewing AMC contract:', id);

        if (!end_date) {
            return res.status(400).json({ 
                success: false, 
                message: 'New end date is required' 
            });
        }

        const existing = await query('SELECT * FROM amc_contracts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'AMC contract not found' 
            });
        }

        // ✅ Auto-calculate status
        const statusInfo = getStatusInfo(existing[0].start_date, end_date);

        await query(
            `INSERT INTO amc_renewal_history 
             (contract_id, previous_end_date, new_end_date, previous_cost, new_cost, renewed_by, renewal_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                existing[0].end_date,
                end_date,
                existing[0].cost,
                cost || existing[0].cost,
                req.user.id,
                notes || 'Renewed'
            ]
        );

        await query(
            `UPDATE amc_contracts SET 
             end_date = ?,
             cost = ?,
             document_url = ?,
             status = ?,
             is_active = ?,
             renewal_count = renewal_count + 1,
             notes = CONCAT(notes, ?),
             updated_at = NOW()
             WHERE id = ?`,
            [
                end_date,
                cost || existing[0].cost,
                document_url || existing[0].document_url,
                statusInfo.status,
                statusInfo.isActive,
                `\nRenewed on ${new Date().toISOString().split('T')[0]}: ${notes || 'Renewed'}`,
                id
            ]
        );

        console.log('✅ AMC contract renewed:', id);

        const renewedContract = await query(
            `SELECT a.*, e.name as equipment_name 
             FROM amc_contracts a
             LEFT JOIN equipment e ON a.equipment_id = e.id
             WHERE a.id = ?`,
            [id]
        );

        res.json({ 
            success: true, 
            message: 'AMC contract renewed successfully',
            contract: renewedContract[0]
        });
    } catch (error) {
        console.error('❌ Renew AMC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to renew AMC contract: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET RENEWAL HISTORY
// ============================================
router.get('/:id/history', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const history = await query(
            `SELECT h.*, u.full_name as renewed_by_name
             FROM amc_renewal_history h
             LEFT JOIN users u ON h.renewed_by = u.id
             WHERE h.contract_id = ?
             ORDER BY h.created_at DESC`,
            [id]
        );

        res.json({ success: true, history });
    } catch (error) {
        console.error('Get renewal history error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch renewal history' 
        });
    }
});

// ============================================
// ✅ GET AMC STATS
// ============================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        await autoUpdateStatus();
        
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN start_date > CURDATE() THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN CURDATE() BETWEEN start_date AND end_date THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as expiring_this_week
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
        res.json({ success: true, stats: stats[0] || {} });
    } catch (error) {
        console.error('Get AMC stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch AMC stats' 
        });
    }
});

module.exports = router;