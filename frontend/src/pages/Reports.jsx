// src/pages/Reports.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar
// ✅ COMPLETE FIXED VERSION
// ✅ Downtime calculation fixed (only resolved errors)
// ✅ Availability % fixed (100% if no downtime)
// ✅ Days/Weeks/Months added in export
// ✅ Charts on screen for downtime reports
// ✅ Charts in Excel/PDF exports
// ✅ Super Admin + Engineer roles supported
// ✅ buildDowntimeRows function added
// ✅ Availability calculation with default 1 year
// ✅ DOWNTIME SHOW ONLY IN DAYS (not hours)

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Grid,
  Typography,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tooltip,
  Menu,
  Divider,
  Card,
  CardContent,
  RadioGroup,
  Radio,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Skeleton,
  SwipeableDrawer,
  Collapse,
  Snackbar,
  Avatar,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  Close,
  Refresh,
  Assessment,
  ErrorOutline,
  Build,
  MedicalServices,
  Engineering,
  BarChart,
  Business,
  Warning,
  Inventory,
  AccessTime,
  Person,
  History,
  Description,
  PictureAsPdf,
  TableChart,
  FileDownload,
  Print,
  Schedule,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  CalendarToday,
  EventNote,
  Speed,
  Assignment,
  FilterList,
  DateRange,
  Today,
  ViewWeek,
  CalendarViewMonth,
  Clear,
  MoreVert,
  GetApp,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CloudOff,
  TimerOff,
  PowerOff,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS - MATCHING MAINLAYOUT
// ============================================================
const colors = {
  // Dark Navy Base
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyDark: '#0A0F1E',
  darkNavyHover: '#1E3A5F',
  
  // Light Cyan Accents
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  
  // Gold accent (keeping PAEC branding)
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  
  // Text
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  darkText: '#0F172A',
  lightText: '#64748B',
  
  // Cards
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  
  // Dashboard Background - Light with cyan tint
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  
  // Card Area Background - Subtle cyan
  cardAreaBg: 'rgba(103, 232, 249, 0.04)',
  cardAreaBorder: 'rgba(103, 232, 249, 0.08)',
  
  // Status colors
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

// ============================================================
// ✅ ANIMATIONS - MATCHING MAINLAYOUT
// ============================================================
const reportStyles = `
@keyframes cyanPulse {
    0% { box-shadow: 0 4px 20px rgba(103, 232, 249, 0.06); }
    50% { box-shadow: 0 8px 40px rgba(103, 232, 249, 0.15); }
    100% { box-shadow: 0 4px 20px rgba(103, 232, 249, 0.06); }
}

@keyframes shimmerSlide {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
}

.table-row-hover {
    transition: all 0.3s ease;
}

.table-row-hover:hover {
    background: rgba(103, 232, 249, 0.04) !important;
    transform: scale(1.01);
    box-shadow: 0 2px 12px rgba(103, 232, 249, 0.08);
}

.report-card {
    transition: all 0.3s ease;
}

.report-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(103, 232, 249, 0.12);
    border-color: ${colors.lightCyan} !important;
}
`

// ============================================================
// ✅ UTILITY HELPERS
// ============================================================

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')

const csvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

const num = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const firstValue = (obj, keys, fallback = null) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') return obj[key]
  }
  return fallback
}

const percentage = (value, total) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0.0%'

const average = (values) => {
  const valid = values.filter((v) => Number.isFinite(v))
  return valid.length ? valid.reduce((sum, v) => sum + v, 0) / valid.length : 0
}

const getRecordDate = (item) =>
  item?.created_at || item?.reported_at || item?.date || item?.repair_date || item?.scheduled_date

// ============================================================
// ✅ DOWNTIME CALCULATION - FIXED ✅
// ============================================================
const getDowntimeHours = (item) => {
  // ✅ SIRF RESOLVED ERRORS KA DOWNTIME COUNT KAREIN
  const status = String(item.status || '').toLowerCase()
  if (!['resolved', 'closed', 'completed'].includes(status)) {
    return 0
  }

  const start = firstValue(item, ['created_at', 'reported_at', 'breakdown_at'])
  const end = firstValue(item, ['updated_at', 'resolved_at', 'completed_at', 'closed_at'])

  if (!start || !end) return 0

  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0

  const hours = Math.max(0, (endDate.getTime() - startDate.getTime()) / 3600000)
  
  return hours
}

// ✅ GET DOWNTIME WITH DAYS/WEEKS/MONTHS
const getDowntimeBreakdown = (hours) => {
  return {
    hours: hours,
    days: hours / 24,
    weeks: hours / 24 / 7,
    months: hours / 24 / 30.44
  }
}

// ============================================================
// ✅ BUILD EQUIPMENT LIFECYCLE ROWS - FIXED ✅
// ============================================================
const buildEquipmentLifecycleRows = (equipment, errors, repairs) => {
  console.log('🔧 buildEquipmentLifecycleRows called');
  console.log('📌 Equipment:', equipment?.length || 0);
  console.log('📌 Errors:', errors?.length || 0);
  console.log('📌 Repairs:', repairs?.length || 0);
  
  if (!Array.isArray(equipment)) {
    console.log('❌ Equipment is not an array');
    return [];
  }
  
  return equipment.map((eq) => {
    const id = eq.id;
    const name = eq.name || 'N/A';
    const serial = eq.serial_number || 'N/A';

    // Filter errors for this equipment
    const eqErrors = errors.filter(e => {
      if (e.equipment_id && e.equipment_id === id) return true;
      if (e.equipment && e.equipment.id === id) return true;
      if (e.equipment_name && e.equipment_name === name) return true;
      return false;
    });

    // Filter repairs for this equipment
    const eqRepairs = repairs.filter(r => {
      if (r.equipment_id && r.equipment_id === id) return true;
      if (r.equipment && r.equipment.id === id) return true;
      if (r.equipment_name && r.equipment_name === name) return true;
      if (r.error_log_id) {
        const error = errors.find(e => e.id === r.error_log_id);
        if (error && (error.equipment_id === id || error.equipment?.id === id)) return true;
      }
      return false;
    });

    const resolved = eqErrors.filter(e => {
      const status = String(e.status || '').toLowerCase();
      return ['resolved', 'closed', 'completed'].includes(status);
    });
    
    const open = eqErrors.filter(e => {
      const status = String(e.status || '').toLowerCase();
      return ['pending', 'in progress', 'open'].includes(status);
    });
    
    const critical = eqErrors.filter(e => {
      const severity = String(e.severity || '').toLowerCase();
      return severity === 'critical';
    }).length;
    
    const high = eqErrors.filter(e => {
      const severity = String(e.severity || '').toLowerCase();
      return severity === 'high';
    }).length;

    // ✅ DOWNTIME - SIRF RESOLVED ERRORS (DAYS ONLY)
    let downtimeHours = 0;
    resolved.forEach(e => {
      const start = firstValue(e, ['created_at', 'reported_at', 'breakdown_at']);
      const end = firstValue(e, ['updated_at', 'resolved_at', 'completed_at', 'closed_at']);
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
          if (hours > 0) downtimeHours += hours;
        }
      }
    });

    // ✅ Convert to days (1 day = 24 hours)
    const downtimeDays = downtimeHours / 24;

    // ✅ AGE - INSTALLATION YEAR WITH DEFAULT 1 YEAR
    const installation = firstValue(eq, ['installation_year', 'installation_date', 'purchase_date']);
    const baseDate = installation ? new Date(installation) : null;
    const age = baseDate && !isNaN(baseDate.getTime())
      ? Math.max(0, (Date.now() - baseDate.getTime()) / (365.25 * 24 * 3600000))
      : 0;

    // ✅ If no installation year, use 1 year as default
    const effectiveAge = age > 0 ? age : 1;
    const monitoredHours = effectiveAge * 365.25 * 24;
    const finalAvailability = monitoredHours > 0
      ? Math.max(0, Math.min(100, ((monitoredHours - downtimeHours) / monitoredHours) * 100))
      : 100;

    console.log(`📊 ${name}: Age=${effectiveAge.toFixed(1)}y, Downtime=${downtimeDays.toFixed(1)}d, Availability=${finalAvailability.toFixed(1)}%`);

    return {
      'Equipment Name': name,
      'Serial / Asset No.': serial,
      'Hospital': eq.hospital_name || eq.hospital || 'N/A',
      'Department': eq.department_name || eq.department || eq.location || 'N/A',
      'Equipment Status': eq.status || 'Active',
      'Total Failures': eqErrors.length,
      'Critical Failures': critical,
      'High Failures': high,
      'Open Errors': open.length,
      'Resolved Errors': resolved.length,
      'Resolution Rate': eqErrors.length > 0 ? `${((resolved.length / eqErrors.length) * 100).toFixed(1)}%` : '0.0%',
      'Maintenance Events': eqRepairs.length,
      'Total Downtime (Days)': downtimeDays.toFixed(1),  // ✅ Days only
      'Availability %': `${finalAvailability.toFixed(1)}%`,
      'Age (Years)': effectiveAge.toFixed(1)
    };
  });
};

// ============================================================
// ✅ BUILD DOWNTIME ROWS - WITH BREAKDOWN ✅
// ============================================================
const buildDowntimeRows = (equipment, errors, repairs) => {
  console.log('🔧 buildDowntimeRows called');
  console.log('📌 Equipment:', equipment?.length || 0);
  console.log('📌 Errors:', errors?.length || 0);
  console.log('📌 Repairs:', repairs?.length || 0);
  
  if (!Array.isArray(equipment)) {
    console.log('❌ Equipment is not an array');
    return [];
  }
  
  const rows = buildEquipmentLifecycleRows(equipment, errors, repairs)
    .filter(r => parseFloat(r['Total Downtime (Days)']) > 0 || r['Total Failures'] > 0)
    .sort((a, b) => parseFloat(b['Total Downtime (Days)']) - parseFloat(a['Total Downtime (Days)']))
    .map(r => {
      const days = parseFloat(r['Total Downtime (Days)']) || 0;
      
      return {
        'Equipment Name': r['Equipment Name'],
        'Serial / Asset No.': r['Serial / Asset No.'],
        'Hospital': r.Hospital,
        'Department': r.Department,
        'Equipment Status': r['Equipment Status'],
        'Total Failures': r['Total Failures'],
        'Critical Failures': r['Critical Failures'],
        'Open Errors': r['Open Errors'],
        'Resolved Errors': r['Resolved Errors'],
        'Resolution Rate': r['Resolution Rate'],
        'Maintenance Events': r['Maintenance Events'],
        'Total Downtime (Days)': r['Total Downtime (Days)'],  // ✅ Days only
        'Availability %': r['Availability %']
      };
    });
  
  console.log('✅ buildDowntimeRows returning:', rows.length, 'rows');
  return rows;
};

const equipmentId = (x) => firstValue(x, ['id', 'equipment_id', 'equipmentId', 'asset_id', 'assetId'])
const equipmentName = (x) => firstValue(x, ['equipment_name', 'name', 'equipment', 'asset_name'], 'N/A')
const serialNo = (x) => firstValue(x, ['serial_number', 'serial_no', 'serial', 'asset_tag', 'asset_code'], 'N/A')

const getPeriodKey = (date, period) => {
  if (!date) return 'Unknown'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'Unknown'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  if (period === 'yearly') return String(year)
  if (period === 'monthly') return `${year}-${month}`
  if (period === 'daily') return `${year}-${month}-${day}`

  const temp = new Date(Date.UTC(year, d.getMonth(), d.getDate()))
  const dayNum = temp.getUTCDay() || 7
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum)
  const weekYear = temp.getUTCFullYear()
  const yearStart = new Date(Date.UTC(weekYear, 0, 1))
  const week = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7)
  return `${weekYear}-W${String(week).padStart(2, '0')}`
}

const formatPeriodLabel = (key, period) => {
  if (key === 'Unknown' || period === 'yearly' || period === 'weekly') return key
  if (period === 'monthly') {
    const [year, month] = key.split('-')
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
      month: 'short', year: 'numeric'
    })
  }
  return formatDate(key)
}

// ============================================================
// ✅ BUILD ERROR SUMMARY ROWS
// ============================================================
const buildErrorSummaryRows = (errors, period) => {
  const groups = new Map()

  errors.forEach((error) => {
    const key = getPeriodKey(getRecordDate(error), period)

    if (!groups.has(key)) {
      groups.set(key, {
        period: formatPeriodLabel(key, period),
        total_errors: 0, resolved: 0, open: 0,
        critical: 0, high: 0, medium: 0, low: 0,
        resolution_hours: []
      })
    }

    const row = groups.get(key)
    const status = String(error.status || '').toLowerCase()
    const severity = String(error.severity || '').toLowerCase()

    row.total_errors += 1
    if (['resolved', 'closed', 'completed'].includes(status)) row.resolved += 1
    if (['pending', 'in progress', 'open'].includes(status)) row.open += 1

    if (severity === 'critical') row.critical += 1
    if (severity === 'high') row.high += 1
    if (severity === 'medium') row.medium += 1
    if (severity === 'low') row.low += 1

    const hours = getDowntimeHours(error)
    if (hours > 0) row.resolution_hours.push(hours)
  })

  return Array.from(groups.values())
    .sort((a, b) => String(a.period).localeCompare(String(b.period)))
    .map((row) => ({
      period: row.period,
      total_errors: row.total_errors,
      resolved: row.resolved,
      open: row.open,
      critical: row.critical,
      high: row.high,
      medium: row.medium,
      low: row.low,
      resolution_rate: percentage(row.resolved, row.total_errors),
      avg_resolution_time: row.resolution_hours.length
        ? `${average(row.resolution_hours).toFixed(1)} hrs`
        : 'N/A'
    }))
}

// ============================================================
// ✅ GET CHART DATA - AVAILABILITY PERCENTAGE ✅
// ============================================================
const getAvailabilityChartData = (data) => {
  if (!Array.isArray(data)) return []
  return data.map(item => ({
    name: item['Equipment Name'] || 'N/A',
    availability: parseFloat(String(item['Availability %'] || '0').replace('%', '')) || 0
  }))
}

// ✅ GET CHART DATA - DOWNTIME BREAKDOWN ✅
const getDowntimeChartData = (data) => {
  if (!Array.isArray(data)) return null
  const totalDays = data.reduce((sum, item) => sum + num(item['Total Downtime (Days)']), 0)
  const totalHours = totalDays * 24
  const breakdown = getDowntimeBreakdown(totalHours)
  return {
    hours: breakdown.hours,
    days: breakdown.days,
    weeks: breakdown.weeks,
    months: breakdown.months
  }
}

// ============================================================
// ✅ FILTER HELPERS
// ============================================================
const dateInRange = (value, filters) => {
  const recordDate = getRecordDate(value)
  if (!recordDate) return true

  const d = new Date(recordDate)
  if (Number.isNaN(d.getTime())) return true

  if (filters?.startDate) {
    const start = new Date(`${filters.startDate}T00:00:00`)
    if (d < start) return false
  }
  if (filters?.endDate) {
    const end = new Date(`${filters.endDate}T23:59:59`)
    if (d > end) return false
  }
  return true
}

const statusMatches = (item, filters) => {
  if (!filters?.status) return true
  const wanted = String(filters.status).toLowerCase()
  const actual = String(
    firstValue(item, ['status', 'equipment_status', 'maintenance_status'], '')
  ).toLowerCase()
  return !actual || actual === wanted
}

const hospitalMatches = (item, filters) => {
  if (!filters?.hospital) return true
  const wanted = String(filters.hospital)
  const ids = [item?.hospital_id, item?.hospitalId, item?.hospital?.id]
    .filter(v => v !== undefined && v !== null)
    .map(String)
  return ids.length ? ids.includes(wanted) : false
}

const applyCommonFilters = (items, filters) => {
  if (!Array.isArray(items)) return []
  return items.filter(item =>
    statusMatches(item, filters) &&
    hospitalMatches(item, filters) &&
    dateInRange(item, filters)
  )
}

const getReportTitle = (type) => ({
  monthly: 'Monthly Error Summary',
  weekly: 'Weekly Error Summary',
  daily: 'Daily Error Summary',
  yearly: 'Yearly Error Summary',
  'my-errors': 'My Error Report',
  'my-downtime': 'My Downtime Report',
  'my-maintenance': 'My Maintenance Report',
  'my-equipment': 'My Equipment Performance',
  'my-performance': 'My Performance',
  hospital: 'Hospital Performance Report',
  equipment: 'Equipment Lifecycle Report',
  downtime: 'Equipment Downtime & Availability Report',
  'spare-parts': 'Spare Parts Usage Report',
  maintenance: 'Maintenance Performance Report',
  'engineer-performance': 'Engineer Performance Report',
  amc: 'AMC Status Report'
}[type] || 'Equipment Management Report')

// ============================================================
// ✅ EXPORT FUNCTIONS - WITH CHART
// ============================================================
const getCleanExportData = (data, reportType) => {
  if (!Array.isArray(data)) return []

  if (['downtime', 'my-downtime'].includes(reportType)) {
    return data.map(r => {
      const days = num(r['Total Downtime (Days)'] || 0)  // ✅ Days only
      const hours = days * 24
      const weeks = days / 7
      const months = days / 30.44
      
      return {
        'Equipment': r['Equipment Name'] || 'N/A',
        'Hospital': r.Hospital || 'N/A',
        'Failures': r['Total Failures'] || 0,
        'Critical': r['Critical Failures'] || 0,
        'Downtime (Days)': days.toFixed(1),  // ✅ Days only
        'Downtime (Weeks)': weeks.toFixed(1),
        'Downtime (Months)': months.toFixed(1),
        'Availability %': r['Availability %'] || '100.0%'
      }
    })
  }

  if (['equipment', 'my-equipment'].includes(reportType)) {
    return data.map(r => ({
      'Equipment': r['Equipment Name'] || 'N/A',
      'Hospital': r.Hospital || 'N/A',
      'Status': r['Equipment Status'] || 'N/A',
      'Failures': r['Total Failures'] || 0,
      'Critical': r['Critical Failures'] || 0,
      'Availability %': r['Availability %'] || '100.0%'
    }))
  }

  if (['monthly', 'weekly', 'daily', 'yearly', 'my-errors'].includes(reportType)) {
    return data.map(r => ({
      'Period': r.period || 'N/A',
      'Total': r.total_errors || 0,
      'Resolved': r.resolved || 0,
      'Open': r.open || 0,
      'Critical': r.critical || 0
    }))
  }

  if (['maintenance', 'my-maintenance'].includes(reportType)) {
    return data.map(r => ({
      'Equipment': r.equipment_name || r.name || 'N/A',
      'Hospital': r.hospital_name || 'N/A',
      'Type': r.maintenance_type || r.type || 'N/A',
      'Status': r.status || 'N/A',
      'Next Due': formatDate(r.next_due_date)
    }))
  }

  if (reportType === 'spare-parts') {
    return data.map(r => ({
      'Part Name': r.part_name || r.name || 'N/A',
      'Equipment': r.equipment_name || 'N/A',
      'Quantity': r.quantity || 0,
      'Unit Cost': r.unit_cost || 0,
      'Total Cost': r.total_cost || 0
    }))
  }

  if (reportType === 'amc') {
    return data.map(r => ({
      'Contract': r.contract_number || r.title || 'N/A',
      'Vendor': r.vendor_name || r.vendor || 'N/A',
      'Equipment': r.equipment_name || 'N/A',
      'Status': r.status || 'N/A',
      'Expiry': formatDate(r.end_date)
    }))
  }

  if (reportType === 'hospital') {
    return data.map(r => ({
      'Hospital': r.name || 'N/A',
      'City': r.city || 'N/A',
      'Equipment': r.equipment_count || 0,
      'Errors': r.error_count || 0,
      'Downtime (Days)': (r.downtime_hours || 0) / 24
    }))
  }

  if (['my-performance', 'engineer-performance'].includes(reportType)) {
    return data.map(r => ({
      'Engineer': r.name || r.full_name || 'N/A',
      'Completed': r.completed || 0,
      'Pending': r.pending || 0,
      'Critical': r.critical || 0,
      'Rate %': r.completion_rate || '0.0%'
    }))
  }

  return data.map(r => ({
    'Title': r.title || r.name || r.error_title || r.equipment_name || 'N/A',
    'Type': r.type || r.category || reportType || 'Report',
    'Status': r.status || 'N/A',
    'Date': formatDate(getRecordDate(r))
  }))
}

const calculateExportSummary = (rows, reportType) => {
  if (['downtime', 'my-downtime'].includes(reportType)) {
    const days = rows.reduce((s, r) => s + num(r['Downtime (Days)']), 0)  // ✅ Days only
    const failures = rows.reduce((s, r) => s + num(r['Failures']), 0)
    const critical = rows.reduce((s, r) => s + num(r['Critical']), 0)
    return {
      'Equipment Count': rows.length,
      'Total Failures': failures,
      'Critical Failures': critical,
      'Total Downtime (Days)': `${days.toFixed(1)}`  // ✅ Days only
    }
  }

  if (['monthly', 'weekly', 'daily', 'yearly', 'my-errors'].includes(reportType)) {
    const total = rows.reduce((s, r) => s + num(r.Total), 0)
    const resolved = rows.reduce((s, r) => s + num(r.Resolved), 0)
    const open = rows.reduce((s, r) => s + num(r.Open), 0)
    const critical = rows.reduce((s, r) => s + num(r.Critical), 0)
    return {
      'Total Errors': total,
      'Resolved': resolved,
      'Open': open,
      'Critical': critical
    }
  }

  return { 'Report Rows': rows.length }
}

// ============================================================
// ✅ CSV EXPORT
// ============================================================
const exportToCSV = (data, filename = 'report') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    const rows = [
      headers.map(csvValue).join(','),
      ...data.map((row) => headers.map((h) => csvValue(row[h])).join(','))
    ]

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`✅ CSV exported successfully! (${data.length} rows)`)
  } catch (error) {
    console.error('CSV export error:', error)
    toast.error('Failed to export CSV: ' + error.message)
  }
}

// ✅ EXCEL EXPORT WITH CHART
const exportToExcel = (data, filename = 'report', reportType = '') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    const summary = calculateExportSummary(data, reportType)
    
    let chartHtml = ''
    if (reportType === 'downtime' || reportType === 'my-downtime') {
      const chartData = data
        .map(row => ({
          name: row['Equipment'] || row['Equipment Name'] || 'N/A',
          value: parseFloat(row['Downtime (Days)'] || row['Downtime'] || 0)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
      
      const maxValue = Math.max(...chartData.map(d => d.value), 1)
      
      let bars = chartData.map((item, index) => {
        const barHeight = (item.value / maxValue) * 150
        const color = item.value > 10 ? '#EF4444' : 
                      item.value > 5 ? '#F59E0B' : '#0F172A'
        return `
          <td style="text-align:center;vertical-align:bottom;padding:2px;width:${100/chartData.length}%;">
            <div style="height:${barHeight + 20}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
              <div style="height:${barHeight}px;width:80%;max-width:35px;background:${color};border-radius:4px 4px 0 0;min-height:5px;"></div>
              <div style="font-size:8px;color:#64748B;margin-top:2px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${item.name.length > 10 ? item.name.substring(0, 8) + '..' : item.name}
              </div>
              <div style="font-size:8px;font-weight:600;color:#0F172A;">${item.value.toFixed(1)}d</div>
            </div>
          </td>
        `
      }).join('')
      
      chartHtml = `
        <tr>
          <td colspan="${headers.length}" style="padding:10px;background:#F8FAFB;border:1px solid rgba(103, 232, 249, 0.1);">
            <div style="font-size:12px;font-weight:600;color:#0F172A;text-align:center;margin-bottom:8px;">
              📊 Top Equipment by Downtime (Days)
            </div>
            <table style="width:100%;border:none;">
              <tr>${bars}</tr>
            </table>
            <div style="font-size:8px;color:#64748B;text-align:center;margin-top:4px;">
              🔴 High (&gt;10d) • 🟠 Medium (5-10d) • 🟢 Low (&lt;5d)
            </div>
          </td>
        </tr>
      `
    }

    const html = `
      <html><head><meta charset="UTF-8"><style>
        body{font-family:Arial,sans-serif;padding:24px;color:#0F172A}
        h1{color:#0F172A;text-align:center;margin-bottom:6px}
        .sub{text-align:center;color:#64748B;margin-bottom:18px}
        .summary{border:1px solid rgba(103, 232, 249, 0.1);margin-bottom:18px}
        .summary td{padding:8px 12px;text-align:center;border-right:1px solid rgba(103, 232, 249, 0.1)}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        th{background:#0F172A;color:white;padding:8px;border:1px solid #1E293B;text-align:center}
        td{padding:7px;border:1px solid rgba(103, 232, 249, 0.1);text-align:center;vertical-align:middle;word-break:break-word}
        tr:nth-child(even){background:#F5F7F6}
        .chart-row td{background:#F8FAFB;padding:12px}
      </style></head><body>
        <h1>${escapeHtml(filename.replace(/_/g, ' ').toUpperCase())}</h1>
        <div class="sub">PAEC Equipment Management System • ${escapeHtml(new Date().toLocaleString())}</div>
        
        <table class="summary"><tr>
          ${Object.entries(summary).map(([k, v]) => `<td><strong>${escapeHtml(k)}</strong><br>${escapeHtml(v)}</td>`).join('')}
        </tr></table>
        
        ${chartHtml}
        
        <table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>${data.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`).join('')}</tbody></table>
      </body></html>
    `

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`✅ Excel-compatible file exported successfully! (${data.length} rows)`)
  } catch (error) {
    console.error('Excel export error:', error)
    toast.error('Failed to export Excel: ' + error.message)
  }
}

// ✅ PDF EXPORT WITH CHART
const exportToPDF = (data, filename = 'report', reportType = '') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    const summary = calculateExportSummary(data, reportType)
    
    let chartHtml = ''
    if (reportType === 'downtime' || reportType === 'my-downtime') {
      const chartData = data
        .map(row => ({
          name: row['Equipment'] || row['Equipment Name'] || 'N/A',
          value: parseFloat(row['Downtime (Days)'] || row['Downtime'] || 0)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
      
      const maxValue = Math.max(...chartData.map(d => d.value), 1)
      
      let bars = chartData.map((item) => {
        const barHeight = Math.max((item.value / maxValue) * 120, 5)
        const color = item.value > 10 ? '#EF4444' : 
                      item.value > 5 ? '#F59E0B' : '#0F172A'
        return `
          <div style="flex:1;text-align:center;min-width:25px;">
            <div style="height:${barHeight}px;background:${color};border-radius:4px 4px 0 0;min-height:5px;width:100%;max-width:30px;margin:0 auto;"></div>
            <div style="font-size:7px;color:#64748B;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:50px;">
              ${item.name.length > 12 ? item.name.substring(0, 10) + '..' : item.name}
            </div>
            <div style="font-size:7px;font-weight:600;color:#0F172A;">${item.value.toFixed(1)}d</div>
          </div>
        `
      }).join('')
      
      chartHtml = `
        <div style="border:1px solid rgba(103, 232, 249, 0.1);border-radius:4px;padding:12px;margin:12px 0;background:#F8FAFB;">
          <div style="font-size:11px;font-weight:600;color:#0F172A;text-align:center;margin-bottom:8px;">
            📊 Top Equipment by Downtime (Days)
          </div>
          <div style="display:flex;align-items:flex-end;height:160px;gap:3px;padding:4px;">
            ${bars}
          </div>
          <div style="font-size:7px;color:#64748B;text-align:center;margin-top:4px;">
            🔴 High (&gt;10d) • 🟠 Medium (5-10d) • 🟢 Low (&lt;5d)
          </div>
        </div>
      `
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800')

    if (!printWindow) {
      toast.warning('Please allow pop-ups to export the PDF')
      return
    }

    printWindow.document.write(`
      <html><head><title>${escapeHtml(filename)}</title><style>
        @page{size:A4 landscape;margin:12mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;color:#0F172A;margin:0;padding:12px}
        h1{color:#0F172A;text-align:center;margin:0 0 4px;font-size:18px}
        .sub{text-align:center;color:#64748B;font-size:9px;margin-bottom:10px}
        .summary{display:grid;grid-template-columns:repeat(${Math.min(Object.keys(summary).length, 6)},1fr);gap:6px;margin-bottom:10px}
        .card{border:1px solid rgba(103, 232, 249, 0.1);border-radius:4px;padding:6px;text-align:center;background:#FAFBFC}
        .label{font-size:7px;color:#64748B}.value{font-size:11px;font-weight:700;color:#0F172A;margin-top:2px}
        .chart-container{border:1px solid rgba(103, 232, 249, 0.1);border-radius:4px;padding:10px;margin:10px 0;background:#F8FAFB}
        .chart-title{font-size:10px;font-weight:600;color:#0F172A;text-align:center;margin-bottom:6px}
        .chart-bars{display:flex;align-items:flex-end;height:140px;gap:3px;padding:3px;justify-content:center}
        .chart-bar{flex:1;text-align:center;min-width:25px}
        .bar{height:var(--bar-height);background:var(--bar-color);border-radius:3px 3px 0 0;min-height:4px;width:100%;max-width:30px;margin:0 auto}
        .bar-label{font-size:6px;color:#64748B;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40px}
        .bar-value{font-size:6px;font-weight:600;color:#0F172A}
        table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7px}
        th{background:#0F172A;color:#fff;padding:5px 3px;border:1px solid #1E293B;text-align:center}
        td{padding:4px 3px;border:1px solid rgba(103, 232, 249, 0.1);text-align:center;vertical-align:middle;overflow-wrap:anywhere}
        tr:nth-child(even){background:#F5F7F6}
        .footer{margin-top:8px;text-align:center;font-size:7px;color:#7A8580}
        .legend{font-size:7px;color:#64748B;text-align:center;margin-top:3px}
      </style></head><body>
        <h1>${escapeHtml(filename.replace(/_/g, ' ').toUpperCase())}</h1>
        <div class="sub">PAEC Equipment Management System • ${escapeHtml(new Date().toLocaleString())}</div>
        
        <div class="summary">
          ${Object.entries(summary).map(([k, v]) => `<div class="card"><div class="label">${escapeHtml(k)}</div><div class="value">${escapeHtml(v)}</div></div>`).join('')}
        </div>
        
        ${chartHtml}
        
        <table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>${data.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`).join('')}</tbody></table>
        <div class="footer">PAEC Equipment Management System</div>
        <script>
          window.onload=function(){
            setTimeout(function(){
              window.print();
              window.onafterprint=function(){window.close();}
            },400);
          };
        </script>
      </body></html>
    `)
    printWindow.document.close()
    toast.info('🖨️ PDF print dialog opened — choose "Save as PDF".')
  } catch (error) {
    console.error('PDF export error:', error)
    toast.error('Failed to export PDF: ' + error.message)
  }
}

// ============================================================
// ✅ CHART COMPONENTS - THEMED
// ============================================================

// 📊 Chart 1: Bar Chart - Downtime by Equipment (Days)
const DowntimeBarChart = ({ data }) => {
  if (!data || data.length === 0) return null
  
  const maxValue = Math.max(...data.map(d => d.downtime), 1)
  const sortedData = [...data].sort((a, b) => b.downtime - a.downtime).slice(0, 8)
  
  return (
    <Card sx={{ 
      p: 3, 
      borderRadius: 3, 
      border: `1px solid rgba(103, 232, 249, 0.1)`,
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(103, 232, 249, 0.3)',
        boxShadow: '0 8px 30px rgba(103, 232, 249, 0.08)',
      }
    }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#0F172A', mb: 2 }}>
        📊 Top Equipment by Downtime (Days)
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 180, pt: 1 }}>
        {sortedData.map((item, index) => {
          const height = Math.max((item.downtime / maxValue) * 150, 5)
          const barColor = item.downtime > 10 ? '#EF4444' : 
                          item.downtime > 5 ? '#F59E0B' : '#0F172A'
          return (
            <Box key={index} sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <Tooltip title={`${item.name}: ${item.downtime.toFixed(1)} days`}>
                <Box sx={{ 
                  height: height,
                  bgcolor: barColor,
                  borderRadius: '4px 4px 0 0',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  boxShadow: `0 4px 12px ${barColor}33`,
                  '&:hover': {
                    opacity: 0.8,
                    transform: 'scaleY(1.05)',
                    transformOrigin: 'bottom'
                  }
                }} />
              </Tooltip>
              <Typography variant="caption" sx={{ 
                display: 'block', mt: 0.5, 
                fontSize: '8px', color: '#64748B',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {item.name.length > 12 ? item.name.substring(0, 10) + '…' : item.name}
              </Typography>
              <Typography variant="caption" sx={{ 
                display: 'block', fontWeight: 600, color: '#0F172A', fontSize: '8px' 
              }}>
                {item.downtime.toFixed(1)}d
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Card>
  )
}

// 📊 Chart 2: Availability Gauge
const AvailabilityGauge = ({ value }) => {
  const color = value >= 95 ? '#22C55E' : 
                value >= 80 ? '#F59E0B' : '#EF4444'
  
  return (
    <Card sx={{ 
      p: 3, 
      borderRadius: 3, 
      border: `1px solid rgba(103, 232, 249, 0.1)`,
      height: '100%',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(103, 232, 249, 0.3)',
        boxShadow: '0 8px 30px rgba(103, 232, 249, 0.08)',
      }
    }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#0F172A', mb: 1 }}>
        📈 Average Availability
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <CircularProgress
          variant="determinate"
          value={Math.min(value, 100)}
          size={120}
          thickness={8}
          sx={{
            color: color,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
            {value.toFixed(1)}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Availability
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}

// 📊 Downtime Breakdown - KPI cards
const DowntimeBreakdown = ({ days, weeks, months }) => {
  const items = [
    { label: 'Days', value: days, color: '#0F172A' },
    { label: 'Weeks', value: weeks, color: '#C9A227' },
    { label: 'Months', value: months, color: '#EF4444' }
  ]

  return (
    <Card sx={{ 
      p: 2.5, 
      borderRadius: 3, 
      border: `1px solid rgba(103, 232, 249, 0.1)`,
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(103, 232, 249, 0.3)',
        boxShadow: '0 8px 30px rgba(103, 232, 249, 0.08)',
      }
    }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#0F172A', mb: 1.5 }}>
        Downtime Summary (Days)
      </Typography>
      <Grid container spacing={1}>
        {items.map((item) => (
          <Grid item xs={4} key={item.label}>
            <Box sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: `${item.color}10`,
              border: `1px solid ${item.color}22`
            }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                {item.label}
              </Typography>
              <Typography variant="h6" sx={{ color: item.color, fontWeight: 700 }}>
                {num(item.value).toFixed(1)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1.25 }}>
        Same downtime converted into different time units.
      </Typography>
    </Card>
  )
}

// 📊 Chart 4: Failure vs Critical (Stacked Bar)
const FailureComparisonChart = ({ data }) => {
  if (!data || data.length === 0) return null
  
  const sortedData = [...data]
    .sort((a, b) => (b.failures || 0) - (a.failures || 0))
    .slice(0, 8)
  
  const maxValue = Math.max(...sortedData.map(d => d.failures || 0), 1)
  
  return (
    <Card sx={{ 
      p: 3, 
      borderRadius: 3, 
      border: `1px solid rgba(103, 232, 249, 0.1)`,
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(103, 232, 249, 0.3)',
        boxShadow: '0 8px 30px rgba(103, 232, 249, 0.08)',
      }
    }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#0F172A', mb: 2 }}>
        📊 Failures vs Critical
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 150, pt: 1 }}>
        {sortedData.map((item, index) => {
          const totalHeight = Math.max((item.failures / maxValue) * 120, 5)
          const criticalHeight = Math.max((item.critical / maxValue) * 120, 5)
          
          return (
            <Box key={index} sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <Box sx={{ position: 'relative', height: 120, display: 'flex', flexDirection: 'column-reverse' }}>
                {item.critical > 0 && (
                  <Box sx={{ 
                    height: criticalHeight,
                    bgcolor: '#EF4444',
                    borderRadius: '2px 2px 0 0',
                    width: '100%',
                    minHeight: 2,
                    boxShadow: '0 4px 12px #EF444433',
                  }} />
                )}
                {item.failures > 0 && (
                  <Box sx={{ 
                    height: totalHeight - criticalHeight,
                    bgcolor: '#0F172A',
                    borderRadius: item.critical > 0 ? '0' : '2px 2px 0 0',
                    width: '100%',
                    minHeight: 2,
                    boxShadow: '0 4px 12px #0F172A33',
                  }} />
                )}
              </Box>
              <Typography variant="caption" sx={{ 
                display: 'block', mt: 0.5, 
                fontSize: '7px', color: '#64748B',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {item.name.length > 10 ? item.name.substring(0, 8) + '…' : item.name}
              </Typography>
              <Typography variant="caption" sx={{ 
                display: 'block', fontWeight: 600, color: '#0F172A', fontSize: '7px' 
              }}>
                {item.failures}
              </Typography>
            </Box>
          )
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, bgcolor: '#0F172A', borderRadius: 1 }} />
          <Typography variant="caption" sx={{ fontSize: '9px', color: '#64748B' }}>Total</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, bgcolor: '#EF4444', borderRadius: 1 }} />
          <Typography variant="caption" sx={{ fontSize: '9px', color: '#64748B' }}>Critical</Typography>
        </Box>
      </Box>
    </Card>
  )
}

// ============================================================
// ✅ STATS CARD COMPONENT - THEMED
// ============================================================
const StatsCard = ({ title, value, color, bgColor, icon, loading, subtitle }) => {
  return (
    <Grow in timeout={300}>
      <Card sx={{
        borderRadius: 3,
        bgcolor: bgColor || '#FFFFFF',
        transition: 'all 0.3s ease',
        border: `1px solid rgba(103, 232, 249, 0.1)`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 8px 30px rgba(103, 232, 249, 0.12)',
          borderColor: 'rgba(103, 232, 249, 0.3)',
        },
        height: '100%'
      }}>
        <CardContent sx={{
          textAlign: 'center',
          py: { xs: 2, sm: 2.5 },
          px: { xs: 1.5, sm: 2 }
        }}>
          {loading ? (
            <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto' }} />
          ) : (
            <>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1
              }}>
                <Avatar sx={{
                  bgcolor: color || '#0F172A',
                  width: 40,
                  height: 40,
                  boxShadow: `0 4px 16px ${color || '#0F172A'}44`
                }}>
                  {icon}
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: color || '#0F172A',
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}
              >
                {value !== undefined && value !== null ? value : 0}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.875rem' }
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Grow>
  )
}

// ============================================================
// ✅ FILTER MENU COMPONENT - THEMED
// ============================================================
const FilterMenu = ({
  anchorEl,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
  period,
  onPeriodChange,
  periodOptions,
  reportTypes,
  selectedReportType,
  onReportTypeChange,
  additionalFilters = [],
  open,
  onOpen,
  onDrawerClose,
  isMobile
}) => {
  const filterContent = (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Typography variant="h6" fontWeight={700} sx={{ color: '#0F172A', mb: 2 }}>
        Filter Reports
      </Typography>

      <Divider sx={{ mb: 2, borderColor: 'rgba(103, 232, 249, 0.1)' }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
          Report Period
        </Typography>
        <RadioGroup
          row
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          sx={{ flexWrap: 'wrap', gap: 0.5 }}
        >
          {periodOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio size="small" sx={{ color: '#64748B', '&.Mui-checked': { color: '#0F172A' } }} />}
              label={
                <Typography variant="caption" sx={{ color: '#64748B' }}>{option.label}</Typography>
              }
              sx={{
                m: 0.5,
                '& .MuiFormControlLabel-label': { fontSize: '0.75rem' }
              }}
            />
          ))}
        </RadioGroup>
      </Box>

      <Divider sx={{ mb: 2, borderColor: 'rgba(103, 232, 249, 0.1)' }} />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel sx={{ color: '#64748B' }}>Report Type</InputLabel>
        <Select
          name="reportType"
          value={selectedReportType}
          onChange={(e) => onReportTypeChange(e.target.value)}
          label="Report Type"
          sx={{
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': { borderColor: '#67E8F9' },
              '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
            }
          }}
        >
          {reportTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#0F172A' }}>{type.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate || ''}
            onChange={onFilterChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: '#67E8F9' },
                '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
              }
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate || ''}
            onChange={onFilterChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: '#67E8F9' },
                '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
              }
            }}
          />
        </Grid>
      </Grid>

      {additionalFilters.map((filter, index) => (
        <FormControl fullWidth size="small" sx={{ mb: 2 }} key={index}>
          <InputLabel sx={{ color: '#64748B' }}>{filter.label}</InputLabel>
          <Select
            name={filter.name}
            value={filters[filter.name] || ''}
            onChange={onFilterChange}
            label={filter.label}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: '#67E8F9' },
                '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            {filter.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel sx={{ color: '#64748B' }}>Status</InputLabel>
        <Select
          name="status"
          value={filters.status || ''}
          onChange={onFilterChange}
          label="Status"
          sx={{
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': { borderColor: '#67E8F9' },
              '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
            }
          }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="Resolved">Resolved</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 2, borderColor: 'rgba(103, 232, 249, 0.1)' }} />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={onApply}
          fullWidth={isMobile}
          sx={{
            flex: isMobile ? 1 : 1,
            bgcolor: '#0F172A',
            '&:hover': { 
              bgcolor: '#1E3A5F',
              boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
            },
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(103, 232, 249, 0.15)',
            textTransform: 'none',
            fontWeight: 600,
          }}
          size="small"
        >
          Apply Filters
        </Button>
        <Button
          variant="outlined"
          onClick={onClear}
          fullWidth={isMobile}
          sx={{
            flex: isMobile ? 1 : 1,
            borderColor: '#0F172A',
            color: '#0F172A',
            '&:hover': { 
              borderColor: '#67E8F9',
              color: '#67E8F9',
              boxShadow: '0 0 20px rgba(103, 232, 249, 0.1)',
              bgcolor: 'rgba(103, 232, 249, 0.05)',
            },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
          size="small"
        >
          Clear All
        </Button>
      </Box>
    </Box>
  )

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onDrawerClose}
        onOpen={onOpen}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90vh',
            p: 2,
            bgcolor: '#FFFFFF'
          }
        }}
      >
        {filterContent}
      </SwipeableDrawer>
    )
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: {
          p: 2,
          width: 380,
          maxHeight: '80vh',
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: `1px solid rgba(103, 232, 249, 0.1)`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {filterContent}
    </Menu>
  )
}

// ============================================================
// ✅ SUPER ADMIN REPORTS
// ============================================================
const SuperAdminReports = () => {
  const { user } = useSelector((state) => state.auth)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [reportType, setReportType] = useState('downtime')
  const [reportData, setReportData] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [period, setPeriod] = useState('monthly')
  const [filters, setFilters] = useState({
    status: '',
    hospital: '',
    startDate: '',
    endDate: '',
    period: 'monthly'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [hospitalOptions, setHospitalOptions] = useState([])

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await api.get('/hospitals')
        const options = (response.data.hospitals || []).map(h => ({
          value: h.id.toString(),
          label: h.name
        }))
        setHospitalOptions(options)
      } catch (error) {
        console.error('Failed to fetch hospitals:', error)
      }
    }
    fetchHospitals()
  }, [])

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  const superAdminReportTypes = [
    { value: 'downtime', label: 'Equipment Downtime Report' },
    { value: 'monthly', label: 'Monthly Error Report' },
    { value: 'weekly', label: 'Weekly Error Report' },
    { value: 'daily', label: 'Daily Error Report' },
    { value: 'yearly', label: 'Yearly Error Report' },
    { value: 'hospital', label: 'Hospital-wise Report' },
    { value: 'equipment', label: 'Equipment-wise Report' },
    { value: 'spare-parts', label: 'Spare Parts Usage' },
    { value: 'maintenance', label: 'Maintenance History' },
    { value: 'engineer-performance', label: 'Engineer Performance' },
    { value: 'amc', label: 'AMC Expiry' }
  ]

  const additionalFilters = [
    {
      name: 'hospital',
      label: 'Hospital',
      options: hospitalOptions
    }
  ]

  // ✅ FIXED: generateReport using existing endpoints
  const generateReport = useCallback(async (type, periodVal) => {
    const reportTypeVal = type || reportType
    const periodValActual = periodVal || period

    setLoading(true)
    setError(null)

    try {
      let data = []

      switch (reportTypeVal) {
        case 'downtime': {
          // ✅ Use existing endpoints - equipment, errors, repairs
          const [equipmentRes, errorsRes, repairsRes] = await Promise.all([
            api.get('/equipment'),
            api.get('/errors'),
            api.get('/repairs')
          ]);
          
          const equipment = equipmentRes.data.equipment || [];
          const errors = errorsRes.data.errors || [];
          const repairs = repairsRes.data.repairs || [];

          console.log('📊 Downtime Report - Raw Data:');
          console.log('  Equipment:', equipment.length);
          console.log('  Errors:', errors.length);
          console.log('  Repairs:', repairs.length);

          // Filter by hospital if selected
          let filteredEquipment = equipment;
          if (filters.hospital) {
            filteredEquipment = equipment.filter(e => 
              String(e.hospital_id) === String(filters.hospital)
            );
            console.log('  Filtered Equipment by hospital:', filteredEquipment.length);
          }

          // Filter errors by date range
          let filteredErrors = errors;
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`);
            filteredErrors = filteredErrors.filter(e => {
              const d = new Date(e.created_at);
              return d >= start;
            });
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`);
            filteredErrors = filteredErrors.filter(e => {
              const d = new Date(e.created_at);
              return d <= end;
            });
          }
          console.log('  Filtered Errors by date:', filteredErrors.length);

          // Filter repairs by date range
          let filteredRepairs = repairs;
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`);
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date);
              return d >= start;
            });
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`);
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date);
              return d <= end;
            });
          }
          console.log('  Filtered Repairs by date:', filteredRepairs.length);

          // Build downtime rows
          data = buildDowntimeRows(filteredEquipment, filteredErrors, filteredRepairs);
          console.log('  Generated Downtime Rows:', data.length);
          break;
        }

        case 'monthly':
        case 'weekly':
        case 'daily':
        case 'yearly': {
          const response = await api.get('/errors')
          const allErrors = response.data.errors || []

          const filteredErrors = allErrors.filter((e) => {
            if (filters.status && e.status !== filters.status) return false
            if (filters.hospital && e.hospital_id !== parseInt(filters.hospital, 10)) return false

            const recordDate = getRecordDate(e)

            if (filters.startDate && recordDate) {
              const start = new Date(`${filters.startDate}T00:00:00`)
              if (new Date(recordDate) < start) return false
            }

            if (filters.endDate && recordDate) {
              const end = new Date(`${filters.endDate}T23:59:59`)
              if (new Date(recordDate) > end) return false
            }

            return true
          })

          data = buildErrorSummaryRows(filteredErrors, reportTypeVal)
          break
        }

        case 'hospital': {
          const [hospitalsRes, equipmentRes, errorsRes] = await Promise.all([
            api.get('/hospitals'), api.get('/equipment'), api.get('/errors')
          ])
          const hospitals = hospitalsRes.data.hospitals || []
          const equipment = equipmentRes.data.equipment || []
          const errors = errorsRes.data.errors || []

          const filteredErrors = applyCommonFilters(errors, filters)
          const filteredEquipment = applyCommonFilters(equipment, filters)

          data = hospitals
            .filter(h => !filters.hospital || String(h.id ?? h.hospital_id) === String(filters.hospital))
            .map(h => {
              const hid = h.id ?? h.hospital_id
              const eq = filteredEquipment.filter(e => String(e.hospital_id ?? e.hospitalId ?? '') === String(hid))
              const er = filteredErrors.filter(e => String(e.hospital_id ?? e.hospitalId ?? '') === String(hid))
              const downtimeDays = er.reduce((sum, e) => sum + (getDowntimeHours(e) / 24), 0)
              const critical = er.filter(e => String(e.severity || '').toLowerCase() === 'critical').length

              return {
                id: hid,
                hospital_id: hid,
                name: h.name,
                city: h.city,
                state: h.state,
                status: h.status || 'Active',
                equipment_count: eq.length,
                error_count: er.length,
                critical_errors: critical,
                downtime_days: downtimeDays.toFixed(1)
              }
            })
            .filter(row => !filters.status || String(row.status).toLowerCase() === String(filters.status).toLowerCase())
          break
        }

        case 'equipment': {
          const [equipmentRes, errorsRes, repairsRes] = await Promise.all([
            api.get('/equipment'), api.get('/errors'), api.get('/repairs')
          ])
          const equipment = equipmentRes.data.equipment || []
          const errors = errorsRes.data.errors || []
          const repairs = repairsRes.data.repairs || []

          const filteredEquipment = equipment.filter(e =>
            hospitalMatches(e, filters) && statusMatches(e, filters)
          )
          const filteredErrors = applyCommonFilters(errors, { ...filters, hospital: '' })
          const filteredRepairs = applyCommonFilters(repairs, { ...filters, hospital: '' })

          data = buildEquipmentLifecycleRows(filteredEquipment, filteredErrors, filteredRepairs)
          break
        }

        case 'spare-parts': {
          const response = await api.get('/spare-parts')
          data = applyCommonFilters(response.data.spareParts || [], filters)
          break
        }

        case 'maintenance': {
          const response = await api.get('/maintenance')
          data = applyCommonFilters(response.data.schedules || [], filters)
          break
        }

        case 'engineer-performance': {
          const response = await api.get('/users')
          const users = response.data.users || []
          data = users.filter((u) => u.role_name === 'ENGINEER').map((u) => ({
            name: u.full_name,
            email: u.email,
            status: u.is_active ? 'Active' : 'Inactive',
            completed: u.completed_count || 0,
            pending: u.pending_count || 0,
            critical: u.critical_count || 0,
            completion_rate: u.completion_rate || '0.0%',
            avg_resolution_time: u.avg_resolution_time || 'N/A'
          }))
          break
        }

        case 'amc': {
          const response = await api.get('/amc')
          data = applyCommonFilters(response.data.contracts || [], filters)
          break
        }

        default:
          toast.warning('Unknown report type')
          setLoading(false)
          return
      }

      setReportData({
        success: true,
        data,
        total: data.length,
        generatedAt: new Date().toISOString(),
        period: periodValActual,
        filters,
        type: reportTypeVal
      })

      toast.success(`✅ ${reportTypeVal.replace('-', ' ')} report generated! (${data.length} rows)`)
    } catch (error) {
      console.error('❌ Report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [reportType, period, filters])

  useEffect(() => {
    generateReport('downtime', 'monthly')
  }, [])

  const handleView = (item) => {
    setSelectedItem(item)
    setOpenViewDialog(true)
  }

  const handleExport = (format) => {
    const sourceData = filteredData

    if (!sourceData || sourceData.length === 0) {
      toast.warning('No data to export. Please generate a report first.')
      return
    }

    const exportData = getCleanExportData(sourceData, reportType)
    const filename = getReportTitle(reportType).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')

    switch (format) {
      case 'CSV':
        exportToCSV(exportData, filename)
        break
      case 'Excel':
        exportToExcel(exportData, filename, reportType)
        break
      case 'PDF':
        exportToPDF(exportData, filename, reportType)
        break
      default:
        toast.info('Export format not supported')
    }

    setExportAnchorEl(null)
  }

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  const filteredData = useMemo(() => {
    const data = reportData?.data || []

    if (!Array.isArray(data)) return []

    let filtered = data.filter(item => {
      if (!searchTerm || searchTerm.trim() === '') return true

      const searchLower = searchTerm.toLowerCase().trim()

      const searchableFields = [
        item.name,
        item.title,
        item.hospital_name,
        item.hospital,
        item.equipment_name,
        item['Equipment Name'],
        item.type,
        item.category,
        item.status,
        item.city,
        item.state,
        item.manufacturer,
        item.model,
        item.part_name,
        item.error_title,
        item.engineer_name,
        item.email,
        item.vendor_name,
        item.period,
        item['Serial / Asset No.'],
        item['Equipment ID'],
        item['Department']
      ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase())

      return searchableFields.some(field => field.includes(searchLower))
    })

    return filtered
  }, [reportData?.data, searchTerm, filters.status])

  const totalRecords = filteredData.length

  const chartData = useMemo(() => {
    if (reportType !== 'downtime' || !filteredData || filteredData.length === 0) return null
    
    const topEquipment = filteredData
      .map(item => ({
        name: item['Equipment Name'] || 'N/A',
        downtime: num(item['Total Downtime (Days)'] || 0),
        failures: num(item['Total Failures'] || 0),
        critical: num(item['Critical Failures'] || 0),
        availability: num(item['Availability %'] || 100)
      }))
      .sort((a, b) => b.downtime - a.downtime)
    
    const totalDays = filteredData.reduce((sum, item) => sum + num(item['Total Downtime (Days)']), 0)
    const totalHours = totalDays * 24
    
    return {
      topEquipment,
      totalDays,
      totalWeeks: totalDays / 7,
      totalMonths: totalDays / 30.44,
      avgAvailability: average(filteredData.map(item => num(item['Availability %'] || 100)))
    }
  }, [reportType, filteredData])

  const handleFilterClick = (event) => {
    if (isMobile) {
      setFilterDrawerOpen(true)
    } else {
      setFilterAnchorEl(event.currentTarget)
    }
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handlePeriodChange = (value) => {
    setPeriod(value)
    setFilters({ ...filters, period: value })
  }

  const handleReportTypeChange = (value) => {
    setReportType(value)
  }

  const applyFilters = () => {
    handleFilterClose()
    generateReport(reportType, period)
    toast.info('📊 Filters applied successfully!')
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      hospital: '',
      startDate: '',
      endDate: '',
      period: 'monthly'
    })
    setPeriod('monthly')
    setSearchTerm('')
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
    toast.info('🧹 Filters cleared')
  }

  const handleRefresh = () => {
    setReportData(null)
    generateReport(reportType, period)
    toast.info('🔄 Refreshing report data...')
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const isErrorReport = ['monthly', 'weekly', 'daily', 'yearly'].includes(reportType)

  return (
    <>
      <style>{reportStyles}</style>
      
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* HEADER */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              color: '#0F172A',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: 0,
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, #67E8F9, #0F172A)',
                borderRadius: '2px',
              }
            }}>
              Reports & Analytics
            </Typography>
            <Chip
              icon={<Assessment sx={{ fontSize: 16 }} />}
              label={`${totalRecords} Records`}
              size="small"
              sx={{
                bgcolor: '#0F172A',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': { color: '#67E8F9' }
              }}
            />
          </Box>
          <Box sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={loading}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                flex: { xs: '1 1 auto', sm: 'none' },
                borderColor: '#0F172A',
                color: '#0F172A',
                '&:hover': { 
                  borderColor: '#67E8F9', 
                  color: '#67E8F9',
                  boxShadow: '0 0 20px rgba(103, 232, 249, 0.1)',
                  bgcolor: 'rgba(103, 232, 249, 0.05)',
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              startIcon={loading ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              onClick={handleExportClick}
              disabled={loading || filteredData.length === 0}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                flex: { xs: '1 1 auto', sm: 'none' },
                bgcolor: '#0F172A',
                '&:hover': { 
                  bgcolor: '#1E3A5F',
                  boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                },
                boxShadow: '0 4px 16px rgba(103, 232, 249, 0.15)',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              startIcon={<Download />}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* LOADING INDICATOR */}
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(103, 232, 249, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#67E8F9' } }} />}

        {/* ERROR DISPLAY */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2, border: `1px solid ${colors.error}33` }}
            action={
              <Button color="inherit" size="small" onClick={() => generateReport(reportType, period)} sx={{ color: '#0F172A' }}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* EXPORT MENU */}
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={handleExportClose}
          PaperProps={{
            sx: {
              p: 1,
              width: 200,
              borderRadius: 2,
              border: `1px solid rgba(103, 232, 249, 0.1)`
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleExport('CSV')} sx={{ gap: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
            <FileDownload fontSize="small" sx={{ color: '#3B82F6' }} />
            <Typography variant="body2" sx={{ color: '#0F172A' }}>Export as CSV</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleExport('Excel')} sx={{ gap: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
            <TableChart fontSize="small" sx={{ color: '#22C55E' }} />
            <Typography variant="body2" sx={{ color: '#0F172A' }}>Export as Excel</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleExport('PDF')} sx={{ gap: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
            <PictureAsPdf fontSize="small" sx={{ color: '#EF4444' }} />
            <Typography variant="body2" sx={{ color: '#0F172A' }}>Export as PDF</Typography>
          </MenuItem>
        </Menu>

        {/* STATS CARDS - DOWNTIME SHOW IN DAYS */}
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          {reportType === 'downtime' ? (
            <>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Equipment"
                  value={filteredData.length}
                  color="#0F172A"
                  icon={<MedicalServices sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Total Failures"
                  value={filteredData.reduce((sum, row) => sum + num(row['Total Failures']), 0)}
                  color="#F59E0B"
                  bgColor="#F59E0B10"
                  icon={<ErrorOutline sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Critical Failures"
                  value={filteredData.reduce((sum, row) => sum + num(row['Critical Failures']), 0)}
                  color="#EF4444"
                  bgColor="#EF444410"
                  icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Total Downtime"
                  value={`${filteredData.reduce((sum, row) => sum + num(row['Total Downtime (Days)']), 0).toFixed(1)} days`}
                  color="#EF4444"
                  bgColor="#EF444410"
                  icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Avg Availability"
                  value={`${average(
                    filteredData
                      .map(row => parseFloat(String(row['Availability %'] || '').replace('%', '')))
                      .filter(Number.isFinite)
                  ).toFixed(1)}%`}
                  color="#6f42c1"
                  bgColor="#f3e5f5"
                  icon={<TrendingUp sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
            </>
          ) : isErrorReport ? (
            <>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Total Errors"
                  value={filteredData.reduce((sum, row) => sum + num(row.total_errors), 0)}
                  color="#0F172A"
                  icon={<Assessment sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Resolved"
                  value={filteredData.reduce((sum, row) => sum + num(row.resolved), 0)}
                  color="#22C55E"
                  bgColor="#22C55E10"
                  icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Open"
                  value={filteredData.reduce((sum, row) => sum + num(row.open), 0)}
                  color="#F59E0B"
                  bgColor="#F59E0B10"
                  icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Critical"
                  value={filteredData.reduce((sum, row) => sum + num(row.critical), 0)}
                  color="#EF4444"
                  bgColor="#EF444410"
                  icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Resolution Rate"
                  value={percentage(
                    filteredData.reduce((sum, row) => sum + num(row.resolved), 0),
                    filteredData.reduce((sum, row) => sum + num(row.total_errors), 0)
                  )}
                  color="#6f42c1"
                  bgColor="#f3e5f5"
                  icon={<BarChart sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Total Records"
                  value={totalRecords}
                  color="#0F172A"
                  icon={<Assessment sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Active"
                  value={filteredData.filter(d => d.status === 'Active' || d.status === 'Completed' || d.status === 'Resolved').length}
                  color="#22C55E"
                  bgColor="#22C55E10"
                  icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Pending"
                  value={filteredData.filter(d => d.status === 'Pending' || d.status === 'In Progress' || d.status === 'Scheduled').length}
                  color="#F59E0B"
                  bgColor="#F59E0B10"
                  icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Critical"
                  value={filteredData.filter(d => d.severity === 'Critical' || d.priority === 'Critical' || d.critical_errors > 0).length}
                  color="#EF4444"
                  bgColor="#EF444410"
                  icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatsCard
                  title="Downtime"
                  value={`${filteredData.reduce((sum, row) => sum + num(row['Total Downtime (Days)'] || row.downtime_days || 0), 0).toFixed(1)} days`}
                  color="#EF4444"
                  bgColor="#EF444410"
                  icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
                  loading={loading}
                />
              </Grid>
            </>
          )}
        </Grid>

        {/* ✅ CHARTS SECTION - SIRF DOWNTIME REPORT KE LIYE */}
        {reportType === 'downtime' && chartData && chartData.topEquipment.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={7}>
              <DowntimeBarChart data={chartData.topEquipment} />
            </Grid>
            <Grid item xs={12} md={5}>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12}>
                  <AvailabilityGauge value={chartData.avgAvailability} />
                </Grid>
                <Grid item xs={12}>
                  <DowntimeBreakdown 
                    days={chartData.totalDays}
                    weeks={chartData.totalWeeks}
                    months={chartData.totalMonths}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <FailureComparisonChart data={chartData.topEquipment} />
            </Grid>
          </Grid>
        )}

        {/* SEARCH & FILTER */}
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          borderRadius: 3, 
          border: `1px solid rgba(103, 232, 249, 0.1)`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <TextField
              size="small"
              placeholder="Search by title, type, status, hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                flexGrow: 1, 
                minWidth: { xs: '100%', sm: 200 },
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#67E8F9' },
                  '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#64748B' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {isMobile && (
              <Button
                variant="outlined"
                onClick={toggleFilters}
                endIcon={showFilters ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                fullWidth
                size="small"
                sx={{
                  borderColor: '#0F172A',
                  color: '#0F172A',
                  '&:hover': { 
                    borderColor: '#67E8F9', 
                    color: '#67E8F9',
                    bgcolor: 'rgba(103, 232, 249, 0.05)',
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            )}

            {!isMobile && (
              <>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel sx={{ color: '#64748B' }}>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value)
                      generateReport(e.target.value, period)
                    }}
                    label="Report Type"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {superAdminReportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                  <InputLabel sx={{ color: '#64748B' }}>Period</InputLabel>
                  <Select
                    value={period}
                    onChange={(e) => {
                      setPeriod(e.target.value)
                      setFilters({ ...filters, period: e.target.value })
                    }}
                    label="Period"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {periodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={handleFilterClick}
                  sx={{
                    borderColor: '#0F172A',
                    color: '#0F172A',
                    '&:hover': { 
                      borderColor: '#67E8F9', 
                      color: '#67E8F9',
                      bgcolor: 'rgba(103, 232, 249, 0.05)',
                    },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                  startIcon={<FilterList />}
                >
                  Filter
                </Button>
                <Button
                  variant="contained"
                  onClick={() => generateReport(reportType, period)}
                  disabled={loading}
                  sx={{
                    bgcolor: '#0F172A',
                    '&:hover': { 
                      bgcolor: '#1E3A5F',
                      boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                    },
                    borderRadius: 2,
                    boxShadow: '0 4px 16px rgba(103, 232, 249, 0.15)',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                  startIcon={<Refresh />}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </>
            )}
          </Box>

          {isMobile && (
            <Collapse in={showFilters} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: '#64748B' }}>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value)
                      generateReport(e.target.value, period)
                    }}
                    label="Report Type"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {superAdminReportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: '#64748B' }}>Period</InputLabel>
                  <Select
                    value={period}
                    onChange={(e) => {
                      setPeriod(e.target.value)
                      setFilters({ ...filters, period: e.target.value })
                    }}
                    label="Period"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {periodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleFilterClick}
                    fullWidth
                    size="small"
                    sx={{
                      borderColor: '#0F172A',
                      color: '#0F172A',
                      '&:hover': { 
                        borderColor: '#67E8F9', 
                        color: '#67E8F9',
                        bgcolor: 'rgba(103, 232, 249, 0.05)',
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                    startIcon={<FilterList />}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => generateReport(reportType, period)}
                    disabled={loading}
                    sx={{
                      bgcolor: '#0F172A',
                      '&:hover': { 
                        bgcolor: '#1E3A5F',
                        boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                    fullWidth
                    size="small"
                    startIcon={<Refresh />}
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </Box>
              </Box>
            </Collapse>
          )}
        </Paper>

        {/* FILTER MENU / DRAWER */}
        <FilterMenu
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          open={filterDrawerOpen}
          onOpen={() => setFilterDrawerOpen(true)}
          onDrawerClose={handleFilterClose}
          isMobile={isMobile}
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={applyFilters}
          onClear={clearFilters}
          period={period}
          onPeriodChange={handlePeriodChange}
          periodOptions={periodOptions}
          reportTypes={superAdminReportTypes}
          selectedReportType={reportType}
          onReportTypeChange={handleReportTypeChange}
          additionalFilters={additionalFilters}
        />

        {/* TABLE */}
        <Paper sx={{ 
          borderRadius: 3, 
          overflow: 'hidden', 
          border: `1px solid rgba(103, 232, 249, 0.1)`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ 
                bgcolor: '#0F172A',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              }}>
                <TableRow>
                  {reportType === 'downtime' ? (
                    <>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Equipment</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Hospital</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Failures</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Critical</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Downtime (Days)</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Availability</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                    </>
                  ) : isErrorReport ? (
                    <>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Period</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Total</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Resolved</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Open</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Critical</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Title</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Date</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <LinearProgress sx={{ my: 2, bgcolor: 'rgba(103, 232, 249, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#67E8F9' } }} />
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box sx={{ py: 4 }}>
                        <Search sx={{ fontSize: 48, color: '#64748B', mb: 1 }} />
                        <Typography variant="body1" color="textSecondary" sx={{ color: '#64748B' }}>
                          {searchTerm || filters.status || filters.hospital
                            ? 'No results found matching your search/filters'
                            : 'No reports found. Click "Generate Report" to create a report.'}
                        </Typography>
                        {(searchTerm || filters.status || filters.hospital) && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={clearFilters}
                            sx={{
                              borderColor: '#0F172A',
                              color: '#0F172A',
                              '&:hover': { 
                                borderColor: '#67E8F9', 
                                color: '#67E8F9',
                                bgcolor: 'rgba(103, 232, 249, 0.05)',
                              },
                              mt: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className="table-row-hover"
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(103, 232, 249, 0.04) !important',
                        }
                      }}
                    >
                      {reportType === 'downtime' ? (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                              {item['Equipment Name'] || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: '#64748B' }}>{item.Hospital || 'N/A'}</TableCell>
                          <TableCell align="center">{item['Total Failures'] ?? 0}</TableCell>
                          <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                            {item['Critical Failures'] ?? 0}
                          </TableCell>
                          <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 700 }}>
                            {item['Total Downtime (Days)'] ?? 0} days
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item['Availability %'] || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor: parseFloat(item['Availability %']) >= 90 ? '#22C55E' :
                                  parseFloat(item['Availability %']) >= 70 ? '#F59E0B' :
                                  '#EF4444',
                                color: 'white',
                                fontWeight: 600,
                                boxShadow: `0 2px 8px ${parseFloat(item['Availability %']) >= 90 ? '#22C55E44' : parseFloat(item['Availability %']) >= 70 ? '#F59E0B44' : '#EF444444'}`
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(item)}
                                sx={{ 
                                  color: '#0F172A', 
                                  '&:hover': { 
                                    color: '#67E8F9',
                                    bgcolor: 'rgba(103, 232, 249, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : isErrorReport ? (
                        <>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                              {item.period}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.total_errors}</TableCell>
                          <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>{item.resolved}</TableCell>
                          <TableCell align="center" sx={{ color: '#F59E0B', fontWeight: 600 }}>{item.open}</TableCell>
                          <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>{item.critical}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(item)}
                                sx={{ 
                                  color: '#0F172A', 
                                  '&:hover': { 
                                    color: '#67E8F9',
                                    bgcolor: 'rgba(103, 232, 249, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                              {item.title || item.name || item.error_title || item.equipment_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                              {item.type || item.category || reportType || 'Report'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.status || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor: item.status === 'Completed' || item.status === 'Resolved' || item.status === 'Active' ? '#22C55E' :
                                  item.status === 'Pending' || item.status === 'Scheduled' ? '#F59E0B' :
                                  item.status === 'In Progress' ? '#3B82F6' :
                                  item.status === 'Critical' ? '#EF4444' : '#64748B',
                                color: 'white',
                                fontWeight: 500,
                                height: 22,
                                fontSize: '10px',
                                boxShadow: `0 2px 8px ${item.status === 'Completed' || item.status === 'Resolved' || item.status === 'Active' ? '#22C55E44' : item.status === 'Pending' ? '#F59E0B44' : '#64748B44'}`
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                              {formatDate(item.created_at || item.date || item.repair_date)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(item)}
                                sx={{ 
                                  color: '#0F172A', 
                                  '&:hover': { 
                                    color: '#67E8F9',
                                    bgcolor: 'rgba(103, 232, 249, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* VIEW DIALOG */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: `1px solid rgba(103, 232, 249, 0.1)`
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: '#0F172A',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: 'white',
            borderBottom: `2px solid #67E8F9`,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>
                Report Details
              </Typography>
              <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white', '&:hover': { color: '#67E8F9' } }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedItem && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(103, 232, 249, 0.04)', 
                    borderRadius: 2, 
                    border: `1px solid #67E8F9`,
                  }}>
                    <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 600 }}>
                      {selectedItem.title || selectedItem.name || selectedItem['Equipment Name'] || selectedItem.error_title || 'Report'}
                    </Typography>
                    <Chip
                      label={selectedItem.type || selectedItem.category || reportType || 'Report'}
                      size="small"
                      sx={{ mt: 1, bgcolor: '#0F172A', color: 'white', fontWeight: 600 }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    Report Information
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Status</Typography>
                      <Chip
                        label={selectedItem.status || 'N/A'}
                        size="small"
                        sx={{
                          bgcolor: selectedItem.status === 'Completed' || selectedItem.status === 'Resolved' ? '#22C55E' :
                            selectedItem.status === 'Pending' ? '#F59E0B' :
                            selectedItem.status === 'In Progress' ? '#3B82F6' :
                            selectedItem.status === 'Critical' ? '#EF4444' : '#64748B',
                          color: 'white',
                          fontWeight: 500,
                          height: 22,
                          fontSize: '10px'
                        }}
                      />
                    </Box>
                    {selectedItem['Total Failures'] !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Total Failures</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                          {selectedItem['Total Failures']}
                        </Typography>
                      </Box>
                    )}
                    {selectedItem['Total Downtime (Days)'] !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Downtime</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                          {selectedItem['Total Downtime (Days)']} days
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    Location Information
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Hospital</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.hospital_name || selectedItem.hospital || selectedItem.Hospital || 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    Date & Time
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Report Date</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatDateTime(selectedItem.created_at || selectedItem.date || selectedItem.repair_date)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: 'rgba(103, 232, 249, 0.1)' }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const dataToExport = [selectedItem]
                        exportToPDF(getCleanExportData(dataToExport, reportType), `${reportType}_${selectedItem.id || 'item'}`)
                      }}
                      sx={{
                        bgcolor: '#EF4444',
                        '&:hover': { bgcolor: '#dc2626', boxShadow: '0 4px 24px rgba(239, 68, 68, 0.3)' },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                      startIcon={<PictureAsPdf />}
                    >
                      Export as PDF
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const dataToExport = [selectedItem]
                        exportToExcel(getCleanExportData(dataToExport, reportType), `${reportType}_${selectedItem.id || 'item'}`)
                      }}
                      sx={{
                        bgcolor: '#22C55E',
                        '&:hover': { bgcolor: '#16a34a', boxShadow: '0 4px 24px rgba(34, 197, 94, 0.3)' },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                      startIcon={<TableChart />}
                    >
                      Export as Excel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setOpenViewDialog(false)}
              variant="contained"
              sx={{
                bgcolor: '#0F172A',
                '&:hover': { 
                  bgcolor: '#1E3A5F',
                  boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  )
}

// ============================================================
// ✅ ENGINEER REPORTS
// ============================================================
const EngineerReports = () => {
  const { user } = useSelector((state) => state.auth)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const engineerId = user?.id || user?.user_id || user?.userId
  const engineerName = user?.full_name || user?.name || user?.username || 'Engineer'

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [reportType, setReportType] = useState('my-downtime')
  const [reportData, setReportData] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [period, setPeriod] = useState('monthly')
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    period: 'monthly'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  const engineerReportTypes = [
    { value: 'my-downtime', label: 'My Downtime Report' },
    { value: 'my-errors', label: 'My Error Reports' },
    { value: 'my-maintenance', label: 'My Maintenance Report' },
    { value: 'my-equipment', label: 'My Equipment Performance' },
    { value: 'my-performance', label: 'My Performance' }
  ]

  const generateReport = useCallback(async (type, periodVal) => {
    const reportTypeVal = type || reportType
    const periodValActual = periodVal || period

    if (!engineerId) {
      toast.error('Engineer ID not found. Please log in again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let data = []

      switch (reportTypeVal) {
        case 'my-errors':
        case 'my-downtime': {
          const response = await api.get(`/errors?engineer_id=${engineerId}`)
          const allErrors = response.data.errors || []

          const filteredErrors = allErrors.filter((e) => {
            if (filters.status && e.status !== filters.status) return false

            const recordDate = getRecordDate(e)

            if (filters.startDate && recordDate) {
              const start = new Date(`${filters.startDate}T00:00:00`)
              if (new Date(recordDate) < start) return false
            }

            if (filters.endDate && recordDate) {
              const end = new Date(`${filters.endDate}T23:59:59`)
              if (new Date(recordDate) > end) return false
            }

            const assignedEngineer = e.assigned_engineer_id || e.engineer_id || e.assigned_to
            return String(assignedEngineer) === String(engineerId)
          })

          if (reportTypeVal === 'my-errors') {
            data = buildErrorSummaryRows(filteredErrors, periodValActual)
          } else {
            const equipmentRes = await api.get('/equipment')
            const equipment = equipmentRes.data.equipment || []
            const repairsRes = await api.get('/repairs')
            const repairs = (repairsRes.data.repairs || []).filter(r =>
              String(r.engineer_id || r.assigned_engineer_id) === String(engineerId)
            )
            data = buildDowntimeRows(equipment, filteredErrors, repairs)
          }
          break
        }

        case 'my-maintenance': {
          const response = await api.get(`/maintenance?engineer_id=${engineerId}`)
          const allMaintenance = response.data.schedules || []

          data = allMaintenance.filter((m) => {
            if (filters.status && m.status !== filters.status) return false

            const recordDate = getRecordDate(m)

            if (filters.startDate && recordDate) {
              const start = new Date(`${filters.startDate}T00:00:00`)
              if (new Date(recordDate) < start) return false
            }

            if (filters.endDate && recordDate) {
              const end = new Date(`${filters.endDate}T23:59:59`)
              if (new Date(recordDate) > end) return false
            }

            return String(m.engineer_id || m.assigned_engineer_id) === String(engineerId)
          }).map(m => ({
            ...m,
            equipment_name: m.equipment_name || m.equipment?.name || 'N/A',
            hospital_name: m.hospital_name || m.hospital?.name || 'N/A'
          }))
          break
        }

        case 'my-equipment': {
          const equipmentRes = await api.get(`/equipment?engineer_id=${engineerId}`)
          const equipment = equipmentRes.data.equipment || []

          const errorsRes = await api.get('/errors')
          const allErrors = errorsRes.data.errors || []

          const repairsRes = await api.get('/repairs')
          const allRepairs = repairsRes.data.repairs || []

          const assignedEquipment = equipment.filter(e =>
            String(e.assigned_engineer_id || e.engineer_id) === String(engineerId) &&
            statusMatches(e, filters)
          )

          const filteredErrors = applyCommonFilters(allErrors, { ...filters, hospital: '' })
            .filter(e => String(e.assigned_engineer_id || e.engineer_id || e.assigned_to) === String(engineerId))
          const filteredRepairs = applyCommonFilters(allRepairs, { ...filters, hospital: '' })
            .filter(r => String(r.engineer_id || r.assigned_engineer_id) === String(engineerId))

          data = buildEquipmentLifecycleRows(assignedEquipment, filteredErrors, filteredRepairs)
          break
        }

        case 'my-performance': {
          const errorsRes = await api.get(`/errors?engineer_id=${engineerId}`)
          const errors = applyCommonFilters(errorsRes.data.errors || [], filters)
            .filter(e => String(e.assigned_engineer_id || e.engineer_id || e.assigned_to) === String(engineerId))

          const total = errors.length
          const completed = errors.filter(e =>
            ['resolved', 'closed', 'completed'].includes(String(e.status || '').toLowerCase())
          ).length
          const pending = errors.filter(e =>
            ['open', 'pending', 'in progress'].includes(String(e.status || '').toLowerCase())
          ).length
          const critical = errors.filter(e =>
            String(e.severity || '').toLowerCase() === 'critical'
          ).length

          const resolutionTimes = errors
            .filter(e => ['resolved', 'closed', 'completed'].includes(String(e.status || '').toLowerCase()))
            .map(e => getDowntimeHours(e))
            .filter(h => h > 0)

          const performanceByPeriod = {}
          errors.forEach((e) => {
            const key = getPeriodKey(getRecordDate(e), periodValActual)
            if (!performanceByPeriod[key]) {
              performanceByPeriod[key] = {
                period: formatPeriodLabel(key, periodValActual),
                total: 0,
                completed: 0,
                pending: 0,
                critical: 0,
                resolution_hours: []
              }
            }
            const p = performanceByPeriod[key]
            p.total += 1
            if (['resolved', 'closed', 'completed'].includes(String(e.status || '').toLowerCase())) {
              p.completed += 1
            } else {
              p.pending += 1
            }
            if (String(e.severity || '').toLowerCase() === 'critical') {
              p.critical += 1
            }
            const hours = getDowntimeHours(e)
            if (hours > 0) p.resolution_hours.push(hours)
          })

          data = Object.values(performanceByPeriod)
            .sort((a, b) => String(a.period).localeCompare(String(b.period)))
            .map(p => ({
              period: p.period,
              total: p.total,
              completed: p.completed,
              pending: p.pending,
              critical: p.critical,
              completion_rate: percentage(p.completed, p.total),
              avg_resolution_time: p.resolution_hours.length
                ? `${average(p.resolution_hours).toFixed(1)} hrs`
                : 'N/A'
            }))

          data._summary = {
            total_tasks: total,
            completed: completed,
            pending: pending,
            critical: critical,
            completion_rate: percentage(completed, total),
            avg_resolution_time: resolutionTimes.length
              ? `${average(resolutionTimes).toFixed(1)} hrs`
              : 'N/A',
            engineer_name: engineerName
          }
          break
        }

        default:
          toast.warning('Unknown report type')
          setLoading(false)
          return
      }

      setReportData({
        success: true,
        data,
        total: data.length,
        generatedAt: new Date().toISOString(),
        period: periodValActual,
        filters,
        type: reportTypeVal,
        engineer_id: engineerId,
        engineer_name: engineerName
      })

      toast.success(`✅ ${reportTypeVal.replace('-', ' ')} report generated!`)
    } catch (error) {
      console.error('❌ Report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [reportType, period, filters, engineerId, engineerName])

  useEffect(() => {
    if (engineerId) {
      generateReport('my-downtime', 'monthly')
    }
  }, [engineerId])

  const handleView = (item) => {
    setSelectedItem(item)
    setOpenViewDialog(true)
  }

  const handleExport = (format) => {
    const sourceData = filteredData

    if (!sourceData || sourceData.length === 0) {
      toast.warning('No data to export. Please generate a report first.')
      return
    }

    const exportData = getCleanExportData(sourceData, reportType)
    const filename = getReportTitle(reportType).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')

    switch (format) {
      case 'CSV':
        exportToCSV(exportData, filename)
        break
      case 'Excel':
        exportToExcel(exportData, filename, reportType)
        break
      case 'PDF':
        exportToPDF(exportData, filename, reportType)
        break
      default:
        toast.info('Export format not supported')
    }

    setExportAnchorEl(null)
  }

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  const filteredData = useMemo(() => {
    let data = reportData?.data || []

    if (!Array.isArray(data)) return []

    const cleanData = data.filter(item => item.period !== undefined || item['Equipment Name'] !== undefined || item.equipment_name !== undefined)

    let filtered = cleanData.filter(item => {
      if (!searchTerm || searchTerm.trim() === '') return true

      const searchLower = searchTerm.toLowerCase().trim()

      const searchableFields = [
        item.period,
        item['Equipment Name'],
        item.equipment_name,
        item.name,
        item.title,
        item.hospital_name,
        item.hospital,
        item['Hospital'],
        item.status,
        item.type,
        item['Serial / Asset No.'],
        item['Department']
      ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase())

      return searchableFields.some(field => field.includes(searchLower))
    })

    return filtered
  }, [reportData?.data, searchTerm, filters.status])

  const totalRecords = filteredData.length

  const summaryData = reportData?.data?._summary || null

  // ✅ CHART DATA - ENGINEER DOWNTIME
  const chartData = useMemo(() => {
    if (reportType !== 'my-downtime' || !filteredData || filteredData.length === 0) return null
    
    const topEquipment = filteredData
      .map(item => ({
        name: item['Equipment Name'] || 'N/A',
        downtime: num(item['Total Downtime (Days)'] || 0),
        failures: num(item['Total Failures'] || 0),
        critical: num(item['Critical Failures'] || 0),
        availability: num(item['Availability %'] || 100)
      }))
      .sort((a, b) => b.downtime - a.downtime)
    
    const totalDays = filteredData.reduce((sum, item) => sum + num(item['Total Downtime (Days)']), 0)
    
    return {
      topEquipment,
      totalDays,
      totalWeeks: totalDays / 7,
      totalMonths: totalDays / 30.44,
      avgAvailability: average(filteredData.map(item => num(item['Availability %'] || 100)))
    }
  }, [reportType, filteredData])

  const handleFilterClick = (event) => {
    if (isMobile) {
      setFilterDrawerOpen(true)
    } else {
      setFilterAnchorEl(event.currentTarget)
    }
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handlePeriodChange = (value) => {
    setPeriod(value)
    setFilters({ ...filters, period: value })
  }

  const handleReportTypeChange = (value) => {
    setReportType(value)
  }

  const applyFilters = () => {
    handleFilterClose()
    generateReport(reportType, period)
    toast.info('📊 Filters applied successfully!')
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      period: 'monthly'
    })
    setPeriod('monthly')
    setSearchTerm('')
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
    toast.info('🧹 Filters cleared')
  }

  const handleRefresh = () => {
    setReportData(null)
    generateReport(reportType, period)
    toast.info('🔄 Refreshing report data...')
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const isErrorReport = ['my-errors'].includes(reportType)

  return (
    <>
      <style>{reportStyles}</style>
      
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* HEADER */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              color: '#0F172A',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: 0,
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, #67E8F9, #0F172A)',
                borderRadius: '2px',
              }
            }}>
              My Reports
            </Typography>
            <Chip
              icon={<Person sx={{ fontSize: 16 }} />}
              label={engineerName}
              size="small"
              sx={{
                bgcolor: '#0F172A',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': { color: '#67E8F9' }
              }}
            />
            <Chip
              icon={<Assessment sx={{ fontSize: 16 }} />}
              label={`${totalRecords} Records`}
              size="small"
              sx={{
                bgcolor: '#0F172A',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': { color: '#67E8F9' }
              }}
            />
          </Box>
          <Box sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={loading}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                flex: { xs: '1 1 auto', sm: 'none' },
                borderColor: '#0F172A',
                color: '#0F172A',
                '&:hover': { 
                  borderColor: '#67E8F9', 
                  color: '#67E8F9',
                  boxShadow: '0 0 20px rgba(103, 232, 249, 0.1)',
                  bgcolor: 'rgba(103, 232, 249, 0.05)',
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              startIcon={loading ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              onClick={handleExportClick}
              disabled={loading || filteredData.length === 0}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                flex: { xs: '1 1 auto', sm: 'none' },
                bgcolor: '#0F172A',
                '&:hover': { 
                  bgcolor: '#1E3A5F',
                  boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                },
                boxShadow: '0 4px 16px rgba(103, 232, 249, 0.15)',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              startIcon={<Download />}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* ENGINEER PERFORMANCE SUMMARY CARDS */}
        {summaryData && reportType === 'my-performance' && (
          <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Total Tasks"
                value={summaryData.total_tasks}
                color="#0F172A"
                icon={<Assessment sx={{ fontSize: 20, color: 'white' }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Completed"
                value={summaryData.completed}
                color="#22C55E"
                bgColor="#22C55E10"
                icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Pending"
                value={summaryData.pending}
                color="#F59E0B"
                bgColor="#F59E0B10"
                icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Critical"
                value={summaryData.critical}
                color="#EF4444"
                bgColor="#EF444410"
                icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Completion Rate"
                value={summaryData.completion_rate}
                color="#6f42c1"
                bgColor="#f3e5f5"
                icon={<BarChart sx={{ fontSize: 20, color: 'white' }} />}
                loading={loading}
              />
            </Grid>
          </Grid>
        )}

        {/* ✅ CHARTS SECTION - ENGINEER DOWNTIME */}
        {reportType === 'my-downtime' && chartData && chartData.topEquipment.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={7}>
              <DowntimeBarChart data={chartData.topEquipment} />
            </Grid>
            <Grid item xs={12} md={5}>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12}>
                  <AvailabilityGauge value={chartData.avgAvailability} />
                </Grid>
                <Grid item xs={12}>
                  <DowntimeBreakdown 
                    days={chartData.totalDays}
                    weeks={chartData.totalWeeks}
                    months={chartData.totalMonths}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <FailureComparisonChart data={chartData.topEquipment} />
            </Grid>
          </Grid>
        )}

        {/* LOADING INDICATOR */}
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(103, 232, 249, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#67E8F9' } }} />}

        {/* ERROR DISPLAY */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2, border: `1px solid ${colors.error}33` }}
            action={
              <Button color="inherit" size="small" onClick={() => generateReport(reportType, period)} sx={{ color: '#0F172A' }}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* EXPORT MENU */}
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={handleExportClose}
          PaperProps={{
            sx: {
              p: 1,
              width: 200,
              borderRadius: 2,
              border: `1px solid rgba(103, 232, 249, 0.1)`
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleExport('CSV')} sx={{ gap: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
            <FileDownload fontSize="small" sx={{ color: '#3B82F6' }} />
            <Typography variant="body2" sx={{ color: '#0F172A' }}>Export as CSV</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleExport('Excel')} sx={{ gap: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
            <TableChart fontSize="small" sx={{ color: '#22C55E' }} />
            <Typography variant="body2" sx={{ color: '#0F172A' }}>Export as Excel</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleExport('PDF')} sx={{ gap: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
            <PictureAsPdf fontSize="small" sx={{ color: '#EF4444' }} />
            <Typography variant="body2" sx={{ color: '#0F172A' }}>Export as PDF</Typography>
          </MenuItem>
        </Menu>

        {/* SEARCH & FILTER */}
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          borderRadius: 3, 
          border: `1px solid rgba(103, 232, 249, 0.1)`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <TextField
              size="small"
              placeholder="Search by period, equipment, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                flexGrow: 1, 
                minWidth: { xs: '100%', sm: 200 },
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#67E8F9' },
                  '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#64748B' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {isMobile && (
              <Button
                variant="outlined"
                onClick={toggleFilters}
                endIcon={showFilters ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                fullWidth
                size="small"
                sx={{
                  borderColor: '#0F172A',
                  color: '#0F172A',
                  '&:hover': { 
                    borderColor: '#67E8F9', 
                    color: '#67E8F9',
                    bgcolor: 'rgba(103, 232, 249, 0.05)',
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            )}

            {!isMobile && (
              <>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel sx={{ color: '#64748B' }}>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value)
                      generateReport(e.target.value, period)
                    }}
                    label="Report Type"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {engineerReportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                  <InputLabel sx={{ color: '#64748B' }}>Period</InputLabel>
                  <Select
                    value={period}
                    onChange={(e) => {
                      setPeriod(e.target.value)
                      setFilters({ ...filters, period: e.target.value })
                    }}
                    label="Period"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {periodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={handleFilterClick}
                  sx={{
                    borderColor: '#0F172A',
                    color: '#0F172A',
                    '&:hover': { 
                      borderColor: '#67E8F9', 
                      color: '#67E8F9',
                      bgcolor: 'rgba(103, 232, 249, 0.05)',
                    },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                  startIcon={<FilterList />}
                >
                  Filter
                </Button>
                <Button
                  variant="contained"
                  onClick={() => generateReport(reportType, period)}
                  disabled={loading}
                  sx={{
                    bgcolor: '#0F172A',
                    '&:hover': { 
                      bgcolor: '#1E3A5F',
                      boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                    },
                    borderRadius: 2,
                    boxShadow: '0 4px 16px rgba(103, 232, 249, 0.15)',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                  startIcon={<Refresh />}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </>
            )}
          </Box>

          {isMobile && (
            <Collapse in={showFilters} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: '#64748B' }}>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value)
                      generateReport(e.target.value, period)
                    }}
                    label="Report Type"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {engineerReportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: '#64748B' }}>Period</InputLabel>
                  <Select
                    value={period}
                    onChange={(e) => {
                      setPeriod(e.target.value)
                      setFilters({ ...filters, period: e.target.value })
                    }}
                    label="Period"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#67E8F9' },
                        '&.Mui-focused fieldset': { borderColor: '#67E8F9' },
                      }
                    }}
                  >
                    {periodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleFilterClick}
                    fullWidth
                    size="small"
                    sx={{
                      borderColor: '#0F172A',
                      color: '#0F172A',
                      '&:hover': { 
                        borderColor: '#67E8F9', 
                        color: '#67E8F9',
                        bgcolor: 'rgba(103, 232, 249, 0.05)',
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                    startIcon={<FilterList />}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => generateReport(reportType, period)}
                    disabled={loading}
                    sx={{
                      bgcolor: '#0F172A',
                      '&:hover': { 
                        bgcolor: '#1E3A5F',
                        boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                    fullWidth
                    size="small"
                    startIcon={<Refresh />}
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </Box>
              </Box>
            </Collapse>
          )}
        </Paper>

        {/* FILTER MENU / DRAWER - No hospital filter for engineer */}
        <FilterMenu
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          open={filterDrawerOpen}
          onOpen={() => setFilterDrawerOpen(true)}
          onDrawerClose={handleFilterClose}
          isMobile={isMobile}
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={applyFilters}
          onClear={clearFilters}
          period={period}
          onPeriodChange={handlePeriodChange}
          periodOptions={periodOptions}
          reportTypes={engineerReportTypes}
          selectedReportType={reportType}
          onReportTypeChange={handleReportTypeChange}
          additionalFilters={[]}
        />

        {/* TABLE */}
        <Paper sx={{ 
          borderRadius: 3, 
          overflow: 'hidden', 
          border: `1px solid rgba(103, 232, 249, 0.1)`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ 
                bgcolor: '#0F172A',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              }}>
                <TableRow>
                  {reportType === 'my-downtime' || reportType === 'my-equipment' ? (
                    <>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Equipment</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Hospital</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Failures</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Critical</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Downtime (Days)</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Availability</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                    </>
                  ) : reportType === 'my-performance' ? (
                    <>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Period</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Total</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Completed</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Pending</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Critical</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                    </>
                  ) : isErrorReport ? (
                    <>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Period</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Total</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Resolved</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Open</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Critical</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Title</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Date</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <LinearProgress sx={{ my: 2, bgcolor: 'rgba(103, 232, 249, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#67E8F9' } }} />
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box sx={{ py: 4 }}>
                        <Search sx={{ fontSize: 48, color: '#64748B', mb: 1 }} />
                        <Typography variant="body1" color="textSecondary" sx={{ color: '#64748B' }}>
                          {searchTerm || filters.status
                            ? 'No results found matching your search/filters'
                            : 'No reports found. Click "Generate Report" to create a report.'}
                        </Typography>
                        {(searchTerm || filters.status) && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={clearFilters}
                            sx={{
                              borderColor: '#0F172A',
                              color: '#0F172A',
                              '&:hover': { 
                                borderColor: '#67E8F9', 
                                color: '#67E8F9',
                                bgcolor: 'rgba(103, 232, 249, 0.05)',
                              },
                              mt: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className="table-row-hover"
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(103, 232, 249, 0.04) !important',
                        }
                      }}
                    >
                      {reportType === 'my-downtime' || reportType === 'my-equipment' ? (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                              {item['Equipment Name'] || item.equipment_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: '#64748B' }}>{item.Hospital || item.hospital_name || 'N/A'}</TableCell>
                          <TableCell align="center">{item['Total Failures'] || item.total_failures || 0}</TableCell>
                          <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                            {item['Critical Failures'] || item.critical_failures || 0}
                          </TableCell>
                          <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 700 }}>
                            {item['Total Downtime (Days)'] || item.total_downtime_days || 0} days
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item['Availability %'] || item.availability || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor: parseFloat(item['Availability %'] || item.availability) >= 90 ? '#22C55E' :
                                  parseFloat(item['Availability %'] || item.availability) >= 70 ? '#F59E0B' :
                                  '#EF4444',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(item)}
                                sx={{ 
                                  color: '#0F172A', 
                                  '&:hover': { 
                                    color: '#67E8F9',
                                    bgcolor: 'rgba(103, 232, 249, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : reportType === 'my-performance' ? (
                        <>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                              {item.period}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.total}</TableCell>
                          <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>{item.completed}</TableCell>
                          <TableCell align="center" sx={{ color: '#F59E0B', fontWeight: 600 }}>{item.pending}</TableCell>
                          <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>{item.critical}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(item)}
                                sx={{ 
                                  color: '#0F172A', 
                                  '&:hover': { 
                                    color: '#67E8F9',
                                    bgcolor: 'rgba(103, 232, 249, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : isErrorReport ? (
                        <>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                              {item.period}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.total_errors}</TableCell>
                          <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>{item.resolved}</TableCell>
                          <TableCell align="center" sx={{ color: '#F59E0B', fontWeight: 600 }}>{item.open}</TableCell>
                          <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>{item.critical}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(item)}
                                sx={{ 
                                  color: '#0F172A', 
                                  '&:hover': { 
                                    color: '#67E8F9',
                                    bgcolor: 'rgba(103, 232, 249, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                              {item.title || item.name || item.equipment_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                              {item.type || item.maintenance_type || 'Maintenance'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.status || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor: item.status === 'Completed' ? '#22C55E' :
                                  item.status === 'Scheduled' ? '#3B82F6' :
                                  item.status === 'In Progress' ? '#F59E0B' :
                                  item.status === 'Overdue' ? '#EF4444' : '#64748B',
                                color: 'white',
                                fontWeight: 500,
                                height: 22,
                                fontSize: '10px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                              {formatDate(item.scheduled_date || item.date)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(item)}
                                sx={{ 
                                  color: '#0F172A', 
                                  '&:hover': { 
                                    color: '#67E8F9',
                                    bgcolor: 'rgba(103, 232, 249, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* VIEW DIALOG */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: `1px solid rgba(103, 232, 249, 0.1)`
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: '#0F172A',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: 'white',
            borderBottom: `2px solid #67E8F9`,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>
                Report Details
              </Typography>
              <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white', '&:hover': { color: '#67E8F9' } }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedItem && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(103, 232, 249, 0.04)', 
                    borderRadius: 2, 
                    border: `1px solid #67E8F9`,
                  }}>
                    <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 600 }}>
                      {selectedItem.title || selectedItem.name || selectedItem['Equipment Name'] || selectedItem.equipment_name || selectedItem.period || 'Report'}
                    </Typography>
                    <Chip
                      label={selectedItem.type || selectedItem.category || reportType || 'Report'}
                      size="small"
                      sx={{ mt: 1, bgcolor: '#0F172A', color: 'white', fontWeight: 600 }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    Report Information
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Status</Typography>
                      <Chip
                        label={selectedItem.status || 'N/A'}
                        size="small"
                        sx={{
                          bgcolor: selectedItem.status === 'Completed' || selectedItem.status === 'Resolved' ? '#22C55E' :
                            selectedItem.status === 'Pending' ? '#F59E0B' :
                            selectedItem.status === 'In Progress' ? '#3B82F6' :
                            selectedItem.status === 'Critical' ? '#EF4444' : '#64748B',
                          color: 'white',
                          fontWeight: 500,
                          height: 22,
                          fontSize: '10px'
                        }}
                      />
                    </Box>
                    {selectedItem['Total Failures'] !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Total Failures</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                          {selectedItem['Total Failures']}
                        </Typography>
                      </Box>
                    )}
                    {selectedItem['Total Downtime (Days)'] !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Downtime</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                          {selectedItem['Total Downtime (Days)']} days
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    Location Information
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Hospital</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.hospital_name || selectedItem.hospital || selectedItem.Hospital || 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    Date & Time
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Report Date</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatDateTime(selectedItem.created_at || selectedItem.date || selectedItem.scheduled_date)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: 'rgba(103, 232, 249, 0.1)' }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const dataToExport = [selectedItem]
                        exportToPDF(getCleanExportData(dataToExport, reportType), `${reportType}_${selectedItem.id || 'item'}`)
                      }}
                      sx={{
                        bgcolor: '#EF4444',
                        '&:hover': { bgcolor: '#dc2626', boxShadow: '0 4px 24px rgba(239, 68, 68, 0.3)' },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                      startIcon={<PictureAsPdf />}
                    >
                      Export as PDF
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const dataToExport = [selectedItem]
                        exportToExcel(getCleanExportData(dataToExport, reportType), `${reportType}_${selectedItem.id || 'item'}`)
                      }}
                      sx={{
                        bgcolor: '#22C55E',
                        '&:hover': { bgcolor: '#16a34a', boxShadow: '0 4px 24px rgba(34, 197, 94, 0.3)' },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                      startIcon={<TableChart />}
                    >
                      Export as Excel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setOpenViewDialog(false)}
              variant="contained"
              sx={{
                bgcolor: '#0F172A',
                '&:hover': { 
                  bgcolor: '#1E3A5F',
                  boxShadow: '0 4px 24px rgba(103, 232, 249, 0.3)',
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  )
}

// ============================================================
// ✅ MAIN REPORTS COMPONENT - ROLE BASED
// ============================================================
const Reports = () => {
  const { user } = useSelector((state) => state.auth)

  const role = String(user?.role || '').toUpperCase()

  switch (role) {
    case 'SUPER_ADMIN':
      return <SuperAdminReports />

    case 'ENGINEER':
      return <EngineerReports />

    default:
      return (
        <AccessDenied
          message="You do not have permission to view reports."
        />
      )
  }
}

export default Reports