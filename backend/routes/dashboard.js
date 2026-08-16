// backend/routes/dashboard.js
// ✅ SIMPLIFIED - No complex queries

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================================
// ✅ GET DASHBOARD STATS - SIMPLIFIED
// ============================================================
router.get('/stats', authenticate, async (req, res) => {
    try {
        console.log('📊 Dashboard stats for user:', req.user.id);
        console.log('📊 Role:', req.user.role_name);

        const role = req.user.role_name;
        const hospitalId = req.user.hospital_id;

        let stats = {
            totalEquipment: 0,
            totalHospitals: 0,
            totalEngineers: 0,
            totalUsers: 0,
            totalErrors: 0,
            totalRepairs: 0,
            maintenanceDue: 0,
            pendingPurchaseOrders: 0,
            sparePartsLow: 0,
            openErrors: 0,
            resolvedErrors: 0,
            myAssignedRepairs: 0,
            myMaintenanceTasks: 0,
            myReportedErrors: 0,
            criticalErrors: 0,
            totalReports: 0
        };

        // ✅ SUPER ADMIN
        if (role === 'SUPER_ADMIN') {
            // Equipment
            const eq = await query("SELECT COUNT(*) as count FROM equipment");
            stats.totalEquipment = eq[0]?.count || 0;

            // Hospitals
            const hospitals = await query("SELECT COUNT(*) as count FROM hospitals WHERE is_active = 1");
            stats.totalHospitals = hospitals[0]?.count || 0;

            // Engineers
            const engineers = await query(`SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'ENGINEER' AND u.is_active = 1`);
            stats.totalEngineers = engineers[0]?.count || 0;

            // Users
            const users = await query("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
            stats.totalUsers = users[0]?.count || 0;

            // Errors
            const errors = await query("SELECT COUNT(*) as count FROM error_logs");
            stats.totalErrors = errors[0]?.count || 0;

            // Repairs
            const repairs = await query("SELECT COUNT(*) as count FROM repairs");
            stats.totalRepairs = repairs[0]?.count || 0;

            // Spare Parts Low
            const spareLow = await query("SELECT COUNT(*) as count FROM spare_parts WHERE quantity < 5");
            stats.sparePartsLow = spareLow[0]?.count || 0;
        }

        // ✅ ENGINEER
        else if (role === 'ENGINEER') {
            // Equipment
            const eq = await query("SELECT COUNT(*) as count FROM equipment WHERE hospital_id = ?", [hospitalId]);
            stats.totalEquipment = eq[0]?.count || 0;

            // Errors
            const errors = await query("SELECT COUNT(*) as count FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)", [hospitalId]);
            stats.totalErrors = errors[0]?.count || 0;

            // Repairs
            const repairs = await query("SELECT COUNT(*) as count FROM repairs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)", [hospitalId]);
            stats.totalRepairs = repairs[0]?.count || 0;

            // My Assigned Repairs
            const assigned = await query("SELECT COUNT(*) as count FROM repairs WHERE LOWER(engineer_name) = LOWER(?)", [req.user.full_name]);
            stats.myAssignedRepairs = assigned[0]?.count || 0;

            // My Maintenance Tasks
            const maintenance = await query("SELECT COUNT(*) as count FROM maintenance_schedule WHERE LOWER(engineer_name) = LOWER(?)", [req.user.full_name]);
            stats.myMaintenanceTasks = maintenance[0]?.count || 0;

            // My Reported Errors
            const reported = await query("SELECT COUNT(*) as count FROM error_logs WHERE reported_by = ?", [req.user.id]);
            stats.myReportedErrors = reported[0]?.count || 0;
        }

        // ✅ HOSPITAL ADMIN
        else if (role === 'HOSPITAL_ADMIN') {
            // Equipment
            const eq = await query("SELECT COUNT(*) as count FROM equipment WHERE hospital_id = ?", [hospitalId]);
            stats.totalEquipment = eq[0]?.count || 0;

            // Engineers
            const engineers = await query("SELECT COUNT(*) as count FROM users WHERE hospital_id = ? AND role_id = 3 AND is_active = 1", [hospitalId]);
            stats.totalEngineers = engineers[0]?.count || 0;

            // Users
            const users = await query("SELECT COUNT(*) as count FROM users WHERE hospital_id = ? AND is_active = 1", [hospitalId]);
            stats.totalUsers = users[0]?.count || 0;

            // Errors
            const errors = await query("SELECT COUNT(*) as count FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)", [hospitalId]);
            stats.totalErrors = errors[0]?.count || 0;

            // Repairs
            const repairs = await query("SELECT COUNT(*) as count FROM repairs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)", [hospitalId]);
            stats.totalRepairs = repairs[0]?.count || 0;

            // Spare Parts Low
            const spareLow = await query(`SELECT COUNT(*) as count FROM spare_parts WHERE quantity < 5`);
            stats.sparePartsLow = spareLow[0]?.count || 0;
        }

        console.log('✅ Stats sent successfully');
        res.json({ success: true, ...stats });

    } catch (error) {
        console.error('❌ Dashboard error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard stats',
            error: error.message 
        });
    }
});

module.exports = router;