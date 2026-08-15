// backend/routes/dashboard.js
// ✅ COMPLETE FIXED VERSION - ENGINEER DASHBOARD WORKING

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================================
// ✅ HELPER: Get Dashboard Stats - COMPLETE FIX
// ============================================================
const getDashboardStats = async (userId, roleName, hospitalId, fullName) => {
    try {
        let hospitalFilter = '';
        let params = [];

        if (roleName !== 'SUPER_ADMIN') {
            hospitalFilter = ' AND hospital_id = ?';
            params.push(hospitalId);
        }

        // ✅ BASE STATS - For ALL users
        const [totalEquipment, openErrors, resolvedErrors, totalHospitals, totalEngineers] = await Promise.all([
            query(`SELECT COUNT(*) as count FROM equipment WHERE status != 'Retired' ${hospitalFilter}`, params),
            query(`SELECT COUNT(*) as count FROM error_logs WHERE status IN ('Pending', 'In Progress')`),
            query(`SELECT COUNT(*) as count FROM error_logs WHERE status IN ('Resolved', 'Closed')`),
            query(`SELECT COUNT(*) as count FROM hospitals WHERE is_active = TRUE`),
            query(`SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'ENGINEER' AND u.is_active = TRUE`)
        ]);

        // ✅ ENGINEER SPECIFIC STATS - For ALL users (will be 0 for non-engineers)
        let myAssignedRepairs = 0;
        let myPendingRepairs = 0;
        let myInProgressRepairs = 0;
        let myCompletedRepairs = 0;
        let myMaintenanceTasks = 0;
        let myReportedErrors = 0;

        // ✅ COMMON STATS - For ALL users (with hospital filter for non-admin)
        let totalErrors = 0;
        let criticalErrors = 0;
        let totalRepairs = 0;
        let pendingRepairs = 0;
        let inProgressRepairs = 0;
        let maintenanceDue = 0;
        let criticalEquipment = 0;
        let pendingPurchaseOrders = 0;
        let sparePartsLow = 0;
        let totalUsers = 0;
        let totalReports = 0;

        // ✅ If Engineer - Get engineer-specific and hospital-wide stats
        if (roleName === 'ENGINEER') {
            const [assigned, pending, inProgress, completed, maintenance, reported, 
                   errors, critical, repairs, maintDue] = await Promise.all([
                // Engineer specific
                query(`SELECT COUNT(*) as count FROM repairs WHERE LOWER(engineer_name) = LOWER(?) AND status = 'Assigned'`, [fullName]),
                query(`SELECT COUNT(*) as count FROM repairs WHERE LOWER(engineer_name) = LOWER(?) AND status = 'Pending'`, [fullName]),
                query(`SELECT COUNT(*) as count FROM repairs WHERE LOWER(engineer_name) = LOWER(?) AND status = 'In Progress'`, [fullName]),
                query(`SELECT COUNT(*) as count FROM repairs WHERE LOWER(engineer_name) = LOWER(?) AND status IN ('Completed', 'Verified', 'Resolved')`, [fullName]),
                query(`SELECT COUNT(*) as count FROM maintenance_schedule WHERE LOWER(engineer_name) = LOWER(?) AND status != 'Completed'`, [fullName]),
                query(`SELECT COUNT(*) as count FROM error_logs WHERE reported_by = ?`, [userId]),
                
                // ✅ Hospital-wide stats for engineer (to show on dashboard)
                query(`SELECT COUNT(*) as count FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM error_logs WHERE severity = 'Critical' AND equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM repairs WHERE error_log_id IN (SELECT id FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?))`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM maintenance_schedule WHERE (status = 'Overdue' OR (next_due_date < CURDATE() AND status != 'Completed')) AND equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)`, [hospitalId])
            ]);
            
            myAssignedRepairs = assigned[0]?.count || 0;
            myPendingRepairs = pending[0]?.count || 0;
            myInProgressRepairs = inProgress[0]?.count || 0;
            myCompletedRepairs = completed[0]?.count || 0;
            myMaintenanceTasks = maintenance[0]?.count || 0;
            myReportedErrors = reported[0]?.count || 0;
            
            // ✅ SET HOSPITAL-WIDE STATS FOR ENGINEER
            totalErrors = errors[0]?.count || 0;
            criticalErrors = critical[0]?.count || 0;
            totalRepairs = repairs[0]?.count || 0;
            maintenanceDue = maintDue[0]?.count || 0;
        }

        // ✅ SUPER ADMIN - Get all stats
        if (roleName === 'SUPER_ADMIN') {
            const [critical, pendingRep, inProgressRep, maintDue, critEquip, pendingPO, spareLow, users, reports, totalErr, totalRep, pendingPurch] = await Promise.all([
                query(`SELECT COUNT(*) as count FROM error_logs WHERE severity = 'Critical'`),
                query(`SELECT COUNT(*) as count FROM repairs WHERE status = 'Pending'`),
                query(`SELECT COUNT(*) as count FROM repairs WHERE status = 'In Progress'`),
                query(`SELECT COUNT(*) as count FROM maintenance_schedule WHERE next_due_date < NOW() AND status != 'Completed'`),
                query(`SELECT COUNT(*) as count FROM equipment WHERE status = 'Critical'`),
                query(`SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'Pending Approval'`),
                query(`SELECT COUNT(*) as count FROM spare_parts WHERE quantity <= minimum_stock_level`),
                query(`SELECT COUNT(*) as count FROM users WHERE is_active = TRUE`),
                query(`SELECT COUNT(*) as count FROM reports`),
                query(`SELECT COUNT(*) as count FROM error_logs`),
                query(`SELECT COUNT(*) as count FROM repairs`),
                query(`SELECT COUNT(*) as count FROM purchase_orders WHERE status != 'Received' AND status != 'Cancelled'`)
            ]);
            
            totalErrors = totalErr[0]?.count || 0;
            totalRepairs = totalRep[0]?.count || 0;
            criticalErrors = critical[0]?.count || 0;
            pendingRepairs = pendingRep[0]?.count || 0;
            inProgressRepairs = inProgressRep[0]?.count || 0;
            maintenanceDue = maintDue[0]?.count || 0;
            criticalEquipment = critEquip[0]?.count || 0;
            pendingPurchaseOrders = pendingPO[0]?.count || 0;
            sparePartsLow = spareLow[0]?.count || 0;
            totalUsers = users[0]?.count || 0;
            totalReports = reports[0]?.count || 0;
        }

        // ✅ HOSPITAL ADMIN - Get hospital-wide stats
        if (roleName === 'HOSPITAL_ADMIN') {
            const [totalErr, critical, totalRep, pendingRep, inProgressRep, maintDue, critEquip, pendingPO, spareLow, users, reports] = await Promise.all([
                query(`SELECT COUNT(*) as count FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM error_logs WHERE severity = 'Critical' AND equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM repairs WHERE error_log_id IN (SELECT id FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?))`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM repairs WHERE status = 'Pending' AND error_log_id IN (SELECT id FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?))`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM repairs WHERE status = 'In Progress' AND error_log_id IN (SELECT id FROM error_logs WHERE equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?))`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM maintenance_schedule WHERE (status = 'Overdue' OR next_due_date < NOW()) AND equipment_id IN (SELECT id FROM equipment WHERE hospital_id = ?)`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM equipment WHERE status = 'Critical' AND hospital_id = ?`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'Pending Approval' AND hospital_id = ?`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM spare_parts WHERE quantity <= minimum_stock_level`),
                query(`SELECT COUNT(*) as count FROM users WHERE is_active = TRUE AND hospital_id = ?`, [hospitalId]),
                query(`SELECT COUNT(*) as count FROM reports WHERE hospital_id = ?`, [hospitalId])
            ]);
            
            totalErrors = totalErr[0]?.count || 0;
            criticalErrors = critical[0]?.count || 0;
            totalRepairs = totalRep[0]?.count || 0;
            pendingRepairs = pendingRep[0]?.count || 0;
            inProgressRepairs = inProgressRep[0]?.count || 0;
            maintenanceDue = maintDue[0]?.count || 0;
            criticalEquipment = critEquip[0]?.count || 0;
            pendingPurchaseOrders = pendingPO[0]?.count || 0;
            sparePartsLow = spareLow[0]?.count || 0;
            totalUsers = users[0]?.count || 0;
            totalReports = reports[0]?.count || 0;
        }

        return {
            success: true,
            totalEquipment: totalEquipment[0]?.count || 0,
            openErrors: openErrors[0]?.count || 0,
            resolvedErrors: resolvedErrors[0]?.count || 0,
            totalHospitals: totalHospitals[0]?.count || 0,
            totalEngineers: totalEngineers[0]?.count || 0,
            // ✅ COMMON FIELDS FOR ALL USERS
            totalErrors,
            criticalErrors,
            totalRepairs,
            pendingRepairs,
            inProgressRepairs,
            maintenanceDue,
            criticalEquipment,
            pendingPurchaseOrders,
            sparePartsLow,
            totalUsers,
            totalReports,
            // ✅ ENGINEER SPECIFIC FIELDS
            myAssignedRepairs,
            myPendingRepairs,
            myInProgressRepairs,
            myCompletedRepairs,
            myMaintenanceTasks,
            myReportedErrors
        };
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        throw error;
    }
};

// ============================================================
// ✅ SSE ENDPOINT FOR REAL-TIME UPDATES
// ============================================================
router.get('/stream', authenticate, async (req, res) => {
    console.log('📡 SSE Connection established for user:', req.user.id);
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const sendUpdate = async () => {
        try {
            const stats = await getDashboardStats(
                req.user.id,
                req.user.role_name,
                req.user.hospital_id,
                req.user.full_name
            );
            res.write(`data: ${JSON.stringify(stats)}\n\n`);
        } catch (error) {
            console.error('SSE Error:', error);
            res.write(`data: ${JSON.stringify({ success: false, error: error.message })}\n\n`);
        }
    };

    await sendUpdate();

    const interval = setInterval(sendUpdate, 3000);

    req.on('close', () => {
        console.log('📡 SSE Connection closed for user:', req.user.id);
        clearInterval(interval);
        res.end();
    });
});

// ============================================================
// ✅ GET DASHBOARD STATS - FIXED
// ============================================================
router.get('/stats', authenticate, async (req, res) => {
    try {
        console.log('📊 Dashboard stats request for user:', req.user.id);
        console.log('📊 Role:', req.user.role_name);
        console.log('📊 Hospital ID:', req.user.hospital_id);
        console.log('📊 Full Name:', req.user.full_name);
        
        const stats = await getDashboardStats(
            req.user.id,
            req.user.role_name,
            req.user.hospital_id,
            req.user.full_name
        );

        console.log('✅ Stats response:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch stats',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET MONTHLY ERROR CHART DATA
// ============================================================
router.get('/charts/monthly', authenticate, async (req, res) => {
    try {
        let hospitalFilter = '';
        let params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalFilter = ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const data = await query(`
            SELECT 
                DATE_FORMAT(el.created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE el.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            ${hospitalFilter}
            GROUP BY DATE_FORMAT(el.created_at, '%Y-%m')
            ORDER BY month ASC
        `, params);

        const chartData = data.map(item => ({
            name: item.month || 'Unknown',
            value: item.count || 0
        }));

        res.json({ success: true, data: chartData });
    } catch (error) {
        console.error('Monthly chart error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch monthly chart data',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET EQUIPMENT BREAKDOWN CHART DATA
// ============================================================
router.get('/charts/equipment-breakdown', authenticate, async (req, res) => {
    try {
        let hospitalFilter = '';
        let params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalFilter = ' WHERE hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const data = await query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM equipment
            ${hospitalFilter}
            GROUP BY status
            ORDER BY count DESC
        `, params);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Equipment breakdown error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch equipment breakdown',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET MOST FAILED EQUIPMENT
// ============================================================
router.get('/charts/most-failed', authenticate, async (req, res) => {
    try {
        let hospitalFilter = '';
        let params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalFilter = ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const data = await query(`
            SELECT 
                e.id,
                e.name,
                e.model,
                e.manufacturer,
                COUNT(el.id) as error_count
            FROM equipment e
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE e.status != 'Retired'
            ${hospitalFilter}
            GROUP BY e.id
            ORDER BY error_count DESC
            LIMIT 10
        `, params);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Most failed equipment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch most failed equipment',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET HOSPITAL COMPARISON CHART DATA
// ============================================================
router.get('/charts/hospital-comparison', authenticate, async (req, res) => {
    try {
        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        const data = await query(`
            SELECT 
                h.name as hospital_name,
                COUNT(DISTINCT e.id) as equipment_count,
                COUNT(DISTINCT el.id) as error_count,
                COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.id END) as open_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed') THEN el.id END) as resolved_errors,
                COUNT(DISTINCT u.id) as engineer_count
            FROM hospitals h
            LEFT JOIN equipment e ON h.id = e.hospital_id AND e.status != 'Retired'
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            LEFT JOIN users u ON h.id = u.hospital_id AND u.is_active = TRUE
            WHERE h.is_active = TRUE
            GROUP BY h.id
            ORDER BY h.name
        `);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Hospital comparison error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch hospital comparison',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET ENGINEER PERFORMANCE CHART DATA
// ============================================================
router.get('/charts/engineer-performance', authenticate, async (req, res) => {
    try {
        let hospitalFilter = '';
        let params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalFilter = ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const data = await query(`
            SELECT 
                u.id as engineer_id,
                u.full_name as engineer_name,
                COUNT(r.id) as repairs_completed,
                AVG(r.time_taken) as avg_time_taken,
                COUNT(DISTINCT r.error_log_id) as errors_fixed,
                MAX(r.repair_date) as last_repair_date
            FROM users u
            LEFT JOIN repairs r ON u.id = r.engineer_id AND r.status IN ('Completed', 'Verified')
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE u.is_active = TRUE
            ${hospitalFilter}
            GROUP BY u.id
            ORDER BY repairs_completed DESC
            LIMIT 10
        `, params);

        const formattedData = data.map(item => ({
            ...item,
            avg_time_taken: Math.round(item.avg_time_taken || 0),
            repairs_completed: parseInt(item.repairs_completed) || 0
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error('Engineer performance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch engineer performance',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET DEPARTMENT-WISE ERROR CHART DATA
// ============================================================
router.get('/charts/department-errors', authenticate, async (req, res) => {
    try {
        let hospitalFilter = '';
        let params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalFilter = ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const data = await query(`
            SELECT 
                d.name as department_name,
                COUNT(el.id) as error_count,
                COUNT(DISTINCT e.id) as equipment_count
            FROM departments d
            LEFT JOIN equipment e ON d.id = e.department_id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE d.name IS NOT NULL
            ${hospitalFilter}
            GROUP BY d.id
            ORDER BY error_count DESC
            LIMIT 10
        `, params);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Department errors error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch department errors',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET RECENT ACTIVITY
// ============================================================
router.get('/recent-activity', authenticate, async (req, res) => {
    try {
        let hospitalFilter = '';
        let params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalFilter = ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const activities = await query(`
            (SELECT 
                'error' as type,
                el.error_title as title,
                el.created_at as timestamp,
                u.full_name as user_name,
                e.name as equipment_name
            FROM error_logs el
            LEFT JOIN users u ON el.reported_by = u.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1 ${hospitalFilter}
            ORDER BY el.created_at DESC
            LIMIT 5)
            
            UNION ALL
            
            (SELECT 
                'repair' as type,
                CONCAT('Repair completed for ', e.name) as title,
                r.repair_date as timestamp,
                u.full_name as user_name,
                e.name as equipment_name
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN users u ON r.engineer_id = u.id
            WHERE r.status IN ('Completed', 'Verified') 
            ${hospitalFilter.replace('e.', '')}
            ORDER BY r.repair_date DESC
            LIMIT 5)
            
            ORDER BY timestamp DESC
            LIMIT 10
        `, params);

        res.json({ success: true, activities });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch recent activity',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ GET COMPREHENSIVE DASHBOARD DATA
// ============================================================
router.get('/all', authenticate, async (req, res) => {
    try {
        const [stats, monthlyData, equipmentBreakdown, mostFailed, hospitalComparison, engineerPerformance, departmentErrors, recentActivity] = await Promise.all([
            getDashboardStats(req.user.id, req.user.role_name, req.user.hospital_id, req.user.full_name),
            
            (async () => {
                let hospitalFilter = '';
                let params = [];
                if (req.user.role_name !== 'SUPER_ADMIN') {
                    hospitalFilter = ' AND e.hospital_id = ?';
                    params.push(req.user.hospital_id);
                }
                const data = await query(`
                    SELECT 
                        DATE_FORMAT(el.created_at, '%Y-%m') as month,
                        COUNT(*) as count
                    FROM error_logs el
                    LEFT JOIN equipment e ON el.equipment_id = e.id
                    WHERE el.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    ${hospitalFilter}
                    GROUP BY DATE_FORMAT(el.created_at, '%Y-%m')
                    ORDER BY month ASC
                `, params);
                return data.map(item => ({
                    name: item.month || 'Unknown',
                    value: item.count || 0
                }));
            })(),
            
            (async () => {
                let hospitalFilter = '';
                let params = [];
                if (req.user.role_name !== 'SUPER_ADMIN') {
                    hospitalFilter = ' WHERE hospital_id = ?';
                    params.push(req.user.hospital_id);
                }
                return await query(`
                    SELECT 
                        status,
                        COUNT(*) as count
                    FROM equipment
                    ${hospitalFilter}
                    GROUP BY status
                    ORDER BY count DESC
                `, params);
            })(),
            
            (async () => {
                let hospitalFilter = '';
                let params = [];
                if (req.user.role_name !== 'SUPER_ADMIN') {
                    hospitalFilter = ' AND e.hospital_id = ?';
                    params.push(req.user.hospital_id);
                }
                return await query(`
                    SELECT 
                        e.id,
                        e.name,
                        e.model,
                        e.manufacturer,
                        COUNT(el.id) as error_count
                    FROM equipment e
                    LEFT JOIN error_logs el ON e.id = el.equipment_id
                    WHERE e.status != 'Retired'
                    ${hospitalFilter}
                    GROUP BY e.id
                    ORDER BY error_count DESC
                    LIMIT 10
                `, params);
            })(),
            
            (async () => {
                if (req.user.role_name !== 'SUPER_ADMIN') return null;
                return await query(`
                    SELECT 
                        h.name as hospital_name,
                        COUNT(DISTINCT e.id) as equipment_count,
                        COUNT(DISTINCT el.id) as error_count,
                        COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.id END) as open_errors,
                        COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed') THEN el.id END) as resolved_errors,
                        COUNT(DISTINCT u.id) as engineer_count
                    FROM hospitals h
                    LEFT JOIN equipment e ON h.id = e.hospital_id AND e.status != 'Retired'
                    LEFT JOIN error_logs el ON e.id = el.equipment_id
                    LEFT JOIN users u ON h.id = u.hospital_id AND u.is_active = TRUE
                    WHERE h.is_active = TRUE
                    GROUP BY h.id
                    ORDER BY h.name
                `);
            })(),
            
            (async () => {
                let hospitalFilter = '';
                let params = [];
                if (req.user.role_name !== 'SUPER_ADMIN') {
                    hospitalFilter = ' AND e.hospital_id = ?';
                    params.push(req.user.hospital_id);
                }
                const data = await query(`
                    SELECT 
                        u.id as engineer_id,
                        u.full_name as engineer_name,
                        COUNT(r.id) as repairs_completed,
                        AVG(r.time_taken) as avg_time_taken,
                        COUNT(DISTINCT r.error_log_id) as errors_fixed,
                        MAX(r.repair_date) as last_repair_date
                    FROM users u
                    LEFT JOIN repairs r ON u.id = r.engineer_id AND r.status IN ('Completed', 'Verified')
                    LEFT JOIN error_logs el ON r.error_log_id = el.id
                    LEFT JOIN equipment e ON el.equipment_id = e.id
                    WHERE u.is_active = TRUE
                    ${hospitalFilter}
                    GROUP BY u.id
                    ORDER BY repairs_completed DESC
                    LIMIT 10
                `, params);
                return data.map(item => ({
                    ...item,
                    avg_time_taken: Math.round(item.avg_time_taken || 0),
                    repairs_completed: parseInt(item.repairs_completed) || 0
                }));
            })(),
            
            (async () => {
                let hospitalFilter = '';
                let params = [];
                if (req.user.role_name !== 'SUPER_ADMIN') {
                    hospitalFilter = ' AND e.hospital_id = ?';
                    params.push(req.user.hospital_id);
                }
                return await query(`
                    SELECT 
                        d.name as department_name,
                        COUNT(el.id) as error_count,
                        COUNT(DISTINCT e.id) as equipment_count
                    FROM departments d
                    LEFT JOIN equipment e ON d.id = e.department_id
                    LEFT JOIN error_logs el ON e.id = el.equipment_id
                    WHERE d.name IS NOT NULL
                    ${hospitalFilter}
                    GROUP BY d.id
                    ORDER BY error_count DESC
                    LIMIT 10
                `, params);
            })(),
            
            (async () => {
                let hospitalFilter = '';
                let params = [];
                if (req.user.role_name !== 'SUPER_ADMIN') {
                    hospitalFilter = ' AND e.hospital_id = ?';
                    params.push(req.user.hospital_id);
                }
                return await query(`
                    (SELECT 
                        'error' as type,
                        el.error_title as title,
                        el.created_at as timestamp,
                        u.full_name as user_name,
                        e.name as equipment_name
                    FROM error_logs el
                    LEFT JOIN users u ON el.reported_by = u.id
                    LEFT JOIN equipment e ON el.equipment_id = e.id
                    WHERE 1=1 ${hospitalFilter}
                    ORDER BY el.created_at DESC
                    LIMIT 5)
                    
                    UNION ALL
                    
                    (SELECT 
                        'repair' as type,
                        CONCAT('Repair completed for ', e.name) as title,
                        r.repair_date as timestamp,
                        u.full_name as user_name,
                        e.name as equipment_name
                    FROM repairs r
                    LEFT JOIN error_logs el ON r.error_log_id = el.id
                    LEFT JOIN equipment e ON el.equipment_id = e.id
                    LEFT JOIN users u ON r.engineer_id = u.id
                    WHERE r.status IN ('Completed', 'Verified') 
                    ${hospitalFilter.replace('e.', '')}
                    ORDER BY r.repair_date DESC
                    LIMIT 5)
                    
                    ORDER BY timestamp DESC
                    LIMIT 10
                `, params);
            })()
        ]);

        res.json({
            success: true,
            data: {
                stats,
                monthlyData,
                equipmentBreakdown,
                mostFailed,
                hospitalComparison,
                engineerPerformance,
                departmentErrors,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Dashboard all data error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard data',
            error: error.message 
        });
    }
});

module.exports = router;