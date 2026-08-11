// backend/routes/training.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================================
// ✅ AUTH MIDDLEWARE (inline - since we don't have separate middleware)
// ============================================================
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        // For now, we'll use a simple check - in production, use JWT
        // Since we're using the same JWT_SECRET from server.js
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-2024';
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            // For development, allow test tokens
            if (token.startsWith('test-token-')) {
                const parts = token.split('-');
                const userId = parseInt(parts[1]) || 1;
                const users = await query(
                    `SELECT u.*, r.name as role_name 
                     FROM users u 
                     LEFT JOIN roles r ON u.role_id = r.id 
                     WHERE u.id = ? AND u.is_active = 1`,
                    [userId]
                );
                if (users.length === 0) {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'User not found' 
                    });
                }
                req.user = users[0];
                return next();
            }
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        const users = await query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ? AND u.is_active = 1`,
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('❌ Auth error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }
        if (!allowedRoles.includes(req.user.role_name)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }
        next();
    };
};

// ============================================================
// ✅ TRAINING ROUTES
// ============================================================

// GET all training records
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT t.*, 
                   u.full_name as created_by_name,
                   h.name as hospital_name
            FROM training_records t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN hospitals h ON t.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND t.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY t.created_at DESC';
        const records = await query(sql, params);
        res.json({ success: true, records });
    } catch (error) {
        console.error('Get training records error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training records' });
    }
});

// GET training by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT t.*, 
                   u.full_name as created_by_name,
                   h.name as hospital_name
            FROM training_records t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN hospitals h ON t.hospital_id = h.id
            WHERE t.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND t.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const records = await query(sql, params);
        if (records.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training record not found' 
            });
        }
        res.json({ success: true, record: records[0] });
    } catch (error) {
        console.error('Get training record error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training record' });
    }
});

// GET training by hospital
router.get('/hospital/:hospitalId', authenticate, async (req, res) => {
    try {
        const { hospitalId } = req.params;
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (parseInt(hospitalId) !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }
        
        const records = await query(
            `SELECT t.*, u.full_name as created_by_name
             FROM training_records t
             LEFT JOIN users u ON t.created_by = u.id
             WHERE t.hospital_id = ?
             ORDER BY t.created_at DESC`,
            [hospitalId]
        );
        
        res.json({ success: true, records });
    } catch (error) {
        console.error('Get training by hospital error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training records' });
    }
});

// GET training stats
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total_trainings,
                SUM(participants) as total_participants,
                AVG(duration) as avg_duration,
                COUNT(DISTINCT trainer) as total_trainers
            FROM training_records
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ 
            success: true, 
            stats: stats[0] || { 
                total_trainings: 0, 
                total_participants: 0, 
                avg_duration: 0, 
                total_trainers: 0 
            } 
        });
    } catch (error) {
        console.error('Get training stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training stats' });
    }
});

// POST create training record
router.post('/', authenticate, async (req, res) => {
    try {
        const { 
            title, 
            description, 
            training_date, 
            trainer, 
            duration, 
            participants, 
            hospital_id,
            training_type,
            location,
            notes,
            attachments
        } = req.body;

        console.log('📚 Creating training record:', title);
        console.log('👤 User:', req.user.email, 'Role:', req.user.role_name);

        if (!title) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title is required' 
            });
        }

        if (!training_date) {
            return res.status(400).json({ 
                success: false, 
                message: 'Training date is required' 
            });
        }

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (!isSuperAdmin && !isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Engineers and Super Admin can create training records' 
            });
        }

        let finalHospitalId = hospital_id;
        if (req.user.role_name === 'ENGINEER') {
            finalHospitalId = req.user.hospital_id;
        }

        const result = await query(
            `INSERT INTO training_records 
             (title, description, training_date, trainer, duration, 
              participants, hospital_id, training_type, location, 
              notes, attachments, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                description || '',
                training_date,
                trainer || '',
                duration || 0,
                participants || 0,
                finalHospitalId || null,
                training_type || 'General',
                location || '',
                notes || '',
                attachments || '',
                req.user.id
            ]
        );

        console.log('✅ Training record created. ID:', result.insertId);

        // Send notification
        const { createNotification } = require('../server');
        if (createNotification) {
            await createNotification(
                1,
                'New Training Record',
                `Training "${title}" created by ${req.user.full_name}`,
                'Training',
                result.insertId,
                'training'
            );
        }

        res.status(201).json({
            success: true,
            message: 'Training record created successfully',
            record: { id: result.insertId }
        });

    } catch (error) {
        console.error('❌ Create training record error:', error);
        console.error('❌ SQL:', error.sql);
        console.error('❌ SQL Message:', error.sqlMessage);
        
        if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields. Please check all required fields are filled.' 
            });
        }
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ 
                success: false, 
                message: 'Database table not found. Please run database migrations.' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to create training record: ' + error.message,
            details: error.sqlMessage || null
        });
    }
});

// PUT update training record
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            description, 
            training_date, 
            trainer, 
            duration, 
            participants,
            training_type,
            location,
            notes,
            attachments
        } = req.body;

        console.log('🔄 Updating training record:', id);

        const existing = await query('SELECT * FROM training_records WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training record not found' 
            });
        }

        const updates = [];
        const values = [];

        if (title !== undefined && title.trim() !== '') {
            updates.push('title = ?');
            values.push(title.trim());
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description || '');
        }
        if (training_date !== undefined) {
            updates.push('training_date = ?');
            values.push(training_date);
        }
        if (trainer !== undefined) {
            updates.push('trainer = ?');
            values.push(trainer || '');
        }
        if (duration !== undefined) {
            updates.push('duration = ?');
            values.push(duration || 0);
        }
        if (participants !== undefined) {
            updates.push('participants = ?');
            values.push(participants || 0);
        }
        if (training_type !== undefined) {
            updates.push('training_type = ?');
            values.push(training_type || 'General');
        }
        if (location !== undefined) {
            updates.push('location = ?');
            values.push(location || '');
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes || '');
        }
        if (attachments !== undefined) {
            updates.push('attachments = ?');
            values.push(attachments || '');
        }

        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No fields to update' 
            });
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await query(
            `UPDATE training_records SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        console.log('✅ Training record updated:', id);
        res.json({ 
            success: true, 
            message: 'Training record updated successfully' 
        });

    } catch (error) {
        console.error('❌ Update training record error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update training record: ' + error.message 
        });
    }
});

// DELETE training record
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting training record ID:', id);
        
        const existing = await query('SELECT * FROM training_records WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training record not found' 
            });
        }

        await query('DELETE FROM training_records WHERE id = ?', [id]);

        console.log('✅ Training record deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Training record deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Training record DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

module.exports = router;