const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all AMC contracts
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT a.*, e.name as equipment_name, h.name as hospital_name
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

        sql += ' ORDER BY a.created_at DESC';
        const contracts = await query(sql, params);
        res.json({ success: true, contracts });
    } catch (error) {
        console.error('Get AMC contracts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch AMC contracts' });
    }
});

// Create AMC contract
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            equipment_id, vendor_name, contract_number,
            start_date, end_date, cost,
            contact_person, contact_phone, status
        } = req.body;

        const result = await query(
            `INSERT INTO amc_contracts 
             (equipment_id, vendor_name, contract_number,
              start_date, end_date, cost,
              contact_person, contact_phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipment_id, vendor_name, contract_number,
             start_date, end_date, cost,
             contact_person, contact_phone, status || 'Active']
        );

        res.status(201).json({
            success: true,
            message: 'AMC contract created',
            contract_id: result.insertId
        });
    } catch (error) {
        console.error('Create AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to create AMC contract' });
    }
});

// Update AMC contract
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            vendor_name, contract_number, start_date,
            end_date, cost, contact_person, contact_phone, status
        } = req.body;

        await query(
            `UPDATE amc_contracts SET 
             vendor_name = ?, contract_number = ?,
             start_date = ?, end_date = ?, cost = ?,
             contact_person = ?, contact_phone = ?, status = ?
             WHERE id = ?`,
            [vendor_name, contract_number, start_date,
             end_date, cost, contact_person, contact_phone, status, id]
        );

        res.json({ success: true, message: 'AMC contract updated' });
    } catch (error) {
        console.error('Update AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to update AMC contract' });
    }
});

// Delete AMC contract
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM amc_contracts WHERE id = ?', [id]);
        res.json({ success: true, message: 'AMC contract deleted' });
    } catch (error) {
        console.error('Delete AMC contract error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete AMC contract' });
    }
});

module.exports = router;