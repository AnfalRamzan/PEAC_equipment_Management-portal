const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================================
// ✅ HELPER: Get Status Based on Quantity
// ============================================================
const getStatus = (quantity, minimumStockLevel) => {
    const minLevel = minimumStockLevel || 5;
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= minLevel) return 'Low Stock';
    return 'In Stock';
};

// ============================================================
// ✅ GET ALL SPARE PARTS - FIXED WITH EQUIPMENT NAME
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('🔩 Fetching spare parts...');
        
        // ✅ FIXED: Get equipment name through multiple paths
        let sql = `
            SELECT 
                s.*,
                e.id as equipment_id,
                e.name as equipment_name,
                e.model as equipment_model,
                e.serial_number,
                h.name as hospital_name,
                h.id as hospital_id,
                r.engineer_name,
                r.id as repair_id,
                r.status as repair_status,
                el.error_title
            FROM spare_parts s
            -- ✅ First try: Through repairs -> error_logs -> equipment
            LEFT JOIN repairs r ON s.repair_id = r.id
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            -- ✅ Second try: Direct equipment_id if it exists
            LEFT JOIN equipment e2 ON s.equipment_id = e2.id
            LEFT JOIN hospitals h ON COALESCE(e.hospital_id, e2.hospital_id) = h.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND (e.hospital_id = ? OR e2.hospital_id = ?)';
            params.push(req.user.hospital_id, req.user.hospital_id);
        }

        sql += ' ORDER BY s.created_at DESC';
        
        const parts = await query(sql, params);
        
        console.log(`✅ Found ${parts.length} spare parts`);
        
        // ✅ Process each part to ensure equipment_name is set
        const partsWithStatus = parts.map(part => {
            // ✅ If equipment_name is null from first join, try the second join
            let equipmentName = part.equipment_name || null;
            let equipmentId = part.equipment_id || null;
            
            // ✅ If still no equipment name, check compatible_equipment field
            if (!equipmentName && part.compatible_equipment) {
                const compNames = part.compatible_equipment.split(',').map(s => s.trim());
                equipmentName = compNames.length > 0 ? compNames[0] : 'N/A';
                // Store all compatible names
                part.compatible_equipment_names = compNames.join(', ');
            }
            
            // ✅ If still no equipment name, set to 'N/A'
            if (!equipmentName) {
                equipmentName = 'N/A';
            }
            
            // ✅ Add status
            const status = getStatus(part.quantity, part.minimum_stock_level);
            
            return {
                ...part,
                equipment_name: equipmentName,
                equipment_id: equipmentId || part.equipment_id || null,
                status: status,
                // ✅ Also add a display field for frontend
                display_equipment: equipmentName
            };
        });
        
        // ✅ Log first few for debugging
        console.log('📊 Sample parts with equipment:');
        partsWithStatus.slice(0, 3).forEach(p => {
            console.log(`   - ${p.part_name} -> Equipment: ${p.equipment_name}`);
        });
        
        res.json({ 
            success: true, 
            spareParts: partsWithStatus 
        });
        
    } catch (error) {
        console.error('❌ Get spare parts error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch spare parts: ' + error.message 
        });
    }
});

// ============================================================
// ✅ CREATE SPARE PART - WITH EQUIPMENT_ID SUPPORT
// ============================================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            repair_id, 
            equipment_id,  // ✅ Added equipment_id support
            part_name, 
            part_number, 
            brand,
            quantity, 
            unit_cost, 
            total_cost,
            compatible_equipment, 
            installation_notes, 
            manufacturer,
            image_url, 
            minimum_stock_level
        } = req.body;

        console.log('🔩 Creating spare part:', part_name, 'Equipment ID:', equipment_id);

        const result = await query(
            `INSERT INTO spare_parts 
             (repair_id, equipment_id, part_name, part_number, brand,
              quantity, unit_cost, total_cost,
              compatible_equipment, installation_notes, manufacturer,
              image_url, minimum_stock_level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                repair_id || null,
                equipment_id || null,  // ✅ Now supports direct equipment_id
                part_name, 
                part_number || null, 
                brand || null,
                quantity || 1, 
                unit_cost || 0, 
                total_cost || 0,
                compatible_equipment || null, 
                installation_notes || null, 
                manufacturer || null,
                image_url || null,
                minimum_stock_level || 5
            ]
        );

        // ✅ Get the newly created part with equipment name
        const newPart = await query(`
            SELECT 
                s.*,
                e.name as equipment_name,
                e.id as equipment_id
            FROM spare_parts s
            LEFT JOIN equipment e ON s.equipment_id = e.id
            WHERE s.id = ?
        `, [result.insertId]);

        const partWithStatus = newPart[0] ? {
            ...newPart[0],
            status: getStatus(newPart[0].quantity, newPart[0].minimum_stock_level)
        } : null;

        res.status(201).json({
            success: true,
            message: 'Spare part added',
            part_id: result.insertId,
            sparePart: partWithStatus
        });
        
    } catch (error) {
        console.error('❌ Create spare part error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add spare part: ' + error.message 
        });
    }
});

// ============================================================
// ✅ UPDATE SPARE PART
// ============================================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            part_name, 
            part_number, 
            brand,
            quantity, 
            unit_cost, 
            total_cost,
            compatible_equipment, 
            installation_notes, 
            manufacturer,
            image_url, 
            minimum_stock_level,
            equipment_id  // ✅ Added equipment_id support
        } = req.body;

        const currentPart = await query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        if (currentPart.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }

        const oldQuantity = currentPart[0].quantity || 0;
        const oldMinStock = currentPart[0].minimum_stock_level || 5;
        const oldStatus = getStatus(oldQuantity, oldMinStock);

        await query(
            `UPDATE spare_parts SET 
             part_name = ?, part_number = ?, brand = ?,
             quantity = ?, unit_cost = ?, total_cost = ?,
             compatible_equipment = ?, installation_notes = ?, manufacturer = ?,
             image_url = ?, minimum_stock_level = ?,
             equipment_id = ?
             WHERE id = ?`,
            [
                part_name, 
                part_number || null, 
                brand || null,
                quantity || 1, 
                unit_cost || 0, 
                total_cost || 0,
                compatible_equipment || null, 
                installation_notes || null, 
                manufacturer || null,
                image_url || null, 
                minimum_stock_level || 5,
                equipment_id || null,
                id
            ]
        );

        // ✅ Get updated part with equipment name
        const updatedPart = await query(`
            SELECT 
                s.*,
                e.name as equipment_name,
                e.id as equipment_id
            FROM spare_parts s
            LEFT JOIN equipment e ON s.equipment_id = e.id
            WHERE s.id = ?
        `, [id]);

        const partWithStatus = updatedPart[0] ? {
            ...updatedPart[0],
            status: getStatus(updatedPart[0].quantity, updatedPart[0].minimum_stock_level)
        } : null;

        // ✅ Log movement if status changed
        if (partWithStatus) {
            const newStatus = getStatus(partWithStatus.quantity, partWithStatus.minimum_stock_level);
            const quantityChange = (partWithStatus.quantity || 0) - oldQuantity;
            
            if (newStatus !== oldStatus || quantityChange !== 0) {
                await query(
                    `INSERT INTO spare_part_movements 
                     (spare_part_id, previous_status, new_status, quantity_change, created_at)
                     VALUES (?, ?, ?, ?, NOW())`,
                    [id, oldStatus, newStatus, quantityChange]
                );
            }
        }

        res.json({ 
            success: true, 
            message: 'Spare part updated',
            sparePart: partWithStatus
        });
        
    } catch (error) {
        console.error('❌ Update spare part error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update spare part: ' + error.message 
        });
    }
});

// ============================================================
// ✅ DELETE SPARE PART
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        await query('DELETE FROM spare_part_movements WHERE spare_part_id = ?', [id]);
        await query('DELETE FROM spare_parts WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Spare part deleted' });
    } catch (error) {
        console.error('❌ Delete spare part error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete spare part' 
        });
    }
});

// ============================================================
// ✅ GET SPARE PART BY ID - FIXED
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const part = await query(`
            SELECT 
                s.*,
                e.name as equipment_name,
                e.id as equipment_id,
                e.model as equipment_model,
                e.serial_number,
                h.name as hospital_name,
                r.engineer_name
            FROM spare_parts s
            LEFT JOIN equipment e ON s.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN repairs r ON s.repair_id = r.id
            WHERE s.id = ?
        `, [id]);
        
        if (part.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }
        
        // ✅ If no equipment_name found, check compatible_equipment
        let equipmentName = part[0].equipment_name;
        if (!equipmentName && part[0].compatible_equipment) {
            const names = part[0].compatible_equipment.split(',').map(s => s.trim());
            equipmentName = names.length > 0 ? names[0] : 'N/A';
        }
        if (!equipmentName) equipmentName = 'N/A';
        
        const partWithStatus = {
            ...part[0],
            equipment_name: equipmentName,
            status: getStatus(part[0].quantity, part[0].minimum_stock_level)
        };
        
        res.json({ success: true, sparePart: partWithStatus });
        
    } catch (error) {
        console.error('❌ Get spare part error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch spare part: ' + error.message 
        });
    }
});

// ============================================================
// ✅ GET SPARE PART MOVEMENTS
// ============================================================
router.get('/:id/movements', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const movements = await query(`
            SELECT * FROM spare_part_movements 
            WHERE spare_part_id = ? 
            ORDER BY created_at DESC
        `, [id]);
        
        res.json({ success: true, movements });
    } catch (error) {
        console.error('❌ Get movements error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch movements' 
        });
    }
});

// ============================================================
// ✅ GET SPARE PART DOWNTIME - FIXED
// ============================================================
router.get('/:id/downtime', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const partExists = await query('SELECT id FROM spare_parts WHERE id = ?', [id]);
        if (partExists.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }
        
        const result = await query(`
            SELECT 
                (SELECT COUNT(*) FROM spare_part_movements spm 
                 WHERE spm.spare_part_id = sp.id 
                 AND spm.new_status = 'Out of Stock') as times_out_of_stock,
                (SELECT MIN(created_at) FROM spare_part_movements spm 
                 WHERE spm.spare_part_id = sp.id 
                 AND spm.new_status = 'Out of Stock') as first_out_of_stock,
                (SELECT MAX(created_at) FROM spare_part_movements spm 
                 WHERE spm.spare_part_id = sp.id 
                 AND spm.previous_status = 'Out of Stock' 
                 AND spm.new_status != 'Out of Stock') as last_back_in_stock,
                COALESCE((SELECT SUM(TIMESTAMPDIFF(HOUR,
                    spm_out.created_at,
                    IFNULL((SELECT MIN(spm_in.created_at)
                            FROM spare_part_movements spm_in
                            WHERE spm_in.spare_part_id = sp.id
                            AND spm_in.previous_status = 'Out of Stock'
                            AND spm_in.new_status != 'Out of Stock'
                            AND spm_in.created_at > spm_out.created_at), NOW())
                ))
                FROM spare_part_movements spm_out
                WHERE spm_out.spare_part_id = sp.id
                AND spm_out.new_status = 'Out of Stock'), 0) as total_downtime_hours,
                ROUND(COALESCE((SELECT SUM(TIMESTAMPDIFF(HOUR,
                    spm_out.created_at,
                    IFNULL((SELECT MIN(spm_in.created_at)
                            FROM spare_part_movements spm_in
                            WHERE spm_in.spare_part_id = sp.id
                            AND spm_in.previous_status = 'Out of Stock'
                            AND spm_in.new_status != 'Out of Stock'
                            AND spm_in.created_at > spm_out.created_at), NOW())
                ))
                FROM spare_part_movements spm_out
                WHERE spm_out.spare_part_id = sp.id
                AND spm_out.new_status = 'Out of Stock'), 0) / 24, 2) as total_downtime_days,
                (SELECT COUNT(*) FROM spare_part_movements spm 
                 WHERE spm.spare_part_id = sp.id) as total_movements
            FROM spare_parts sp
            WHERE sp.id = ?
            GROUP BY sp.id
        `, [id]);
        
        const downtimeData = result[0] || {
            times_out_of_stock: 0,
            first_out_of_stock: null,
            last_back_in_stock: null,
            total_downtime_hours: 0,
            total_downtime_days: 0,
            total_movements: 0
        };
        
        const currentPart = await query('SELECT quantity, minimum_stock_level FROM spare_parts WHERE id = ?', [id]);
        const currentStatus = currentPart[0] ? getStatus(currentPart[0].quantity, currentPart[0].minimum_stock_level) : 'Unknown';
        
        res.json({ 
            success: true, 
            data: {
                ...downtimeData,
                current_status: currentStatus,
                is_currently_out: currentStatus === 'Out of Stock'
            }
        });
        
    } catch (error) {
        console.error('❌ Get downtime error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get downtime: ' + error.message 
        });
    }
});

// ============================================================
// ✅ GET SPARE PART SUMMARY STATS
// ============================================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total_parts,
                SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN quantity > 0 AND quantity <= minimum_stock_level THEN 1 ELSE 0 END) as low_stock,
                SUM(CASE WHEN quantity > minimum_stock_level THEN 1 ELSE 0 END) as in_stock,
                SUM(quantity) as total_quantity,
                SUM(total_cost) as total_inventory_value,
                COUNT(DISTINCT brand) as total_brands
            FROM spare_parts
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' WHERE hospital_id IN (SELECT id FROM hospitals WHERE id = ?)';
            params.push(req.user.hospital_id);
        }

        const result = await query(sql, params);
        res.json({ success: true, stats: result[0] || {} });
        
    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch stats' 
        });
    }
});

module.exports = router;