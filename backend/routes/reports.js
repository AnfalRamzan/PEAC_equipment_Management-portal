// backend/routes/reports.js
// ✅ IMPROVED: Uses actual installation date, merges overlapping errors,
//   calculates working-day downtime, optional include_inactive filter.
//   ✅ ADDED: availability_percentage back for functional status editing
//   ✅ ADDED: functional_status field (Functional/Non-Functional)

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================
// HELPER: Merge overlapping date ranges
// ============================================
const mergeDateRanges = (ranges) => {
  if (!ranges || ranges.length === 0) return [];
  // Sort by start date
  const sorted = ranges
    .map(r => ({ start: new Date(r.start), end: new Date(r.end) }))
    .filter(r => r.end >= r.start)
    .sort((a, b) => a.start - b.start);

  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= last.end) {
      // Overlap – extend if needed
      if (current.end > last.end) last.end = current.end;
    } else {
      merged.push(current);
    }
  }
  return merged;
};

// ============================================
// HELPER: Count working days (Mon-Fri) between two dates
// ============================================
const countWorkingDays = (start, end) => {
  let count = 0;
  const current = new Date(start);
  current.setHours(0,0,0,0);
  const endDate = new Date(end);
  endDate.setHours(23,59,59,999);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// ============================================
// COMPLETE DOWNTIME REPORT - IMPROVED
// ============================================
router.get('/downtime-complete', authenticate, async (req, res) => {
  try {
    const {
      period = 'month',
      startDate,
      endDate,
      hospital_id,
      equipment_id,
      include_inactive = 'false',
    } = req.query;

    console.log('📊 ===== COMPLETE DOWNTIME REPORT (IMPROVED) =====');
    console.log('📌 Period:', period);
    console.log('📌 Filters:', { startDate, endDate, hospital_id, equipment_id, include_inactive });

    // 1️⃣ BUILD DATE FILTERS (for error_logs)
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

    // 2️⃣ BUILD HOSPITAL/EQUIPMENT FILTERS
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

    // 3️⃣ INACTIVE FILTER
    let inactiveFilter = '';
    if (include_inactive !== 'true') {
      inactiveFilter = 'AND e.status != "Inactive"';
    }

    // ============================================
    // MAIN QUERY – fetch all equipment and their errors/repairs
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
        e.created_at as equipment_added_on,
        e.manufacturer,
        e.category_name,
        -- error & repair stats (for reference, not used for downtime calculation)
        COALESCE(COUNT(DISTINCT el.id), 0) as total_errors,
        COALESCE(COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed', 'Completed') THEN el.id END), 0) as resolved_errors,
        COALESCE(COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'Open') THEN el.id END), 0) as pending_errors,
        COALESCE(COUNT(DISTINCT CASE WHEN el.status IN ('In Progress', 'Assigned') THEN el.id END), 0) as in_progress_errors,
        COALESCE((SELECT COUNT(*) FROM repairs WHERE equipment_id = e.id), 0) as total_repairs,
        COALESCE((SELECT COUNT(*) FROM repairs WHERE equipment_id = e.id AND status IN ('Completed', 'Verified')), 0) as completed_repairs,
        COALESCE((SELECT COUNT(*) FROM spare_parts WHERE equipment_id = e.id), 0) as spare_parts_used
      FROM equipment e
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      WHERE 1=1
        ${inactiveFilter}
        ${dateFilter}
        ${hospitalFilter}
        ${equipmentFilter}
      GROUP BY e.id, e.name, e.model, e.serial_number, e.status, e.installation_year, e.date_of_installation, e.location, h.id, h.name, d.name, e.created_at, e.manufacturer, e.category_name
      ORDER BY e.name
    `;

    const allParams = [...dateParams, ...hospitalParams, ...equipmentParams];
    const equipmentData = await query(sql, allParams);

    console.log(`✅ Fetched ${equipmentData.length} equipment records.`);

    // ============================================
    // For each equipment, calculate unique downtime (working days) by merging its error periods
    // ============================================
    const enhancedEquipment = await Promise.all(equipmentData.map(async (eq) => {
      // Fetch all error_logs for this equipment that fall within the report period
      let errorSql = `
        SELECT error_date, updated_at, resolved_at, status
        FROM error_logs
        WHERE equipment_id = ?
          AND status IN ('Resolved', 'Closed', 'Completed')
          AND error_date IS NOT NULL
          AND (resolved_at IS NOT NULL OR updated_at IS NOT NULL)
          ${startDate && endDate ? 'AND DATE(error_date) BETWEEN ? AND ?' : ''}
          ${!startDate || !endDate ? dateFilter.replace('AND DATE(el.error_date)', '') : ''}
      `;
      let errorParams = [eq.id];
      if (startDate && endDate) {
        errorParams.push(startDate, endDate);
      } else {
        errorParams = [...errorParams, ...dateParams];
      }

      const errorRows = await query(errorSql, errorParams);

      // Build ranges (start = error_date, end = resolved_at or updated_at)
      const ranges = errorRows
        .filter(r => r.error_date && (r.resolved_at || r.updated_at))
        .map(r => {
          const start = new Date(r.error_date);
          const end = new Date(r.resolved_at || r.updated_at);
          return { start, end };
        })
        .filter(r => r.end >= r.start);

      // Merge overlapping ranges
      const mergedRanges = mergeDateRanges(ranges);

      // Calculate total downtime in working days (Mon-Fri)
      let totalDowntimeDays = 0;
      mergedRanges.forEach(range => {
        totalDowntimeDays += countWorkingDays(range.start, range.end);
      });

      // ============================================
      // Calculate availability based on actual installation date
      // ============================================
      let ageInYears = 1; // fallback
      if (eq.date_of_installation) {
        const installDate = new Date(eq.date_of_installation);
        if (!isNaN(installDate)) {
          ageInYears = Math.max(0, (Date.now() - installDate) / (365.25 * 24 * 60 * 60 * 1000));
        }
      } else if (eq.installation_year) {
        const year = parseInt(eq.installation_year);
        if (!isNaN(year)) {
          ageInYears = Math.max(0, (new Date().getFullYear() - year));
        }
      }
      if (ageInYears < 0.1) ageInYears = 1;

      const totalWorkingDaysInPeriod = Math.round(ageInYears * 260);
      const availableDays = Math.max(0, totalWorkingDaysInPeriod - totalDowntimeDays);
      const availability = totalWorkingDaysInPeriod > 0
        ? Math.max(0, Math.min(100, (availableDays / totalWorkingDaysInPeriod) * 100))
        : 100;

      // ✅ Determine functional status based on availability (threshold: 90%)
      const isFunctional = availability >= 90;

      // ✅ Check for functional override from database (if equipment has functional_override field)
      // If we add a functional_override column, we can use it here
      // For now, we'll use the calculated value
      let finalFunctionalStatus = isFunctional ? 'Functional' : 'Non-Functional';
      let finalAvailability = availability;

      // Optional: If equipment has a functional_override field, use it
      // This allows manual override of functional status
      // if (eq.functional_override !== null && eq.functional_override !== undefined) {
      //   finalFunctionalStatus = eq.functional_override === 1 ? 'Functional' : 'Non-Functional';
      //   // Keep availability as-is for reference
      // }

      return {
        ...eq,
        total_downtime_days: totalDowntimeDays,
        // ✅ KEPT: availability_percentage for editing purposes (but hidden from UI)
        availability_percentage: parseFloat(finalAvailability.toFixed(1)),
        // ✅ ADDED: functional_status
        functional_status: finalFunctionalStatus,
        // Internal use only
        _availability: finalAvailability,
      };
    }));

    // ============================================
    // SUMMARY STATS
    // ============================================
    const totalEquipment = enhancedEquipment.length;
    const totalErrors = enhancedEquipment.reduce((s, e) => s + (parseInt(e.total_errors) || 0), 0);
    const totalResolved = enhancedEquipment.reduce((s, e) => s + (parseInt(e.resolved_errors) || 0), 0);
    const totalDowntimeDays = enhancedEquipment.reduce((s, e) => s + (e.total_downtime_days || 0), 0);
    const totalRepairs = enhancedEquipment.reduce((s, e) => s + (parseInt(e.total_repairs) || 0), 0);
    const totalSpareParts = enhancedEquipment.reduce((s, e) => s + (parseInt(e.spare_parts_used) || 0), 0);

    // Count functional vs non-functional
    const functionalCount = enhancedEquipment.filter(e => e.functional_status === 'Functional').length;
    const nonFunctionalCount = totalEquipment - functionalCount;

    const avgAvailability = totalEquipment > 0
      ? enhancedEquipment.reduce((s, e) => s + (e._availability || 0), 0) / totalEquipment
      : 100;
    const resolutionRate = totalErrors > 0 ? (totalResolved / totalErrors) * 100 : 0;

    // ============================================
    // RESPONSE - WITH availability_percentage (for editing)
    // ============================================
    const response = {
      success: true,
      data: {
        equipment: enhancedEquipment.map(e => ({
          id: e.id,
          equipment_name: e.equipment_name || 'N/A',
          model: e.model || 'N/A',
          serial_number: e.serial_number || 'N/A',
          hospital_id: e.hospital_id || null,
          hospital_name: e.hospital_name || 'N/A',
          department_name: e.department_name || 'N/A',
          current_status: e.current_status || 'Active',
          location: e.location || 'N/A',
          equipment_added_on: e.equipment_added_on || null,
          manufacturer: e.manufacturer || 'N/A',
          category_name: e.category_name || 'N/A',
          total_errors: parseInt(e.total_errors) || 0,
          resolved_errors: parseInt(e.resolved_errors) || 0,
          pending_errors: parseInt(e.pending_errors) || 0,
          in_progress_errors: parseInt(e.in_progress_errors) || 0,
          total_repairs: parseInt(e.total_repairs) || 0,
          completed_repairs: parseInt(e.completed_repairs) || 0,
          spare_parts_used: parseInt(e.spare_parts_used) || 0,
          total_downtime_days: parseFloat(e.total_downtime_days).toFixed(2),
          // ✅ KEPT: availability_percentage (for functional status editing)
          availability_percentage: parseFloat(e.availability_percentage || 0),
          // ✅ ADDED: functional_status
          functional_status: e.functional_status,
        })),
        summary: {
          total_equipment: totalEquipment,
          functional_count: functionalCount,
          non_functional_count: nonFunctionalCount,
          total_errors: totalErrors,
          total_resolved: totalResolved,
          total_downtime_days: parseFloat(totalDowntimeDays).toFixed(2),
          total_repairs: totalRepairs,
          total_spare_parts_used: totalSpareParts,
          avg_availability: parseFloat(avgAvailability).toFixed(1),
          resolution_rate: parseFloat(resolutionRate).toFixed(1),
        }
      },
      filters: { period, startDate: startDate || null, endDate: endDate || null, hospital_id, equipment_id, include_inactive },
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Report generated successfully.');
    res.json(response);

  } catch (error) {
    console.error('❌ Report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report: ' + error.message,
    });
  }
});

module.exports = router;