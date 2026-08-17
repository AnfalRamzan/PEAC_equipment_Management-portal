// backend/routes/feedback.js
// ✅ Feedback routes for Medical Equipment Portal

const express = require('express');
const router = express.Router();

// ============================================================
// ✅ HELPER: Get database connection
// ============================================================
const { query } = require('../config/database');

// ============================================================
// ✅ GET ALL FEEDBACKS (Admin only)
// ============================================================
router.get('/', async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.role_name !== 'ENGINEER') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const feedbacks = await query(
            `SELECT * FROM feedback 
             ORDER BY created_at DESC`
        );

        console.log(`📊 ${feedbacks.length} feedbacks fetched by ${req.user.email}`);
        
        res.json({
            success: true,
            feedbacks: feedbacks,
            count: feedbacks.length
        });
    } catch (error) {
        console.error('❌ Error fetching feedbacks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedbacks: ' + error.message
        });
    }
});

// ============================================================
// ✅ SUBMIT FEEDBACK (Any authenticated user)
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { user, email, rating, message, timestamp } = req.body;

        console.log('📝 New feedback submission:');
        console.log('👤 User:', user);
        console.log('📧 Email:', email);
        console.log('⭐ Rating:', rating);
        console.log('💬 Message:', message?.substring(0, 50) + '...');

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Feedback message is required'
            });
        }

        // Insert into database
        const result = await query(
            `INSERT INTO feedback (
                user_name, 
                user_email, 
                rating, 
                message, 
                created_at,
                user_id
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                user || 'Anonymous User',
                email || 'No email',
                rating,
                message.trim(),
                timestamp || new Date().toISOString(),
                req.user?.id || null
            ]
        );

        console.log('✅ Feedback saved. ID:', result.insertId);

        // ✅ Notify admins about new feedback
        try {
            // Send notification to SUPER_ADMIN
            const admins = await query(
                `SELECT u.id FROM users u
                 JOIN roles r ON u.role_id = r.id
                 WHERE r.name = 'SUPER_ADMIN' AND u.is_active = 1`
            );

            for (const admin of admins) {
                await query(
                    `INSERT INTO notifications (user_id, title, message, type, related_id, related_module, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        admin.id,
                        '📝 New Feedback Received',
                        `New feedback from ${user || 'Anonymous'}: ${rating}⭐ - ${message?.substring(0, 80)}${message?.length > 80 ? '...' : ''}`,
                        'Feedback',
                        result.insertId,
                        'feedback'
                    ]
                );
            }

            console.log(`📨 Notified ${admins.length} admins about new feedback`);
        } catch (notifyError) {
            console.warn('⚠️ Failed to send notifications:', notifyError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback_id: result.insertId,
            feedback: {
                id: result.insertId,
                user: user || 'Anonymous User',
                email: email || 'No email',
                rating: rating,
                message: message.trim(),
                created_at: timestamp || new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        
        // ✅ Fallback to localStorage if database fails
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback: ' + error.message,
            fallback: 'Please try again later'
        });
    }
});

// ============================================================
// ✅ DELETE FEEDBACK (Admin only)
// ============================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is admin
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.role_name !== 'ENGINEER') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        // Check if feedback exists
        const existing = await query(
            'SELECT * FROM feedback WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        // Delete feedback
        await query('DELETE FROM feedback WHERE id = ?', [id]);

        console.log(`🗑️ Feedback ${id} deleted by ${req.user.email}`);
        
        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback: ' + error.message
        });
    }
});

// ============================================================
// ✅ GET FEEDBACK STATS (Admin only)
// ============================================================
router.get('/stats', async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.role_name !== 'ENGINEER') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                AVG(rating) as average_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating,
                COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_count,
                COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_count,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
            FROM feedback
        `);

        const distribution = {
            1: parseInt(stats[0]?.one_star) || 0,
            2: parseInt(stats[0]?.two_star) || 0,
            3: parseInt(stats[0]?.three_star) || 0,
            4: parseInt(stats[0]?.four_star) || 0,
            5: parseInt(stats[0]?.five_star) || 0
        };

        res.json({
            success: true,
            stats: {
                total: parseInt(stats[0]?.total) || 0,
                average_rating: parseFloat(stats[0]?.average_rating || 0).toFixed(1),
                min_rating: parseInt(stats[0]?.min_rating) || 0,
                max_rating: parseInt(stats[0]?.max_rating) || 0,
                positive_count: parseInt(stats[0]?.positive_count) || 0,
                negative_count: parseInt(stats[0]?.negative_count) || 0,
                distribution: distribution
            }
        });
    } catch (error) {
        console.error('❌ Error fetching feedback stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats: ' + error.message
        });
    }
});

module.exports = router;