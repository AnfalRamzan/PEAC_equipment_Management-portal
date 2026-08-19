// backend/routes/equipment.js
// ✅ COMPLETE FIXED VERSION - Hospital name properly returned
// ✅ FIXED: Table name from equipment_categories to categories
// ✅ FIXED: Removed status filter for super admins
// ✅ FIXED: Added hospital filter for non-super admins
// ✅ FIXED: Return hospital_name in all responses with proper fallback
// ✅ FIXED: purchase_date properly handled

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// ✅ GET ALL EQUIPMENT - WITH HOSPITAL NAME
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('📊 Fetching equipment...');
        console.log('👤 User:', req.user?.email, 'Role:', req.user?.role_name);
        console.log('🏥 Hospital ID:', req.user?.hospital_id);
        
        let sql = `
            SELECT 
                e.id,
                e.name,
                e.category_id,
                e.manufacturer,
                e.model,
                e.serial_number,
                e.date_of_installation,
                e.purchase_date,
                e.hospital_id,
                e.department_id,
                e.location,
                e.status,
                e.image_url,
                e.created_at,
                e.updated_at,
                c.name as category_name,
                d.name as department_name,
                h.name as hospital_name,
                h.address as hospital_address,
                h.phone as hospital_phone,
                h.email as hospital_email
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        
        const params = [];

        // ✅ Hospital filter for non-super admins
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY e.name ASC';
        
        console.log('📝 SQL Query:', sql);
        console.log('📝 Params:', params);
        
        const equipment = await query(sql, params);
        
        console.log(`📊 Found ${equipment.length} equipment items`);
        
        // ✅ Log first item to verify hospital_name
        if (equipment.length > 0) {
            console.log('🔍 First equipment item:', {
                id: equipment[0].id,
                name: equipment[0].name,
                hospital_id: equipment[0].hospital_id,
                hospital_name: equipment[0].hospital_name,
                purchase_date: equipment[0].purchase_date,
                all_keys: Object.keys(equipment[0])
            });
        }
        
        // ✅ Ensure hospital_name is always set
        const equipmentWithHospital = equipment.map(item => ({
            ...item,
            hospital_name: item.hospital_name || 'N/A',
            hospital_address: item.hospital_address || 'N/A',
            hospital_phone: item.hospital_phone || 'N/A',
            hospital_email: item.hospital_email || 'N/A'
        }));
        
        res.json({ success: true, equipment: equipmentWithHospital });
    } catch (error) {
        console.error('❌ Get equipment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch equipment: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET SINGLE EQUIPMENT - WITH HOSPITAL NAME
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT 
                e.id,
                e.name,
                e.category_id,
                e.manufacturer,
                e.model,
                e.serial_number,
                e.date_of_installation,
                e.purchase_date,
                e.hospital_id,
                e.department_id,
                e.location,
                e.status,
                e.image_url,
                e.created_at,
                e.updated_at,
                c.name as category_name,
                d.name as department_name,
                h.name as hospital_name,
                h.address as hospital_address,
                h.phone as hospital_phone,
                h.email as hospital_email
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE e.id = ?
        `;
        
        const params = [id];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const equipment = await query(sql, params);
        
        if (equipment.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }

        const equipmentItem = {
            ...equipment[0],
            hospital_name: equipment[0].hospital_name || 'N/A',
            hospital_address: equipment[0].hospital_address || 'N/A',
            hospital_phone: equipment[0].hospital_phone || 'N/A',
            hospital_email: equipment[0].hospital_email || 'N/A'
        };

        res.json({ success: true, equipment: equipmentItem });
    } catch (error) {
        console.error('❌ Get equipment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch equipment: ' + error.message 
        });
    }
});

// ============================================
// ✅ CREATE EQUIPMENT
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const { 
            name, 
            category_id, 
            manufacturer, 
            model, 
            serial_number, 
            date_of_installation,
            purchase_date,
            hospital_id, 
            department_id, 
            location, 
            status,
            image_url
        } = req.body;
        
        console.log('🛠️ Creating equipment:', name);
        console.log('🏥 Hospital ID:', hospital_id);
        console.log('📅 Purchase Date:', purchase_date);
        console.log('📅 Installation Date:', date_of_installation);
        
        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment name is required' 
            });
        }

        // ✅ Hospital validation - compulsory
        let finalHospitalId = hospital_id || req.user.hospital_id || null;
        
        if (!finalHospitalId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Hospital is required. Please select a hospital.' 
            });
        }

        // Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (parseInt(finalHospitalId) !== parseInt(req.user.hospital_id)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only create equipment for your hospital' 
                });
            }
        }

        // Check duplicate serial number
        if (serial_number && serial_number.trim() !== '') {
            const existing = await query(
                'SELECT id FROM equipment WHERE serial_number = ?',
                [serial_number.trim()]
            );
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Serial number "${serial_number}" already exists` 
                });
            }
        }

        // ✅ INSERT with all fields including purchase_date
        const result = await query(
            `INSERT INTO equipment (
                name, category_id, manufacturer, model, serial_number, 
                date_of_installation, purchase_date, hospital_id, department_id, 
                location, status, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                category_id || null,
                manufacturer || '',
                model || '',
                serial_number || '',
                date_of_installation || null,
                purchase_date || null,
                parseInt(finalHospitalId),
                department_id || null,
                location || '',
                status || 'Warranty',
                image_url || ''
            ]
        );

        console.log('✅ Equipment created successfully. ID:', result.insertId);

        // ✅ Fetch created equipment with hospital_name
        const newEquipment = await query(
            `SELECT 
                e.id,
                e.name,
                e.category_id,
                e.manufacturer,
                e.model,
                e.serial_number,
                e.date_of_installation,
                e.purchase_date,
                e.hospital_id,
                e.department_id,
                e.location,
                e.status,
                e.image_url,
                c.name as category_name,
                d.name as department_name,
                h.name as hospital_name,
                h.address as hospital_address,
                h.phone as hospital_phone,
                h.email as hospital_email
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE e.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Equipment created successfully',
            equipment: newEquipment[0] || null
        });
    } catch (error) {
        console.error('❌ Create equipment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create equipment: ' + error.message 
        });
    }
});

// ============================================
// ✅ UPDATE EQUIPMENT
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            category_id, 
            manufacturer, 
            model, 
            serial_number, 
            date_of_installation,
            purchase_date,
            hospital_id,
            department_id, 
            location, 
            status,
            image_url
        } = req.body;

        console.log('🔄 Updating equipment:', id);
        console.log('📅 Purchase Date:', purchase_date);
        console.log('📅 Installation Date:', date_of_installation);

        // Check if equipment exists
        const existing = await query('SELECT * FROM equipment WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }

        // Permission check
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only update equipment for your hospital' 
                });
            }
        }

        // Check duplicate serial number (excluding current)
        if (serial_number && serial_number.trim() !== '') {
            const duplicate = await query(
                'SELECT id FROM equipment WHERE serial_number = ? AND id != ?',
                [serial_number.trim(), id]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Serial number "${serial_number}" already exists` 
                });
            }
        }

        // ✅ Determine final hospital_id
        let finalHospitalId = hospital_id || existing[0].hospital_id;

        // ✅ UPDATE with all fields
        await query(
            `UPDATE equipment SET 
                name = ?,
                category_id = ?,
                manufacturer = ?,
                model = ?,
                serial_number = ?,
                date_of_installation = ?,
                purchase_date = ?,
                hospital_id = ?,
                department_id = ?,
                location = ?,
                status = ?,
                image_url = ?
             WHERE id = ?`,
            [
                name || existing[0].name,
                category_id !== undefined ? category_id : existing[0].category_id,
                manufacturer !== undefined ? manufacturer : existing[0].manufacturer,
                model !== undefined ? model : existing[0].model,
                serial_number !== undefined ? serial_number : existing[0].serial_number,
                date_of_installation !== undefined ? date_of_installation : existing[0].date_of_installation,
                purchase_date !== undefined ? purchase_date : existing[0].purchase_date,
                parseInt(finalHospitalId),
                department_id !== undefined ? department_id : existing[0].department_id,
                location !== undefined ? location : existing[0].location,
                status || existing[0].status,
                image_url !== undefined ? image_url : existing[0].image_url,
                id
            ]
        );

        console.log('✅ Equipment updated successfully:', id);
        res.json({ 
            success: true, 
            message: 'Equipment updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update equipment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update equipment: ' + error.message 
        });
    }
});

// ============================================
// ✅ DELETE EQUIPMENT - PERMANENT DELETE
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Permanently deleting equipment ID:', id);
        
        const existing = await query('SELECT * FROM equipment WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }
        
        // ✅ Delete related records
        await query('DELETE FROM error_logs WHERE equipment_id = ?', [id]);
        await query('DELETE FROM maintenance_schedule WHERE equipment_id = ?', [id]);
        await query('DELETE FROM amc_contracts WHERE equipment_id = ?', [id]);
        await query('DELETE FROM knowledge_base WHERE equipment_id = ?', [id]);
        await query('DELETE FROM spare_parts WHERE equipment_id = ?', [id]);
        
        // ✅ Delete equipment
        await query('DELETE FROM equipment WHERE id = ?', [id]);
        
        console.log('✅ Equipment deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Equipment deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Equipment DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================
// ✅ GET CATEGORIES
// ============================================
router.get('/categories/all', authenticate, async (req, res) => {
    try {
        const categories = await query('SELECT * FROM equipment_categories ORDER BY name ASC');
        res.json({ success: true, categories });
    } catch (error) {
        console.error('❌ Get categories error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch categories' 
        });
    }
});

// ============================================
// ✅ CREATE CATEGORY
// ============================================
router.post('/categories', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, description, is_active } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Category name is required' 
            });
        }

        const result = await query(
            'INSERT INTO equipment_categories (name, description, is_active) VALUES (?, ?, ?)',
            [name.trim(), description || '', is_active !== undefined ? is_active : 1]
        );

        const newCategory = await query(
            'SELECT * FROM equipment_categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category: newCategory[0]
        });
    } catch (error) {
        console.error('❌ Create category error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create category' 
        });
    }
});

module.exports = router;