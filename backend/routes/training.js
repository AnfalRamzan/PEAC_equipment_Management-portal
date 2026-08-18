// routes/training.js
// ✅ COMPLETE FIXED VERSION
// ✅ Only SUPER_ADMIN can CREATE, UPDATE, DELETE, ADD/REMOVE PARTICIPANTS
// ✅ ALL users can VIEW trainings
// ✅ ALL users can SELF-JOIN (one-click)

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================================
// ✅ AUTH MIDDLEWARE
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

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-2024';
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
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
            message: 'Authentication failed' 
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
// ✅ GET ALL TRAININGS - ANY AUTHENTICATED USER
// ============================================================
router.get('/', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT t.*, 
                   u.full_name as created_by_name,
                   h.name as hospital_name
            FROM trainings t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN hospitals h ON u.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND u.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY t.created_at DESC';
        const trainings = await query(sql, params);
        res.json({ success: true, trainings });
    } catch (error) {
        console.error('❌ Get trainings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trainings' });
    }
});

// ============================================================
// ✅ GET TRAINING STATS - ANY AUTHENTICATED USER
// ============================================================
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgress,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                COUNT(CASE WHEN type = 'local' THEN 1 END) as local,
                COUNT(CASE WHEN type = 'foreign' THEN 1 END) as \`foreign\`
            FROM trainings
        `);

        const result = stats[0] || { 
            total: 0, pending: 0, inProgress: 0, 
            completed: 0, cancelled: 0, local: 0, foreign: 0 
        };

        res.json({ 
            success: true, 
            stats: {
                total: result.total || 0,
                pending: result.pending || 0,
                inProgress: result.inProgress || 0,
                completed: result.completed || 0,
                cancelled: result.cancelled || 0,
                local: result.local || 0,
                foreign: result.foreign || 0
            }
        });
    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch stats: ' + error.message 
        });
    }
});

// ============================================================
// ✅ GET SINGLE TRAINING - ANY AUTHENTICATED USER
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT t.*, 
                   u.full_name as created_by_name,
                   h.name as hospital_name
            FROM trainings t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN hospitals h ON u.hospital_id = h.id
            WHERE t.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND u.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const trainings = await query(sql, params);
        if (trainings.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training not found' 
            });
        }

        const participants = await query(
            `SELECT u.id, u.full_name, u.email, u.profile_image
             FROM training_participants tp
             JOIN users u ON tp.user_id = u.id
             WHERE tp.training_id = ?`,
            [id]
        );

        res.json({ 
            success: true, 
            training: trainings[0],
            participants: participants
        });
    } catch (error) {
        console.error('❌ Get training error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training' });
    }
});

// ============================================================
// ✅ CREATE TRAINING - ONLY SUPER_ADMIN
// ============================================================
router.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            status,
            start_date,
            end_date,
            location,
            trainer_name,
            participants_count,
            department,
            attachments,
            created_by
        } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Training title is required' 
            });
        }

        if (!location || location.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Location is required' 
            });
        }

        if (!trainer_name || trainer_name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Trainer name is required' 
            });
        }

        const finalStartDate = start_date && start_date.trim() !== '' ? start_date : null;
        const finalEndDate = end_date && end_date.trim() !== '' ? end_date : null;

        const result = await query(
            `INSERT INTO trainings (
                title, description, type, status, 
                start_date, end_date, location, trainer_name,
                participants_count, department, attachments,
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                title.trim(),
                description || null,
                type || 'local',
                status || 'pending',
                finalStartDate,
                finalEndDate,
                location.trim(),
                trainer_name.trim(),
                participants_count || 0,
                department || null,
                attachments || null,
                created_by || req.user.id
            ]
        );

        const [newTraining] = await query(
            `SELECT t.*, u.full_name as created_by_name
             FROM trainings t
             LEFT JOIN users u ON t.created_by = u.id
             WHERE t.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Training created successfully',
            training: newTraining || { id: result.insertId }
        });

    } catch (error) {
        console.error('❌ Create training error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create training: ' + error.message
        });
    }
});

// ============================================================
// ✅ UPDATE TRAINING - ONLY SUPER_ADMIN
// ============================================================
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            type,
            status,
            start_date,
            end_date,
            location,
            trainer_name,
            participants_count,
            department,
            attachments
        } = req.body;

        const existing = await query(
            'SELECT * FROM trainings WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training not found' 
            });
        }

        const finalStartDate = start_date && start_date.trim() !== '' ? start_date : null;
        const finalEndDate = end_date && end_date.trim() !== '' ? end_date : null;

        await query(
            `UPDATE trainings SET 
                title = ?,
                description = ?,
                type = ?,
                status = ?,
                start_date = ?,
                end_date = ?,
                location = ?,
                trainer_name = ?,
                participants_count = ?,
                department = ?,
                attachments = ?,
                updated_at = NOW()
             WHERE id = ?`,
            [
                title || existing[0].title,
                description !== undefined ? description : existing[0].description,
                type || existing[0].type,
                status || existing[0].status,
                finalStartDate !== null ? finalStartDate : existing[0].start_date,
                finalEndDate !== null ? finalEndDate : existing[0].end_date,
                location || existing[0].location,
                trainer_name || existing[0].trainer_name,
                participants_count !== undefined ? participants_count : existing[0].participants_count,
                department !== undefined ? department : existing[0].department,
                attachments !== undefined ? attachments : existing[0].attachments,
                id
            ]
        );

        res.json({ 
            success: true, 
            message: 'Training updated successfully' 
        });

    } catch (error) {
        console.error('❌ Update training error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update training: ' + error.message 
        });
    }
});

// ============================================================
// ✅ DELETE TRAINING - ONLY SUPER_ADMIN
// ============================================================
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query(
            'SELECT * FROM trainings WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training not found' 
            });
        }

        await query('DELETE FROM training_participants WHERE training_id = ?', [id]);
        await query('DELETE FROM trainings WHERE id = ?', [id]);

        res.json({ 
            success: true, 
            message: 'Training deleted successfully' 
        });

    } catch (error) {
        console.error('❌ Delete training error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete training: ' + error.message 
        });
    }
});

// ============================================================
// ✅ UPDATE TRAINING STATUS - ANY AUTHENTICATED USER
// ============================================================
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        const existing = await query(
            'SELECT * FROM trainings WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training not found' 
            });
        }

        await query(
            'UPDATE trainings SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );

        res.json({ 
            success: true, 
            message: `Training status updated to ${status}` 
        });

    } catch (error) {
        console.error('❌ Update status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update status' 
        });
    }
});

// ============================================================
// ✅ ADD PARTICIPANT - ANY AUTHENTICATED USER (Self-Join)
// ============================================================
router.post('/:id/participants', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        const training = await query(
            'SELECT * FROM trainings WHERE id = ?',
            [id]
        );
        
        if (training.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training not found' 
            });
        }

        const user = await query(
            'SELECT * FROM users WHERE id = ? AND is_active = 1',
            [user_id]
        );
        
        if (user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const existing = await query(
            'SELECT * FROM training_participants WHERE training_id = ? AND user_id = ?',
            [id, user_id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'User is already a participant' 
            });
        }

        await query(
            'INSERT INTO training_participants (training_id, user_id, joined_at) VALUES (?, ?, NOW())',
            [id, user_id]
        );

        await query(
            'UPDATE trainings SET participants_count = participants_count + 1 WHERE id = ?',
            [id]
        );

        res.json({ 
            success: true, 
            message: 'Participant added successfully' 
        });

    } catch (error) {
        console.error('❌ Add participant error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add participant' 
        });
    }
});

// ============================================================
// ✅ REMOVE PARTICIPANT - ONLY SUPER_ADMIN
// ============================================================
router.delete('/:id/participants/:userId', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id, userId } = req.params;

        const training = await query(
            'SELECT * FROM trainings WHERE id = ?',
            [id]
        );
        
        if (training.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Training not found' 
            });
        }

        const existing = await query(
            'SELECT * FROM training_participants WHERE training_id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Participant not found' 
            });
        }

        await query(
            'DELETE FROM training_participants WHERE training_id = ? AND user_id = ?',
            [id, userId]
        );

        await query(
            'UPDATE trainings SET participants_count = participants_count - 1 WHERE id = ?',
            [id]
        );

        res.json({ 
            success: true, 
            message: 'Participant removed successfully' 
        });

    } catch (error) {
        console.error('❌ Remove participant error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove participant' 
        });
    }
});

module.exports = router;