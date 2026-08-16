// backend/routes/spareParts.js
// ✅ COMPLETE FIXED VERSION - Properly returns hospital_name and equipment_name

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

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
// ✅ GET ALL SPARE PARTS - FIXED
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('🔩 Fetching spare parts...');
        console.log('👤 User:', req.user ? req.user.email : 'No user');
        
        // ✅ SIMPLE QUERY - Get all spare parts
        const sql = `
            SELECT 
                id,
                part_name,
                part_number,
                quantity,
                unit_cost,
                total_cost,
                installation_notes,
                image_url,
                minimum_stock_level,
                created_at,
                updated_at,
                hospital_name,
                equipment_name,
                brand,
                manufacturer,
                compatible_equipment,
                repair_id,
                equipment_id
            FROM spare_parts
            ORDER BY created_at DESC
        `;
        
        console.log('📝 Executing SQL query...');
        const parts = await query(sql, []);
        
        console.log(`✅ Found ${parts.length} spare parts`);
        
        // ✅ Log the first part to verify data
        if (parts.length > 0) {
            console.log('📊 First part from DB:', {
                id: parts[0].id,
                part_name: parts[0].part_name,
                hospital_name: parts[0].hospital_name,
                equipment_name: parts[0].equipment_name,
                // Show all keys to verify columns
                all_keys: Object.keys(parts[0])
            });
        }
        
        // ✅ Map parts with status - KEEP THE ORIGINAL VALUES
        const partsWithStatus = parts.map(part => ({
            id: part.id,
            part_name: part.part_name || '',
            part_number: part.part_number || '',
            quantity: part.quantity || 0,
            unit_cost: part.unit_cost || 0,
            total_cost: part.total_cost || 0,
            installation_notes: part.installation_notes || '',
            image_url: part.image_url || '',
            minimum_stock_level: part.minimum_stock_level || 5,
            created_at: part.created_at,
            updated_at: part.updated_at,
            // ✅ CRITICAL: Use the values directly from database
            hospital_name: part.hospital_name || 'N/A',
            equipment_name: part.equipment_name || 'N/A',
            brand: part.brand || '',
            manufacturer: part.manufacturer || '',
            compatible_equipment: part.compatible_equipment || '',
            repair_id: part.repair_id,
            equipment_id: part.equipment_id,
            status: getStatus(part.quantity, part.minimum_stock_level)
        }));
        
        // ✅ Log what we're sending
        console.log('📤 Sending to frontend:');
        partsWithStatus.forEach(p => {
            console.log(`  ID: ${p.id}, Hospital: "${p.hospital_name}", Equipment: "${p.equipment_name}"`);
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
// ✅ GET SINGLE SPARE PART - FIXED
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `SELECT * FROM spare_parts WHERE id = ?`;
        const parts = await query(sql, [id]);
        
        if (parts.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }
        
        const part = parts[0];
        const partWithStatus = {
            ...part,
            status: getStatus(part.quantity, part.minimum_stock_level),
            hospital_name: part.hospital_name || 'N/A',
            equipment_name: part.equipment_name || 'N/A'
        };
        
        res.json({ 
            success: true, 
            sparePart: partWithStatus 
        });
        
    } catch (error) {
        console.error('❌ Get spare part error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch spare part: ' + error.message 
        });
    }
});

// ============================================================
// ✅ CREATE SPARE PART - FIXED
// ============================================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            part_name,
            part_number,
            quantity,
            unit_cost,
            total_cost,
            installation_notes,
            image_url,
            minimum_stock_level,
            hospital_name,
            equipment_name,
            brand,
            manufacturer,
            compatible_equipment,
            repair_id,
            equipment_id
        } = req.body;

        console.log('🔩 Creating spare part:', part_name);
        console.log('  Hospital:', hospital_name);
        console.log('  Equipment:', equipment_name);

        // ✅ Validate required fields
        if (!part_name || part_name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Part name is required' 
            });
        }

        if (!hospital_name || hospital_name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Hospital name is required' 
            });
        }

        if (!equipment_name || equipment_name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment name is required' 
            });
        }

        const finalQuantity = parseInt(quantity) || 1;
        const finalUnitCost = parseFloat(unit_cost) || 0;
        const finalTotalCost = parseFloat(total_cost) || (finalQuantity * finalUnitCost);

        // ✅ Insert with all fields
        const result = await query(
            `INSERT INTO spare_parts (
                part_name,
                part_number,
                quantity,
                unit_cost,
                total_cost,
                installation_notes,
                image_url,
                minimum_stock_level,
                hospital_name,
                equipment_name,
                brand,
                manufacturer,
                compatible_equipment,
                repair_id,
                equipment_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                part_name.trim(),
                part_number || null,
                finalQuantity,
                finalUnitCost,
                finalTotalCost,
                installation_notes || null,
                image_url || null,
                minimum_stock_level || 5,
                hospital_name.trim(),
                equipment_name.trim(),
                brand || null,
                manufacturer || null,
                compatible_equipment || null,
                repair_id || null,
                equipment_id || null
            ]
        );

        console.log('✅ Spare part created. ID:', result.insertId);

        // ✅ Get the created part
        const newPart = await query(
            'SELECT * FROM spare_parts WHERE id = ?',
            [result.insertId]
        );

        const partWithStatus = newPart[0] ? {
            ...newPart[0],
            status: getStatus(newPart[0].quantity, newPart[0].minimum_stock_level),
            hospital_name: newPart[0].hospital_name || 'N/A',
            equipment_name: newPart[0].equipment_name || 'N/A'
        } : null;

        res.status(201).json({
            success: true,
            message: 'Spare part added successfully',
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
// ✅ UPDATE SPARE PART - FIXED
// ============================================================
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            part_name,
            part_number,
            quantity,
            unit_cost,
            total_cost,
            installation_notes,
            image_url,
            minimum_stock_level,
            hospital_name,
            equipment_name,
            brand,
            manufacturer,
            compatible_equipment,
            repair_id,
            equipment_id
        } = req.body;

        console.log('🔄 Updating spare part:', id);

        // ✅ Check if part exists
        const existing = await query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }

        // ✅ Build update query
        const updates = [];
        const params = [];

        if (part_name !== undefined) {
            updates.push('part_name = ?');
            params.push(part_name.trim());
        }
        if (part_number !== undefined) {
            updates.push('part_number = ?');
            params.push(part_number || null);
        }
        if (quantity !== undefined) {
            updates.push('quantity = ?');
            params.push(parseInt(quantity));
        }
        if (unit_cost !== undefined) {
            updates.push('unit_cost = ?');
            params.push(parseFloat(unit_cost));
        }
        if (total_cost !== undefined) {
            updates.push('total_cost = ?');
            params.push(parseFloat(total_cost));
        }
        if (installation_notes !== undefined) {
            updates.push('installation_notes = ?');
            params.push(installation_notes || null);
        }
        if (image_url !== undefined) {
            updates.push('image_url = ?');
            params.push(image_url || null);
        }
        if (minimum_stock_level !== undefined) {
            updates.push('minimum_stock_level = ?');
            params.push(parseInt(minimum_stock_level));
        }
        if (hospital_name !== undefined) {
            updates.push('hospital_name = ?');
            params.push(hospital_name.trim());
        }
        if (equipment_name !== undefined) {
            updates.push('equipment_name = ?');
            params.push(equipment_name.trim());
        }
        if (brand !== undefined) {
            updates.push('brand = ?');
            params.push(brand || null);
        }
        if (manufacturer !== undefined) {
            updates.push('manufacturer = ?');
            params.push(manufacturer || null);
        }
        if (compatible_equipment !== undefined) {
            updates.push('compatible_equipment = ?');
            params.push(compatible_equipment || null);
        }
        if (repair_id !== undefined) {
            updates.push('repair_id = ?');
            params.push(repair_id || null);
        }
        if (equipment_id !== undefined) {
            updates.push('equipment_id = ?');
            params.push(equipment_id || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // ✅ Execute update
        params.push(id);
        await query(
            `UPDATE spare_parts SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // ✅ Get updated part
        const updatedPart = await query(
            'SELECT * FROM spare_parts WHERE id = ?',
            [id]
        );

        const partWithStatus = updatedPart[0] ? {
            ...updatedPart[0],
            status: getStatus(updatedPart[0].quantity, updatedPart[0].minimum_stock_level),
            hospital_name: updatedPart[0].hospital_name || 'N/A',
            equipment_name: updatedPart[0].equipment_name || 'N/A'
        } : null;

        res.json({ 
            success: true, 
            message: 'Spare part updated successfully',
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
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Deleting spare part:', id);
        
        const existing = await query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }

        await query('DELETE FROM spare_parts WHERE id = ?', [id]);
        
        res.json({ 
            success: true, 
            message: 'Spare part deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete spare part error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete spare part: ' + error.message 
        });
    }
});

// ============================================================
// ✅ GET DOWNTIME FOR A SPARE PART
// ============================================================
router.get('/:id/downtime', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if part exists
        const part = await query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        if (part.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }

        res.json({
            success: true,
            data: {
                times_out_of_stock: 0,
                first_out_of_stock: null,
                last_out_of_stock: null,
                total_downtime_days: 0
            }
        });
        
    } catch (error) {
        console.error('❌ Get downtime error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch downtime: ' + error.message 
        });
    }
});

module.exports = router;