// backend/routes/reports.js
// ✅ FIXED: Removed status filter ambiguity

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================
// ✅ COMPLETE DOWNTIME REPORT - FIXED VERSION
// ============================================

router.get('/downtime-complete', authenticate, async (req, res) => {
    try {
        const {
            period = 'month',
            startDate,
            endDate,
            hospital_id,
            equipment_id,
            // status REMOVED - causing ambiguity
        } = req.query;

        console.log('📊 ===== COMPLETE DOWNTIME REPORT =====');
        console.log('📌 Period:', period);
        console.log('📌 Filters:', { startDate, endDate, hospital_id, equipment_id });

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

        // ✅ REMOVED: status filter (causing ambiguity)

        // ============================================
        // 3️⃣ MAIN QUERY
        // ============================================
        let sql = `
            SELECT 
                e.id,
                e.name as equipment_name,
                e.model,
                e.serial_number,
                e.status as current_status,
                e.installation_year,
                e.date_of_installation,
                e.location,
                h.id as hospital_id,
                h.name as hospital_name,
                d.name as department_name,
                COALESCE(COUNT(DISTINCT el.id), 0) as total_errors,
                COALESCE(COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END), 0) as resolved_errors,
                COALESCE(COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'Open') THEN el.id END), 0) as pending_errors,
                COALESCE(COUNT(DISTINCT CASE WHEN el.status IN ('In Progress', 'Assigned') THEN el.id END), 0) as in_progress_errors,
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
                MIN(el.error_date) as first_error_date,
                MAX(el.error_date) as last_error_date,
                (SELECT status FROM error_logs WHERE equipment_id = e.id ORDER BY created_at DESC LIMIT 1) as current_error_status,
                COALESCE((SELECT COUNT(*) FROM repairs WHERE equipment_id = e.id), 0) as total_repairs,
                COALESCE((SELECT COUNT(*) FROM repairs WHERE equipment_id = e.id AND status IN ('Completed', 'Verified')), 0) as completed_repairs,
                COALESCE((SELECT AVG(DATEDIFF(repair_date, created_at)) FROM repairs WHERE equipment_id = e.id AND status IN ('Completed', 'Verified') AND repair_date IS NOT NULL), 0) as avg_repair_days,
                COALESCE((SELECT COUNT(*) FROM spare_parts WHERE equipment_id = e.id), 0) as spare_parts_used,
                COALESCE((SELECT SUM(total_cost) FROM spare_parts WHERE equipment_id = e.id), 0) as spare_parts_cost
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN error_logs el ON e.id = el.equipment_id
            WHERE e.status != 'Inactive'
            ${dateFilter}
            ${hospitalFilter}
            ${equipmentFilter}
            GROUP BY e.id, e.name, e.model, e.serial_number, e.status, e.installation_year, e.date_of_installation, e.location, h.id, h.name, d.name
            ORDER BY e.name
        `;

        // Combine all params
        const allParams = [...dateParams, ...hospitalParams, ...equipmentParams];

        console.log('📊 Executing query...');
        console.log('📊 Params:', allParams);

        const equipmentData = await query(sql, allParams);

        console.log(`✅ Equipment data processed: ${equipmentData.length} rows`);

        // ============================================
        // 4️⃣ CALCULATE SUMMARY STATS
        // ============================================
        const totalEquipment = equipmentData.length;
        const totalErrors = equipmentData.reduce((sum, e) => sum + (parseInt(e.total_errors) || 0), 0);
        const totalResolved = equipmentData.reduce((sum, e) => sum + (parseInt(e.resolved_errors) || 0), 0);
        const totalDowntimeHours = equipmentData.reduce((sum, e) => sum + (parseFloat(e.total_downtime_hours) || 0), 0);
        const totalDowntimeDays = totalDowntimeHours / 24;
        const totalRepairs = equipmentData.reduce((sum, e) => sum + (parseInt(e.total_repairs) || 0), 0);
        const totalSpareParts = equipmentData.reduce((sum, e) => sum + (parseInt(e.spare_parts_used) || 0), 0);

        // Calculate average availability
        let avgAvailability = 100;
        if (equipmentData.length > 0) {
            let totalAvailability = 0;
            let count = 0;
            equipmentData.forEach(e => {
                const downtimeHours = parseFloat(e.total_downtime_hours) || 0;
                const ageInYears = 1;
                const monitoredHours = ageInYears * 365.25 * 24;
                const availability = monitoredHours > 0 
                    ? Math.max(0, Math.min(100, ((monitoredHours - downtimeHours) / monitoredHours) * 100))
                    : 100;
                totalAvailability += availability;
                count++;
            });
            avgAvailability = count > 0 ? totalAvailability / count : 100;
        }

        // Resolution rate
        const resolutionRate = totalErrors > 0 ? (totalResolved / totalErrors) * 100 : 0;

        // ============================================
        // 5️⃣ BUILD RESPONSE - WITH 2 DECIMAL PLACES
        // ============================================
        const response = {
            success: true,
            data: {
                equipment: equipmentData.map(e => ({
                    id: e.id,
                    equipment_name: e.equipment_name || 'N/A',
                    model: e.model || 'N/A',
                    serial_number: e.serial_number || 'N/A',
                    hospital_id: e.hospital_id || null,
                    hospital_name: e.hospital_name || 'N/A',
                    department_name: e.department_name || 'N/A',
                    current_status: e.current_status || 'Active',
                    installation_year: e.installation_year || null,
                    date_of_installation: e.date_of_installation || null,
                    location: e.location || 'N/A',
                    total_errors: parseInt(e.total_errors) || 0,
                    resolved_errors: parseInt(e.resolved_errors) || 0,
                    pending_errors: parseInt(e.pending_errors) || 0,
                    in_progress_errors: parseInt(e.in_progress_errors) || 0,
                    critical_errors: 0,
                    total_downtime_hours: parseFloat(e.total_downtime_hours || 0).toFixed(2),
                    total_downtime_days: (parseFloat(e.total_downtime_hours || 0) / 24).toFixed(2),
                    availability_percentage: (() => {
                        const downtimeHours = parseFloat(e.total_downtime_hours) || 0;
                        const ageInYears = 1;
                        const monitoredHours = ageInYears * 365.25 * 24;
                        const availability = monitoredHours > 0 
                            ? Math.max(0, Math.min(100, ((monitoredHours - downtimeHours) / monitoredHours) * 100))
                            : 100;
                        return availability.toFixed(1);
                    })(),
                    first_error_date: e.first_error_date || null,
                    last_error_date: e.last_error_date || null,
                    current_error_status: e.current_error_status || null,
                    total_repairs: parseInt(e.total_repairs) || 0,
                    completed_repairs: parseInt(e.completed_repairs) || 0,
                    avg_repair_days: parseFloat(e.avg_repair_days || 0).toFixed(1),
                    spare_parts_used: parseInt(e.spare_parts_used) || 0,
                    spare_parts_cost: parseFloat(e.spare_parts_cost || 0).toFixed(2)
                })),
                summary: {
                    total_equipment: totalEquipment,
                    total_errors: totalErrors,
                    total_resolved: totalResolved,
                    total_critical: 0,
                    total_downtime_hours: totalDowntimeHours.toFixed(2),
                    total_downtime_days: totalDowntimeDays.toFixed(2),
                    total_repairs: totalRepairs,
                    total_spare_parts_used: totalSpareParts,
                    avg_availability: avgAvailability.toFixed(1),
                    resolution_rate: resolutionRate.toFixed(1)
                }
            },
            filters: {
                period,
                startDate: startDate || null,
                endDate: endDate || null,
                hospital_id: hospital_id || null,
                equipment_id: equipment_id || null,
            },
            generatedAt: new Date().toISOString()
        };

        console.log('✅ Complete downtime report generated!');
        console.log(`📊 Summary: ${totalEquipment} equipment, ${totalErrors} errors, ${totalDowntimeDays.toFixed(2)} days downtime`);

        res.json(response);

    } catch (error) {
        console.error('❌ Complete downtime report error:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to generate complete downtime report: ' + error.message,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;