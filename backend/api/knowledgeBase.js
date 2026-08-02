const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get knowledge base entries
router.get('/', authenticate, async (req, res) => {
    try {
        const entries = await query(`
            SELECT kb.*, e.name as equipment_name, u.full_name as created_by_name
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            LEFT JOIN users u ON kb.created_by = u.id
            ORDER BY kb.created_at DESC
        `);
        res.json({ success: true, entries });
    } catch (error) {
        console.error('Get knowledge base error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch knowledge base' });
    }
});

// Get knowledge base by equipment
router.get('/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        const entries = await query(
            `SELECT kb.*, u.full_name as created_by_name
             FROM knowledge_base kb
             LEFT JOIN users u ON kb.created_by = u.id
             WHERE kb.equipment_id = ?
             ORDER BY kb.created_at DESC`,
            [equipmentId]
        );
        res.json({ success: true, entries });
    } catch (error) {
        console.error('Get knowledge base by equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch knowledge base' });
    }
});

module.exports = router;