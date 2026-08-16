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
        
        // ✅ Add status to each part (calculated on backend)
        const partsWithStatus = parts.map(part => ({
            ...part,
            status: part.quantity <= 0 ? 'Out of Stock' :
                    part.quantity <= (part.minimum_stock_level || 5) ? 'Low Stock' : 'In Stock'
        }));
        
        res.json({ success: true, spareParts: partsWithStatus });
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
            compatible_equipment, installation_notes, manufacturer,
            image_url, minimum_stock_level  // ✅ Added image_url and minimum_stock_level
        } = req.body;

        const result = await query(
            `INSERT INTO spare_parts 
             (repair_id, part_name, part_number, brand,
              quantity, unit_cost, total_cost,
              compatible_equipment, installation_notes, manufacturer,
              image_url, minimum_stock_level)  // ✅ Added columns
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                repair_id || null, 
                part_name, 
                part_number || null, 
                brand || null,
                quantity || 1, 
                unit_cost || 0, 
                total_cost || 0,
                compatible_equipment || null, 
                installation_notes || null, 
                manufacturer || null,
                image_url || null,           // ✅ Added
                minimum_stock_level || 5     // ✅ Added with default
            ]
        );

        // ✅ Get the newly created part with status
        const newPart = await query('SELECT * FROM spare_parts WHERE id = ?', [result.insertId]);
        const partWithStatus = {
            ...newPart[0],
            status: newPart[0].quantity <= 0 ? 'Out of Stock' :
                    newPart[0].quantity <= (newPart[0].minimum_stock_level || 5) ? 'Low Stock' : 'In Stock'
        };

        res.status(201).json({
            success: true,
            message: 'Spare part added',
            part_id: result.insertId,
            sparePart: partWithStatus
        });
    } catch (error) {
        console.error('Create spare part error:', error);
        res.status(500).json({ success: false, message: 'Failed to add spare part: ' + error.message });
    }
});

// Update spare part
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            part_name, part_number, brand,
            quantity, unit_cost, total_cost,
            compatible_equipment, installation_notes, manufacturer,
            image_url, minimum_stock_level  // ✅ Added fields
        } = req.body;

        await query(
            `UPDATE spare_parts SET 
             part_name = ?, part_number = ?, brand = ?,
             quantity = ?, unit_cost = ?, total_cost = ?,
             compatible_equipment = ?, installation_notes = ?, manufacturer = ?,
             image_url = ?, minimum_stock_level = ?
             WHERE id = ?`,
            [
                part_name, part_number || null, brand || null,
                quantity || 1, unit_cost || 0, total_cost || 0,
                compatible_equipment || null, installation_notes || null, manufacturer || null,
                image_url || null, minimum_stock_level || 5, id
            ]
        );

        // ✅ Get the updated part with status
        const updatedPart = await query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        const partWithStatus = updatedPart[0] ? {
            ...updatedPart[0],
            status: updatedPart[0].quantity <= 0 ? 'Out of Stock' :
                    updatedPart[0].quantity <= (updatedPart[0].minimum_stock_level || 5) ? 'Low Stock' : 'In Stock'
        } : null;

        res.json({ 
            success: true, 
            message: 'Spare part updated',
            sparePart: partWithStatus
        });
    } catch (error) {
        console.error('Update spare part error:', error);
        res.status(500).json({ success: false, message: 'Failed to update spare part: ' + error.message });
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

// ✅ NEW: Get spare part by ID with status
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        let sql = `
            SELECT s.*, e.name as equipment_name
            FROM spare_parts s
            LEFT JOIN repairs r ON s.repair_id = r.id
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE s.id = ?
        `;
        const part = await query(sql, [id]);
        
        if (part.length === 0) {
            return res.status(404).json({ success: false, message: 'Spare part not found' });
        }
        
        const partWithStatus = {
            ...part[0],
            status: part[0].quantity <= 0 ? 'Out of Stock' :
                    part[0].quantity <= (part[0].minimum_stock_level || 5) ? 'Low Stock' : 'In Stock'
        };
        
        res.json({ success: true, sparePart: partWithStatus });
    } catch (error) {
        console.error('Get spare part error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch spare part' });
    }
});

module.exports = router;