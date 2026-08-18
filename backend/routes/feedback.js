// backend/routes/feedback.js
// ✅ COMPLETE FIXED VERSION - With proper role checks
// ✅ authenticate removed from individual routes (handled by server.js)

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================================
// ✅ GET ALL FEEDBACKS (Any authenticated user can view)
// ============================================================
router.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const feedbacks = await query(
            `SELECT 
                id,
                user_name,
                user_email,
                rating,
                message,
                hospital_name,
                admin_name,
                user_id,
                created_at,
                updated_at
             FROM feedback 
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
        const { 
            user_name, 
            email, 
            rating, 
            message, 
            hospital_name, 
            admin_name, 
            timestamp 
        } = req.body;

        // ✅ Rating ko ensure karein - default to 0 if not provided
        const finalRating = (rating !== undefined && rating !== null) ? parseInt(rating) : 0;

        console.log('📝 New feedback submission:');
        console.log('👤 User:', user_name);
        console.log('📧 Email:', email);
        console.log('⭐ Rating:', finalRating);
        console.log('🏥 Hospital:', hospital_name);
        console.log('👤 Admin:', admin_name);
        console.log('💬 Message:', message?.substring(0, 50) + '...');

        // ✅ Validation - Only message is required
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Feedback message is required'
            });
        }

        // ✅ Convert ISO datetime to MySQL datetime format
        let mysqlTimestamp = null;
        if (timestamp) {
            try {
                const date = new Date(timestamp);
                mysqlTimestamp = date.toISOString().slice(0, 19).replace('T', ' ');
            } catch (e) {
                mysqlTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
            }
        } else {
            mysqlTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        console.log('📅 MySQL Timestamp:', mysqlTimestamp);

        // ✅ Insert into database
        const result = await query(
            `INSERT INTO feedback (
                user_name, 
                user_email, 
                rating, 
                message, 
                hospital_name,
                admin_name,
                user_id,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_name || 'Anonymous User',
                email || 'No email',
                finalRating,
                message.trim(),
                hospital_name || null,
                admin_name || null,
                req.user?.id || null,
                mysqlTimestamp
            ]
        );

        console.log('✅ Feedback saved. ID:', result.insertId);

        // ✅ Notify admins about new feedback
        try {
            const admins = await query(
                `SELECT u.id FROM users u
                 WHERE u.role = 'SUPER_ADMIN' AND u.is_active = 1`
            );

            for (const admin of admins) {
                await query(
                    `INSERT INTO notifications (
                        user_id, 
                        title, 
                        message, 
                        type, 
                        related_id, 
                        related_module, 
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        admin.id,
                        '📝 New Feedback Received',
                        `New feedback from ${user_name || 'Anonymous'}: ${finalRating || 'No rating'}⭐ - ${message?.substring(0, 80)}${message?.length > 80 ? '...' : ''}`,
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

        // ✅ Return saved feedback
        const savedFeedback = await query(
            `SELECT 
                id,
                user_name,
                user_email,
                rating,
                message,
                hospital_name,
                admin_name,
                user_id,
                created_at
             FROM feedback 
             WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback_id: result.insertId,
            feedback: savedFeedback[0] || {
                id: result.insertId,
                user_name: user_name || 'Anonymous User',
                user_email: email || 'No email',
                rating: finalRating,
                message: message.trim(),
                hospital_name: hospital_name || null,
                admin_name: admin_name || null,
                created_at: mysqlTimestamp
            }
        });

    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        
        // ✅ Check if table missing columns
        if (error.message && error.message.includes('Unknown column')) {
            console.log('⚠️ Table missing columns, adding them...');
            try {
                await query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255) DEFAULT NULL`);
                await query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255) DEFAULT NULL`);
                console.log('✅ Columns added successfully');
                
                // ✅ Retry after adding columns
                return router.handle(req, res);
            } catch (alterError) {
                console.error('❌ Failed to add columns:', alterError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback: ' + error.message,
            fallback: 'Please try again later'
        });
    }
});

// ============================================================
// ✅ DELETE FEEDBACK (SUPER_ADMIN only) - FIXED
// ============================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🔍 DELETE Feedback Request:');
        console.log('👤 User Email:', req.user?.email);
        console.log('📌 User Role:', req.user?.role);
        console.log('📌 User Role Name:', req.user?.role_name);
        console.log('📌 Full User:', JSON.stringify(req.user, null, 2));

        // ✅ Check if user exists
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // ✅ Check using role_name OR role (both)
        const userRole = req.user.role_name || req.user.role;
        console.log('📌 Final User Role:', userRole);

        // ✅ Only SUPER_ADMIN can delete
        if (userRole !== 'SUPER_ADMIN') {
            console.log(`❌ Permission denied. User role: ${userRole}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only SUPER_ADMIN can delete feedback.'
            });
        }

        // ✅ Check if feedback exists
        const existing = await query('SELECT * FROM feedback WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        // ✅ Delete feedback
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
// ✅ GET FEEDBACK STATS (Any authenticated user can view)
// ============================================================
router.get('/stats', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                AVG(rating) as average_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating,
                COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_count,
                COUNT(CASE WHEN rating <= 2 AND rating > 0 THEN 1 END) as negative_count,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
                COUNT(CASE WHEN rating = 0 OR rating IS NULL THEN 1 END) as not_rated
            FROM feedback
        `);

        const distribution = {
            1: parseInt(stats[0]?.one_star) || 0,
            2: parseInt(stats[0]?.two_star) || 0,
            3: parseInt(stats[0]?.three_star) || 0,
            4: parseInt(stats[0]?.four_star) || 0,
            5: parseInt(stats[0]?.five_star) || 0,
            0: parseInt(stats[0]?.not_rated) || 0
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