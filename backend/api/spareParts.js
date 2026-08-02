const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all spare parts
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT s.*, e.name as equipment_name
            FROM spare_parts s
            LEFT JOIN repairs r ON s.repair_id = r.id
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY s.created_at DESC';
        const parts = await query(sql, params);
        res.json({ success: true, spareParts: parts });
    } catch (error) {
        console.error('Get spare parts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch spare parts' });
    }
});

// Create spare part
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            repair_id, part_name, part_number, brand,
            quantity, unit_cost, total_cost,
            compatible_equipment, installation_notes, manufacturer
        } = req.body;

        const result = await query(
            `INSERT INTO spare_parts 
             (repair_id, part_name, part_number, brand,
              quantity, unit_cost, total_cost,
              compatible_equipment, installation_notes, manufacturer)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [repair_id, part_name, part_number, brand,
             quantity || 1, unit_cost, total_cost,
             compatible_equipment, installation_notes, manufacturer]
        );

        res.status(201).json({
            success: true,
            message: 'Spare part added',
            part_id: result.insertId
        });
    } catch (error) {
        console.error('Create spare part error:', error);
        res.status(500).json({ success: false, message: 'Failed to add spare part' });
    }
});

// Update spare part
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            part_name, part_number, brand,
            quantity, unit_cost, total_cost,
            compatible_equipment, installation_notes, manufacturer
        } = req.body;

        await query(
            `UPDATE spare_parts SET 
             part_name = ?, part_number = ?, brand = ?,
             quantity = ?, unit_cost = ?, total_cost = ?,
             compatible_equipment = ?, installation_notes = ?, manufacturer = ?
             WHERE id = ?`,
            [part_name, part_number, brand,
             quantity, unit_cost, total_cost,
             compatible_equipment, installation_notes, manufacturer, id]
        );

        res.json({ success: true, message: 'Spare part updated' });
    } catch (error) {
        console.error('Update spare part error:', error);
        res.status(500).json({ success: false, message: 'Failed to update spare part' });
    }
});

// Delete spare part
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM spare_parts WHERE id = ?', [id]);
        res.json({ success: true, message: 'Spare part deleted' });
    } catch (error) {
        console.error('Delete spare part error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete spare part' });
    }
});

module.exports = router;