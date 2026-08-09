// backend/services/reportService.js
const { query } = require('../config/database');

class ReportService {
  // ============================================================
  // ✅ ENGINEER REPORTS
  // ============================================================

  /**
   * Get errors reported by a specific engineer
   */
  async getEngineerErrors({ userId, startDate, endDate, status }) {
    let sql = `
      SELECT 
        el.id,
        el.error_title,
        el.error_code,
        el.severity,
        el.status,
        el.description,
        el.created_at,
        el.updated_at,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number,
        h.name as hospital_name,
        d.name as department_name,
        u.name as reported_by_name,
        (SELECT COUNT(*) FROM repairs WHERE error_log_id = el.id) as repair_count,
        (SELECT COUNT(*) FROM comments WHERE error_log_id = el.id) as comment_count
      FROM error_logs el
      LEFT JOIN equipment e ON el.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON el.reported_by = u.id
      WHERE el.reported_by = ?
    `;

    const params = [userId];

    if (startDate && endDate) {
      sql += ' AND el.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (status) {
      sql += ' AND el.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY el.created_at DESC';

    const data = await query(sql, params);

    // Get summary statistics
    const summary = await this.getErrorSummary(userId, startDate, endDate);

    return {
      data,
      total: data.length,
      summary
    };
  }

  /**
   * Get error summary for an engineer
   */
  async getErrorSummary(userId, startDate, endDate) {
    let sql = `
      SELECT 
        COUNT(*) as total_errors,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 1) as avg_resolution_hours,
        ROUND(MIN(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 1) as min_resolution_hours,
        ROUND(MAX(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 1) as max_resolution_hours
      FROM error_logs
      WHERE reported_by = ?
    `;

    const params = [userId];

    if (startDate && endDate) {
      sql += ' AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const result = await query(sql, params);
    return result[0] || {};
  }

  /**
   * Get repairs performed by an engineer
   */
  async getEngineerRepairs({ userId, startDate, endDate, status }) {
    let sql = `
      SELECT 
        r.id,
        r.root_cause,
        r.solution_description,
        r.time_taken,
        r.status,
        r.created_at,
        r.repair_date,
        r.completion_date,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number,
        h.name as hospital_name,
        d.name as department_name,
        el.error_title,
        el.error_code,
        el.severity as error_severity,
        u.name as reported_by_name,
        (SELECT COUNT(*) FROM spare_parts WHERE repair_id = r.id) as parts_count,
        (SELECT SUM(total_cost) FROM spare_parts WHERE repair_id = r.id) as total_parts_cost
      FROM repairs r
      LEFT JOIN error_logs el ON r.error_log_id = el.id
      LEFT JOIN equipment e ON el.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON el.reported_by = u.id
      WHERE r.engineer_id = ?
    `;

    const params = [userId];

    if (startDate && endDate) {
      sql += ' AND r.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';

    const data = await query(sql, params);

    // Get repair summary
    const summary = await this.getRepairSummary(userId, startDate, endDate);

    return {
      data,
      total: data.length,
      summary
    };
  }

  /**
   * Get repair summary for an engineer
   */
  async getRepairSummary(userId, startDate, endDate) {
    let sql = `
      SELECT 
        COUNT(*) as total_repairs,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed,
        ROUND(AVG(time_taken), 1) as avg_time_taken,
        ROUND(MIN(time_taken), 1) as min_time_taken,
        ROUND(MAX(time_taken), 1) as max_time_taken,
        ROUND(SUM(time_taken), 1) as total_time_taken,
        (SELECT COUNT(*) FROM spare_parts sp 
         JOIN repairs r ON sp.repair_id = r.id 
         WHERE r.engineer_id = ?) as total_parts_used,
        (SELECT SUM(sp.total_cost) FROM spare_parts sp 
         JOIN repairs r ON sp.repair_id = r.id 
         WHERE r.engineer_id = ?) as total_parts_cost
      FROM repairs
      WHERE engineer_id = ?
    `;

    const params = [userId, userId, userId];

    if (startDate && endDate) {
      sql = sql.replace('WHERE engineer_id = ?', 'WHERE engineer_id = ? AND created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    const result = await query(sql, params);
    return result[0] || {};
  }

  /**
   * Get equipment worked on by an engineer
   */
  async getEngineerEquipment(userId) {
    const sql = `
      SELECT DISTINCT
        e.id,
        e.name,
        e.model,
        e.manufacturer,
        e.serial_number,
        e.status as equipment_status,
        e.installation_year,
        e.last_maintenance_date,
        e.warranty_expiry,
        h.name as hospital_name,
        h.city as hospital_city,
        d.name as department_name,
        c.name as category_name,
        (SELECT COUNT(*) FROM error_logs WHERE equipment_id = e.id) as total_errors,
        (SELECT COUNT(*) FROM repairs r 
         LEFT JOIN error_logs el ON r.error_log_id = el.id 
         WHERE el.equipment_id = e.id AND r.engineer_id = ?) as my_repairs,
        (SELECT COUNT(*) FROM error_logs 
         WHERE equipment_id = e.id AND reported_by = ?) as my_reported_errors,
        (SELECT COUNT(*) FROM error_logs 
         WHERE equipment_id = e.id AND status IN ('Pending', 'In Progress')) as open_errors,
        (SELECT MAX(created_at) FROM error_logs WHERE equipment_id = e.id) as last_error_date,
        (SELECT MAX(repair_date) FROM repairs r 
         LEFT JOIN error_logs el ON r.error_log_id = el.id 
         WHERE el.equipment_id = e.id AND r.engineer_id = ?) as last_repair_date
      FROM equipment e
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      WHERE e.id IN (
        SELECT DISTINCT el.equipment_id 
        FROM error_logs el
        LEFT JOIN repairs r ON el.id = r.error_log_id
        WHERE r.engineer_id = ? OR el.reported_by = ?
      )
      AND e.status != 'Retired'
      ORDER BY e.name
    `;

    const data = await query(sql, [userId, userId, userId, userId, userId]);

    return {
      data,
      total: data.length
    };
  }

  /**
   * Get performance metrics for an engineer
   */
  async getEngineerPerformance({ userId, startDate, endDate }) {
    let dateFilter = '';
    const params = [userId];

    if (startDate && endDate) {
      dateFilter = ' AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get repair performance
    const repairPerformance = await query(`
      SELECT 
        COUNT(*) as total_repairs,
        ROUND(AVG(time_taken), 1) as avg_time_taken,
        ROUND(SUM(time_taken), 1) as total_time_taken,
        ROUND(AVG(CASE WHEN status = 'Completed' THEN time_taken ELSE NULL END), 1) as avg_completed_time,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_repairs,
        COUNT(CASE WHEN status = 'Failed' THEN 1 END) as failed_repairs,
        ROUND(COUNT(CASE WHEN status = 'Completed' THEN 1 END) * 100.0 / COUNT(*), 1) as success_rate
      FROM repairs
      WHERE engineer_id = ?${dateFilter}
    `, params);

    // Get error resolution performance
    const errorPerformance = await query(`
      SELECT 
        COUNT(*) as total_errors,
        COUNT(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 END) as resolved_errors,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_errors,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_errors,
        ROUND(AVG(CASE WHEN status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, created_at, updated_at) 
          ELSE NULL END), 1) as avg_resolution_hours,
        ROUND(COUNT(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 END) * 100.0 / COUNT(*), 1) as resolution_rate
      FROM error_logs
      WHERE reported_by = ?${dateFilter}
    `, params);

    // Get daily activity
    const dailyActivity = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activities,
        COUNT(CASE WHEN type = 'repair' THEN 1 END) as repairs,
        COUNT(CASE WHEN type = 'error' THEN 1 END) as errors
      FROM (
        SELECT created_at, 'repair' as type FROM repairs WHERE engineer_id = ?${dateFilter}
        UNION ALL
        SELECT created_at, 'error' as type FROM error_logs WHERE reported_by = ?${dateFilter}
      ) activities
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [userId, userId]);

    // Get monthly trends
    const monthlyTrends = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'repair' THEN 1 END) as repairs,
        COUNT(CASE WHEN type = 'error' THEN 1 END) as errors
      FROM (
        SELECT created_at, 'repair' as type FROM repairs WHERE engineer_id = ?${dateFilter}
        UNION ALL
        SELECT created_at, 'error' as type FROM error_logs WHERE reported_by = ?${dateFilter}
      ) activities
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `, [userId, userId]);

    return {
      repair_performance: repairPerformance[0] || {},
      error_performance: errorPerformance[0] || {},
      daily_activity: dailyActivity,
      monthly_trends: monthlyTrends
    };
  }

  /**
   * Get pending tasks for an engineer
   */
  async getEngineerPendingTasks(userId) {
    const sql = `
      SELECT 
        'error' as task_type,
        el.id as task_id,
        el.error_title as title,
        el.severity,
        el.status,
        el.created_at,
        e.name as equipment_name,
        e.model as equipment_model,
        h.name as hospital_name,
        'Reported by me' as assignment_type
      FROM error_logs el
      LEFT JOIN equipment e ON el.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      WHERE el.reported_by = ?
        AND el.status IN ('Pending', 'In Progress')
      
      UNION ALL
      
      SELECT 
        'repair' as task_type,
        r.id as task_id,
        CONCAT('Repair: ', el.error_title) as title,
        el.severity,
        r.status,
        r.created_at,
        e.name as equipment_name,
        e.model as equipment_model,
        h.name as hospital_name,
        'Assigned to me' as assignment_type
      FROM repairs r
      LEFT JOIN error_logs el ON r.error_log_id = el.id
      LEFT JOIN equipment e ON el.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      WHERE r.engineer_id = ?
        AND r.status IN ('Pending', 'In Progress')
      
      ORDER BY created_at DESC
    `;

    const data = await query(sql, [userId, userId]);

    return {
      data,
      total: data.length
    };
  }

  /**
   * Generic engineer report getter
   */
  async getEngineerReport({ type, userId, startDate, endDate }) {
    switch (type) {
      case 'my-errors':
        return this.getEngineerErrors({ userId, startDate, endDate });
      case 'my-repairs':
        return this.getEngineerRepairs({ userId, startDate, endDate });
      case 'my-equipment':
        return this.getEngineerEquipment(userId);
      case 'my-performance':
        return this.getEngineerPerformance({ userId, startDate, endDate });
      case 'my-pending-tasks':
        return this.getEngineerPendingTasks(userId);
      default:
        throw new Error('Invalid engineer report type');
    }
  }

  // ============================================================
  // ✅ ADMIN REPORT GENERATION
  // ============================================================

  /**
   * Generate comprehensive report based on type
   */
  async generateReport({ type, startDate, endDate, hospitalId, equipmentId, departmentId, user }) {
    let data = [];
    let params = [];
    let whereClause = '';
    let summary = {};

    // Build base filters
    const filterBuilder = this.buildFilters({
      startDate,
      endDate,
      hospitalId,
      equipmentId,
      departmentId,
      user
    });

    whereClause = filterBuilder.whereClause;
    params = filterBuilder.params;

    switch (type) {
      case 'monthly':
        data = await this.generateMonthlyReport({ whereClause, params });
        summary = this.calculateMonthlySummary(data);
        break;

      case 'hospital':
        data = await this.generateHospitalReport({ whereClause, params, hospitalId, user });
        summary = this.calculateHospitalSummary(data);
        break;

      case 'equipment':
        data = await this.generateEquipmentReport({ whereClause, params, equipmentId });
        summary = this.calculateEquipmentSummary(data);
        break;

      case 'department':
        data = await this.generateDepartmentReport({ whereClause, params, departmentId });
        summary = this.calculateDepartmentSummary(data);
        break;

      case 'failure-frequency':
        data = await this.generateFailureFrequencyReport({ whereClause, params });
        summary = this.calculateFailureFrequencySummary(data);
        break;

      case 'spare-parts':
        data = await this.generateSparePartsReport({ whereClause, params });
        summary = this.calculateSparePartsSummary(data);
        break;

      case 'maintenance':
        data = await this.generateMaintenanceReport({ whereClause, params });
        summary = this.calculateMaintenanceSummary(data);
        break;

      case 'downtime':
        data = await this.generateDowntimeReport({ whereClause, params });
        summary = this.calculateDowntimeSummary(data);
        break;

      default:
        throw new Error('Invalid report type');
    }

    return {
      data,
      summary,
      total: data.length
    };
  }

  // ============================================================
  // ✅ HELPER METHODS
  // ============================================================

  buildFilters({ startDate, endDate, hospitalId, equipmentId, departmentId, user }) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause += ' AND el.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (user?.role_name !== 'SUPER_ADMIN') {
      whereClause += ' AND e.hospital_id = ?';
      params.push(user?.hospital_id);
    } else if (hospitalId) {
      whereClause += ' AND e.hospital_id = ?';
      params.push(hospitalId);
    }

    if (equipmentId) {
      whereClause += ' AND el.equipment_id = ?';
      params.push(equipmentId);
    }

    if (departmentId) {
      whereClause += ' AND e.department_id = ?';
      params.push(departmentId);
    }

    return { whereClause, params };
  }

  // ============================================================
  // ✅ SUMMARY CALCULATORS
  // ============================================================

  calculateMonthlySummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_errors: data.reduce((sum, d) => sum + (d.total_errors || 0), 0),
      total_resolved: data.reduce((sum, d) => sum + (d.resolved_errors || 0), 0),
      total_open: data.reduce((sum, d) => sum + (d.open_errors || 0), 0),
      avg_resolution_hours: data.reduce((sum, d) => sum + (d.avg_resolution_hours || 0), 0) / data.length,
      months: data.length
    };
  }

  calculateHospitalSummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_errors: data.reduce((sum, d) => sum + (d.total_errors || 0), 0),
      total_resolved: data.reduce((sum, d) => sum + (d.resolved_errors || 0), 0),
      total_open: data.reduce((sum, d) => sum + (d.open_errors || 0), 0),
      total_equipment: data.reduce((sum, d) => sum + (d.affected_equipment || 0), 0),
      hospitals: data.length
    };
  }

  calculateEquipmentSummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_errors: data.reduce((sum, d) => sum + (d.total_errors || 0), 0),
      total_resolved: data.reduce((sum, d) => sum + (d.resolved_errors || 0), 0),
      total_open: data.reduce((sum, d) => sum + (d.open_errors || 0), 0),
      equipment_count: data.length
    };
  }

  calculateDepartmentSummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_errors: data.reduce((sum, d) => sum + (d.total_errors || 0), 0),
      total_resolved: data.reduce((sum, d) => sum + (d.resolved_errors || 0), 0),
      total_open: data.reduce((sum, d) => sum + (d.open_errors || 0), 0),
      departments: data.length
    };
  }

  calculateFailureFrequencySummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_equipment: data.length,
      total_errors: data.reduce((sum, d) => sum + (d.error_count || 0), 0),
      avg_errors_per_day: data.reduce((sum, d) => sum + (d.errors_per_day || 0), 0) / data.length
    };
  }

  calculateSparePartsSummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_parts: data.length,
      total_quantity: data.reduce((sum, d) => sum + (d.total_quantity_used || 0), 0),
      total_cost: data.reduce((sum, d) => sum + (d.total_cost || 0), 0)
    };
  }

  calculateMaintenanceSummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_schedules: data.length,
      overdue: data.filter(d => d.days_until_due < 0).length,
      due_soon: data.filter(d => d.days_until_due >= 0 && d.days_until_due <= 7).length
    };
  }

  calculateDowntimeSummary(data) {
    if (!data || data.length === 0) return {};
    return {
      total_equipment: data.length,
      total_downtime_hours: data.reduce((sum, d) => sum + (d.total_downtime_hours || 0), 0),
      avg_downtime_hours: data.reduce((sum, d) => sum + (d.total_downtime_hours || 0), 0) / data.length
    };
  }

  // ============================================================
  // ✅ REPORT GENERATORS (Admin)
  // ============================================================

  async generateMonthlyReport({ whereClause, params }) {
    return await query(`
      SELECT 
        DATE_FORMAT(el.created_at, '%Y-%m') as month,
        DATE_FORMAT(el.created_at, '%b %Y') as month_label,
        COUNT(*) as total_errors,
        SUM(CASE WHEN el.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_errors,
        SUM(CASE WHEN el.status IN ('Pending', 'In Progress') THEN 1 ELSE 0 END) as open_errors,
        ROUND(AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
          ELSE NULL END), 1) as avg_resolution_hours,
        COUNT(DISTINCT el.equipment_id) as affected_equipment
      FROM error_logs el
      LEFT JOIN equipment e ON el.equipment_id = e.id
      WHERE 1=1 ${whereClause}
      GROUP BY DATE_FORMAT(el.created_at, '%Y-%m')
      ORDER BY month ASC
    `, params);
  }

  async generateHospitalReport({ whereClause, params, hospitalId, user }) {
    let sql = `
      SELECT 
        h.id,
        h.name as hospital_name,
        h.city,
        COUNT(DISTINCT el.id) as total_errors,
        COUNT(DISTINCT e.id) as affected_equipment,
        COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.id END) as open_errors,
        COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed') THEN el.id END) as resolved_errors,
        COUNT(DISTINCT u.id) as engineer_count,
        ROUND(AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
          ELSE NULL END), 1) as avg_resolution_hours
      FROM hospitals h
      LEFT JOIN equipment e ON h.id = e.hospital_id AND e.status != 'Retired'
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      LEFT JOIN users u ON h.id = u.hospital_id AND u.is_active = TRUE
      WHERE h.is_active = TRUE
    `;

    if (hospitalId) {
      sql += ' AND h.id = ?';
    } else if (user?.role_name !== 'SUPER_ADMIN') {
      sql += ' AND h.id = ?';
      params.push(user?.hospital_id);
    }

    sql += ' GROUP BY h.id ORDER BY total_errors DESC';

    return await query(sql, params);
  }

  async generateEquipmentReport({ whereClause, params, equipmentId }) {
    let sql = `
      SELECT 
        e.id,
        e.name as equipment_name,
        e.model,
        e.manufacturer,
        e.serial_number,
        c.name as category_name,
        h.name as hospital_name,
        d.name as department_name,
        COUNT(DISTINCT el.id) as total_errors,
        COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.id END) as open_errors,
        COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed') THEN el.id END) as resolved_errors,
        MAX(el.created_at) as last_error_date,
        ROUND(AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
          ELSE NULL END), 1) as avg_resolution_hours
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      WHERE e.status != 'Retired'
    `;

    if (equipmentId) {
      sql += ' AND e.id = ?';
    }

    sql += ' GROUP BY e.id ORDER BY total_errors DESC LIMIT 100';

    return await query(sql, params);
  }

  async generateDepartmentReport({ whereClause, params, departmentId }) {
    let sql = `
      SELECT 
        d.id,
        d.name as department_name,
        h.name as hospital_name,
        COUNT(DISTINCT e.id) as equipment_count,
        COUNT(DISTINCT el.id) as total_errors,
        COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.id END) as open_errors,
        COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed') THEN el.id END) as resolved_errors,
        ROUND(AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
          ELSE NULL END), 1) as avg_resolution_hours
      FROM departments d
      LEFT JOIN equipment e ON d.id = e.department_id AND e.status != 'Retired'
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      LEFT JOIN hospitals h ON d.hospital_id = h.id
      WHERE 1=1
    `;

    if (departmentId) {
      sql += ' AND d.id = ?';
    }

    sql += ' GROUP BY d.id ORDER BY total_errors DESC';

    return await query(sql, params);
  }

  async generateFailureFrequencyReport({ whereClause, params }) {
    return await query(`
      SELECT 
        e.id,
        e.name as equipment_name,
        e.model,
        e.manufacturer,
        h.name as hospital_name,
        COUNT(el.id) as error_count,
        COUNT(DISTINCT DATE(el.created_at)) as days_with_errors,
        ROUND(COUNT(el.id) / NULLIF(COUNT(DISTINCT DATE(el.created_at)), 0), 1) as errors_per_day,
        MIN(el.created_at) as first_error_date,
        MAX(el.created_at) as last_error_date,
        (SELECT error_title FROM error_logs WHERE equipment_id = e.id GROUP BY error_title ORDER BY COUNT(*) DESC LIMIT 1) as most_common_error,
        COUNT(DISTINCT el.error_title) as unique_error_types
      FROM equipment e
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      WHERE e.status != 'Retired' ${whereClause}
      GROUP BY e.id
      HAVING error_count > 0
      ORDER BY error_count DESC
      LIMIT 50
    `, params);
  }

  async generateSparePartsReport({ whereClause, params }) {
    return await query(`
      SELECT 
        sp.id,
        sp.part_name,
        sp.part_number,
        sp.brand,
        sp.manufacturer,
        COUNT(DISTINCT sp.repair_id) as usage_count,
        SUM(sp.quantity) as total_quantity_used,
        AVG(sp.unit_cost) as avg_unit_cost,
        SUM(sp.total_cost) as total_cost,
        e.name as equipment_name,
        h.name as hospital_name,
        MAX(sp.created_at) as last_used_date
      FROM spare_parts sp
      LEFT JOIN repairs r ON sp.repair_id = r.id
      LEFT JOIN error_logs el ON r.error_log_id = el.id
      LEFT JOIN equipment e ON el.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      WHERE 1=1 ${whereClause}
      GROUP BY sp.id
      ORDER BY usage_count DESC, total_cost DESC
      LIMIT 100
    `, params);
  }

  async generateMaintenanceReport({ whereClause, params }) {
    return await query(`
      SELECT 
        ms.id,
        e.name as equipment_name,
        e.model,
        e.serial_number,
        h.name as hospital_name,
        ms.maintenance_type,
        ms.frequency,
        ms.last_maintenance_date,
        ms.next_due_date,
        ms.status,
        DATEDIFF(ms.next_due_date, CURDATE()) as days_until_due,
        ms.maintenance_checklist,
        ms.calibration_date,
        ms.warranty_expiry,
        ms.amc_details
      FROM maintenance_schedule ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      WHERE 1=1 ${whereClause}
      ORDER BY ms.next_due_date ASC
    `, params);
  }

  async generateDowntimeReport({ whereClause, params }) {
    return await query(`
      SELECT 
        e.id,
        e.name as equipment_name,
        e.model,
        e.manufacturer,
        h.name as hospital_name,
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
        MAX(el.created_at) as last_downtime
      FROM equipment e
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      WHERE e.status != 'Retired' AND el.id IS NOT NULL ${whereClause}
      GROUP BY e.id
      ORDER BY total_downtime_hours DESC
      LIMIT 50
    `, params);
  }

  /**
   * Get monthly report with summary
   */
  async getMonthlyReport({ year, month, user }) {
    const targetYear = year || new Date().getFullYear();
    let whereClause = ' AND YEAR(el.created_at) = ?';
    let params = [targetYear];

    if (month) {
      whereClause += ' AND MONTH(el.created_at) = ?';
      params.push(month);
    }

    if (user?.role_name !== 'SUPER_ADMIN') {
      whereClause += ' AND e.hospital_id = ?';
      params.push(user?.hospital_id);
    }

    const data = await query(`
      SELECT 
        MONTH(el.created_at) as month,
        YEAR(el.created_at) as year,
        COUNT(*) as total_errors,
        SUM(CASE WHEN el.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_errors,
        SUM(CASE WHEN el.status IN ('Pending', 'In Progress') THEN 1 ELSE 0 END) as open_errors,
        ROUND(AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
          ELSE NULL END), 1) as avg_resolution_hours
      FROM error_logs el
      LEFT JOIN equipment e ON el.equipment_id = e.id
      WHERE 1=1 ${whereClause}
      GROUP BY YEAR(el.created_at), MONTH(el.created_at)
      ORDER BY year DESC, month DESC
    `, params);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = data.map(item => ({
      ...item,
      month_name: monthNames[item.month - 1],
      total_errors: parseInt(item.total_errors),
      resolved_errors: parseInt(item.resolved_errors),
      open_errors: parseInt(item.open_errors),
      avg_resolution_hours: parseFloat(item.avg_resolution_hours) || 0
    }));

    const summary = {
      total_errors: formattedData.reduce((sum, d) => sum + d.total_errors, 0),
      total_resolved: formattedData.reduce((sum, d) => sum + d.resolved_errors, 0),
      total_open: formattedData.reduce((sum, d) => sum + d.open_errors, 0),
      avg_resolution_hours: formattedData.reduce((sum, d) => sum + d.avg_resolution_hours, 0) / (formattedData.length || 1)
    };

    return {
      data: formattedData,
      summary,
      total: formattedData.length,
      year: targetYear,
      month: month || 'All'
    };
  }

  // ============================================================
  // ✅ ADVANCED ANALYTICS (Admin only)
  // ============================================================

  async getEquipmentFailureRate({ startDate, endDate, hospitalId, user }) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause += ' AND el.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (user?.role_name !== 'SUPER_ADMIN') {
      whereClause += ' AND e.hospital_id = ?';
      params.push(user?.hospital_id);
    } else if (hospitalId) {
      whereClause += ' AND e.hospital_id = ?';
      params.push(hospitalId);
    }

    const data = await query(`
      SELECT 
        e.id,
        e.name as equipment_name,
        e.model,
        e.manufacturer,
        h.name as hospital_name,
        COUNT(el.id) as total_errors,
        AVG(TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at)) as avg_repair_time,
        COUNT(DISTINCT el.severity) as severity_types,
        SUM(CASE WHEN el.severity = 'Critical' THEN 1 ELSE 0 END) as critical_errors,
        SUM(CASE WHEN el.severity = 'High' THEN 1 ELSE 0 END) as high_errors,
        SUM(CASE WHEN el.severity = 'Medium' THEN 1 ELSE 0 END) as medium_errors,
        SUM(CASE WHEN el.severity = 'Low' THEN 1 ELSE 0 END) as low_errors
      FROM equipment e
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      WHERE e.status != 'Retired' AND el.id IS NOT NULL ${whereClause}
      GROUP BY e.id
      ORDER BY total_errors DESC
      LIMIT 50
    `, params);

    const summary = {
      total_equipment: data.length,
      total_errors: data.reduce((sum, d) => sum + d.total_errors, 0),
      critical_errors: data.reduce((sum, d) => sum + d.critical_errors, 0),
      high_errors: data.reduce((sum, d) => sum + d.high_errors, 0)
    };

    return { data, summary, total: data.length };
  }

  async getEngineerPerformanceAnalytics({ startDate, endDate, hospitalId, user }) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause += ' AND r.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (user?.role_name !== 'SUPER_ADMIN') {
      whereClause += ' AND e.hospital_id = ?';
      params.push(user?.hospital_id);
    } else if (hospitalId) {
      whereClause += ' AND e.hospital_id = ?';
      params.push(hospitalId);
    }

    const data = await query(`
      SELECT 
        u.id as engineer_id,
        u.name as engineer_name,
        u.email,
        COUNT(DISTINCT r.id) as total_repairs,
        AVG(r.time_taken) as avg_time_taken,
        SUM(r.time_taken) as total_time_taken,
        COUNT(CASE WHEN r.status = 'Completed' THEN 1 END) as completed_repairs,
        ROUND(COUNT(CASE WHEN r.status = 'Completed' THEN 1 END) * 100.0 / COUNT(r.id), 1) as success_rate,
        COUNT(DISTINCT el.id) as errors_handled,
        COUNT(DISTINCT e.id) as equipment_serviced
      FROM users u
      LEFT JOIN repairs r ON u.id = r.engineer_id
      LEFT JOIN error_logs el ON r.error_log_id = el.id
      LEFT JOIN equipment e ON el.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      WHERE u.role_name = 'ENGINEER' AND r.id IS NOT NULL ${whereClause}
      GROUP BY u.id
      ORDER BY total_repairs DESC
    `, params);

    const summary = {
      total_engineers: data.length,
      total_repairs: data.reduce((sum, d) => sum + d.total_repairs, 0),
      avg_success_rate: data.reduce((sum, d) => sum + d.success_rate, 0) / (data.length || 1)
    };

    return { data, summary, total: data.length };
  }

  async getDowntimeAnalysis({ startDate, endDate, hospitalId, user }) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause += ' AND el.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (user?.role_name !== 'SUPER_ADMIN') {
      whereClause += ' AND e.hospital_id = ?';
      params.push(user?.hospital_id);
    } else if (hospitalId) {
      whereClause += ' AND e.hospital_id = ?';
      params.push(hospitalId);
    }

    const data = await query(`
      SELECT 
        e.id,
        e.name as equipment_name,
        e.model,
        h.name as hospital_name,
        COUNT(el.id) as downtime_events,
        SUM(TIMESTAMPDIFF(HOUR, el.created_at, COALESCE(el.updated_at, NOW()))) as total_downtime_hours,
        AVG(TIMESTAMPDIFF(HOUR, el.created_at, COALESCE(el.updated_at, NOW()))) as avg_downtime_hours,
        MIN(el.created_at) as first_downtime,
        MAX(el.created_at) as last_downtime,
        AVG(TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at)) as avg_repair_time
      FROM equipment e
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      WHERE e.status != 'Retired' AND el.id IS NOT NULL ${whereClause}
      GROUP BY e.id
      HAVING total_downtime_hours > 0
      ORDER BY total_downtime_hours DESC
      LIMIT 50
    `, params);

    const summary = {
      total_equipment: data.length,
      total_downtime_hours: data.reduce((sum, d) => sum + d.total_downtime_hours, 0),
      avg_downtime_hours: data.reduce((sum, d) => sum + d.avg_downtime_hours, 0) / (data.length || 1)
    };

    return { data, summary, total: data.length };
  }

  async getSparePartsUsageAnalytics({ startDate, endDate, hospitalId, user }) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause += ' AND sp.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (user?.role_name !== 'SUPER_ADMIN') {
      whereClause += ' AND e.hospital_id = ?';
      params.push(user?.hospital_id);
    } else if (hospitalId) {
      whereClause += ' AND e.hospital_id = ?';
      params.push(hospitalId);
    }

    const data = await query(`
      SELECT 
        sp.part_name,
        sp.part_number,
        sp.brand,
        sp.manufacturer,
        COUNT(sp.id) as usage_count,
        SUM(sp.quantity) as total_quantity,
        AVG(sp.unit_cost) as avg_unit_cost,
        SUM(sp.total_cost) as total_cost,
        COUNT(DISTINCT sp.repair_id) as repair_count,
        COUNT(DISTINCT e.id) as equipment_count,
        h.name as hospital_name
      FROM spare_parts sp
      LEFT JOIN repairs r ON sp.repair_id = r.id
      LEFT JOIN error_logs el ON r.error_log_id = el.id
      LEFT JOIN equipment e ON el.equipment_id = e.id
      LEFT JOIN hospitals h ON e.hospital_id = h.id
      WHERE 1=1 ${whereClause}
      GROUP BY sp.part_name, sp.part_number
      ORDER BY total_quantity DESC, total_cost DESC
      LIMIT 50
    `, params);

    const summary = {
      total_parts: data.length,
      total_quantity: data.reduce((sum, d) => sum + d.total_quantity, 0),
      total_cost: data.reduce((sum, d) => sum + d.total_cost, 0)
    };

    return { data, summary, total: data.length };
  }

  async getHospitalOverview(user) {
    let whereClause = '';
    const params = [];

    if (user?.role_name !== 'SUPER_ADMIN') {
      whereClause += ' AND h.id = ?';
      params.push(user?.hospital_id);
    }

    const data = await query(`
      SELECT 
        h.id,
        h.name as hospital_name,
        h.city,
        h.state,
        COUNT(DISTINCT e.id) as total_equipment,
        COUNT(DISTINCT CASE WHEN e.status = 'Operational' THEN e.id END) as operational_equipment,
        COUNT(DISTINCT CASE WHEN e.status IN ('Under Repair', 'Maintenance') THEN e.id END) as non_operational_equipment,
        COUNT(DISTINCT el.id) as total_errors,
        COUNT(DISTINCT CASE WHEN el.status IN ('Pending', 'In Progress') THEN el.id END) as open_errors,
        COUNT(DISTINCT CASE WHEN el.status IN ('Resolved', 'Closed') THEN el.id END) as resolved_errors,
        COUNT(DISTINCT r.id) as total_repairs,
        COUNT(DISTINCT u.id) as total_engineers,
        AVG(CASE WHEN el.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, el.created_at, el.updated_at) 
          ELSE NULL END) as avg_resolution_hours
      FROM hospitals h
      LEFT JOIN equipment e ON h.id = e.hospital_id
      LEFT JOIN error_logs el ON e.id = el.equipment_id
      LEFT JOIN repairs r ON el.id = r.error_log_id
      LEFT JOIN users u ON h.id = u.hospital_id AND u.role_name = 'ENGINEER' AND u.is_active = TRUE
      WHERE h.is_active = TRUE ${whereClause}
      GROUP BY h.id
    `, params);

    const summary = {
      total_hospitals: data.length,
      total_equipment: data.reduce((sum, d) => sum + d.total_equipment, 0),
      total_errors: data.reduce((sum, d) => sum + d.total_errors, 0),
      total_repairs: data.reduce((sum, d) => sum + d.total_repairs, 0)
    };

    return { data, summary, total: data.length };
  }
}

module.exports = new ReportService();