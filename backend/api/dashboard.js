const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', authenticate, async (req, res) => {
    try {
        console.log('Dashboard stats request for user:', req.user.id);
        
        let hospitalFilter = '';
        let params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalFilter = ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const [totalEquipment, openErrors, resolvedErrors, totalHospitals, totalEngineers] = await Promise.all([
            query(`SELECT COUNT(*) as count FROM equipment WHERE status != 'Retired' ${hospitalFilter}`, params),
            query(`SELECT COUNT(*) as count FROM error_logs WHERE status IN ('Pending', 'In Progress')`),
            query(`SELECT COUNT(*) as count FROM error_logs WHERE status IN ('Resolved', 'Closed')`),
            query(`SELECT COUNT(*) as count FROM hospitals WHERE is_active = TRUE`),
            query(`SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'ENGINEER' AND u.is_active = TRUE`)
        ]);

        res.json({
            success: true,
            totalEquipment: totalEquipment[0]?.count || 0,
            openErrors: openErrors[0]?.count || 0,
            resolvedErrors: resolvedErrors[0]?.count || 0,
            totalHospitals: totalHospitals[0]?.count || 0,
            totalEngineers: totalEngineers[0]?.count || 0,
            totalReports: 0
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch stats',
            error: error.message 
        });
    }
});

// Get chart data
router.get('/charts/:type', authenticate, async (req, res) => {
    try {
        const { type } = req.params;
        let data = [];

        if (type === 'monthly') {
            data = await query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as count
                FROM error_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC
            `);
        }

        const chartData = data.map(item => ({
            name: item.month || 'Unknown',
            value: item.count || 0
        }));

        res.json({ success: true, data: chartData });
    } catch (error) {
        console.error('Chart data error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chart data' });
    }
});

// Get recent activity
router.get('/recent-activity', authenticate, async (req, res) => {
    try {
        const activities = await query(`
            SELECT 
                'error' as type,
                el.error_title as title,
                el.created_at as timestamp,
                u.full_name as user_name
            FROM error_logs el
            LEFT JOIN users u ON el.reported_by = u.id
            ORDER BY el.created_at DESC
            LIMIT 10
        `);
        res.json({ success: true, activities });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
    }
});

module.exports = router;