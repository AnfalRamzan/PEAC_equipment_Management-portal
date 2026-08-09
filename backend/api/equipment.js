const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/equipment';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for equipment images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'equip-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// ============================================
// ✅ FIX 1: CREATE DEPARTMENT (was missing)
// ============================================
router.post('/departments', authenticate, async (req, res) => {
    try {
        const { name, hospital_id } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department name is required' 
            });
        }

        // Hospital Admin can only create for their hospital
        let hospitalId = hospital_id;
        if (req.user.role_name === 'HOSPITAL_ADMIN') {
            if (!req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Hospital Admin must have a hospital assigned' 
                });
            }
            hospitalId = req.user.hospital_id;
        }

        // Check if department already exists
        const existing = await query(
            'SELECT id FROM departments WHERE name = ? AND hospital_id = ?',
            [name, hospitalId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department already exists in this hospital' 
            });
        }

        const result = await query(
            'INSERT INTO departments (name, hospital_id) VALUES (?, ?)',
            [name, hospitalId]
        );

        const newDepartment = await query(
            'SELECT * FROM departments WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            success: true, 
            department: newDepartment[0],
            message: 'Department created successfully'
        });
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create department' 
        });
    }
});

// ============================================
// ✅ FIX 2: UPLOAD EQUIPMENT IMAGES (was missing)
// ============================================
router.post('/:id/upload', authenticate, upload.array('files', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No files uploaded' 
            });
        }

        // Check equipment exists and user has access
        let sql = 'SELECT * FROM equipment WHERE id = ?';
        let params = [id];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const equip = await query(sql, params);
        if (equip.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found or access denied' 
            });
        }

        // Save file paths
        const fileUrls = files.map(f => `/uploads/equipment/${f.filename}`);
        const imageUrl = fileUrls.join(',');

        // Update equipment with image URLs
        await query(
            'UPDATE equipment SET image_url = ? WHERE id = ?',
            [imageUrl, id]
        );

        res.json({ 
            success: true, 
            message: 'Files uploaded successfully',
            files: fileUrls,
            equipment_id: id
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to upload files' 
        });
    }
});

// ============================================
// ✅ FIX 3: GET DEPARTMENTS BY HOSPITAL
// ============================================
router.get('/departments/hospital/:hospitalId', authenticate, async (req, res) => {
    try {
        const { hospitalId } = req.params;
        
        // Check access
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (parseInt(hospitalId) !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        const departments = await query(
            'SELECT * FROM departments WHERE hospital_id = ? ORDER BY name',
            [hospitalId]
        );
        
        res.json({ success: true, departments });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch departments' 
        });
    }
});

// ============================================
// ✅ EXISTING: GET ALL EQUIPMENT
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT e.*, 
                   c.name as category_name, 
                   h.name as hospital_name,
                   d.name as department_name
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.status != 'Retired'
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY e.created_at DESC';
        
        const equipment = await query(sql, params);
        res.json({ success: true, equipment });
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch equipment' });
    }
});

// ============================================
// ✅ EXISTING: CREATE EQUIPMENT
// ============================================
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            name, category_id, manufacturer, model, serial_number,
            installation_year, hospital_id, department_id, location, status
        } = req.body;

        // Validate
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment name is required' 
            });
        }

        // Check hospital access
        let finalHospitalId = hospital_id;
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (!req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are not assigned to any hospital' 
                });
            }
            if (hospital_id && parseInt(hospital_id) !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only add equipment to your hospital' 
                });
            }
            finalHospitalId = req.user.hospital_id;
        }

        // Check if serial number already exists
        if (serial_number) {
            const existing = await query(
                'SELECT id FROM equipment WHERE serial_number = ?',
                [serial_number]
            );
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Serial number already exists' 
                });
            }
        }

        const result = await query(
            `INSERT INTO equipment 
             (name, category_id, manufacturer, model, serial_number,
              installation_year, hospital_id, department_id, location, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id, manufacturer, model, serial_number,
             installation_year, finalHospitalId, department_id, location, status || 'Active']
        );

        const newEquipment = await query(
            `SELECT e.*, c.name as category_name, h.name as hospital_name, d.name as department_name
             FROM equipment e
             LEFT JOIN equipment_categories c ON e.category_id = c.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             LEFT JOIN departments d ON e.department_id = d.id
             WHERE e.id = ?`,
            [result.insertId]
        );

        res.status(201).json({ 
            success: true, 
            equipment: newEquipment[0],
            message: 'Equipment created successfully'
        });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to create equipment' });
    }
});

// ============================================
// ✅ EXISTING: UPDATE EQUIPMENT
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, category_id, manufacturer, model, serial_number,
            installation_year, hospital_id, department_id, location, status
        } = req.body;

        // Check access
        let sql = 'SELECT * FROM equipment WHERE id = ?';
        let params = [id];
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found or access denied' 
            });
        }

        await query(
            `UPDATE equipment SET 
             name = ?, category_id = ?, manufacturer = ?, model = ?,
             serial_number = ?, installation_year = ?, hospital_id = ?,
             department_id = ?, location = ?, status = ?
             WHERE id = ?`,
            [name, category_id, manufacturer, model, serial_number,
             installation_year, hospital_id, department_id, location, status, id]
        );

        res.json({ success: true, message: 'Equipment updated successfully' });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to update equipment' });
    }
});

// ============================================
// ✅ EXISTING: DELETE EQUIPMENT
// ============================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check access
        let sql = 'SELECT * FROM equipment WHERE id = ?';
        let params = [id];
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found or access denied' 
            });
        }

        // Soft delete - set status to Retired
        await query('UPDATE equipment SET status = "Retired" WHERE id = ?', [id]);
        res.json({ success: true, message: 'Equipment retired successfully' });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete equipment' });
    }
});

// ============================================
// ✅ EXISTING: GET CATEGORIES
// ============================================
router.get('/categories/all', authenticate, async (req, res) => {
    try {
        const categories = await query(
            'SELECT * FROM equipment_categories ORDER BY name'
        );
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

// ============================================
// ✅ FIX 4: CREATE CATEGORY
// ============================================
router.post('/categories', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category name is required' 
            });
        }

        // Check if category exists
        const existing = await query(
            'SELECT id FROM equipment_categories WHERE name = ?',
            [name]
        );
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category already exists' 
            });
        }

        const result = await query(
            'INSERT INTO equipment_categories (name, description) VALUES (?, ?)',
            [name, description || '']
        );

        const newCategory = await query(
            'SELECT * FROM equipment_categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            success: true, 
            category: newCategory[0],
            message: 'Category created successfully'
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create category' 
        });
    }
});

module.exports = router;