// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const reportService = require('../services/reportService');

// ============================================
// ✅ EQUIPMENT COMPLETE REPORT
// ============================================

/**
 * GET /api/reports/equipment-complete
 * Get complete equipment report with all metrics
 */
router.get('/equipment-complete', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                e.id,
                e.name as equipment_name,
                e.model,
                e.manufacturer,
                e.serial_number,
                e.status as current_status,
                h.name as hospital_name,
                d.name as department_name,
                e.location,
                e.installation_year,
                e.created_at as equipment_added_on,
                -- Current status duration
                (SELECT TIMESTAMPDIFF(HOUR, MAX(changed_at), NOW())
                 FROM equipment_status_history esh
                 WHERE esh.equipment_id = e.id
                 AND esh.new_status = e.status
                ) as current_status_hours,
                -- Total inactive time
                COALESCE((
                    SELECT SUM(TIMESTAMPDIFF(HOUR, 
                        esh.changed_at,
                        IFNULL(
                            (SELECT MIN(esh2.changed_at) 
                             FROM equipment_status_history esh2 
                             WHERE esh2.equipment_id = e.id 
                             AND esh2.changed_at > esh.changed_at),
                            NOW()
                        )
                    ))
                    FROM equipment_status_history esh
                    WHERE esh.equipment_id = e.id
                    AND esh.new_status = 'Inactive'
                ), 0) as total_inactive_hours,
                -- Total maintenance time
                COALESCE((
                    SELECT SUM(TIMESTAMPDIFF(HOUR, 
                        esh.changed_at,
                        IFNULL(
                            (SELECT MIN(esh2.changed_at) 
                             FROM equipment_status_history esh2 
                             WHERE esh2.equipment_id = e.id 
                             AND esh2.changed_at > esh.changed_at),
                            NOW()
                        )
                    ))
                    FROM equipment_status_history esh
                    WHERE esh.equipment_id = e.id
                    AND esh.new_status = 'Maintenance'
                ), 0) as total_maintenance_hours,
                -- Total downtime
                (COALESCE((
                    SELECT SUM(TIMESTAMPDIFF(HOUR, 
                        esh.changed_at,
                        IFNULL(
                            (SELECT MIN(esh2.changed_at) 
                             FROM equipment_status_history esh2 
                             WHERE esh2.equipment_id = e.id 
                             AND esh2.changed_at > esh.changed_at),
                            NOW()
                        )
                    ))
                    FROM equipment_status_history esh
                    WHERE esh.equipment_id = e.id
                    AND esh.new_status IN ('Inactive', 'Maintenance')
                ), 0)) as total_downtime_hours,
                ROUND(COALESCE((
                    SELECT SUM(TIMESTAMPDIFF(HOUR, 
                        esh.changed_at,
                        IFNULL(
                            (SELECT MIN(esh2.changed_at) 
                             FROM equipment_status_history esh2 
                             WHERE esh2.equipment_id = e.id 
                             AND esh2.changed_at > esh.changed_at),
                            NOW()
                        )
                    ))
                    FROM equipment_status_history esh
                    WHERE esh.equipment_id = e.id
                    AND esh.new_status IN ('Inactive', 'Maintenance')
                ), 0) / 24, 2) as total_downtime_days,
                -- Error stats
                COUNT(DISTINCT el.id) as total_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.id END) as open_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END) as resolved_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Critical' THEN el.id END) as critical_errors,
                -- Repair stats
                COUNT(DISTINCT r.id) as total_repairs,
                COUNT(DISTINCT CASE WHEN r.status = 'Completed' THEN r.id END) as completed_repairs,
                -- Spare parts stats
                COUNT(DISTINCT sp.id) as total_spare_parts,
                COUNT(DISTINCT CASE WHEN sp.status = 'In Stock' THEN sp.id END) as spare_parts_in_stock,
                COUNT(DISTINCT CASE WHEN sp.status = 'Low Stock' THEN sp.id END) as spare_parts_low_stock,
                COUNT(DISTINCT CASE WHEN sp.status = 'Out of Stock' THEN sp.id END) as spare_parts_out_of_stock,
                SUM(sp.total_cost) as spare_parts_total_cost
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            LEFT JOIN repairs r ON el.id = r.error_log_id
            LEFT JOIN spare_parts sp ON e.id = sp.equipment_id
            WHERE e.status != 'Inactive'
            GROUP BY e.id
            ORDER BY total_downtime_days DESC, e.status DESC
        `;

        const data = await query(sql);

        // Calculate summary stats
        const stats = {
            total: data.length,
            active: data.filter(d => d.current_status === 'Active').length,
            inactive: data.filter(d => d.current_status === 'Inactive').length,
            maintenance: data.filter(d => d.current_status === 'Maintenance').length,
            total_downtime_days: data.reduce((sum, d) => sum + (parseFloat(d.total_downtime_days) || 0), 0),
            avg_downtime_days: data.length > 0 
                ? (data.reduce((sum, d) => sum + (parseFloat(d.total_downtime_days) || 0), 0) / data.length)
                : 0,
            total_errors: data.reduce((sum, d) => sum + (d.total_errors || 0), 0),
            total_repairs: data.reduce((sum, d) => sum + (d.total_repairs || 0), 0),
            total_spare_parts: data.reduce((sum, d) => sum + (d.total_spare_parts || 0), 0)
        };

        res.json({
            success: true,
            data,
            stats,
            total: data.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Equipment report error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate equipment report' 
        });
    }
});

// ============================================
// ✅ ENGINEER REPORTS
// ============================================

/**
 * GET /api/reports/engineer
 * Get reports for the logged-in engineer
 */
router.get('/engineer', authenticate, async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const userId = req.user.id;

        const result = await reportService.getEngineerReport({
            type: type || 'my-errors',
            userId,
            startDate,
            endDate
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Engineer report error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate engineer report'
        });
    }
});

/**
 * GET /api/reports/engineer/my-errors
 * Get errors reported by the logged-in engineer
 */
router.get('/engineer/my-errors', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const result = await reportService.getEngineerErrors({
            userId: req.user.id,
            startDate,
            endDate,
            status
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Engineer errors report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get engineer errors report'
        });
    }
});

/**
 * GET /api/reports/engineer/my-repairs
 * Get repairs performed by the logged-in engineer
 */
router.get('/engineer/my-repairs', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const result = await reportService.getEngineerRepairs({
            userId: req.user.id,
            startDate,
            endDate,
            status
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Engineer repairs report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get engineer repairs report'
        });
    }
});

/**
 * GET /api/reports/engineer/my-equipment
 * Get equipment worked on by the logged-in engineer
 */
router.get('/engineer/my-equipment', authenticate, async (req, res) => {
    try {
        const result = await reportService.getEngineerEquipment(req.user.id);

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Engineer equipment report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get engineer equipment report'
        });
    }
});

/**
 * GET /api/reports/engineer/my-performance
 * Get performance metrics for the logged-in engineer
 */
router.get('/engineer/my-performance', authenticate, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const result = await reportService.getEngineerPerformance({
            userId: req.user.id,
            startDate,
            endDate
        });

        res.json({
            success: true,
            data: result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Engineer performance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get engineer performance report'
        });
    }
});

/**
 * GET /api/reports/engineer/my-pending-tasks
 * Get pending tasks for the logged-in engineer
 */
router.get('/engineer/my-pending-tasks', authenticate, async (req, res) => {
    try {
        const result = await reportService.getEngineerPendingTasks(req.user.id);

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Engineer pending tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending tasks'
        });
    }
});

// ============================================
// ✅ ADMIN REPORTS
// ============================================

/**
 * GET /api/reports/admin
 * Generate admin reports
 */
router.get('/admin', authenticate, async (req, res) => {
    try {
        // Check if user has admin role
        if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'SUPPORT'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const {
            type,
            startDate,
            endDate,
            hospitalId,
            equipmentId,
            departmentId
        } = req.query;

        const result = await reportService.generateReport({
            type,
            startDate,
            endDate,
            hospitalId,
            equipmentId,
            departmentId,
            user: req.user
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Admin report error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate admin report'
        });
    }
});

/**
 * GET /api/reports/admin/monthly
 * Get monthly report
 */
router.get('/admin/monthly', authenticate, async (req, res) => {
    try {
        if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'SUPPORT'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { year, month } = req.query;
        const result = await reportService.getMonthlyReport({
            year,
            month,
            user: req.user
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Monthly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate monthly report'
        });
    }
});

// ============================================
// ✅ MAINTENANCE + DOWNTIME COMBINED REPORT
// ============================================

/**
 * GET /api/reports/maintenance-downtime
 * Get combined maintenance and downtime report
 */
router.get('/maintenance-downtime', authenticate, async (req, res) => {
    try {
        const { period, status, engineer_id, startDate, endDate } = req.query;
        
        let sql = `
            SELECT 
                m.id as maintenance_id,
                m.equipment_id,
                e.name as equipment_name,
                e.model as equipment_model,
                e.serial_number,
                h.name as hospital_name,
                m.maintenance_type,
                m.frequency,
                m.last_maintenance_date,
                m.next_due_date,
                m.status as maintenance_status,
                m.engineer_name,
                m.priority,
                m.description,
                m.created_at as maintenance_created_at,
                (
                    SELECT COUNT(*) FROM error_logs el 
                    WHERE el.equipment_id = m.equipment_id
                ) as total_errors,
                (
                    SELECT COUNT(*) FROM error_logs el 
                    WHERE el.equipment_id = m.equipment_id 
                    AND el.severity = 'Critical'
                ) as critical_errors,
                (
                    SELECT COUNT(*) FROM repairs r 
                    WHERE r.error_log_id IN (
                        SELECT id FROM error_logs el 
                        WHERE el.equipment_id = m.equipment_id
                    )
                ) as total_repairs,
                (
                    SELECT 
                        SUM(TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at)) 
                    FROM error_logs el 
                    WHERE el.equipment_id = m.equipment_id 
                    AND el.status IN ('Resolved', 'Closed')
                ) as total_downtime_hours
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            sql += ' AND m.status = ?';
            params.push(status);
        }
        
        if (engineer_id) {
            sql += ' AND LOWER(m.engineer_name) = (SELECT LOWER(full_name) FROM users WHERE id = ?)';
            params.push(engineer_id);
        }
        
        if (startDate) {
            sql += ' AND m.next_due_date >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            sql += ' AND m.next_due_date <= ?';
            params.push(endDate);
        }
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY m.next_due_date ASC, m.created_at DESC';
        
        const data = await query(sql, params);
        
        // Process data - calculate availability
        const processedData = data.map(item => {
            const downtimeHours = item.total_downtime_hours || 0;
            const downtimeDays = downtimeHours / 24;
            
            // Calculate availability (assuming 1 year = 365 days)
            const ageDays = 365; // Default 1 year
            const totalHours = ageDays * 24;
            const availability = totalHours > 0 
                ? ((totalHours - downtimeHours) / totalHours * 100).toFixed(1)
                : 100;
            
            return {
                ...item,
                total_downtime_hours: Number(downtimeHours),
                total_downtime_days: Number(downtimeDays.toFixed(1)),
                availability_percentage: Number(availability),
                is_overdue: item.next_due_date && new Date(item.next_due_date) < new Date()
            };
        });
        
        // Stats
        const stats = {
            total: processedData.length,
            scheduled: processedData.filter(m => m.maintenance_status === 'Scheduled').length,
            in_progress: processedData.filter(m => m.maintenance_status === 'In Progress').length,
            completed: processedData.filter(m => m.maintenance_status === 'Completed').length,
            overdue: processedData.filter(m => m.maintenance_status === 'Overdue' || m.is_overdue).length,
            total_downtime_hours: Number(processedData.reduce((sum, m) => sum + (m.total_downtime_hours || 0), 0)),
            total_downtime_days: Number((processedData.reduce((sum, m) => sum + (m.total_downtime_hours || 0), 0) / 24).toFixed(1)),
            avg_availability: processedData.length > 0 
                ? Number((processedData.reduce((sum, m) => sum + parseFloat(m.availability_percentage), 0) / processedData.length).toFixed(1))
                : 100
        };
        
        res.json({
            success: true,
            data: processedData,
            stats,
            total: processedData.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Maintenance downtime report error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate report: ' + error.message 
        });
    }
});

// ============================================
// ✅ MAINTENANCE SUMMARY STATS
// ============================================

/**
 * GET /api/reports/maintenance-summary
 * Get maintenance summary statistics
 */
router.get('/maintenance-summary', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN m.status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
                SUM(CASE WHEN m.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN m.status = 'Completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN m.status = 'Overdue' THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN m.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN m.priority = 'High' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN m.priority = 'Medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN m.priority = 'Low' THEN 1 ELSE 0 END) as low,
                AVG(TIMESTAMPDIFF(DAY, m.last_maintenance_date, m.next_due_date)) as avg_interval_days,
                (
                    SELECT COUNT(*) FROM error_logs el 
                    WHERE el.equipment_id IN (SELECT id FROM equipment)
                ) as total_errors,
                (
                    SELECT SUM(TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at))
                    FROM error_logs el 
                    WHERE el.status IN ('Resolved', 'Closed')
                ) as total_downtime_hours
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const stats = await query(sql, params);
        res.json({ 
            success: true, 
            stats: stats[0] || {} 
        });
    } catch (error) {
        console.error('❌ Maintenance summary error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get maintenance summary' 
        });
    }
});

// ============================================
// ✅ ADVANCED ANALYTICS (Admin only)
// ============================================

/**
 * GET /api/reports/analytics/failure-rate
 * Get equipment failure rate analysis
 */
router.get('/analytics/failure-rate', authenticate, async (req, res) => {
    try {
        if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { startDate, endDate, hospitalId } = req.query;
        const result = await reportService.getEquipmentFailureRate({
            startDate,
            endDate,
            hospitalId,
            user: req.user
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failure rate analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get failure rate analysis'
        });
    }
});

/**
 * GET /api/reports/analytics/engineer-performance
 * Get engineer performance analytics
 */
router.get('/analytics/engineer-performance', authenticate, async (req, res) => {
    try {
        if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { startDate, endDate, hospitalId } = req.query;
        const result = await reportService.getEngineerPerformanceAnalytics({
            startDate,
            endDate,
            hospitalId,
            user: req.user
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Engineer performance analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get engineer performance analytics'
        });
    }
});

/**
 * GET /api/reports/analytics/downtime
 * Get downtime analysis
 */
router.get('/analytics/downtime', authenticate, async (req, res) => {
    try {
        if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { startDate, endDate, hospitalId } = req.query;
        const result = await reportService.getDowntimeAnalysis({
            startDate,
            endDate,
            hospitalId,
            user: req.user
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Downtime analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get downtime analysis'
        });
    }
});

/**
 * GET /api/reports/analytics/spare-parts
 * Get spare parts usage analytics
 */
router.get('/analytics/spare-parts', authenticate, async (req, res) => {
    try {
        if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { startDate, endDate, hospitalId } = req.query;
        const result = await reportService.getSparePartsUsageAnalytics({
            startDate,
            endDate,
            hospitalId,
            user: req.user
        });

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Spare parts analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get spare parts usage analytics'
        });
    }
});

/**
 * GET /api/reports/analytics/hospital-overview
 * Get hospital overview dashboard data
 */
router.get('/analytics/hospital-overview', authenticate, async (req, res) => {
    try {
        if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const result = await reportService.getHospitalOverview(req.user);

        res.json({
            success: true,
            ...result,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Hospital overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get hospital overview'
        });
    }
});

// ============================================
// ✅ DOWNTIME REPORT (Standalone)
// ============================================

/**
 * GET /api/reports/downtime
 * Get downtime report
 */
router.get('/downtime', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, hospitalId, equipmentId } = req.query;
        
        let sql = `
            SELECT 
                e.id,
                e.name as equipment_name,
                e.model,
                e.serial_number,
                h.name as hospital_name,
                d.name as department_name,
                COUNT(DISTINCT el.id) as downtime_events,
                SUM(CASE WHEN el.status IN ('Resolved', 'Closed') 
                    THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
                    ELSE TIMESTAMPDIFF(HOUR, el.created_at, NOW()) 
                END) as total_downtime_hours,
                AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
                    THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
                    ELSE TIMESTAMPDIFF(HOUR, el.created_at, NOW()) 
                END) as avg_downtime_hours,
                MIN(el.created_at) as first_downtime,
                MAX(el.created_at) as last_downtime,
                MAX(CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.created_at ELSE NULL END) as current_downtime_start
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE e.status != 'Retired' 
            AND el.id IS NOT NULL
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            sql += ' AND el.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (equipmentId) {
            sql += ' AND e.id = ?';
            params.push(equipmentId);
        }
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        } else if (hospitalId) {
            sql += ' AND e.hospital_id = ?';
            params.push(hospitalId);
        }
        
        sql += ` 
            GROUP BY e.id
            HAVING total_downtime_hours > 0
            ORDER BY total_downtime_hours DESC
        `;
        
        const data = await query(sql, params);
        
        // Calculate additional metrics
        const processedData = data.map(item => {
            const totalHours = Number(item.total_downtime_hours || 0);
            return {
                ...item,
                total_downtime_hours: totalHours,
                total_downtime_days: Number((totalHours / 24).toFixed(1)),
                availability_percentage: 100 - Number(((totalHours / (365 * 24)) * 100).toFixed(1)),
                is_currently_down: item.current_downtime_start !== null
            };
        });
        
        const summary = {
            total_equipment: processedData.length,
            total_downtime_hours: Number(processedData.reduce((sum, d) => sum + d.total_downtime_hours, 0)),
            avg_downtime_hours: processedData.length > 0 
                ? Number((processedData.reduce((sum, d) => sum + d.total_downtime_hours, 0) / processedData.length).toFixed(1))
                : 0,
            currently_down: processedData.filter(d => d.is_currently_down).length
        };
        
        res.json({
            success: true,
            data: processedData,
            summary,
            total: processedData.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Downtime report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate downtime report'
        });
    }
});

// ============================================
// ✅ MAINTENANCE REPORT (Standalone)
// ============================================

/**
 * GET /api/reports/maintenance
 * Get maintenance report
 */
router.get('/maintenance', authenticate, async (req, res) => {
    try {
        const { status, priority, startDate, endDate, hospitalId, equipmentId } = req.query;
        
        let sql = `
            SELECT 
                ms.id,
                ms.equipment_id,
                e.name as equipment_name,
                e.model,
                e.serial_number,
                h.name as hospital_name,
                d.name as department_name,
                ms.maintenance_type,
                ms.frequency,
                ms.last_maintenance_date,
                ms.next_due_date,
                ms.status as maintenance_status,
                ms.priority,
                ms.description,
                ms.engineer_name,
                ms.maintenance_checklist,
                ms.calibration_date,
                ms.warranty_expiry,
                ms.amc_details,
                ms.created_at,
                ms.updated_at,
                DATEDIFF(ms.next_due_date, CURDATE()) as days_until_due
            FROM maintenance_schedule ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            sql += ' AND ms.status = ?';
            params.push(status);
        }
        
        if (priority) {
            sql += ' AND ms.priority = ?';
            params.push(priority);
        }
        
        if (startDate && endDate) {
            sql += ' AND ms.next_due_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (equipmentId) {
            sql += ' AND ms.equipment_id = ?';
            params.push(equipmentId);
        }
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        } else if (hospitalId) {
            sql += ' AND e.hospital_id = ?';
            params.push(hospitalId);
        }
        
        sql += ' ORDER BY ms.next_due_date ASC, ms.priority DESC';
        
        const data = await query(sql, params);
        
        // Process data
        const processedData = data.map(item => ({
            ...item,
            days_until_due: Number(item.days_until_due || 0),
            is_overdue: (item.days_until_due || 0) < 0,
            is_due_soon: (item.days_until_due || 0) >= 0 && (item.days_until_due || 0) <= 7
        }));
        
        const summary = {
            total: processedData.length,
            overdue: processedData.filter(m => m.is_overdue).length,
            due_soon: processedData.filter(m => m.is_due_soon).length,
            scheduled: processedData.filter(m => m.maintenance_status === 'Scheduled').length,
            in_progress: processedData.filter(m => m.maintenance_status === 'In Progress').length,
            completed: processedData.filter(m => m.maintenance_status === 'Completed').length,
            critical: processedData.filter(m => m.priority === 'Critical').length,
            high: processedData.filter(m => m.priority === 'High').length,
            medium: processedData.filter(m => m.priority === 'Medium').length,
            low: processedData.filter(m => m.priority === 'Low').length
        };
        
        res.json({
            success: true,
            data: processedData,
            summary,
            total: processedData.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Maintenance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate maintenance report'
        });
    }
});

// ============================================
// ✅ SPARE PARTS REPORT
// ============================================

/**
 * GET /api/reports/spare-parts
 * Get spare parts usage report
 */
router.get('/spare-parts', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, hospitalId, equipmentId, partName } = req.query;
        
        let sql = `
            SELECT 
                sp.id,
                sp.part_name,
                sp.part_number,
                sp.brand,
                sp.manufacturer,
                sp.specifications,
                sp.quantity as quantity_used,
                sp.unit_cost,
                sp.total_cost,
                sp.created_at as usage_date,
                e.name as equipment_name,
                e.model as equipment_model,
                h.name as hospital_name,
                r.id as repair_id,
                el.error_title,
                el.severity
            FROM spare_parts sp
            LEFT JOIN repairs r ON sp.repair_id = r.id
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            sql += ' AND sp.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (partName) {
            sql += ' AND sp.part_name LIKE ?';
            params.push(`%${partName}%`);
        }
        
        if (equipmentId) {
            sql += ' AND e.id = ?';
            params.push(equipmentId);
        }
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        } else if (hospitalId) {
            sql += ' AND e.hospital_id = ?';
            params.push(hospitalId);
        }
        
        sql += ' ORDER BY sp.created_at DESC LIMIT 200';
        
        const data = await query(sql, params);
        
        const summary = {
            total_parts_used: data.length,
            total_quantity: data.reduce((sum, d) => sum + (d.quantity_used || 0), 0),
            total_cost: Number(data.reduce((sum, d) => sum + (d.total_cost || 0), 0).toFixed(2)),
            unique_parts: new Set(data.map(d => d.part_name)).size
        };
        
        res.json({
            success: true,
            data,
            summary,
            total: data.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Spare parts report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate spare parts report'
        });
    }
});

// ============================================
// ✅ EXPORT REPORTS (CSV/Excel ready)
// ============================================

/**
 * GET /api/reports/export/maintenance-downtime
 * Export maintenance-downtime report data
 */
router.get('/export/maintenance-downtime', authenticate, async (req, res) => {
    try {
        // Reuse the same query as the main endpoint
        const { status, startDate, endDate } = req.query;
        
        let sql = `
            SELECT 
                m.id as maintenance_id,
                e.name as equipment_name,
                e.model as equipment_model,
                e.serial_number,
                h.name as hospital_name,
                m.maintenance_type,
                m.status as maintenance_status,
                m.priority,
                m.last_maintenance_date,
                m.next_due_date,
                m.engineer_name,
                m.description,
                (
                    SELECT COUNT(*) FROM error_logs el 
                    WHERE el.equipment_id = m.equipment_id
                ) as total_errors,
                (
                    SELECT SUM(TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at)) 
                    FROM error_logs el 
                    WHERE el.equipment_id = m.equipment_id 
                    AND el.status IN ('Resolved', 'Closed')
                ) as total_downtime_hours
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            sql += ' AND m.status = ?';
            params.push(status);
        }
        
        if (startDate) {
            sql += ' AND m.next_due_date >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            sql += ' AND m.next_due_date <= ?';
            params.push(endDate);
        }
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY m.next_due_date ASC';
        
        const data = await query(sql, params);
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=maintenance-downtime-report-${new Date().toISOString().split('T')[0]}.csv`);
        
        // Write CSV header
        const headers = [
            'Maintenance ID', 'Equipment', 'Model', 'Serial Number', 'Hospital',
            'Maintenance Type', 'Status', 'Priority', 'Last Maintenance', 'Next Due',
            'Engineer', 'Total Errors', 'Downtime Hours'
        ];
        res.write(headers.join(',') + '\n');
        
        // Write data rows
        data.forEach(row => {
            const values = [
                row.maintenance_id,
                `"${row.equipment_name || ''}"`,
                `"${row.equipment_model || ''}"`,
                `"${row.serial_number || ''}"`,
                `"${row.hospital_name || ''}"`,
                `"${row.maintenance_type || ''}"`,
                `"${row.maintenance_status || ''}"`,
                `"${row.priority || ''}"`,
                row.last_maintenance_date || '',
                row.next_due_date || '',
                `"${row.engineer_name || ''}"`,
                row.total_errors || 0,
                row.total_downtime_hours || 0
            ];
            res.write(values.join(',') + '\n');
        });
        
        res.end();
    } catch (error) {
        console.error('❌ Export report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export report'
        });
    }
});

module.exports = router;