const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = await query(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

// Get unread count
router.get('/unread/count', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.json({ success: true, count: result[0]?.count || 0 });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ success: false, message: 'Failed to get count' });
    }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
    try {
        await query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`,
            [req.user.id]
        );
        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
});

module.exports = router;