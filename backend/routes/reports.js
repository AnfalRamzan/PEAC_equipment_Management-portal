// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================
// ✅ ERROR SUMMARY REPORT - FIXED
// ============================================

router.get('/error-summary', authenticate, async (req, res) => {
    try {
        const { period, month, year, hospital_id, status } = req.query;
        
        const targetPeriod = period || 'monthly';
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        
        console.log(`📊 Error Summary Report: ${targetPeriod} - ${targetYear}-${targetMonth}`);
        
        // ============================================
        // 1️⃣ BUILD DATE FILTER
        // ============================================
        let dateCondition = '';
        let params = [];
        
        if (targetPeriod === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            dateCondition = 'DATE(el.error_date) = ?';
            params = [today];
        } else if (targetPeriod === 'weekly') {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - mondayOffset);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            
            dateCondition = 'DATE(el.error_date) BETWEEN ? AND ?';
            params = [
                monday.toISOString().split('T')[0],
                sunday.toISOString().split('T')[0]
            ];
        } else if (targetPeriod === 'monthly') {
            dateCondition = 'MONTH(el.error_date) = ? AND YEAR(el.error_date) = ?';
            params = [parseInt(targetMonth), parseInt(targetYear)];
        } else if (targetPeriod === 'yearly') {
            dateCondition = 'YEAR(el.error_date) = ?';
            params = [parseInt(targetYear)];
        } else {
            dateCondition = 'MONTH(el.error_date) = ? AND YEAR(el.error_date) = ?';
            params = [parseInt(targetMonth), parseInt(targetYear)];
        }
        
        // ============================================
        // 2️⃣ WHERE CLAUSE
        // ============================================
        let whereClause = dateCondition;
        let queryParams = [...params];
        
        if (hospital_id) {
            whereClause += ' AND e.hospital_id = ?';
            queryParams.push(parseInt(hospital_id));
        }
        if (status) {
            whereClause += ' AND el.status = ?';
            queryParams.push(status);
        }
        
        // ============================================
        // 3️⃣ SUMMARY STATS
        // ============================================
        let summaryQuery = `
            SELECT 
                COUNT(*) as total_errors,
                SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN el.priority = 'High' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN el.priority = 'Medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN el.priority = 'Low' THEN 1 ELSE 0 END) as low
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE ${whereClause}
        `;
        const summary = await query(summaryQuery, queryParams);
        
        // ============================================
        // 4️⃣ TREND DATA - FIXED
        // ============================================
        let trendData = [];
        
        if (targetPeriod === 'daily') {
            const trendQuery = `
                SELECT 
                    DATE(el.error_date) as period,
                    COUNT(*) as total_errors,
                    SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                    GROUP_CONCAT(DISTINCT e.name) as equipment_names,
                    GROUP_CONCAT(DISTINCT h.name) as hospital_names
                FROM error_logs el
                LEFT JOIN equipment e ON el.equipment_id = e.id
                LEFT JOIN hospitals h ON e.hospital_id = h.id
                WHERE ${whereClause}
                GROUP BY DATE(el.error_date)
                ORDER BY period DESC
            `;
            trendData = await query(trendQuery, queryParams);
            
        } else if (targetPeriod === 'weekly') {
            const trendQuery = `
                SELECT 
                    CONCAT(YEAR(el.error_date), '-W', LPAD(WEEK(el.error_date, 1), 2, '0')) as period,
                    COUNT(*) as total_errors,
                    SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                    GROUP_CONCAT(DISTINCT e.name) as equipment_names,
                    GROUP_CONCAT(DISTINCT h.name) as hospital_names
                FROM error_logs el
                LEFT JOIN equipment e ON el.equipment_id = e.id
                LEFT JOIN hospitals h ON e.hospital_id = h.id
                WHERE ${whereClause}
                GROUP BY CONCAT(YEAR(el.error_date), '-W', LPAD(WEEK(el.error_date, 1), 2, '0'))
                ORDER BY period DESC
            `;
            trendData = await query(trendQuery, queryParams);
            
        } else if (targetPeriod === 'monthly') {
            const trendQuery = `
                SELECT 
                    CONCAT(YEAR(el.error_date), '-', LPAD(MONTH(el.error_date), 2, '0')) as period,
                    COUNT(*) as total_errors,
                    SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                    GROUP_CONCAT(DISTINCT e.name) as equipment_names,
                    GROUP_CONCAT(DISTINCT h.name) as hospital_names
                FROM error_logs el
                LEFT JOIN equipment e ON el.equipment_id = e.id
                LEFT JOIN hospitals h ON e.hospital_id = h.id
                WHERE ${whereClause}
                GROUP BY CONCAT(YEAR(el.error_date), '-', LPAD(MONTH(el.error_date), 2, '0'))
                ORDER BY period DESC
            `;
            trendData = await query(trendQuery, queryParams);
            
        } else if (targetPeriod === 'yearly') {
            const trendQuery = `
                SELECT 
                    YEAR(el.error_date) as period,
                    COUNT(*) as total_errors,
                    SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                    GROUP_CONCAT(DISTINCT e.name) as equipment_names,
                    GROUP_CONCAT(DISTINCT h.name) as hospital_names
                FROM error_logs el
                LEFT JOIN equipment e ON el.equipment_id = e.id
                LEFT JOIN hospitals h ON e.hospital_id = h.id
                WHERE ${whereClause}
                GROUP BY YEAR(el.error_date)
                ORDER BY period DESC
            `;
            trendData = await query(trendQuery, queryParams);
        }
        
        // ============================================
        // 5️⃣ EQUIPMENT BREAKDOWN
        // ============================================
        let equipmentQuery = `
            SELECT 
                COALESCE(e.name, 'Unknown Equipment') as equipment_name,
                COALESCE(h.name, 'Unknown Hospital') as hospital_name,
                COUNT(el.id) as total_errors,
                SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE ${whereClause}
            GROUP BY e.id, e.name, h.id, h.name
            ORDER BY total_errors DESC
            LIMIT 20
        `;
        const equipmentBreakdown = await query(equipmentQuery, queryParams);
        
        // ============================================
        // 6️⃣ TOP ERRORS
        // ============================================
        let topErrorsQuery = `
            SELECT 
                el.error_title,
                COUNT(*) as count,
                GROUP_CONCAT(DISTINCT el.status) as statuses
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE ${whereClause}
            GROUP BY el.error_title
            ORDER BY count DESC
            LIMIT 10
        `;
        const topErrors = await query(topErrorsQuery, queryParams);
        
        const totalErrors = trendData.reduce((sum, d) => sum + d.total_errors, 0);
        
        res.json({
            success: true,
            data: {
                period: targetPeriod,
                summary: summary[0] || {},
                trend: trendData,
                equipment_breakdown: equipmentBreakdown,
                top_errors: topErrors,
                total: totalErrors,
                filters: {
                    hospital_id: hospital_id || null,
                    status: status || null
                }
            },
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error summary report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate error summary report: ' + error.message
        });
    }
});

// ============================================
// ✅ MONTHLY ERROR REPORT - FIXED
// ============================================

router.get('/monthly-errors', authenticate, async (req, res) => {
    try {
        const { month, year, hospital_id, status } = req.query;
        
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        
        console.log(`📅 Monthly Error Report: ${targetYear}-${targetMonth}`);
        
        // 1️⃣ Monthly Summary
        let summaryQuery = `
            SELECT 
                COUNT(*) as total_errors,
                SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN el.priority = 'High' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN el.priority = 'Medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN el.priority = 'Low' THEN 1 ELSE 0 END) as low
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE MONTH(el.error_date) = ? 
            AND YEAR(el.error_date) = ?
        `;
        const params = [parseInt(targetMonth), parseInt(targetYear)];
        
        if (hospital_id) {
            summaryQuery += ' AND e.hospital_id = ?';
            params.push(parseInt(hospital_id));
        }
        if (status) {
            summaryQuery += ' AND el.status = ?';
            params.push(status);
        }
        
        const summary = await query(summaryQuery, params);
        
        // 2️⃣ Daily Trend
        let dailyQuery = `
            SELECT 
                DATE(el.error_date) as date,
                COUNT(*) as total_errors,
                SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                GROUP_CONCAT(DISTINCT e.name) as equipment_names,
                GROUP_CONCAT(DISTINCT h.name) as hospital_names
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE MONTH(el.error_date) = ? 
            AND YEAR(el.error_date) = ?
        `;
        const dailyParams = [parseInt(targetMonth), parseInt(targetYear)];
        
        if (hospital_id) {
            dailyQuery += ' AND e.hospital_id = ?';
            dailyParams.push(parseInt(hospital_id));
        }
        if (status) {
            dailyQuery += ' AND el.status = ?';
            dailyParams.push(status);
        }
        
        dailyQuery += ' GROUP BY DATE(el.error_date) ORDER BY date';
        const dailyTrend = await query(dailyQuery, dailyParams);
        
        // 3️⃣ Equipment Breakdown
        let equipmentQuery = `
            SELECT 
                COALESCE(e.name, 'Unknown Equipment') as equipment_name,
                COALESCE(h.name, 'Unknown Hospital') as hospital_name,
                COUNT(el.id) as total_errors,
                SUM(CASE WHEN el.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN el.status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN el.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE MONTH(el.error_date) = ? 
            AND YEAR(el.error_date) = ?
        `;
        const equipParams = [parseInt(targetMonth), parseInt(targetYear)];
        
        if (hospital_id) {
            equipmentQuery += ' AND e.hospital_id = ?';
            equipParams.push(parseInt(hospital_id));
        }
        if (status) {
            equipmentQuery += ' AND el.status = ?';
            equipParams.push(status);
        }
        
        equipmentQuery += ' GROUP BY e.id, e.name, h.id, h.name ORDER BY total_errors DESC';
        const equipmentBreakdown = await query(equipmentQuery, equipParams);
        
        // 4️⃣ Top Errors
        let topErrorsQuery = `
            SELECT 
                el.error_title,
                COUNT(*) as count,
                GROUP_CONCAT(DISTINCT el.status) as statuses
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE MONTH(el.error_date) = ? 
            AND YEAR(el.error_date) = ?
        `;
        const topParams = [parseInt(targetMonth), parseInt(targetYear)];
        
        if (hospital_id) {
            topErrorsQuery += ' AND e.hospital_id = ?';
            topParams.push(parseInt(hospital_id));
        }
        if (status) {
            topErrorsQuery += ' AND el.status = ?';
            topParams.push(status);
        }
        
        topErrorsQuery += ' GROUP BY el.error_title ORDER BY count DESC LIMIT 10';
        const topErrors = await query(topErrorsQuery, topParams);
        
        res.json({
            success: true,
            data: {
                month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
                summary: summary[0] || {},
                daily_trend: dailyTrend,
                equipment_breakdown: equipmentBreakdown,
                top_errors: topErrors,
                total: dailyTrend.reduce((sum, d) => sum + d.total_errors, 0)
            },
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Monthly error report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate monthly error report: ' + error.message
        });
    }
});

// ============================================
// ✅ HOSPITAL WISE REPORT - COMPLETE FIXED
// ============================================

router.get('/hospital-wise', authenticate, async (req, res) => {
    try {
        console.log('🏥 Hospital-wise report requested');
        console.log('👤 User:', req.user.email, 'Role:', req.user.role_name);
        
        // ============================================
        // 1️⃣ GET HOSPITALS
        // ============================================
        let hospitalSql = `
            SELECT 
                id,
                name,
                hospital_code,
                city,
                state,
                is_active,
                biomedical_head,
                phone,
                email,
                address
            FROM hospitals
            WHERE is_active = 1
        `;
        const hospitalParams = [];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            hospitalSql += ' AND id = ?';
            hospitalParams.push(req.user.hospital_id);
        }
        
        hospitalSql += ' ORDER BY name';
        
        const hospitals = await query(hospitalSql, hospitalParams);
        
        console.log(`✅ Found ${hospitals.length} hospitals`);
        
        if (hospitals.length === 0) {
            return res.json({
                success: true,
                data: [],
                summary: {
                    total_hospitals: 0,
                    total_equipment: 0,
                    total_errors: 0,
                    total_resolved: 0,
                    total_pending: 0,
                    total_critical: 0,
                    total_downtime_hours: 0,
                    total_downtime_days: 0,
                    avg_availability: 100
                },
                total: 0,
                generatedAt: new Date().toISOString()
            });
        }
        
        // ============================================
        // 2️⃣ FOR EACH HOSPITAL, GET ALL DATA
        // ============================================
        const data = [];
        
        for (const hospital of hospitals) {
            console.log(`📊 Processing hospital: ${hospital.name} (ID: ${hospital.id})`);
            
            // --- Get ALL Equipment ---
            const equipment = await query(`
                SELECT 
                    id, 
                    name, 
                    model, 
                    manufacturer,
                    serial_number,
                    status,
                    installation_year,
                    department_id,
                    location,
                    created_at
                FROM equipment
                WHERE hospital_id = ?
                AND status != 'Inactive'
            `, [hospital.id]);
            
            console.log(`   📦 Equipment found: ${equipment.length}`);
            
            // --- Get ALL Error Logs ---
            let errors = [];
            if (equipment.length > 0) {
                const eqIds = equipment.map(e => e.id).join(',');
                
                errors = await query(`
                    SELECT 
                        id,
                        equipment_id,
                        error_title,
                        error_code,
                        error_description,
                        status,
                        priority,
                        error_date,
                        created_at,
                        updated_at,
                        reported_by
                    FROM error_logs
                    WHERE equipment_id IN (${eqIds})
                    ORDER BY created_at DESC
                `);
                
                console.log(`   ❌ Errors found: ${errors.length}`);
            }
            
            // --- Get Repairs ---
            let repairs = [];
            if (equipment.length > 0) {
                const eqIds = equipment.map(e => e.id).join(',');
                repairs = await query(`
                    SELECT 
                        r.id,
                        r.error_log_id,
                        r.engineer_id,
                        r.engineer_name,
                        r.root_cause,
                        r.solution_description,
                        r.repair_procedure,
                        r.status as repair_status,
                        r.repair_date,
                        r.created_at,
                        r.updated_at
                    FROM repairs r
                    LEFT JOIN error_logs el ON r.error_log_id = el.id
                    WHERE el.equipment_id IN (${eqIds})
                `);
            }
            
            // --- Get Spare Parts ---
            let spareParts = [];
            if (equipment.length > 0) {
                const eqIds = equipment.map(e => e.id).join(',');
                spareParts = await query(`
                    SELECT 
                        sp.id,
                        sp.repair_id,
                        sp.equipment_id,
                        sp.part_name,
                        sp.part_number,
                        sp.quantity,
                        sp.unit_cost,
                        sp.total_cost,
                        sp.status as part_status,
                        sp.created_at
                    FROM spare_parts sp
                    WHERE sp.equipment_id IN (${eqIds})
                `);
            }
            
            // ============================================
            // 3️⃣ CALCULATE STATS
            // ============================================
            
            // Equipment Stats
            const totalEquipment = equipment.length;
            const activeEquipment = equipment.filter(e => e.status === 'Active').length;
            const inactiveEquipment = equipment.filter(e => e.status === 'Inactive').length;
            const maintenanceEquipment = equipment.filter(e => e.status === 'Maintenance').length;
            
            // Error Stats - Fixed to handle multiple status values
            const resolvedStatuses = ['Resolved', 'Closed', 'Completed'];
            const pendingStatuses = ['Pending', 'Open'];
            const inProgressStatuses = ['In Progress', 'Assigned', 'Accepted'];
            
            const totalErrors = errors.length;
            const resolvedErrors = errors.filter(e => 
                resolvedStatuses.includes(e.status)
            ).length;
            const pendingErrors = errors.filter(e => 
                pendingStatuses.includes(e.status)
            ).length;
            const inProgressErrors = errors.filter(e => 
                inProgressStatuses.includes(e.status)
            ).length;
            
            // Priority Stats
            const criticalErrors = errors.filter(e => e.priority === 'Critical').length;
            const highPriorityErrors = errors.filter(e => e.priority === 'High').length;
            const mediumPriorityErrors = errors.filter(e => e.priority === 'Medium').length;
            const lowPriorityErrors = errors.filter(e => e.priority === 'Low').length;
            
            // Resolution Rate
            const resolutionRate = totalErrors > 0 
                ? Number(((resolvedErrors / totalErrors) * 100).toFixed(1))
                : 0;
            
            // ============================================
            // 4️⃣ DOWNTIME CALCULATION - IMPROVED
            // ============================================
            let downtimeHours = 0;
            let resolvedCount = 0;
            
            errors.forEach(e => {
                if (resolvedStatuses.includes(e.status)) {
                    resolvedCount++;
                    
                    // Start date: use error_date or created_at
                    const start = new Date(e.error_date || e.created_at);
                    
                    // End date: use updated_at, or created_at if not available
                    let end = new Date(e.updated_at || e.created_at);
                    
                    // ✅ FIX: If updated_at is before error_date, use fallback
                    if (end <= start) {
                        // Use 1 hour as estimated downtime
                        end = new Date(start);
                        end.setHours(end.getHours() + 1);
                    }
                    
                    if (end > start) {
                        const hours = (end - start) / (1000 * 60 * 60);
                        // Validate: less than 1 year, positive
                        if (hours > 0 && hours < 8760) {
                            downtimeHours += hours;
                        }
                    }
                }
            });
            
            // ============================================
            // 5️⃣ REPAIR STATS
            // ============================================
            const totalRepairs = repairs.length;
            const completedRepairs = repairs.filter(r => 
                ['Completed', 'Verified', 'Resolved'].includes(r.repair_status)
            ).length;
            
            // ============================================
            // 6️⃣ SPARE PARTS STATS
            // ============================================
            const totalSpareParts = spareParts.length;
            const sparePartsCost = spareParts.reduce((sum, sp) => sum + (parseFloat(sp.total_cost) || 0), 0);
            
            // ============================================
            // 7️⃣ AVAILABILITY CALCULATION
            // ============================================
            const totalPossibleHours = totalEquipment * 8760; // 365 days * 24 hours
            const availability = totalPossibleHours > 0 
                ? Number((Math.max(0, ((totalPossibleHours - downtimeHours) / totalPossibleHours) * 100)).toFixed(1))
                : 100;
            
            // ============================================
            // 8️⃣ BUILD RESPONSE
            // ============================================
            data.push({
                id: hospital.id,
                hospital_id: hospital.id,
                name: hospital.name,
                hospital_code: hospital.hospital_code || 'N/A',
                city: hospital.city || 'N/A',
                state: hospital.state || 'N/A',
                status: hospital.is_active ? 'Active' : 'Inactive',
                biomedical_head: hospital.biomedical_head || 'N/A',
                phone: hospital.phone || 'N/A',
                email: hospital.email || 'N/A',
                address: hospital.address || 'N/A',
                
                // Equipment
                total_equipment: totalEquipment,
                active_equipment: activeEquipment,
                inactive_equipment: inactiveEquipment,
                maintenance_equipment: maintenanceEquipment,
                retired_equipment: 0,
                
                // Errors
                total_errors: totalErrors,
                resolved_errors: resolvedErrors,
                pending_errors: pendingErrors,
                in_progress_errors: inProgressErrors,
                
                // Priority
                critical_errors: criticalErrors,
                high_priority_errors: highPriorityErrors,
                medium_priority_errors: mediumPriorityErrors,
                low_priority_errors: lowPriorityErrors,
                
                // Repairs
                total_repairs: totalRepairs,
                completed_repairs: completedRepairs,
                
                // Spare Parts
                total_spare_parts: totalSpareParts,
                spare_parts_cost: Number(sparePartsCost.toFixed(2)),
                
                // Performance
                resolution_rate: resolutionRate,
                total_downtime_hours: Number(downtimeHours.toFixed(1)),
                total_downtime_days: Number((downtimeHours / 24).toFixed(1)),
                availability_percentage: availability
            });
        }
        
        // ============================================
        // 9️⃣ SUMMARY STATS
        // ============================================
        const summary = {
            total_hospitals: data.length,
            total_equipment: data.reduce((sum, d) => sum + d.total_equipment, 0),
            total_errors: data.reduce((sum, d) => sum + d.total_errors, 0),
            total_resolved: data.reduce((sum, d) => sum + d.resolved_errors, 0),
            total_pending: data.reduce((sum, d) => sum + d.pending_errors, 0),
            total_critical: data.reduce((sum, d) => sum + d.critical_errors, 0),
            total_repairs: data.reduce((sum, d) => sum + d.total_repairs, 0),
            total_spare_parts: data.reduce((sum, d) => sum + d.total_spare_parts, 0),
            total_downtime_hours: Number(data.reduce((sum, d) => sum + d.total_downtime_hours, 0).toFixed(1)),
            total_downtime_days: Number((data.reduce((sum, d) => sum + d.total_downtime_hours, 0) / 24).toFixed(1)),
            avg_availability: data.length > 0 
                ? Number((data.reduce((sum, d) => sum + d.availability_percentage, 0) / data.length).toFixed(1))
                : 100,
            avg_resolution_rate: data.length > 0
                ? Number((data.reduce((sum, d) => sum + d.resolution_rate, 0) / data.length).toFixed(1))
                : 0
        };
        
        console.log('✅ Hospital report generated:', data.length, 'hospitals');
        console.log('📊 Summary:', summary);
        
        res.json({
            success: true,
            data: data,
            summary: summary,
            total: data.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Hospital report error:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to generate hospital report: ' + error.message
        });
    }
});

// ============================================
// ✅ MAINTENANCE + DOWNTIME COMBINED REPORT
// ============================================

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
                    AND el.priority = 'Critical'
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
                        SUM(TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)) 
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
        
        const processedData = data.map(item => {
            const downtimeHours = item.total_downtime_hours || 0;
            const downtimeDays = downtimeHours / 24;
            
            const ageDays = 365;
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
                    SELECT SUM(TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at))
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
// ✅ DOWNTIME REPORT (Standalone)
// ============================================

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
                    THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at) 
                    ELSE TIMESTAMPDIFF(HOUR, el.error_date, NOW()) 
                END) as total_downtime_hours,
                AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
                    THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at) 
                    ELSE TIMESTAMPDIFF(HOUR, el.error_date, NOW()) 
                END) as avg_downtime_hours,
                MIN(el.error_date) as first_downtime,
                MAX(el.error_date) as last_downtime,
                MAX(CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.error_date ELSE NULL END) as current_downtime_start
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE e.status != 'Inactive' 
            AND el.id IS NOT NULL
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            sql += ' AND el.error_date BETWEEN ? AND ?';
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
// ✅ SPARE PARTS REPORT - FIXED
// ============================================

router.get('/spare-parts', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, hospitalId, equipmentId, partName, status } = req.query;
        
        // ✅ FIXED: Get ALL spare parts with equipment info and downtime stats
        let sql = `
            SELECT 
                sp.id,
                sp.part_name,
                sp.part_number,
                sp.brand,
                sp.manufacturer,
                sp.quantity,
                sp.minimum_stock_level,
                sp.status as part_status,
                sp.unit_cost,
                sp.total_cost,
                sp.compatible_equipment,
                sp.times_used,
                sp.last_used_at,
                sp.times_out_of_stock,
                sp.first_out_of_stock,
                sp.last_back_in_stock,
                sp.total_downtime_hours,
                sp.total_downtime_days,
                sp.created_at,
                sp.updated_at,
                e.id as equipment_id,
                e.name as equipment_name,
                e.model as equipment_model,
                h.name as hospital_name,
                -- Count of equipment using this part
                (SELECT COUNT(*) FROM equipment WHERE compatible_equipment LIKE CONCAT('%', sp.part_name, '%')) as equipment_count
            FROM spare_parts sp
            LEFT JOIN equipment e ON sp.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            sql += ' AND sp.status = ?';
            params.push(status);
        }
        
        if (partName) {
            sql += ' AND sp.part_name LIKE ?';
            params.push(`%${partName}%`);
        }
        
        if (equipmentId) {
            sql += ' AND (sp.equipment_id = ? OR sp.compatible_equipment LIKE ?)';
            params.push(equipmentId, `%${equipmentId}%`);
        }
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        } else if (hospitalId) {
            sql += ' AND e.hospital_id = ?';
            params.push(hospitalId);
        }
        
        if (startDate && endDate) {
            sql += ' AND sp.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        sql += ' ORDER BY sp.status = "Out of Stock" DESC, sp.quantity ASC';
        
        const data = await query(sql, params);
        
        // Calculate summary stats
        const summary = {
            total_parts: data.length,
            out_of_stock: data.filter(sp => sp.part_status === 'Out of Stock').length,
            low_stock: data.filter(sp => sp.part_status === 'Low Stock').length,
            in_stock: data.filter(sp => sp.part_status === 'In Stock').length,
            total_downtime_hours: Number(data.reduce((sum, sp) => sum + (sp.total_downtime_hours || 0), 0)),
            total_downtime_days: Number((data.reduce((sum, sp) => sum + (sp.total_downtime_hours || 0), 0) / 24).toFixed(1)),
            total_cost: Number(data.reduce((sum, sp) => sum + (sp.total_cost || 0), 0).toFixed(2)),
            parts_used: data.filter(sp => sp.times_used > 0).length,
            total_quantity: data.reduce((sum, sp) => sum + (sp.quantity || 0), 0)
        };
        
        res.json({
            success: true,
            spareParts: data,
            summary,
            total: data.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Spare parts report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate spare parts report: ' + error.message
        });
    }
});

// ============================================
// ✅ COMPLETE DOWNTIME REPORT - FULL COVERAGE
// ============================================

/**
 * GET /api/reports/downtime-complete
 * Complete downtime report with Equipment, Hospital, Spare Parts, Maintenance
 * 
 * Query Parameters:
 *   - period: today | week | month | quarter | year
 *   - startDate: YYYY-MM-DD
 *   - endDate: YYYY-MM-DD
 *   - hospital_id: number
 *   - equipment_id: number
 *   - status: string (Active, Inactive, Maintenance, etc.)
 *   - severity: string (Critical, High, Medium, Low)
 *   - group_by: equipment | hospital | department | status
 */
router.get('/downtime-complete', authenticate, async (req, res) => {
    try {
        const {
            period = 'month',
            startDate,
            endDate,
            hospital_id,
            equipment_id,
            status,
            severity,
            group_by = 'equipment'
        } = req.query;

        console.log('📊 ===== COMPLETE DOWNTIME REPORT =====');
        console.log('📌 Period:', period);
        console.log('📌 Group By:', group_by);
        console.log('📌 Filters:', { startDate, endDate, hospital_id, equipment_id, status, severity });

        // ============================================
        // 1️⃣ BUILD DATE FILTERS
        // ============================================
        let dateFilter = '';
        let dateParams = [];
        const now = new Date();

        if (startDate && endDate) {
            dateFilter = 'AND DATE(el.error_date) BETWEEN ? AND ?';
            dateParams = [startDate, endDate];
        } else if (period === 'today') {
            const today = now.toISOString().split('T')[0];
            dateFilter = 'AND DATE(el.error_date) = ?';
            dateParams = [today];
        } else if (period === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - 7);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'month') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'quarter') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 3);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'year') {
            const start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else {
            // Default: monthly
            const start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        }

        // ============================================
        // 2️⃣ BUILD FILTERS
        // ============================================
        let hospitalFilter = '';
        let hospitalParams = [];
        if (hospital_id) {
            hospitalFilter = 'AND e.hospital_id = ?';
            hospitalParams = [parseInt(hospital_id)];
        }

        let equipmentFilter = '';
        let equipmentParams = [];
        if (equipment_id) {
            equipmentFilter = 'AND e.id = ?';
            equipmentParams = [parseInt(equipment_id)];
        }

        let statusFilter = '';
        let statusParams = [];
        if (status) {
            statusFilter = 'AND e.status = ?';
            statusParams = [status];
        }

        let severityFilter = '';
        let severityParams = [];
        if (severity) {
            severityFilter = 'AND el.priority = ?';
            severityParams = [severity];
        }

        // ============================================
        // 3️⃣ GET EQUIPMENT DOWNTIME DATA
        // ============================================
        const equipmentQuery = `
            SELECT 
                e.id,
                e.name as equipment_name,
                e.model,
                e.serial_number,
                e.status as current_status,
                e.installation_year,
                e.location,
                h.id as hospital_id,
                h.name as hospital_name,
                d.id as department_id,
                d.name as department_name,
                -- Error Stats
                COUNT(DISTINCT el.id) as total_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END) as resolved_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'Open') THEN el.id END) as pending_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('In Progress', 'Assigned') THEN el.id END) as in_progress_errors,
                -- Severity Stats
                COUNT(DISTINCT CASE WHEN el.priority = 'Critical' THEN el.id END) as critical_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'High' THEN el.id END) as high_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Medium' THEN el.id END) as medium_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Low' THEN el.id END) as low_errors,
                -- Downtime Calculation (hours)
                COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) as total_downtime_hours,
                -- Availability
                CASE 
                    WHEN COUNT(DISTINCT el.id) > 0 
                    THEN ROUND((1 - (COALESCE(SUM(
                        CASE 
                            WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                            AND el.error_date IS NOT NULL 
                            AND el.updated_at IS NOT NULL 
                            AND el.updated_at > el.error_date
                            THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                            WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                            AND el.error_date IS NOT NULL
                            THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                            ELSE 0
                        END
                    ), 0) / (COUNT(DISTINCT el.id) * 24)) * 100, 2)
                    ELSE 100
                END as availability_percentage,
                -- First and Last Error
                MIN(el.error_date) as first_error_date,
                MAX(el.error_date) as last_error_date,
                -- Current Error Status
                (SELECT status FROM error_logs WHERE equipment_id = e.id ORDER BY created_at DESC LIMIT 1) as current_error_status,
                -- Repair Stats
                COUNT(DISTINCT r.id) as total_repairs,
                COUNT(DISTINCT CASE WHEN r.status = 'Completed' THEN r.id END) as completed_repairs,
                -- Average Repair Time (days)
                COALESCE(AVG(
                    CASE 
                        WHEN r.repair_date IS NOT NULL AND r.created_at IS NOT NULL
                        AND r.repair_date > r.created_at
                        THEN DATEDIFF(r.repair_date, r.created_at)
                        ELSE NULL
                    END
                ), 0) as avg_repair_days,
                -- Spare Parts Used
                COUNT(DISTINCT sp.id) as spare_parts_used,
                COALESCE(SUM(sp.total_cost), 0) as spare_parts_cost
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            LEFT JOIN repairs r ON el.id = r.error_log_id
            LEFT JOIN spare_parts sp ON r.id = sp.repair_id
            WHERE 1=1
            ${dateFilter}
            ${hospitalFilter}
            ${equipmentFilter}
            ${statusFilter}
            ${severityFilter}
            GROUP BY e.id, e.name, e.model, e.serial_number, e.status, e.installation_year, e.location,
                     h.id, h.name, d.id, d.name
            ORDER BY total_downtime_hours DESC
        `;

        const equipmentData = await query(
            equipmentQuery,
            [...dateParams, ...hospitalParams, ...equipmentParams, ...statusParams, ...severityParams]
        );

        console.log(`✅ Equipment data: ${equipmentData.length} rows`);

        // ============================================
        // 4️⃣ GET HOSPITAL SUMMARY
        // ============================================
        const hospitalQuery = `
            SELECT 
                h.id,
                h.name as hospital_name,
                h.city,
                h.state,
                COUNT(DISTINCT e.id) as total_equipment,
                COUNT(DISTINCT el.id) as total_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END) as resolved_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Critical' THEN el.id END) as critical_errors,
                COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) as total_downtime_hours,
                ROUND(COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) / 24, 1) as total_downtime_days
            FROM hospitals h
            LEFT JOIN equipment e ON h.id = e.hospital_id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE h.is_active = 1
            ${hospital_id ? 'AND h.id = ?' : ''}
            GROUP BY h.id, h.name, h.city, h.state
            ORDER BY total_downtime_hours DESC
        `;

        const hospitalParams2 = hospital_id ? [parseInt(hospital_id)] : [];
        const hospitalData = await query(hospitalQuery, hospitalParams2);

        console.log(`✅ Hospital data: ${hospitalData.length} rows`);

        // ============================================
        // 5️⃣ GET MAINTENANCE DOWNTIME SUMMARY
        // ============================================
        const maintenanceQuery = `
            SELECT 
                COUNT(*) as total_maintenance,
                COUNT(CASE WHEN m.status = 'Overdue' OR m.next_due_date < CURDATE() THEN 1 END) as overdue_maintenance,
                COUNT(CASE WHEN m.status = 'In Progress' THEN 1 END) as in_progress_maintenance,
                COUNT(CASE WHEN m.status = 'Completed' THEN 1 END) as completed_maintenance,
                COUNT(CASE WHEN m.status = 'Scheduled' THEN 1 END) as scheduled_maintenance,
                COUNT(CASE WHEN m.priority = 'Critical' THEN 1 END) as critical_maintenance,
                COUNT(CASE WHEN m.priority = 'High' THEN 1 END) as high_maintenance,
                COUNT(CASE WHEN m.priority = 'Medium' THEN 1 END) as medium_maintenance,
                COUNT(CASE WHEN m.priority = 'Low' THEN 1 END) as low_maintenance,
                COALESCE(AVG(
                    CASE 
                        WHEN m.last_maintenance_date IS NOT NULL AND m.next_due_date IS NOT NULL
                        THEN DATEDIFF(m.next_due_date, m.last_maintenance_date)
                        ELSE NULL
                    END
                ), 0) as avg_maintenance_interval
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            WHERE 1=1
            ${hospital_id ? 'AND e.hospital_id = ?' : ''}
        `;

        const maintenanceParams = hospital_id ? [parseInt(hospital_id)] : [];
        const maintenanceData = await query(maintenanceQuery, maintenanceParams);

        console.log(`✅ Maintenance data:`, maintenanceData[0]);

        // ============================================
        // 6️⃣ GET SPARE PARTS DOWNTIME SUMMARY
        // ============================================
        const sparePartsQuery = `
            SELECT 
                COUNT(*) as total_spare_parts,
                COUNT(CASE WHEN sp.status = 'Out of Stock' THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN sp.status = 'Low Stock' THEN 1 END) as low_stock,
                COUNT(CASE WHEN sp.status = 'In Stock' THEN 1 END) as in_stock,
                COUNT(CASE WHEN sp.quantity <= 0 THEN 1 END) as zero_stock,
                COALESCE(AVG(sp.quantity), 0) as avg_quantity,
                COALESCE(SUM(sp.total_cost), 0) as total_inventory_value,
                COALESCE(AVG(sp.unit_cost), 0) as avg_unit_cost
            FROM spare_parts sp
            LEFT JOIN repairs r ON sp.repair_id = r.id
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1
            ${hospital_id ? 'AND e.hospital_id = ?' : ''}
        `;

        const sparePartsParams = hospital_id ? [parseInt(hospital_id)] : [];
        const sparePartsData = await query(sparePartsQuery, sparePartsParams);

        console.log(`✅ Spare parts data:`, sparePartsData[0]);

        // ============================================
        // 7️⃣ CALCULATE SUMMARY STATS
        // ============================================
        const totalEquipment = equipmentData.length;
        const totalErrors = equipmentData.reduce((sum, e) => sum + (e.total_errors || 0), 0);
        const totalResolved = equipmentData.reduce((sum, e) => sum + (e.resolved_errors || 0), 0);
        const totalCritical = equipmentData.reduce((sum, e) => sum + (e.critical_errors || 0), 0);
        const totalDowntimeHours = equipmentData.reduce((sum, e) => sum + (e.total_downtime_hours || 0), 0);
        const totalDowntimeDays = totalDowntimeHours / 24;
        const totalRepairs = equipmentData.reduce((sum, e) => sum + (e.total_repairs || 0), 0);
        const totalSpareParts = equipmentData.reduce((sum, e) => sum + (e.spare_parts_used || 0), 0);

        // Average Availability
        const avgAvailability = equipmentData.length > 0
            ? equipmentData.reduce((sum, e) => sum + (parseFloat(e.availability_percentage) || 0), 0) / equipmentData.length
            : 100;

        // ============================================
        // 8️⃣ BUILD RESPONSE
        // ============================================
        const response = {
            success: true,
            data: {
                // ✅ Equipment-wise downtime
                equipment: equipmentData.map(e => ({
                    ...e,
                    total_downtime_days: (e.total_downtime_hours / 24).toFixed(1),
                    availability_percentage: parseFloat(e.availability_percentage).toFixed(1),
                    total_errors: e.total_errors || 0,
                    resolved_errors: e.resolved_errors || 0,
                    pending_errors: e.pending_errors || 0,
                    in_progress_errors: e.in_progress_errors || 0,
                    critical_errors: e.critical_errors || 0,
                    high_errors: e.high_errors || 0,
                    medium_errors: e.medium_errors || 0,
                    low_errors: e.low_errors || 0,
                    total_repairs: e.total_repairs || 0,
                    completed_repairs: e.completed_repairs || 0,
                    avg_repair_days: parseFloat(e.avg_repair_days || 0).toFixed(1),
                    spare_parts_used: e.spare_parts_used || 0,
                    spare_parts_cost: parseFloat(e.spare_parts_cost || 0).toFixed(2)
                })),

                // ✅ Hospital-wise summary
                hospitals: hospitalData.map(h => ({
                    ...h,
                    total_downtime_days: (h.total_downtime_hours / 24).toFixed(1),
                    total_equipment: h.total_equipment || 0,
                    total_errors: h.total_errors || 0,
                    resolved_errors: h.resolved_errors || 0,
                    critical_errors: h.critical_errors || 0
                })),

                // ✅ Maintenance summary
                maintenance: maintenanceData[0] || {
                    total_maintenance: 0,
                    overdue_maintenance: 0,
                    in_progress_maintenance: 0,
                    completed_maintenance: 0,
                    scheduled_maintenance: 0,
                    critical_maintenance: 0,
                    high_maintenance: 0,
                    medium_maintenance: 0,
                    low_maintenance: 0,
                    avg_maintenance_interval: 0
                },

                // ✅ Spare Parts summary
                spare_parts: sparePartsData[0] || {
                    total_spare_parts: 0,
                    out_of_stock: 0,
                    low_stock: 0,
                    in_stock: 0,
                    zero_stock: 0,
                    avg_quantity: 0,
                    total_inventory_value: 0,
                    avg_unit_cost: 0
                },

                // ✅ Overall Summary
                summary: {
                    total_equipment: totalEquipment,
                    total_errors: totalErrors,
                    total_resolved: totalResolved,
                    total_critical: totalCritical,
                    total_downtime_hours: totalDowntimeHours.toFixed(1),
                    total_downtime_days: totalDowntimeDays.toFixed(1),
                    total_repairs: totalRepairs,
                    total_spare_parts_used: totalSpareParts,
                    avg_availability: avgAvailability.toFixed(1),
                    resolution_rate: totalErrors > 0 
                        ? ((totalResolved / totalErrors) * 100).toFixed(1)
                        : '0.0'
                }
            },
            filters: {
                period,
                startDate: startDate || null,
                endDate: endDate || null,
                hospital_id: hospital_id || null,
                equipment_id: equipment_id || null,
                status: status || null,
                severity: severity || null,
                group_by
            },
            generatedAt: new Date().toISOString()
        };

        console.log('✅ Complete downtime report generated!');
        console.log(`📊 Summary: ${totalEquipment} equipment, ${totalErrors} errors, ${totalDowntimeDays.toFixed(1)} days downtime`);

        res.json(response);

    } catch (error) {
        console.error('❌ Complete downtime report error:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to generate complete downtime report: ' + error.message
        });
    }
});

// ============================================================
// ✅ EXPORT DOWNTIME REPORT AS CSV
// ============================================================
router.get('/downtime-complete/export', authenticate, async (req, res) => {
    try {
        const { period, startDate, endDate, hospital_id, equipment_id, status, severity, format = 'csv' } = req.query;

        // ✅ Get the data using the same function
        const { query: dbQuery } = require('../config/database');

        // Build filters (same as above)
        let dateFilter = '';
        let dateParams = [];
        const now = new Date();

        if (startDate && endDate) {
            dateFilter = 'AND DATE(el.error_date) BETWEEN ? AND ?';
            dateParams = [startDate, endDate];
        } else if (period === 'today') {
            const today = now.toISOString().split('T')[0];
            dateFilter = 'AND DATE(el.error_date) = ?';
            dateParams = [today];
        } else if (period === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - 7);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'month') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'quarter') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 3);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'year') {
            const start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        }

        let hospitalFilter = '';
        let hospitalParams = [];
        if (hospital_id) {
            hospitalFilter = 'AND e.hospital_id = ?';
            hospitalParams = [parseInt(hospital_id)];
        }

        let equipmentFilter = '';
        let equipmentParams = [];
        if (equipment_id) {
            equipmentFilter = 'AND e.id = ?';
            equipmentParams = [parseInt(equipment_id)];
        }

        let statusFilter = '';
        let statusParams = [];
        if (status) {
            statusFilter = 'AND e.status = ?';
            statusParams = [status];
        }

        let severityFilter = '';
        let severityParams = [];
        if (severity) {
            severityFilter = 'AND el.priority = ?';
            severityParams = [severity];
        }

        // ✅ Get export data
        const exportQuery = `
            SELECT 
                e.name as Equipment,
                e.model as Model,
                e.serial_number as 'Serial Number',
                h.name as Hospital,
                d.name as Department,
                e.status as 'Current Status',
                COUNT(DISTINCT el.id) as 'Total Errors',
                COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END) as 'Resolved',
                COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'Open') THEN el.id END) as 'Pending',
                COUNT(DISTINCT CASE WHEN el.status IN ('In Progress', 'Assigned') THEN el.id END) as 'In Progress',
                COUNT(DISTINCT CASE WHEN el.priority = 'Critical' THEN el.id END) as 'Critical',
                COUNT(DISTINCT CASE WHEN el.priority = 'High' THEN el.id END) as 'High',
                COUNT(DISTINCT CASE WHEN el.priority = 'Medium' THEN el.id END) as 'Medium',
                COUNT(DISTINCT CASE WHEN el.priority = 'Low' THEN el.id END) as 'Low',
                ROUND(COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) / 24, 1) as 'Downtime (Days)',
                ROUND(
                    CASE 
                        WHEN COUNT(DISTINCT el.id) > 0 
                        THEN (1 - (COALESCE(SUM(
                            CASE 
                                WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                                AND el.error_date IS NOT NULL 
                                AND el.updated_at IS NOT NULL 
                                AND el.updated_at > el.error_date
                                THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                                WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                                AND el.error_date IS NOT NULL
                                THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                                ELSE 0
                            END
                        ), 0) / (COUNT(DISTINCT el.id) * 24)) * 100, 2)
                        ELSE 100
                    END, 1
                ) as 'Availability %',
                COUNT(DISTINCT r.id) as 'Total Repairs',
                COUNT(DISTINCT CASE WHEN r.status = 'Completed' THEN r.id END) as 'Completed Repairs',
                ROUND(COALESCE(AVG(
                    CASE 
                        WHEN r.repair_date IS NOT NULL AND r.created_at IS NOT NULL
                        AND r.repair_date > r.created_at
                        THEN DATEDIFF(r.repair_date, r.created_at)
                        ELSE NULL
                    END
                ), 0), 1) as 'Avg Repair Days',
                COUNT(DISTINCT sp.id) as 'Spare Parts Used',
                ROUND(COALESCE(SUM(sp.total_cost), 0), 2) as 'Spare Parts Cost'
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            LEFT JOIN repairs r ON el.id = r.error_log_id
            LEFT JOIN spare_parts sp ON r.id = sp.repair_id
            WHERE 1=1
            ${dateFilter}
            ${hospitalFilter}
            ${equipmentFilter}
            ${statusFilter}
            ${severityFilter}
            GROUP BY e.id, e.name, e.model, e.serial_number, e.status, h.name, d.name
            ORDER BY 'Downtime (Days)' DESC
        `;

        const data = await dbQuery(
            exportQuery,
            [...dateParams, ...hospitalParams, ...equipmentParams, ...statusParams, ...severityParams]
        );

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No data found for export'
            });
        }

        // ✅ Generate CSV
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
        ];
        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=downtime-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csv);

    } catch (error) {
        console.error('❌ Export downtime report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export downtime report: ' + error.message
        });
    }
});

// ============================================================
// ✅ GET DOWNTIME DASHBOARD STATS
// ============================================================
router.get('/downtime-dashboard', authenticate, async (req, res) => {
    try {
        const { hospital_id, period = 'month' } = req.query;

        const now = new Date();
        let dateFilter = '';
        let dateParams = [];

        if (period === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - 7);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'month') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'quarter') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 3);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'year') {
            const start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        }

        let hospitalFilter = '';
        let hospitalParams = [];
        if (hospital_id) {
            hospitalFilter = 'AND e.hospital_id = ?';
            hospitalParams = [parseInt(hospital_id)];
        }

        // ✅ Dashboard Stats
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT e.id) as total_equipment,
                COUNT(DISTINCT el.id) as total_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END) as resolved_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Critical' THEN el.id END) as critical_errors,
                COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) as total_downtime_hours,
                ROUND(COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) / 24, 1) as total_downtime_days,
                COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'Open') THEN el.id END) as pending_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('In Progress', 'Assigned') THEN el.id END) as in_progress_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'High' THEN el.id END) as high_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Medium' THEN el.id END) as medium_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Low' THEN el.id END) as low_errors
            FROM equipment e
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE 1=1
            ${dateFilter}
            ${hospitalFilter}
        `;

        const stats = await query(statsQuery, [...dateParams, ...hospitalParams]);

        // ✅ Top 5 Equipment with Most Downtime
        const topEquipmentQuery = `
            SELECT 
                e.name as equipment_name,
                e.model,
                h.name as hospital_name,
                COUNT(DISTINCT el.id) as total_errors,
                ROUND(COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) / 24, 1) as downtime_days
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE 1=1
            ${dateFilter}
            ${hospitalFilter}
            GROUP BY e.id, e.name, e.model, h.name
            ORDER BY downtime_days DESC
            LIMIT 5
        `;

        const topEquipment = await query(topEquipmentQuery, [...dateParams, ...hospitalParams]);

        // ✅ Daily Trend (last 30 days)
        const trendQuery = `
            SELECT 
                DATE(el.error_date) as date,
                COUNT(*) as errors,
                SUM(CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN el.priority = 'Critical' THEN 1 ELSE 0 END) as critical,
                ROUND(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ) / 24, 1) as downtime_days
            FROM error_logs el
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE DATE(el.error_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ${hospital_id ? 'AND e.hospital_id = ?' : ''}
            GROUP BY DATE(el.error_date)
            ORDER BY date ASC
        `;

        const trendParams = hospital_id ? [parseInt(hospital_id)] : [];
        const trendData = await query(trendQuery, trendParams);

        res.json({
            success: true,
            data: {
                stats: stats[0] || {
                    total_equipment: 0,
                    total_errors: 0,
                    resolved_errors: 0,
                    critical_errors: 0,
                    total_downtime_hours: 0,
                    total_downtime_days: 0,
                    pending_errors: 0,
                    in_progress_errors: 0,
                    high_errors: 0,
                    medium_errors: 0,
                    low_errors: 0
                },
                top_equipment: topEquipment,
                trend: trendData,
                resolution_rate: stats[0]?.total_errors > 0
                    ? ((stats[0].resolved_errors / stats[0].total_errors) * 100).toFixed(1)
                    : 0
            },
            filters: {
                period,
                hospital_id: hospital_id || null
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Downtime dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch downtime dashboard: ' + error.message
        });
    }
});

// ============================================================
// ✅ GET DOWNTIME BY HOSPITAL
// ============================================================
router.get('/downtime-by-hospital', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, period = 'month' } = req.query;

        const now = new Date();
        let dateFilter = '';
        let dateParams = [];

        if (startDate && endDate) {
            dateFilter = 'AND DATE(el.error_date) BETWEEN ? AND ?';
            dateParams = [startDate, endDate];
        } else if (period === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - 7);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'month') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'quarter') {
            const start = new Date(now);
            start.setMonth(now.getMonth() - 3);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        } else if (period === 'year') {
            const start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            dateFilter = 'AND DATE(el.error_date) >= ?';
            dateParams = [start.toISOString().split('T')[0]];
        }

        const querySql = `
            SELECT 
                h.id,
                h.name as hospital_name,
                h.city,
                h.state,
                COUNT(DISTINCT e.id) as total_equipment,
                COUNT(DISTINCT el.id) as total_errors,
                COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END) as resolved_errors,
                COUNT(DISTINCT CASE WHEN el.priority = 'Critical' THEN el.id END) as critical_errors,
                ROUND(COALESCE(SUM(
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0) / 24, 1) as total_downtime_days,
                ROUND(
                    CASE 
                        WHEN COUNT(DISTINCT el.id) > 0 
                        THEN (1 - (COALESCE(SUM(
                            CASE 
                                WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                                AND el.error_date IS NOT NULL 
                                AND el.updated_at IS NOT NULL 
                                AND el.updated_at > el.error_date
                                THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                                WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                                AND el.error_date IS NOT NULL
                                THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                                ELSE 0
                            END
                        ), 0) / (COUNT(DISTINCT el.id) * 24)) * 100, 2)
                        ELSE 100
                    END, 1
                ) as availability_percentage,
                ROUND(AVG(COALESCE(((
                    CASE 
                        WHEN el.status IN ('Resolved', 'Closed', 'Completed') 
                        AND el.error_date IS NOT NULL 
                        AND el.updated_at IS NOT NULL 
                        AND el.updated_at > el.error_date
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, el.updated_at)
                        WHEN el.status IN ('Pending', 'In Progress', 'Open') 
                        AND el.error_date IS NOT NULL
                        THEN TIMESTAMPDIFF(HOUR, el.error_date, NOW())
                        ELSE 0
                    END
                ), 0)), 1) as avg_downtime_hours
            FROM hospitals h
            LEFT JOIN equipment e ON h.id = e.hospital_id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE h.is_active = 1
            ${dateFilter}
            GROUP BY h.id, h.name, h.city, h.state
            ORDER BY total_downtime_days DESC
        `;

        const data = await query(querySql, dateParams);

        // Calculate summary
        const summary = {
            total_hospitals: data.length,
            total_equipment: data.reduce((sum, d) => sum + (d.total_equipment || 0), 0),
            total_errors: data.reduce((sum, d) => sum + (d.total_errors || 0), 0),
            total_resolved: data.reduce((sum, d) => sum + (d.resolved_errors || 0), 0),
            total_critical: data.reduce((sum, d) => sum + (d.critical_errors || 0), 0),
            total_downtime_days: data.reduce((sum, d) => sum + (parseFloat(d.total_downtime_days) || 0), 0).toFixed(1),
            avg_availability: data.length > 0
                ? (data.reduce((sum, d) => sum + (parseFloat(d.availability_percentage) || 0), 0) / data.length).toFixed(1)
                : 100
        };

        res.json({
            success: true,
            data,
            summary,
            total: data.length,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Downtime by hospital error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch downtime by hospital: ' + error.message
        });
    }
});

module.exports = router;