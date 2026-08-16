// src/pages/Reports.jsx
// ✅ COMPLETE FIXED VERSION
// ✅ Engineer Performance with Avg Days
// ✅ Super Admin can see all engineers
// ✅ Engineer can see own performance
// ✅ AMC: Closed removed, only Resolved for downtime calculation
// ✅ Data persists on refresh with localStorage caching
// ✅ Proper useEffect dependencies
// ✅ MAINTENANCE REPORT SUPPORT ADDED
// ✅ SPARE PARTS REPORT - USAGE + DOWNTIME COMBINED (FIXED)
// ✅ FIXED: toFixed is not a function error
// ✅ PKR CURRENCY FORMATTING FOR SPARE PARTS
// ✅ EQUIPMENT WISE REPORT - Backend Integration with Complete Data
// ✅ REMOVED: Equipment Complete Report (duplicate)
// ✅ ENGINEER HOSPITAL REPORT - Role based filtering added
// ✅ FIXED: Hospital report API call - using /error-logs instead of /errors
// ✅ MONTHLY ERROR REPORT integrated with /error-summary endpoint
// ✅ ADDED: Equipment & Hospital columns in Error Reports
// ✅ UPDATED: Unified /error-summary endpoint for daily/weekly/monthly/yearly
// ✅ FIXED: Hospital report response mapping - /error-logs returns { success: true, errors: [...] }
// ✅ FIXED: Spare Parts case - removed individual downtime API calls

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
  Receipt,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS
// ============================================================
const colors = {
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyDark: '#0A0F1E',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  darkText: '#0F172A',
  lightText: '#64748B',
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  cardAreaBg: 'rgba(103, 232, 249, 0.04)',
  cardAreaBorder: 'rgba(103, 232, 249, 0.08)',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

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

// ✅ PKR CURRENCY FORMATTER
const formatPKR = (value) => {
  if (!value || value === '0' || value === '0.00') return 'Rs. 0'
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return 'Rs. 0'
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue).replace('PKR', 'Rs.')
}

// ============================================================
// ✅ BUILD DOWNTIME ROWS
// ============================================================
const buildDowntimeRows = (equipment, errors, repairs) => {
  if (!Array.isArray(equipment)) return []
  
  return equipment.map((eq) => {
    const eqErrors = errors.filter(e => e.equipment_id === eq.id)
    const eqRepairs = repairs.filter(r => {
      const error = errors.find(e => e.id === r.error_log_id)
      return error && error.equipment_id === eq.id
    })

    const resolved = eqErrors.filter(e => 
      ['Resolved', 'Closed', 'Completed'].includes(e.status)
    )
    const open = eqErrors.filter(e => 
      ['Pending', 'In Progress', 'Open'].includes(e.status)
    )
    const critical = eqErrors.filter(e => 
      e.severity === 'Critical'
    ).length

    let totalDowntime = 0
    resolved.forEach(e => {
      if (e.created_at && e.updated_at) {
        const start = new Date(e.created_at)
        const end = new Date(e.updated_at)
        const hours = (end - start) / (1000 * 60 * 60)
        if (hours > 0) totalDowntime += hours
      }
    })

    const installationYear = eq.installation_year || 2023
    const ageInYears = new Date().getFullYear() - installationYear
    const monitoredHours = ageInYears * 365.25 * 24
    const availability = monitoredHours > 0 
      ? Math.max(0, Math.min(100, ((monitoredHours - totalDowntime) / monitoredHours) * 100))
      : 100

    return {
      'Equipment Name': eq.name || 'N/A',
      'Serial / Asset No.': eq.serial_number || 'N/A',
      'Hospital': eq.hospital_name || 'N/A',
      'Department': eq.department_name || 'N/A',
      'Equipment Status': eq.status || 'Active',
      'Total Failures': eqErrors.length,
      'Critical Failures': critical,
      'Open Errors': open.length,
      'Resolved Errors': resolved.length,
      'Resolution Rate': eqErrors.length > 0 ? `${((resolved.length / eqErrors.length) * 100).toFixed(1)}%` : '0.0%',
      'Maintenance Events': eqRepairs.length,
      'Total Downtime (Days)': (totalDowntime / 24).toFixed(1),
      'Availability %': `${availability.toFixed(1)}%`
    }
  }).filter(r => r['Total Failures'] > 0 || parseFloat(r['Total Downtime (Days)']) > 0)
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

const getCleanExportData = (data, reportType) => {
  if (!Array.isArray(data)) return []

  if (['downtime', 'my-downtime'].includes(reportType)) {
    return data.map(r => ({
      'Equipment': r['Equipment Name'] || 'N/A',
      'Hospital': r.Hospital || 'N/A',
      'Failures': r['Total Failures'] || 0,
      'Critical': r['Critical Failures'] || 0,
      'Downtime (Days)': r['Total Downtime (Days)'] || '0.0',
      'Availability %': r['Availability %'] || '100.0%'
    }))
  }

  if (['monthly', 'weekly', 'daily', 'yearly'].includes(reportType)) {
    return data.map(r => ({
      'Period': r.period || r.date || 'N/A',
      'Equipment': r.equipment_names || 'N/A',
      'Hospital': r.hospital_names || 'N/A',
      'Total': r.total_errors || 0,
      'Resolved': r.resolved || 0,
      'Pending': r.pending || 0,
      'In Progress': r.in_progress || 0,
      'Critical': r.critical || 0
    }))
  }

  if (reportType === 'amc') {
    return data.map(r => ({
      'Contract': r.contract_number || 'N/A',
      'Vendor': r.vendor_name || 'N/A',
      'Equipment': r.equipment_name || 'N/A',
      'Hospital': r.hospital_name || 'N/A',
      'Status': r.status || 'N/A',
      'Total Errors': r.total_errors || 0,
      'Pending': r.pending_errors || 0,
      'In Progress': r.in_progress_errors || 0,
      'Completed': r.completed_errors || 0,
      'Resolved': r.resolved_errors || 0,
      'Downtime (Days)': Number(r.total_downtime_days || 0).toFixed(1),
      'Days Left': r.days_remaining !== null && r.days_remaining !== undefined ? r.days_remaining : 'N/A'
    }))
  }

  if (reportType === 'engineer-performance') {
    return data.map(r => ({
      'Engineer': r.engineer_name || 'N/A',
      'Email': r.email || 'N/A',
      'Hospital': r.hospital_name || 'N/A',
      'Total Repairs': r.total_repairs || 0,
      'Completed': r.completed || 0,
      'Pending': r.pending || 0,
      'Critical': r.critical || 0,
      'Avg Days': r.avg_days || '0.0',
      'Completion Rate': r.completion_rate || '0.0%',
      'Status': r.status || 'N/A'
    }))
  }

  // ✅ MAINTENANCE EXPORT
  if (reportType === 'maintenance' || reportType === 'my-maintenance') {
    return data.map(r => ({
      'Equipment': r.equipment_name || r.name || 'N/A',
      'Type': r.maintenance_type || 'Preventive',
      'Status': r.status || 'Scheduled',
      'Engineer': r.engineer_name || 'Unassigned',
      'Next Due': formatDate(r.next_due_date),
      'Last Maintenance': formatDate(r.last_maintenance_date),
      'Downtime (Days)': Number(r.total_downtime_days || 0).toFixed(1),
      'Availability %': r.availability || '100.0%'
    }))
  }

  // ✅ SPARE PARTS EXPORT - Combined Usage + Downtime (FIXED)
  if (reportType === 'spare-parts' || reportType === 'my-spare-parts') {
    return data.map(r => ({
      'Part Name': r.part_name || 'N/A',
      'Part Number': r.part_number || 'N/A',
      'Brand': r.brand || 'N/A',
      'Quantity': r.quantity || 0,
      'Min Stock': r.minimum_stock_level || 5,
      'Status': r.status || 'Unknown',
      'Times Used': r.times_used || 0,
      'Times Out of Stock': r.times_out_of_stock || 0,
      'Downtime (Days)': Number(r.total_downtime_days || 0).toFixed(1),
      'Total Cost': formatPKR(r.total_cost),
      'Equipment': r.equipment_names || 'N/A'
    }))
  }

  // ✅ EQUIPMENT WISE REPORT EXPORT - with Spare Parts Stats
  if (reportType === 'equipment-status') {
    return data.map(r => ({
      'Equipment': r.equipment_name || 'N/A',
      'Model': r.model || 'N/A',
      'Serial Number': r.serial_number || 'N/A',
      'Hospital': r.hospital_name || 'N/A',
      'Department': r.department_name || 'N/A',
      'Status': r.current_status || 'Active',
      'Inactive (Hours)': Number(r.total_inactive_hours || 0).toFixed(1),
      'Downtime (Days)': Number(r.total_downtime_days || 0).toFixed(1),
      'Total Errors': r.total_errors || 0,
      'Open Errors': r.open_errors || 0,
      'Resolved Errors': r.resolved_errors || 0,
      'Critical Errors': r.critical_errors || 0,
      'Total Repairs': r.total_repairs || 0,
      'Spare Parts': r.total_spare_parts || 0,
      'Spare Parts (In Stock)': r.spare_parts_in_stock || 0,
      'Spare Parts (Low Stock)': r.spare_parts_low_stock || 0,
      'Spare Parts (Out of Stock)': r.spare_parts_out_of_stock || 0,
    }))
  }

  // ✅ HOSPITAL REPORT EXPORT
  if (reportType === 'hospital') {
    return data.map(r => ({
      'Hospital': r.name || 'N/A',
      'City': r.city || 'N/A',
      'State': r.state || 'N/A',
      'Status': r.status || 'Active',
      'Total Equipment': r.total_equipment || 0,
      'Active Equipment': r.active_equipment || 0,
      'Inactive Equipment': r.inactive_equipment || 0,
      'Total Errors': r.total_errors || 0,
      'Resolved Errors': r.resolved_errors || 0,
      'Pending Errors': r.pending_errors || 0,
      'Critical Errors': r.critical_errors || 0,
      'Downtime (Days)': Number(r.total_downtime_days || 0).toFixed(1),
      'Availability %': r.availability_percentage || '100.0',
      'Resolution Rate %': r.resolution_rate || 0
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
    const days = rows.reduce((s, r) => s + parseFloat(r['Downtime (Days)'] || 0), 0)
    const failures = rows.reduce((s, r) => s + num(r['Failures']), 0)
    const critical = rows.reduce((s, r) => s + num(r['Critical']), 0)
    return {
      'Equipment Count': rows.length,
      'Total Failures': failures,
      'Critical Failures': critical,
      'Total Downtime (Days)': `${days.toFixed(1)}`
    }
  }

  if (['monthly', 'weekly', 'daily', 'yearly'].includes(reportType)) {
    const total = rows.reduce((s, r) => s + num(r.Total), 0)
    const resolved = rows.reduce((s, r) => s + num(r.Resolved), 0)
    const open = rows.reduce((s, r) => s + num(r.Pending || r['In Progress']), 0)
    const critical = rows.reduce((s, r) => s + num(r.Critical), 0)
    return {
      'Total Errors': total,
      'Resolved': resolved,
      'Pending/InProgress': open,
      'Critical': critical
    }
  }

  if (reportType === 'amc') {
    const totalDowntime = rows.reduce((s, r) => s + parseFloat(r['Downtime (Days)'] || 0), 0)
    const totalErrors = rows.reduce((s, r) => s + num(r['Total Errors']), 0)
    const resolved = rows.reduce((s, r) => s + num(r['Resolved']), 0)
    return {
      'Total Contracts': rows.length,
      'Total Errors': totalErrors,
      'Resolved Errors': resolved,
      'Total Downtime (Days)': `${totalDowntime.toFixed(1)}`
    }
  }

  if (reportType === 'engineer-performance') {
    const totalRepairs = rows.reduce((s, r) => s + num(r['Total Repairs']), 0)
    const completed = rows.reduce((s, r) => s + num(r['Completed']), 0)
    const pending = rows.reduce((s, r) => s + num(r['Pending']), 0)
    return {
      'Total Engineers': rows.length,
      'Total Repairs': totalRepairs,
      'Completed': completed,
      'Pending': pending
    }
  }

  // ✅ MAINTENANCE SUMMARY
  if (reportType === 'maintenance' || reportType === 'my-maintenance') {
    const total = rows.length
    const overdue = rows.filter(r => r['Status'] === 'Overdue' || r.is_overdue).length
    const completed = rows.filter(r => r['Status'] === 'Completed').length
    const scheduled = rows.filter(r => r['Status'] === 'Scheduled').length
    const inProgress = rows.filter(r => r['Status'] === 'In Progress').length
    const downtime = rows.reduce((s, r) => s + parseFloat(r['Downtime (Days)'] || 0), 0)
    return {
      'Total Tasks': total,
      'Scheduled': scheduled,
      'In Progress': inProgress,
      'Completed': completed,
      'Overdue': overdue,
      'Total Downtime (Days)': `${downtime.toFixed(1)}`
    }
  }

  // ✅ SPARE PARTS SUMMARY - Combined Usage + Downtime (FIXED)
  if (reportType === 'spare-parts' || reportType === 'my-spare-parts') {
    const inStock = rows.filter(r => r['Status'] === 'In Stock').length
    const lowStock = rows.filter(r => r['Status'] === 'Low Stock').length
    const outOfStock = rows.filter(r => r['Status'] === 'Out of Stock').length
    const totalDowntime = rows.reduce((s, r) => s + parseFloat(r['Downtime (Days)'] || 0), 0)
    const totalCost = rows.reduce((s, r) => s + parseFloat(String(r['Total Cost'] || '0').replace(/[^0-9.]/g, '') || 0), 0)
    return {
      'Total Parts': rows.length,
      'In Stock': inStock,
      'Low Stock': lowStock,
      'Out of Stock': outOfStock,
      'Total Downtime (Days)': `${totalDowntime.toFixed(1)}`,
      'Total Cost': formatPKR(totalCost)
    }
  }

  // ✅ EQUIPMENT WISE REPORT SUMMARY
  if (reportType === 'equipment-status') {
    const totalEquipment = rows.length
    const totalErrors = rows.reduce((s, r) => s + num(r['Total Errors']), 0)
    const resolvedErrors = rows.reduce((s, r) => s + num(r['Resolved Errors']), 0)
    const openErrors = rows.reduce((s, r) => s + num(r['Open Errors']), 0)
    const criticalErrors = rows.reduce((s, r) => s + num(r['Critical Errors']), 0)
    const totalRepairs = rows.reduce((s, r) => s + num(r['Total Repairs']), 0)
    const totalSpareParts = rows.reduce((s, r) => s + num(r['Spare Parts']), 0)
    const totalDowntime = rows.reduce((s, r) => s + parseFloat(r['Downtime (Days)'] || 0), 0)
    const totalInactiveHours = rows.reduce((s, r) => s + parseFloat(r['Inactive (Hours)'] || 0), 0)
    const active = rows.filter(r => r['Status'] === 'Active').length
    const inactive = rows.filter(r => r['Status'] === 'Inactive' || r['Status'] === 'Retired').length
    const maintenance = rows.filter(r => r['Status'] === 'Maintenance' || r['Status'] === 'Under Repair').length
    return {
      'Total Equipment': totalEquipment,
      'Active': active,
      'Inactive': inactive,
      'Maintenance': maintenance,
      'Total Errors': totalErrors,
      'Resolved Errors': resolvedErrors,
      'Open Errors': openErrors,
      'Critical Errors': criticalErrors,
      'Total Repairs': totalRepairs,
      'Total Spare Parts': totalSpareParts,
      'Total Downtime (Days)': `${totalDowntime.toFixed(1)}`,
      'Total Inactive (Hours)': `${totalInactiveHours.toFixed(1)}`
    }
  }

  // ✅ HOSPITAL REPORT SUMMARY
  if (reportType === 'hospital') {
    const totalHospitals = rows.length
    const totalEquipment = rows.reduce((s, r) => s + num(r['Total Equipment']), 0)
    const totalErrors = rows.reduce((s, r) => s + num(r['Total Errors']), 0)
    const totalResolved = rows.reduce((s, r) => s + num(r['Resolved Errors']), 0)
    const totalCritical = rows.reduce((s, r) => s + num(r['Critical Errors']), 0)
    const totalDowntime = rows.reduce((s, r) => s + parseFloat(r['Downtime (Days)'] || 0), 0)
    return {
      'Total Hospitals': totalHospitals,
      'Total Equipment': totalEquipment,
      'Total Errors': totalErrors,
      'Resolved Errors': totalResolved,
      'Critical Errors': totalCritical,
      'Total Downtime (Days)': `${totalDowntime.toFixed(1)}`
    }
  }

  return { 'Report Rows': rows.length }
}

// ============================================================
// ✅ EXPORT FUNCTIONS
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

const exportToExcel = (data, filename = 'report', reportType = '') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    const summary = calculateExportSummary(data, reportType)

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
      </style></head><body>
        <h1>${escapeHtml(filename.replace(/_/g, ' ').toUpperCase())}</h1>
        <div class="sub">PAEC Equipment Management System • ${escapeHtml(new Date().toLocaleString())}</div>
        
        <table class="summary"><tr>
          ${Object.entries(summary).map(([k, v]) => `<td><strong>${escapeHtml(k)}</strong><br>${escapeHtml(v)}</td>`).join('')}
        </tr></table>
        
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

const exportToPDF = (data, filename = 'report', reportType = '') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    const summary = calculateExportSummary(data, reportType)

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
        table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7px}
        th{background:#0F172A;color:#fff;padding:5px 3px;border:1px solid #1E293B;text-align:center}
        td{padding:4px 3px;border:1px solid rgba(103, 232, 249, 0.1);text-align:center;vertical-align:middle;overflow-wrap:anywhere}
        tr:nth-child(even){background:#F5F7F6}
        .footer{margin-top:8px;text-align:center;font-size:7px;color:#7A8580}
      </style></head><body>
        <h1>${escapeHtml(filename.replace(/_/g, ' ').toUpperCase())}</h1>
        <div class="sub">PAEC Equipment Management System • ${escapeHtml(new Date().toLocaleString())}</div>
        
        <div class="summary">
          ${Object.entries(summary).map(([k, v]) => `<div class="card"><div class="label">${escapeHtml(k)}</div><div class="value">${escapeHtml(v)}</div></div>`).join('')}
        </div>
        
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
// ✅ STATS CARD COMPONENT
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
// ✅ FILTER MENU COMPONENT
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
          <MenuItem value="Scheduled">Scheduled</MenuItem>
          <MenuItem value="Overdue">Overdue</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
          <MenuItem value="Maintenance">Maintenance</MenuItem>
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
  const [initialLoadDone, setInitialLoadDone] = useState(false)

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

  // ✅ Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem('reportData_cache')
        if (cached) {
          const parsed = JSON.parse(cached)
          // ✅ Check if cache is not too old (5 minutes)
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            console.log('📦 Loading cached report data...')
            setReportData({
              success: true,
              data: parsed.data,
              total: parsed.data.length,
              generatedAt: parsed.timestamp,
              period: parsed.period || 'monthly',
              filters: parsed.filters || {},
              type: parsed.type || 'downtime'
            })
            setReportType(parsed.type || 'downtime')
            setPeriod(parsed.period || 'monthly')
            if (parsed.filters) {
              setFilters(prev => ({ ...prev, ...parsed.filters }))
            }
            return true
          }
        }
      } catch (e) {
        console.error('Failed to load cached data:', e)
      }
      return false
    }

    const cachedLoaded = loadCachedData()
    setInitialLoadDone(true)
    
    // ✅ If no cache or cache expired, generate fresh data
    if (!cachedLoaded) {
      generateReport('downtime', 'monthly')
    }
  }, [])

  // ✅ Save data to localStorage when it changes
  useEffect(() => {
    if (reportData?.data?.length > 0) {
      try {
        localStorage.setItem('reportData_cache', JSON.stringify({
          data: reportData.data,
          timestamp: Date.now(),
          type: reportData.type || reportType,
          period: reportData.period || period,
          filters: reportData.filters || filters
        }))
      } catch (e) {
        console.error('Failed to cache data:', e)
      }
    }
  }, [reportData, reportType, period, filters])

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  // ✅ UPDATED - Super Admin Report Types
  const superAdminReportTypes = [
    { value: 'downtime', label: '📉 Equipment Downtime Report' },
    { value: 'equipment-status', label: '📊 Equipment Wise Report' },
    { value: 'maintenance', label: '🔧 Maintenance Report' },
    { value: 'monthly', label: '📅 Monthly Error Report' },
    { value: 'weekly', label: '📅 Weekly Error Report' },
    { value: 'daily', label: '📅 Daily Error Report' },
    { value: 'yearly', label: '📅 Yearly Error Report' },
    { value: 'hospital', label: '🏥 Hospital-wise Report' },
    { value: 'spare-parts', label: '📦 Spare Parts Report' },
    { value: 'engineer-performance', label: '👨‍🔧 Engineer Performance Report' },
    { value: 'amc', label: '📄 AMC Expiry' }
  ]

  const additionalFilters = [
    {
      name: 'hospital',
      label: 'Hospital',
      options: hospitalOptions
    }
  ]

  // ✅ generateReport with unified error-summary endpoint
  const generateReport = useCallback(async (type, periodVal) => {
    const reportTypeVal = type || reportType
    const periodValActual = periodVal || period

    setLoading(true)
    setError(null)

    try {
      let data = []

      switch (reportTypeVal) {
        case 'downtime': {
          const [equipmentRes, errorsRes, repairsRes] = await Promise.all([
            api.get('/equipment'),
            api.get('/errors'),
            api.get('/repairs')
          ])
          
          const equipment = equipmentRes.data.equipment || []
          const errors = errorsRes.data.errors || []
          const repairs = repairsRes.data.repairs || []

          let filteredEquipment = equipment
          if (filters.hospital) {
            filteredEquipment = equipment.filter(e => 
              String(e.hospital_id) === String(filters.hospital)
            )
          }

          let filteredErrors = errors
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            filteredErrors = filteredErrors.filter(e => {
              const d = new Date(e.created_at)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            filteredErrors = filteredErrors.filter(e => {
              const d = new Date(e.created_at)
              return d <= end
            })
          }

          let filteredRepairs = repairs
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d <= end
            })
          }

          data = buildDowntimeRows(filteredEquipment, filteredErrors, filteredRepairs)
          break
        }

        // ✅ UNIFIED ERROR SUMMARY ENDPOINT - daily/weekly/monthly/yearly
        case 'monthly':
        case 'weekly':
        case 'daily':
        case 'yearly': {
          try {
            // ✅ Use the new unified error-summary endpoint
            const response = await api.get('/reports/error-summary', {
              params: {
                period: reportTypeVal, // daily, weekly, monthly, yearly
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                hospital_id: filters.hospital || undefined,
                status: filters.status || undefined
              }
            });
            
            const reportData = response.data.data || {};
            const summary = reportData.summary || {};
            
            // ✅ Data from trend
            data = reportData.trend || [];
            
            // ✅ Add summary to data
            data._summary = {
              total_errors: summary.total_errors || 0,
              resolved: summary.resolved || 0,
              pending: summary.pending || 0,
              in_progress: summary.in_progress || 0,
              critical: summary.critical || 0,
              high: summary.high || 0,
              medium: summary.medium || 0,
              low: summary.low || 0,
              resolution_rate: summary.total_errors > 0 
                ? ((summary.resolved / summary.total_errors) * 100).toFixed(1) 
                : 0
            };
            
            // ✅ Equipment breakdown and top errors for view dialog
            data._equipment = reportData.equipment_breakdown || [];
            data._topErrors = reportData.top_errors || [];
            
            console.log(`✅ ${reportTypeVal} Error Report:`, data.length, 'rows with equipment & hospital names');
            
            break;
          } catch (error) {
            console.error('❌ Error report error:', error);
            toast.error('Failed to fetch error report');
            data = [];
            break;
          }
        }

        // ✅ EQUIPMENT WISE REPORT CASE
        case 'equipment-status': {
          try {
            const [equipmentRes, errorsRes, repairsRes, sparePartsRes] = await Promise.all([
              api.get('/equipment'),
              api.get('/errors'),
              api.get('/repairs'),
              api.get('/spare-parts')
            ]);
            
            const equipment = equipmentRes.data.equipment || [];
            const errors = errorsRes.data.errors || [];
            const repairs = repairsRes.data.repairs || [];
            const spareParts = sparePartsRes.data.spareParts || [];

            // Apply filters
            let filteredEquipment = equipment;
            if (filters.hospital) {
              filteredEquipment = equipment.filter(e => 
                String(e.hospital_id) === String(filters.hospital)
              );
            }
            if (filters.status) {
              filteredEquipment = filteredEquipment.filter(e => 
                String(e.status).toLowerCase() === String(filters.status).toLowerCase()
              );
            }

            // Build equipment data with all details
            const equipmentData = filteredEquipment.map(eq => {
              const eqErrors = errors.filter(e => e.equipment_id === eq.id);
              const eqRepairs = repairs.filter(r => {
                const error = errors.find(e => e.id === r.error_log_id);
                return error && error.equipment_id === eq.id;
              });
              const eqSpareParts = spareParts.filter(sp => sp.equipment_id === eq.id);

              // Calculate downtime from resolved errors
              let downtimeHours = 0;
              const resolvedErrors = eqErrors.filter(e => ['Resolved', 'Closed', 'Completed'].includes(e.status));
              resolvedErrors.forEach(e => {
                if (e.created_at && e.updated_at) {
                  const hours = (new Date(e.updated_at) - new Date(e.created_at)) / (1000 * 60 * 60);
                  if (hours > 0) downtimeHours += hours;
                }
              });

              // Calculate inactive and maintenance time based on status
              let inactiveHours = 0;
              let maintenanceHours = 0;
              
              if (eq.status === 'Inactive') {
                const lastUpdate = new Date(eq.updated_at || eq.created_at);
                const now = new Date();
                inactiveHours = Math.max(0, (now - lastUpdate) / (1000 * 60 * 60));
              } else if (eq.status === 'Maintenance' || eq.status === 'Under Repair') {
                const lastUpdate = new Date(eq.updated_at || eq.created_at);
                const now = new Date();
                maintenanceHours = Math.max(0, (now - lastUpdate) / (1000 * 60 * 60));
              }

              const totalDowntimeHours = downtimeHours + inactiveHours + maintenanceHours;

              return {
                id: eq.id,
                equipment_name: eq.name || 'N/A',
                model: eq.model || 'N/A',
                manufacturer: eq.manufacturer || 'N/A',
                serial_number: eq.serial_number || 'N/A',
                current_status: eq.status || 'Active',
                hospital_name: eq.hospital_name || 'N/A',
                department_name: eq.department_name || 'N/A',
                location: eq.location || 'N/A',
                installation_year: eq.installation_year || 'N/A',
                equipment_added_on: eq.created_at || 'N/A',
                // Status duration
                total_inactive_hours: inactiveHours.toFixed(1),
                total_maintenance_hours: maintenanceHours.toFixed(1),
                total_downtime_hours: totalDowntimeHours.toFixed(1),
                total_downtime_days: (totalDowntimeHours / 24).toFixed(2),
                // Error stats
                total_errors: eqErrors.length,
                open_errors: eqErrors.filter(e => ['Pending', 'In Progress', 'Open'].includes(e.status)).length,
                resolved_errors: resolvedErrors.length,
                critical_errors: eqErrors.filter(e => e.severity === 'Critical' || e.priority === 'Critical').length,
                // Repair stats
                total_repairs: eqRepairs.length,
                completed_repairs: eqRepairs.filter(r => r.status === 'Completed').length,
                // Spare parts stats
                total_spare_parts: eqSpareParts.length,
                spare_parts_in_stock: eqSpareParts.filter(sp => sp.status === 'In Stock').length,
                spare_parts_low_stock: eqSpareParts.filter(sp => sp.status === 'Low Stock').length,
                spare_parts_out_of_stock: eqSpareParts.filter(sp => sp.status === 'Out of Stock').length,
                spare_parts_total_cost: eqSpareParts.reduce((sum, sp) => sum + (sp.total_cost || 0), 0)
              };
            });

            // Calculate summary stats
            const stats = {
              total: equipmentData.length,
              active: equipmentData.filter(d => d.current_status === 'Active').length,
              inactive: equipmentData.filter(d => d.current_status === 'Inactive').length,
              maintenance: equipmentData.filter(d => d.current_status === 'Maintenance' || d.current_status === 'Under Repair').length,
              total_downtime_days: equipmentData.reduce((sum, d) => sum + parseFloat(d.total_downtime_days || 0), 0),
              total_errors: equipmentData.reduce((sum, d) => sum + (d.total_errors || 0), 0),
              total_repairs: equipmentData.reduce((sum, d) => sum + (d.total_repairs || 0), 0),
              total_spare_parts: equipmentData.reduce((sum, d) => sum + (d.total_spare_parts || 0), 0),
              total_inactive_hours: equipmentData.reduce((sum, d) => sum + parseFloat(d.total_inactive_hours || 0), 0)
            };

            equipmentData._summary = stats;
            data = equipmentData;
            
            console.log('✅ Equipment Wise Data:', data.length, 'rows');
            break;
          } catch (error) {
            console.error('❌ Equipment wise report error:', error);
            toast.error('Failed to fetch equipment wise data');
            data = [];
            break;
          }
        }

        // ✅ MAINTENANCE REPORT CASE
        case 'maintenance': {
          const response = await api.get('/maintenance')
          let maintenanceData = response.data.schedules || response.data || []
          
          // Apply date filters
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            maintenanceData = maintenanceData.filter(m => {
              const d = new Date(m.created_at || m.updated_at)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            maintenanceData = maintenanceData.filter(m => {
              const d = new Date(m.created_at || m.updated_at)
              return d <= end
            })
          }
          if (filters.status) {
            maintenanceData = maintenanceData.filter(m => 
              String(m.status).toLowerCase() === String(filters.status).toLowerCase()
            )
          }
          if (filters.hospital) {
            maintenanceData = maintenanceData.filter(m => 
              String(m.hospital_id) === String(filters.hospital)
            )
          }

          // Get errors for downtime calculation
          const errorsRes = await api.get('/errors')
          const allErrors = errorsRes.data.errors || []
          
          // Calculate downtime for each maintenance
          const dataWithDowntime = maintenanceData.map(m => {
            // Get errors for this equipment
            const equipmentErrors = allErrors.filter(e => 
              e.equipment_id === m.equipment_id
            )
            
            // Calculate total downtime (resolved errors only)
            let totalDowntimeHours = 0
            let resolvedErrors = 0
            let criticalErrors = 0
            
            equipmentErrors.forEach(e => {
              const resolvedStatuses = ['Resolved', 'Closed', 'Completed']
              if (resolvedStatuses.includes(e.status)) {
                resolvedErrors++
                if (e.created_at && e.updated_at) {
                  const start = new Date(e.created_at)
                  const end = new Date(e.updated_at)
                  const hours = (end - start) / (1000 * 60 * 60)
                  if (hours > 0) totalDowntimeHours += hours
                }
              }
              if (String(e.severity).toLowerCase() === 'critical') {
                criticalErrors++
              }
            })
            
            const downtimeDays = totalDowntimeHours / 24
            
            // Check if overdue
            const isOverdue = m.next_due_date && new Date(m.next_due_date) < new Date()
            const isCompleted = String(m.status).toLowerCase() === 'completed'
            
            return {
              ...m,
              total_errors: equipmentErrors.length,
              resolved_errors: resolvedErrors,
              critical_errors: criticalErrors,
              total_downtime_hours: totalDowntimeHours,
              total_downtime_days: Number(downtimeDays.toFixed(1)),
              is_overdue: isOverdue,
              is_completed: isCompleted,
              availability: totalDowntimeHours > 0 
                ? ((365 * 24 - totalDowntimeHours) / (365 * 24) * 100).toFixed(1)
                : '100.0'
            }
          })
          
          // Sort: Overdue first, then by next_due_date
          dataWithDowntime.sort((a, b) => {
            if (a.is_overdue && !b.is_overdue) return -1
            if (!a.is_overdue && b.is_overdue) return 1
            return (a.next_due_date || '').localeCompare(b.next_due_date || '')
          })
          
          // Calculate summary stats
          const stats = {
            total: dataWithDowntime.length,
            scheduled: dataWithDowntime.filter(m => m.status === 'Scheduled').length,
            in_progress: dataWithDowntime.filter(m => m.status === 'In Progress').length,
            completed: dataWithDowntime.filter(m => m.status === 'Completed').length,
            overdue: dataWithDowntime.filter(m => m.is_overdue || m.status === 'Overdue').length,
            total_downtime_hours: dataWithDowntime.reduce((sum, m) => sum + (m.total_downtime_hours || 0), 0),
            total_downtime_days: Number((dataWithDowntime.reduce((sum, m) => sum + (m.total_downtime_hours || 0), 0) / 24).toFixed(1)),
            avg_availability: dataWithDowntime.length > 0 
              ? (dataWithDowntime.reduce((sum, m) => sum + parseFloat(m.availability), 0) / dataWithDowntime.length).toFixed(1)
              : '100.0',
            total_errors: dataWithDowntime.reduce((sum, m) => sum + (m.total_errors || 0), 0),
            critical_errors: dataWithDowntime.reduce((sum, m) => sum + (m.critical_errors || 0), 0)
          }
          
          // Add summary to data
          dataWithDowntime._summary = stats
          data = dataWithDowntime
          break
        }

        // ✅ SPARE PARTS CASE - FIXED (removed individual downtime API calls)
        case 'spare-parts': {
          try {
            // Get all spare parts
            const response = await api.get('/spare-parts')
            const allParts = response.data.spareParts || []
            
            console.log('🔩 Spare Parts Raw:', allParts.length)
            
            // Get equipment for reference
            const equipmentRes = await api.get('/equipment')
            const equipment = equipmentRes.data.equipment || []
            
            console.log('🛠️ Equipment:', equipment.length)
            
            // ✅ Build spare parts data with equipment info
            const dataWithDetails = allParts.map(part => {
              // Find equipment using this part based on compatible_equipment field
              let equipmentNames = []
              let equipmentIds = []
              
              // Check if part has compatible_equipment field
              if (part.compatible_equipment) {
                const compatibleList = part.compatible_equipment.split(',').map(s => s.trim().toLowerCase())
                equipment.forEach(eq => {
                  const eqName = (eq.name || '').toLowerCase()
                  if (compatibleList.some(c => eqName.includes(c) || c.includes(eqName))) {
                    equipmentNames.push(eq.name)
                    equipmentIds.push(eq.id)
                  }
                })
              }
              
              // Also check if any equipment has this part_id
              equipment.forEach(eq => {
                if (String(eq.part_id) === String(part.id)) {
                  if (!equipmentNames.includes(eq.name)) {
                    equipmentNames.push(eq.name)
                    equipmentIds.push(eq.id)
                  }
                }
              })
              
              // If equipment_id is directly on part
              if (part.equipment_id) {
                const eq = equipment.find(e => String(e.id) === String(part.equipment_id))
                if (eq && !equipmentNames.includes(eq.name)) {
                  equipmentNames.push(eq.name)
                  equipmentIds.push(eq.id)
                }
              }
              
              // If still no equipment, mark as N/A
              if (equipmentNames.length === 0) {
                equipmentNames = ['N/A']
              }
              
              // Calculate downtime days - use available fields from part data
              const downtimeDays = part.total_downtime_days || part.downtime_days || 0
              const totalDowntimeHours = part.total_downtime_hours || part.downtime_hours || 0
              
              return {
                id: part.id,
                part_name: part.part_name || 'N/A',
                part_number: part.part_number || 'N/A',
                brand: part.brand || 'N/A',
                manufacturer: part.manufacturer || 'N/A',
                quantity: part.quantity || 0,
                minimum_stock_level: part.minimum_stock_level || 5,
                status: part.status || 'Unknown',
                unit_cost: part.unit_cost || 0,
                total_cost: part.total_cost || 0,
                compatible_equipment: part.compatible_equipment || 'N/A',
                // ✅ Usage Stats (from backend)
                times_used: part.times_used || 0,
                last_used_at: part.last_used_at || null,
                // ✅ Downtime Stats (from backend)
                times_out_of_stock: part.times_out_of_stock || 0,
                first_out_of_stock: part.first_out_of_stock || null,
                last_back_in_stock: part.last_back_in_stock || null,
                total_downtime_hours: Number(totalDowntimeHours) || 0,
                total_downtime_days: Number(downtimeDays).toFixed(1),
                is_currently_out: part.status === 'Out of Stock',
                // ✅ Equipment Info
                equipment_count: equipmentNames.length,
                equipment_names: equipmentNames.join(', '),
                equipment_ids: equipmentIds
              }
            })
            
            // Apply filters
            let filteredData = dataWithDetails
            if (filters.status) {
              filteredData = filteredData.filter(p => 
                String(p.status).toLowerCase() === String(filters.status).toLowerCase()
              )
            }
            if (filters.search) {
              const search = filters.search.toLowerCase()
              filteredData = filteredData.filter(p => 
                p.part_name.toLowerCase().includes(search) ||
                p.part_number.toLowerCase().includes(search) ||
                p.equipment_names.toLowerCase().includes(search) ||
                p.brand.toLowerCase().includes(search)
              )
            }
            
            // Calculate summary stats
            const stats = {
              total_parts: filteredData.length,
              out_of_stock: filteredData.filter(p => p.status === 'Out of Stock').length,
              low_stock: filteredData.filter(p => p.status === 'Low Stock').length,
              in_stock: filteredData.filter(p => p.status === 'In Stock').length,
              total_downtime_hours: filteredData.reduce((sum, p) => sum + (parseFloat(p.total_downtime_hours) || 0), 0),
              total_downtime_days: Number(filteredData.reduce((sum, p) => sum + (parseFloat(p.total_downtime_days) || 0), 0).toFixed(1)),
              total_cost: filteredData.reduce((sum, p) => sum + (p.total_cost || 0), 0),
              parts_with_downtime: filteredData.filter(p => parseFloat(p.total_downtime_days) > 0).length,
              parts_used: filteredData.filter(p => p.times_used > 0).length
            }
            
            filteredData._summary = stats
            data = filteredData
            
            console.log('✅ Spare Parts Data with Equipment:', data.length)
            console.log('📊 Sample:', data[0])
            break
          } catch (error) {
            console.error('❌ Spare parts error:', error)
            toast.error('Failed to fetch spare parts data: ' + error.message)
            data = []
            break
          }
        }

        case 'engineer-performance': {
          const usersRes = await api.get('/users')
          const users = usersRes.data.users || []
          const engineers = users.filter(u => u.role_name === 'ENGINEER')

          const repairsRes = await api.get('/repairs')
          const allRepairs = repairsRes.data.repairs || []

          let filteredRepairs = allRepairs
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d <= end
            })
          }

          data = engineers.map(eng => {
            const engineerRepairs = filteredRepairs.filter(r => 
              String(r.engineer_id) === String(eng.id)
            )

            const total = engineerRepairs.length
            const completed = engineerRepairs.filter(r =>
              ['completed', 'verified', 'resolved'].includes(String(r.status || '').toLowerCase())
            ).length
            const pending = engineerRepairs.filter(r =>
              ['pending', 'in progress', 'assigned'].includes(String(r.status || '').toLowerCase())
            ).length
            const critical = engineerRepairs.filter(r => r.spare_part_used === 1).length

            const totalMinutes = engineerRepairs.reduce((sum, r) => sum + (parseInt(r.time_taken) || 0), 0)
            const avgDays = total > 0 ? (totalMinutes / (24 * 60)) : 0

            return {
              engineer_id: eng.id,
              engineer_name: eng.full_name || eng.username || 'Unknown',
              email: eng.email,
              hospital_name: eng.hospital_name || 'N/A',
              total_repairs: total,
              completed: completed,
              pending: pending,
              critical: critical,
              total_time: totalMinutes,
              avg_days: avgDays.toFixed(1),
              completion_rate: total > 0 ? ((completed / total) * 100).toFixed(1) + '%' : '0.0%',
              status: eng.is_active ? 'Active' : 'Inactive'
            }
          })

          data = data.sort((a, b) => b.completed - a.completed)
          break
        }

        // ✅ HOSPITAL REPORT CASE - FIXED RESPONSE MAPPING
        case 'hospital': {
          // ✅ FIXED: Using /error-logs API with correct response mapping
          const [hospitalsRes, equipmentRes, errorLogsRes] = await Promise.all([
            api.get('/hospitals'),
            api.get('/equipment'),
            api.get('/error-logs')
          ])
          
          const hospitals = hospitalsRes.data.hospitals || []
          const equipment = equipmentRes.data.equipment || []
          
          // ✅ FIX: The API returns { success: true, errors: [...] }
          const errorLogs = errorLogsRes.data.errors || []
          
          console.log('🏥 Hospitals:', hospitals.length)
          console.log('🛠️ Equipment:', equipment.length)
          console.log('❌ Error Logs:', errorLogs.length)

          // Apply filters
          let filteredEquipment = equipment
          if (filters.hospital) {
            filteredEquipment = equipment.filter(e => 
              String(e.hospital_id) === String(filters.hospital)
            )
          }

          let filteredErrorLogs = errorLogs
          if (filters.status) {
            filteredErrorLogs = errorLogs.filter(e => 
              String(e.status).toLowerCase() === String(filters.status).toLowerCase()
            )
          }
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            filteredErrorLogs = filteredErrorLogs.filter(e => {
              const d = new Date(e.created_at || e.error_date)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            filteredErrorLogs = filteredErrorLogs.filter(e => {
              const d = new Date(e.created_at || e.error_date)
              return d <= end
            })
          }

          // Build hospital data
          const hospitalData = hospitals
            .filter(h => !filters.hospital || String(h.id) === String(filters.hospital))
            .map(h => {
              const hospitalEquipment = filteredEquipment.filter(e => 
                String(e.hospital_id) === String(h.id)
              )
              const equipmentIds = hospitalEquipment.map(e => e.id)
              const hospitalErrors = filteredErrorLogs.filter(e => 
                equipmentIds.includes(e.equipment_id)
              )

              // Calculate stats
              const totalEquipment = hospitalEquipment.length
              const totalErrors = hospitalErrors.length
              const resolvedErrors = hospitalErrors.filter(e => e.status === 'Resolved' || e.status === 'Closed').length
              const pendingErrors = hospitalErrors.filter(e => e.status === 'Pending').length
              const inProgressErrors = hospitalErrors.filter(e => e.status === 'In Progress').length
              const criticalErrors = hospitalErrors.filter(e => e.priority === 'Critical' || e.severity === 'Critical').length

              // Calculate downtime
              let downtimeHours = 0
              hospitalErrors.forEach(e => {
                if (e.status === 'Resolved' || e.status === 'Closed') {
                  const start = new Date(e.error_date || e.created_at)
                  let end = new Date(e.updated_at || e.created_at)
                  if (end <= start) {
                    end = new Date(start)
                    end.setHours(end.getHours() + 1)
                  }
                  if (end > start) {
                    const hours = (end - start) / (1000 * 60 * 60)
                    if (hours > 0 && hours < 8760) downtimeHours += hours
                  }
                }
              })

              // Calculate availability
              const totalPossibleHours = totalEquipment * 8760
              const availability = totalPossibleHours > 0 
                ? Number((Math.max(0, ((totalPossibleHours - downtimeHours) / totalPossibleHours) * 100)).toFixed(1))
                : 100

              // Resolution rate
              const resolutionRate = totalErrors > 0 
                ? Number(((resolvedErrors / totalErrors) * 100).toFixed(1))
                : 0

              return {
                id: h.id,
                hospital_id: h.id,
                name: h.name,
                city: h.city || 'N/A',
                state: h.state || 'N/A',
                status: h.is_active ? 'Active' : 'Inactive',
                hospital_code: h.hospital_code || 'N/A',
                total_equipment: totalEquipment,
                active_equipment: hospitalEquipment.filter(e => e.status === 'Active').length,
                inactive_equipment: hospitalEquipment.filter(e => e.status === 'Inactive' || e.status === 'Retired').length,
                maintenance_equipment: hospitalEquipment.filter(e => e.status === 'Maintenance').length,
                total_errors: totalErrors,
                resolved_errors: resolvedErrors,
                pending_errors: pendingErrors,
                in_progress_errors: inProgressErrors,
                critical_errors: criticalErrors,
                total_downtime_hours: Number(downtimeHours.toFixed(1)),
                total_downtime_days: Number((downtimeHours / 24).toFixed(1)),
                availability_percentage: availability,
                resolution_rate: resolutionRate
              }
            })

          // Add summary
          const summary = {
            total_hospitals: hospitalData.length,
            total_equipment: hospitalData.reduce((sum, d) => sum + d.total_equipment, 0),
            total_errors: hospitalData.reduce((sum, d) => sum + d.total_errors, 0),
            total_resolved: hospitalData.reduce((sum, d) => sum + d.resolved_errors, 0),
            total_pending: hospitalData.reduce((sum, d) => sum + d.pending_errors, 0),
            total_critical: hospitalData.reduce((sum, d) => sum + d.critical_errors, 0),
            total_downtime_hours: Number(hospitalData.reduce((sum, d) => sum + d.total_downtime_hours, 0).toFixed(1)),
            total_downtime_days: Number((hospitalData.reduce((sum, d) => sum + d.total_downtime_hours, 0) / 24).toFixed(1)),
            avg_availability: hospitalData.length > 0 
              ? Number((hospitalData.reduce((sum, d) => sum + d.availability_percentage, 0) / hospitalData.length).toFixed(1))
              : 100
          }

          hospitalData._summary = summary
          data = hospitalData
          
          console.log('✅ Hospital Data:', data.length, 'hospitals')
          console.log('📊 Summary:', summary)
          break
        }

        // ✅ AMC CASE - CLOSED REMOVED, ONLY RESOLVED FOR DOWNTIME
        case 'amc': {
          const response = await api.get('/amc')
          const contracts = response.data.contracts || []
          
          const equipmentRes = await api.get('/equipment')
          const equipment = equipmentRes.data.equipment || []
          
          const errorsRes = await api.get('/errors')
          const allErrors = errorsRes.data.errors || []

          const mappedData = contracts.map(contract => {
            const equip = equipment.find(e => e.id === contract.equipment_id)
            const eqErrors = allErrors.filter(e => e.equipment_id === contract.equipment_id)
            
            const pendingErrors = eqErrors.filter(e => e.status === 'Pending')
            const inProgressErrors = eqErrors.filter(e => e.status === 'In Progress')
            const completedErrors = eqErrors.filter(e => e.status === 'Completed')
            const resolvedErrors = eqErrors.filter(e => e.status === 'Resolved')
            
            let totalDowntimeHours = 0
            resolvedErrors.forEach(e => {
              if (e.created_at && e.updated_at) {
                const start = new Date(e.created_at)
                const end = new Date(e.updated_at)
                const hours = (end - start) / (1000 * 60 * 60)
                if (hours > 0) totalDowntimeHours += hours
              }
            })
            
            const downtimeDays = totalDowntimeHours / 24

            return {
              id: contract.id,
              contract_number: contract.contract_number || 'N/A',
              vendor_name: contract.vendor_name || 'N/A',
              equipment_name: equip?.name || 'N/A',
              equipment_model: equip?.model || 'N/A',
              hospital_name: equip?.hospital_name || 'N/A',
              start_date: contract.start_date,
              end_date: contract.end_date,
              status: contract.status || 'Pending',
              cost: Number(contract.cost) || 0,
              is_active: contract.is_active,
              total_errors: eqErrors.length,
              pending_errors: pendingErrors.length,
              in_progress_errors: inProgressErrors.length,
              completed_errors: completedErrors.length,
              resolved_errors: resolvedErrors.length,
              total_downtime_hours: totalDowntimeHours,
              total_downtime_days: Number(downtimeDays.toFixed(1)),
              days_remaining: contract.end_date ? 
                Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null,
              document_url: contract.document_url,
              notes: contract.notes,
              contact_person: contract.contact_person,
              contact_phone: contract.contact_phone
            }
          })

          data = mappedData
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

  // ✅ Fixed useEffect with proper dependencies
  useEffect(() => {
    if (initialLoadDone && !reportData) {
      generateReport(reportType, period)
    }

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing report data...')
      generateReport(reportType, period)
    }, 30000)

    return () => clearInterval(interval)
  }, [reportType, period, initialLoadDone, generateReport])

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
    const filename = (() => {
      const map = {
        downtime: 'Equipment_Downtime',
        'equipment-status': 'Equipment_Wise',
        monthly: 'Monthly_Errors',
        weekly: 'Weekly_Errors',
        daily: 'Daily_Errors',
        yearly: 'Yearly_Errors',
        hospital: 'Hospital_Report',
        'spare-parts': 'Spare_Parts_Report',
        maintenance: 'Maintenance_Report',
        'engineer-performance': 'Engineer_Performance',
        amc: 'AMC_Contracts'
      }
      return map[reportType] || 'Report'
    })()

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
        item.current_status,
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
        item.date,
        item['Serial / Asset No.'],
        item['Equipment ID'],
        item['Department'],
        item.contract_number,
        item.vendor_name,
        item.maintenance_type,
        item.frequency,
        item.part_number,
        item.brand,
        item.equipment_names,
        item.hospital_names,
        item.Model,
        item['Serial Number']
      ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase())

      return searchableFields.some(field => field.includes(searchLower))
    })

    return filtered
  }, [reportData?.data, searchTerm, filters.status])

  const totalRecords = filteredData.length

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
  const isAMCReport = reportType === 'amc'
  const isMaintenanceReport = reportType === 'maintenance'
  const isSparePartsReport = reportType === 'spare-parts'
  const isEquipmentWiseReport = reportType === 'equipment-status'
  const isHospitalReport = reportType === 'hospital'

  return (
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

      {/* ✅ STATS CARDS - Super Admin Report Stats */}
      {isEquipmentWiseReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Equipment"
              value={filteredData._summary?.total || filteredData.length}
              color="#0F172A"
              icon={<MedicalServices sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Active"
              value={filteredData._summary?.active || 0}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Inactive"
              value={filteredData._summary?.inactive || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Cancel sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Maintenance"
              value={filteredData._summary?.maintenance || 0}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Build sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Downtime"
              value={Number(filteredData._summary?.total_downtime_days || 0).toFixed(1)}
              subtitle="Days"
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isHospitalReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Hospitals"
              value={filteredData._summary?.total_hospitals || filteredData.length}
              color="#0F172A"
              icon={<Business sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Equipment"
              value={filteredData._summary?.total_equipment || 0}
              color="#3B82F6"
              bgColor="#3B82F610"
              icon={<MedicalServices sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Errors"
              value={filteredData._summary?.total_errors || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<ErrorOutline sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Resolved"
              value={filteredData._summary?.total_resolved || 0}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Downtime"
              value={Number(filteredData._summary?.total_downtime_days || 0).toFixed(1)}
              subtitle="Days"
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isMaintenanceReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Tasks"
              value={filteredData._summary?.total || filteredData.length}
              color="#0F172A"
              icon={<Assessment sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Scheduled"
              value={filteredData._summary?.scheduled || 0}
              color="#3B82F6"
              bgColor="#3B82F610"
              icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="In Progress"
              value={filteredData._summary?.in_progress || 0}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Build sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Overdue"
              value={filteredData._summary?.overdue || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Downtime"
              value={filteredData._summary?.total_downtime_days || '0'}
              subtitle="Days"
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isAMCReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Contracts"
              value={filteredData.length}
              color="#0F172A"
              icon={<Receipt sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Active"
              value={filteredData.filter(d => d.status === 'Active' || d.status === 'In Progress').length}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Expired"
              value={filteredData.filter(d => d.status === 'Expired').length}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Cancel sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Errors"
              value={filteredData.reduce((sum, row) => sum + (row.total_errors || 0), 0)}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<ErrorOutline sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Downtime"
              value={`${Number(filteredData.reduce((sum, row) => sum + parseFloat(row.total_downtime_days || 0), 0)).toFixed(1)} days`}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isSparePartsReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Parts"
              value={filteredData.length}
              color="#0F172A"
              icon={<Inventory sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="In Stock"
              value={filteredData._summary?.in_stock || 0}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Low Stock"
              value={filteredData._summary?.low_stock || 0}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Out of Stock"
              value={filteredData._summary?.out_of_stock || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Cancel sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Downtime"
              value={Number(filteredData._summary?.total_downtime_days || 0).toFixed(1)}
              subtitle="Days"
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : reportType === 'downtime' ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
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
              value={`${Number(filteredData.reduce((sum, row) => sum + parseFloat(row['Total Downtime (Days)'] || 0), 0)).toFixed(1)} days`}
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
        </Grid>
      ) : reportType === 'engineer-performance' ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Engineers"
              value={filteredData.length}
              color="#0F172A"
              icon={<Engineering sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Repairs"
              value={filteredData.reduce((sum, row) => sum + row.total_repairs, 0)}
              color="#0F172A"
              icon={<Build sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Completed"
              value={filteredData.reduce((sum, row) => sum + row.completed, 0)}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Pending"
              value={filteredData.reduce((sum, row) => sum + row.pending, 0)}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Avg Days"
              value={`${(filteredData.reduce((sum, row) => sum + parseFloat(row.avg_days || 0), 0) / (filteredData.length || 1)).toFixed(1)} days`}
              color="#6f42c1"
              bgColor="#f3e5f5"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isErrorReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Errors"
              value={filteredData._summary?.total_errors || 0}
              color="#0F172A"
              icon={<Assessment sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Resolved"
              value={filteredData._summary?.resolved || 0}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Pending"
              value={filteredData._summary?.pending || 0}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Critical"
              value={filteredData._summary?.critical || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Resolution Rate"
              value={filteredData._summary?.resolution_rate || '0.0%'}
              color="#6f42c1"
              bgColor="#f3e5f5"
              icon={<BarChart sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
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
              value={`${Number(filteredData.reduce((sum, row) => sum + parseFloat(row['Total Downtime (Days)'] || row.downtime_days || 0), 0)).toFixed(1)} days`}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
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

      {/* ✅ TABLE - Super Admin Report Table */}
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
                {isEquipmentWiseReport ? (
                  // ✅ EQUIPMENT WISE REPORT TABLE HEADERS
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Model</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hospital</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Department</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Inactive (Hrs)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Errors</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Repairs</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Spare Parts</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : isHospitalReport ? (
                  // ✅ HOSPITAL REPORT TABLE HEADERS
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hospital</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>City</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>State</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Errors</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Resolved</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Availability</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : isMaintenanceReport ? (
                  // ✅ MAINTENANCE TABLE HEADERS
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Next Due</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Engineer</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Availability</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                  </>
                ) : isAMCReport ? (
                  // ✅ AMC Table Headers
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Contract</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Hospital</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Errors</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Pending</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>In Progress</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Resolved</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Days Left</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                  </>
                ) : isSparePartsReport ? (
                  // ✅ SPARE PARTS TABLE HEADERS
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Part Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Part #</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Brand</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Qty</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Min Stock</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Used</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Times Out</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : reportType === 'downtime' ? (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Hospital</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Failures</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Availability</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                  </>
                ) : reportType === 'engineer-performance' ? (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Engineer</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Hospital</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Total Repairs</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Completed</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Pending</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Avg Days</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Completion Rate</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Actions</TableCell>
                  </>
                ) : isErrorReport ? (
                  // ✅ ERROR REPORT TABLE HEADERS WITH EQUIPMENT & HOSPITAL
                  <>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>
                      {reportType === 'daily' ? 'Date' : 
                       reportType === 'weekly' ? 'Week' : 
                       reportType === 'monthly' ? 'Month' : 'Year'}
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Hospital</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Total</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Resolved</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>Pending</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>In Progress</TableCell>
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
                  <TableCell colSpan={10} align="center">
                    <LinearProgress sx={{ my: 2, bgcolor: 'rgba(103, 232, 249, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#67E8F9' } }} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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
                    {isEquipmentWiseReport ? (
                      // ✅ EQUIPMENT WISE REPORT TABLE ROWS
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                            {item.equipment_name || item.name || 'N/A'}
                          </Typography>
                          {item.serial_number && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                              SN: {item.serial_number}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.model || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.hospital_name || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.department_name || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.current_status || item.status || 'Active'}
                            size="small"
                            sx={{
                              bgcolor: item.current_status === 'Active' || item.status === 'Active' ? '#22C55E' :
                                       item.current_status === 'Maintenance' || item.status === 'Maintenance' ? '#F59E0B' :
                                       item.current_status === 'Under Repair' ? '#EF4444' :
                                       item.current_status === 'Inactive' || item.status === 'Inactive' || item.current_status === 'Retired' ? '#64748B' : '#3B82F6',
                              color: 'white',
                              fontWeight: 500,
                              height: 22,
                              fontSize: '10px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          color: parseFloat(item.total_inactive_hours || 0) > 100 ? '#EF4444' : 
                                 parseFloat(item.total_inactive_hours || 0) > 50 ? '#F59E0B' : '#64748B',
                          fontWeight: 600 
                        }}>
                          {Number(item.total_inactive_hours || 0).toFixed(1)}h
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          color: parseFloat(item.total_downtime_days || 0) > 10 ? '#EF4444' : 
                                 parseFloat(item.total_downtime_days || 0) > 5 ? '#F59E0B' : '#0F172A',
                          fontWeight: 700 
                        }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {item.total_errors || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#3B82F6', fontWeight: 600 }}>
                          {item.total_repairs || 0}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`${item.spare_parts_in_stock || 0} In Stock, ${item.spare_parts_low_stock || 0} Low, ${item.spare_parts_out_of_stock || 0} Out`}>
                            <Chip
                              label={item.total_spare_parts || 0}
                              size="small"
                              sx={{
                                bgcolor: (item.total_spare_parts || 0) > 0 ? '#6f42c1' : '#64748B',
                                color: 'white',
                                fontWeight: 600,
                                minWidth: 30
                              }}
                            />
                          </Tooltip>
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
                    ) : isHospitalReport ? (
                      // ✅ HOSPITAL REPORT TABLE ROWS
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                            {item.name || 'N/A'}
                          </Typography>
                          {item.hospital_code && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                              Code: {item.hospital_code}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.city || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.state || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status || 'Active'}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'Active' ? '#22C55E' : '#EF4444',
                              color: 'white',
                              fontWeight: 500,
                              height: 22,
                              fontSize: '10px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#0F172A', fontWeight: 600 }}>
                          {item.total_equipment || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {item.total_errors || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>
                          {item.resolved_errors || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {item.critical_errors || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 700 }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${item.availability_percentage || 100}%`}
                            size="small"
                            sx={{
                              bgcolor: (item.availability_percentage || 100) >= 90 ? '#22C55E' :
                                       (item.availability_percentage || 100) >= 70 ? '#F59E0B' : '#EF4444',
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
                    ) : isMaintenanceReport ? (
                      // ✅ MAINTENANCE TABLE ROWS
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                            {item.equipment_name || item.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>
                          <Chip 
                            label={item.maintenance_type || 'Preventive'} 
                            size="small"
                            sx={{
                              bgcolor: item.maintenance_type === 'Emergency' ? '#EF4444' :
                                       item.maintenance_type === 'Corrective' ? '#F59E0B' : '#3B82F6',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '10px',
                              height: 22
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: item.is_overdue ? '#EF4444' : '#0F172A' }}>
                            {item.next_due_date ? new Date(item.next_due_date).toLocaleDateString() : '-'}
                          </Typography>
                          {item.is_overdue && !item.is_completed && (
                            <Typography variant="caption" sx={{ color: '#EF4444', display: 'block' }}>
                              ⚠️ Overdue
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status || 'Scheduled'}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'Completed' ? '#22C55E' :
                                       item.status === 'In Progress' ? '#F59E0B' :
                                       item.status === 'Overdue' ? '#EF4444' : '#3B82F6',
                              color: 'white',
                              fontWeight: 500,
                              height: 24,
                              fontSize: '11px'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>
                          {item.engineer_name || 'Unassigned'}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)} days
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${item.availability || '100.0'}%`}
                            size="small"
                            sx={{
                              bgcolor: parseFloat(item.availability) >= 95 ? '#22C55E' :
                                       parseFloat(item.availability) >= 80 ? '#F59E0B' : '#EF4444',
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
                    ) : isAMCReport ? (
                      // ✅ AMC Table Rows
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                            {item.contract_number}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {item.vendor_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#0F172A' }}>
                            {item.equipment_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {item.equipment_model || ''}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.hospital_name}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'Active' ? '#22C55E' :
                                       item.status === 'In Progress' ? '#3B82F6' :
                                       item.status === 'Expired' ? '#EF4444' :
                                       item.status === 'Pending' ? '#F59E0B' : '#64748B',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.total_errors}
                            size="small"
                            sx={{
                              bgcolor: item.total_errors > 0 ? '#EF4444' : '#22C55E',
                              color: 'white',
                              fontWeight: 600,
                              minWidth: 30
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.pending_errors}
                            size="small"
                            sx={{
                              bgcolor: item.pending_errors > 0 ? '#F59E0B' : '#64748B',
                              color: 'white',
                              fontWeight: 600,
                              minWidth: 30
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.in_progress_errors}
                            size="small"
                            sx={{
                              bgcolor: item.in_progress_errors > 0 ? '#3B82F6' : '#64748B',
                              color: 'white',
                              fontWeight: 600,
                              minWidth: 30
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.resolved_errors}
                            size="small"
                            sx={{
                              bgcolor: item.resolved_errors > 0 ? '#22C55E' : '#64748B',
                              color: 'white',
                              fontWeight: 600,
                              minWidth: 30
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          color: parseFloat(item.total_downtime_days) > 10 ? '#EF4444' : 
                                 parseFloat(item.total_downtime_days) > 5 ? '#F59E0B' : '#0F172A',
                          fontWeight: 700 
                        }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)} days
                        </TableCell>
                        <TableCell align="center">
                          {item.days_remaining !== null && item.days_remaining !== undefined ? (
                            <Chip
                              label={`${item.days_remaining} days`}
                              size="small"
                              sx={{
                                bgcolor: item.days_remaining < 0 ? '#EF4444' :
                                         item.days_remaining < 30 ? '#F59E0B' : '#22C55E',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          ) : '-'}
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
                    ) : isSparePartsReport ? (
                      // ✅ SPARE PARTS TABLE ROWS
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                            {item.part_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.part_number || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.brand || 'N/A'}</TableCell>
                        <TableCell align="center" sx={{ 
                          color: item.quantity <= 0 ? '#EF4444' : 
                                 item.quantity <= item.minimum_stock_level ? '#F59E0B' : '#0F172A',
                          fontWeight: 600 
                        }}>
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748B' }}>
                          {item.minimum_stock_level || 5}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status || 'Unknown'}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'In Stock' ? '#22C55E' :
                                       item.status === 'Low Stock' ? '#F59E0B' :
                                       item.status === 'Out of Stock' ? '#EF4444' : '#64748B',
                              color: 'white',
                              fontWeight: 600,
                              height: 24,
                              fontSize: '11px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#3B82F6', fontWeight: 600 }}>
                          {item.times_used || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {item.times_out_of_stock || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          color: item.total_downtime_days > 0 ? '#EF4444' : '#0F172A',
                          fontWeight: 700 
                        }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                          {item.equipment_names || 'N/A'}
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
                    ) : reportType === 'downtime' ? (
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
                          {Number(item['Total Downtime (Days)'] || 0).toFixed(1)} days
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
                    ) : reportType === 'engineer-performance' ? (
                      <>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: '#0F172A',
                              fontSize: '14px',
                              border: `2px solid #67E8F9`,
                            }}>
                              {item.engineer_name?.charAt(0) || 'E'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                                {item.engineer_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {item.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.hospital_name}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: '#0F172A' }}>{item.total_repairs}</TableCell>
                        <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>{item.completed}</TableCell>
                        <TableCell align="center" sx={{ color: '#F59E0B', fontWeight: 600 }}>{item.pending}</TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>{item.critical}</TableCell>
                        <TableCell align="center" sx={{ color: '#0F172A', fontWeight: 600 }}>
                          {item.avg_days} days
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.completion_rate}
                            size="small"
                            sx={{
                              bgcolor: parseFloat(item.completion_rate) >= 80 ? '#22C55E' :
                                       parseFloat(item.completion_rate) >= 50 ? '#F59E0B' : '#EF4444',
                              color: 'white',
                              fontWeight: 600,
                              height: 22,
                              fontSize: '10px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'Active' ? '#22C55E' : '#EF4444',
                              color: 'white',
                              fontWeight: 500,
                              height: 22,
                              fontSize: '10px'
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
                      // ✅ ERROR REPORT TABLE ROWS WITH EQUIPMENT & HOSPITAL
                      <>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                            {item.period || item.date || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#0F172A' }}>
                            {item.equipment_names || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            {item.hospital_names || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.total_errors || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>{item.resolved || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#F59E0B', fontWeight: 600 }}>{item.pending || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#3B82F6', fontWeight: 600 }}>{item.in_progress || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>{item.critical || 0}</TableCell>
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
                    {selectedItem.equipment_name || selectedItem.name || selectedItem.title || selectedItem['Equipment Name'] || selectedItem.engineer_name || selectedItem.contract_number || selectedItem.part_name || 'Report'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedItem.maintenance_type || selectedItem.type || selectedItem.category || selectedItem.current_status || selectedItem.status || reportType || 'Report'}
                      size="small"
                      sx={{ bgcolor: '#0F172A', color: 'white', fontWeight: 600 }}
                    />
                    {selectedItem.priority && (
                      <Chip
                        label={`Priority: ${selectedItem.priority}`}
                        size="small"
                        sx={{ 
                          bgcolor: selectedItem.priority === 'Critical' ? '#EF4444' :
                                   selectedItem.priority === 'High' ? '#e65100' :
                                   selectedItem.priority === 'Medium' ? '#F59E0B' : '#2E7D32',
                          color: 'white'
                        }}
                      />
                    )}
                    {selectedItem.current_status && (isEquipmentWiseReport || isHospitalReport) && (
                      <Chip
                        label={selectedItem.current_status}
                        size="small"
                        sx={{
                          bgcolor: selectedItem.current_status === 'Active' ? '#22C55E' :
                                   selectedItem.current_status === 'Maintenance' ? '#F59E0B' :
                                   selectedItem.current_status === 'Under Repair' ? '#EF4444' :
                                   selectedItem.current_status === 'Inactive' || selectedItem.current_status === 'Retired' ? '#64748B' : '#3B82F6',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* ✅ Equipment Wise Report - Spare Parts Section */}
              {isEquipmentWiseReport && selectedItem && (selectedItem.total_spare_parts !== undefined) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    🔧 Spare Parts Summary
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Spare Parts</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                        {selectedItem.total_spare_parts || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>In Stock</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#22C55E' }}>
                        {selectedItem.spare_parts_in_stock || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Low Stock</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#F59E0B' }}>
                        {selectedItem.spare_parts_low_stock || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Out of Stock</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#EF4444' }}>
                        {selectedItem.spare_parts_out_of_stock || 0}
                      </Typography>
                    </Box>
                    {isEquipmentWiseReport && selectedItem.total_inactive_hours !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Total Inactive Time</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#EF4444' }}>
                          {Number(selectedItem.total_inactive_hours || 0).toFixed(1)} hours
                        </Typography>
                      </Box>
                    )}
                    {selectedItem.total_spare_parts > 0 && (
                      <Alert severity="info" sx={{ mt: 1, borderRadius: 1 }}>
                        This equipment has {selectedItem.total_spare_parts} associated spare parts.
                        {selectedItem.spare_parts_low_stock > 0 && ` ${selectedItem.spare_parts_low_stock} are low on stock.`}
                        {selectedItem.spare_parts_out_of_stock > 0 && ` ${selectedItem.spare_parts_out_of_stock} are out of stock!`}
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* ✅ Maintenance Schedule Section */}
              {selectedItem.last_maintenance_date !== undefined && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    📅 Schedule
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Last Maintenance</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.last_maintenance_date ? new Date(selectedItem.last_maintenance_date).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Next Due</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: selectedItem.is_overdue ? '#EF4444' : '#0F172A' }}>
                        {selectedItem.next_due_date ? new Date(selectedItem.next_due_date).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Frequency</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.frequency || 'Monthly'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* ✅ Downtime & Availability Section */}
              {selectedItem.total_downtime_days !== undefined && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    📊 Downtime & Availability
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.total_errors || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Resolved Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#22C55E' }}>
                        {selectedItem.resolved_errors || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Critical Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                        {selectedItem.critical_errors || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Downtime</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#EF4444' }}>
                        {Number(selectedItem.total_downtime_days || 0).toFixed(1)} days
                      </Typography>
                    </Box>
                    {isEquipmentWiseReport && selectedItem.total_inactive_hours !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Inactive Time</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#EF4444' }}>
                          {Number(selectedItem.total_inactive_hours || 0).toFixed(1)} hours
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Availability</Typography>
                      <Chip
                        label={selectedItem.availability || '100.0%'}
                        size="small"
                        sx={{
                          bgcolor: parseFloat(selectedItem.availability || 100) >= 95 ? '#22C55E' :
                                   parseFloat(selectedItem.availability || 100) >= 80 ? '#F59E0B' : '#EF4444',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Spare Parts Details */}
              {selectedItem.part_name !== undefined && !isEquipmentWiseReport && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    🔧 Spare Part Details
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Part Name</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.part_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Part Number</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.part_number || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Brand</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.brand || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Quantity</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.quantity || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Minimum Stock</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.minimum_stock_level || 5}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Unit Cost</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatPKR(selectedItem.unit_cost)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Cost</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatPKR(selectedItem.total_cost)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Regular Report Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                  Report Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Status</Typography>
                    <Chip
                      label={selectedItem.status || selectedItem.current_status || 'N/A'}
                      size="small"
                      sx={{
                        bgcolor: selectedItem.status === 'Completed' || selectedItem.status === 'Resolved' || selectedItem.status === 'In Stock' || selectedItem.current_status === 'Active' ? '#22C55E' :
                          selectedItem.status === 'Pending' || selectedItem.status === 'Low Stock' ? '#F59E0B' :
                          selectedItem.status === 'In Progress' ? '#3B82F6' :
                          selectedItem.status === 'Critical' || selectedItem.status === 'Out of Stock' || selectedItem.current_status === 'Under Repair' ? '#EF4444' : '#64748B',
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '10px'
                      }}
                    />
                  </Box>
                  {selectedItem.total_errors !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.total_errors}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.resolved_errors !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Resolved Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#22C55E' }}>
                        {selectedItem.resolved_errors}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.critical_errors !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Critical Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                        {selectedItem.critical_errors}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.total_repairs !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Repairs</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#3B82F6' }}>
                        {selectedItem.total_repairs}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.total_downtime_days !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Downtime</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                        {Number(selectedItem.total_downtime_days || 0).toFixed(1)} days
                      </Typography>
                    </Box>
                  )}
                  {isEquipmentWiseReport && selectedItem.total_inactive_hours !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Inactive Time</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                        {Number(selectedItem.total_inactive_hours || 0).toFixed(1)} hours
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.availability !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Availability</Typography>
                      <Chip
                        label={selectedItem.availability}
                        size="small"
                        sx={{
                          bgcolor: parseFloat(selectedItem.availability) >= 95 ? '#22C55E' :
                                   parseFloat(selectedItem.availability) >= 80 ? '#F59E0B' : '#EF4444',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}
                  {/* AMC Fields */}
                  {selectedItem.contract_number && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Contract</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.contract_number}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.vendor_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Vendor</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.vendor_name}
                      </Typography>
                    </Box>
                  )}
                  {/* Engineer Performance Fields */}
                  {selectedItem.avg_days && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Average Days</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                        {selectedItem.avg_days} days
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.completion_rate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Completion Rate</Typography>
                      <Chip
                        label={selectedItem.completion_rate}
                        size="small"
                        sx={{
                          bgcolor: parseFloat(selectedItem.completion_rate) >= 80 ? '#22C55E' :
                                   parseFloat(selectedItem.completion_rate) >= 50 ? '#F59E0B' : '#EF4444',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Location Information */}
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
                  {selectedItem.department_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Department</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.department_name}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.engineer_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Engineer</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.engineer_name}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.contact_person && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Contact Person</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.contact_person}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.contact_phone && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Contact Phone</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.contact_phone}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Date & Time */}
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
                  {selectedItem.start_date && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Start Date</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatDate(selectedItem.start_date)}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.end_date && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>End Date</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatDate(selectedItem.end_date)}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Description */}
              {selectedItem.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    📝 Description
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Typography variant="body2" sx={{ color: '#0F172A' }}>
                      {selectedItem.description}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* AMC Notes */}
              {selectedItem.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      {selectedItem.notes}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Export Buttons */}
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
  )
}

// ============================================================
// ✅ ENGINEER REPORTS COMPONENT
// ============================================================
const EngineerReports = () => {
  const { user } = useSelector((state) => state.auth)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // ✅ Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem('engineerReportData_cache')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            console.log('📦 Loading cached engineer report data...')
            setReportData({
              success: true,
              data: parsed.data,
              total: parsed.data.length,
              generatedAt: parsed.timestamp,
              period: parsed.period || 'monthly',
              filters: parsed.filters || {},
              type: parsed.type || 'my-downtime'
            })
            setReportType(parsed.type || 'my-downtime')
            setPeriod(parsed.period || 'monthly')
            if (parsed.filters) {
              setFilters(prev => ({ ...prev, ...parsed.filters }))
            }
            return true
          }
        }
      } catch (e) {
        console.error('Failed to load cached engineer data:', e)
      }
      return false
    }

    const cachedLoaded = loadCachedData()
    setInitialLoadDone(true)
    
    if (!cachedLoaded) {
      generateReport('my-downtime', 'monthly')
    }
  }, [])

  // ✅ Save data to localStorage when it changes
  useEffect(() => {
    if (reportData?.data?.length > 0) {
      try {
        localStorage.setItem('engineerReportData_cache', JSON.stringify({
          data: reportData.data,
          timestamp: Date.now(),
          type: reportData.type || reportType,
          period: reportData.period || period,
          filters: reportData.filters || filters
        }))
      } catch (e) {
        console.error('Failed to cache engineer data:', e)
      }
    }
  }, [reportData, reportType, period, filters])

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  // ✅ Engineer Report Types
  const engineerReportTypes = [
    { value: 'my-downtime', label: '📉 My Equipment Downtime' },
    { value: 'my-maintenance', label: '🔧 My Maintenance Tasks' },
    { value: 'my-spare-parts', label: '📦 My Spare Parts' },
    { value: 'my-performance', label: '👨‍🔧 My Performance' },
    { value: 'my-hospital', label: '🏥 My Hospital Report' },
  ]

  const additionalFilters = []

  // ✅ generateReport for Engineer
  const generateReport = useCallback(async (type, periodVal) => {
    const reportTypeVal = type || reportType
    const periodValActual = periodVal || period

    setLoading(true)
    setError(null)

    try {
      let data = []

      switch (reportTypeVal) {
        case 'my-downtime': {
          const [equipmentRes, errorsRes, repairsRes] = await Promise.all([
            api.get('/equipment'),
            api.get('/errors'),
            api.get('/repairs')
          ])
          
          const equipment = equipmentRes.data.equipment || []
          const errors = errorsRes.data.errors || []
          const repairs = repairsRes.data.repairs || []

          // Filter equipment by engineer's hospital
          const engineerHospitalId = user?.hospital_id
          let filteredEquipment = equipment.filter(e => 
            String(e.hospital_id) === String(engineerHospitalId)
          )

          let filteredErrors = errors
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            filteredErrors = filteredErrors.filter(e => {
              const d = new Date(e.created_at)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            filteredErrors = filteredErrors.filter(e => {
              const d = new Date(e.created_at)
              return d <= end
            })
          }

          let filteredRepairs = repairs
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d <= end
            })
          }

          data = buildDowntimeRows(filteredEquipment, filteredErrors, filteredRepairs)
          break
        }

        case 'my-maintenance': {
          const response = await api.get('/maintenance')
          let maintenanceData = response.data.schedules || response.data || []
          
          // Filter by engineer's hospital
          const engineerHospitalId = user?.hospital_id
          maintenanceData = maintenanceData.filter(m => 
            String(m.hospital_id) === String(engineerHospitalId)
          )
          
          // Apply date filters
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            maintenanceData = maintenanceData.filter(m => {
              const d = new Date(m.created_at || m.updated_at)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            maintenanceData = maintenanceData.filter(m => {
              const d = new Date(m.created_at || m.updated_at)
              return d <= end
            })
          }
          if (filters.status) {
            maintenanceData = maintenanceData.filter(m => 
              String(m.status).toLowerCase() === String(filters.status).toLowerCase()
            )
          }

          // Get errors for downtime calculation
          const errorsRes = await api.get('/errors')
          const allErrors = errorsRes.data.errors || []
          
          // Calculate downtime for each maintenance
          const dataWithDowntime = maintenanceData.map(m => {
            const equipmentErrors = allErrors.filter(e => 
              e.equipment_id === m.equipment_id
            )
            
            let totalDowntimeHours = 0
            let resolvedErrors = 0
            let criticalErrors = 0
            
            equipmentErrors.forEach(e => {
              const resolvedStatuses = ['Resolved', 'Closed', 'Completed']
              if (resolvedStatuses.includes(e.status)) {
                resolvedErrors++
                if (e.created_at && e.updated_at) {
                  const start = new Date(e.created_at)
                  const end = new Date(e.updated_at)
                  const hours = (end - start) / (1000 * 60 * 60)
                  if (hours > 0) totalDowntimeHours += hours
                }
              }
              if (String(e.severity).toLowerCase() === 'critical') {
                criticalErrors++
              }
            })
            
            const downtimeDays = totalDowntimeHours / 24
            
            const isOverdue = m.next_due_date && new Date(m.next_due_date) < new Date()
            const isCompleted = String(m.status).toLowerCase() === 'completed'
            
            return {
              ...m,
              total_errors: equipmentErrors.length,
              resolved_errors: resolvedErrors,
              critical_errors: criticalErrors,
              total_downtime_hours: totalDowntimeHours,
              total_downtime_days: Number(downtimeDays.toFixed(1)),
              is_overdue: isOverdue,
              is_completed: isCompleted,
              availability: totalDowntimeHours > 0 
                ? ((365 * 24 - totalDowntimeHours) / (365 * 24) * 100).toFixed(1)
                : '100.0'
            }
          })
          
          dataWithDowntime.sort((a, b) => {
            if (a.is_overdue && !b.is_overdue) return -1
            if (!a.is_overdue && b.is_overdue) return 1
            return (a.next_due_date || '').localeCompare(b.next_due_date || '')
          })
          
          const stats = {
            total: dataWithDowntime.length,
            scheduled: dataWithDowntime.filter(m => m.status === 'Scheduled').length,
            in_progress: dataWithDowntime.filter(m => m.status === 'In Progress').length,
            completed: dataWithDowntime.filter(m => m.status === 'Completed').length,
            overdue: dataWithDowntime.filter(m => m.is_overdue || m.status === 'Overdue').length,
            total_downtime_hours: dataWithDowntime.reduce((sum, m) => sum + (m.total_downtime_hours || 0), 0),
            total_downtime_days: Number((dataWithDowntime.reduce((sum, m) => sum + (m.total_downtime_hours || 0), 0) / 24).toFixed(1)),
            avg_availability: dataWithDowntime.length > 0 
              ? (dataWithDowntime.reduce((sum, m) => sum + parseFloat(m.availability), 0) / dataWithDowntime.length).toFixed(1)
              : '100.0'
          }
          
          dataWithDowntime._summary = stats
          data = dataWithDowntime
          break
        }

        case 'my-spare-parts': {
          try {
            const response = await api.get('/spare-parts')
            const allParts = response.data.spareParts || []
            
            const equipmentRes = await api.get('/equipment')
            const equipment = equipmentRes.data.equipment || []
            
            // Filter by engineer's hospital
            const engineerHospitalId = user?.hospital_id
            const hospitalEquipment = equipment.filter(e => 
              String(e.hospital_id) === String(engineerHospitalId)
            )
            
            const dataWithDetails = allParts.map(part => {
              let equipmentNames = []
              let equipmentIds = []
              
              if (part.compatible_equipment) {
                const compatibleList = part.compatible_equipment.split(',').map(s => s.trim().toLowerCase())
                hospitalEquipment.forEach(eq => {
                  const eqName = (eq.name || '').toLowerCase()
                  if (compatibleList.some(c => eqName.includes(c) || c.includes(eqName))) {
                    equipmentNames.push(eq.name)
                    equipmentIds.push(eq.id)
                  }
                })
              }
              
              hospitalEquipment.forEach(eq => {
                if (String(eq.part_id) === String(part.id)) {
                  if (!equipmentNames.includes(eq.name)) {
                    equipmentNames.push(eq.name)
                    equipmentIds.push(eq.id)
                  }
                }
              })
              
              if (part.equipment_id) {
                const eq = hospitalEquipment.find(e => String(e.id) === String(part.equipment_id))
                if (eq && !equipmentNames.includes(eq.name)) {
                  equipmentNames.push(eq.name)
                  equipmentIds.push(eq.id)
                }
              }
              
              if (equipmentNames.length === 0) {
                equipmentNames = ['N/A']
              }
              
              const downtimeDays = part.total_downtime_days || part.downtime_days || 0
              const totalDowntimeHours = part.total_downtime_hours || part.downtime_hours || 0
              
              return {
                id: part.id,
                part_name: part.part_name || 'N/A',
                part_number: part.part_number || 'N/A',
                brand: part.brand || 'N/A',
                manufacturer: part.manufacturer || 'N/A',
                quantity: part.quantity || 0,
                minimum_stock_level: part.minimum_stock_level || 5,
                status: part.status || 'Unknown',
                unit_cost: part.unit_cost || 0,
                total_cost: part.total_cost || 0,
                compatible_equipment: part.compatible_equipment || 'N/A',
                times_used: part.times_used || 0,
                last_used_at: part.last_used_at || null,
                times_out_of_stock: part.times_out_of_stock || 0,
                first_out_of_stock: part.first_out_of_stock || null,
                last_back_in_stock: part.last_back_in_stock || null,
                total_downtime_hours: Number(totalDowntimeHours) || 0,
                total_downtime_days: Number(downtimeDays).toFixed(1),
                is_currently_out: part.status === 'Out of Stock',
                equipment_count: equipmentNames.length,
                equipment_names: equipmentNames.join(', '),
                equipment_ids: equipmentIds
              }
            })
            
            let filteredData = dataWithDetails
            if (filters.status) {
              filteredData = filteredData.filter(p => 
                String(p.status).toLowerCase() === String(filters.status).toLowerCase()
              )
            }
            
            const stats = {
              total_parts: filteredData.length,
              out_of_stock: filteredData.filter(p => p.status === 'Out of Stock').length,
              low_stock: filteredData.filter(p => p.status === 'Low Stock').length,
              in_stock: filteredData.filter(p => p.status === 'In Stock').length,
              total_downtime_hours: filteredData.reduce((sum, p) => sum + (parseFloat(p.total_downtime_hours) || 0), 0),
              total_downtime_days: Number(filteredData.reduce((sum, p) => sum + (parseFloat(p.total_downtime_days) || 0), 0).toFixed(1)),
              total_cost: filteredData.reduce((sum, p) => sum + (p.total_cost || 0), 0)
            }
            
            filteredData._summary = stats
            data = filteredData
            break
          } catch (error) {
            console.error('❌ Spare parts error:', error)
            toast.error('Failed to fetch spare parts data: ' + error.message)
            data = []
            break
          }
        }

        case 'my-performance': {
          const repairsRes = await api.get('/repairs')
          const allRepairs = repairsRes.data.repairs || []
          
          const engineerRepairs = allRepairs.filter(r => 
            String(r.engineer_id) === String(user?.id)
          )

          let filteredRepairs = engineerRepairs
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d >= start
            })
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`)
            filteredRepairs = filteredRepairs.filter(r => {
              const d = new Date(r.created_at || r.repair_date)
              return d <= end
            })
          }

          const total = filteredRepairs.length
          const completed = filteredRepairs.filter(r =>
            ['completed', 'verified', 'resolved'].includes(String(r.status || '').toLowerCase())
          ).length
          const pending = filteredRepairs.filter(r =>
            ['pending', 'in progress', 'assigned'].includes(String(r.status || '').toLowerCase())
          ).length
          const critical = filteredRepairs.filter(r => r.spare_part_used === 1).length

          const totalMinutes = filteredRepairs.reduce((sum, r) => sum + (parseInt(r.time_taken) || 0), 0)
          const avgDays = total > 0 ? (totalMinutes / (24 * 60)) : 0

          data = [{
            engineer_id: user?.id,
            engineer_name: user?.full_name || user?.username || 'Engineer',
            email: user?.email,
            hospital_name: user?.hospital_name || 'N/A',
            total_repairs: total,
            completed: completed,
            pending: pending,
            critical: critical,
            total_time: totalMinutes,
            avg_days: avgDays.toFixed(1),
            completion_rate: total > 0 ? ((completed / total) * 100).toFixed(1) + '%' : '0.0%',
            status: user?.is_active ? 'Active' : 'Inactive'
          }]
          break
        }

        case 'my-hospital': {
          const [hospitalsRes, equipmentRes, errorLogsRes] = await Promise.all([
            api.get('/hospitals'),
            api.get('/equipment'),
            api.get('/error-logs')
          ])
          
          const hospitals = hospitalsRes.data.hospitals || []
          const equipment = equipmentRes.data.equipment || []
          const errorLogs = errorLogsRes.data.errors || []

          // Filter by engineer's hospital
          const engineerHospitalId = user?.hospital_id
          const engineerHospital = hospitals.find(h => String(h.id) === String(engineerHospitalId))
          
          if (!engineerHospital) {
            data = []
            break
          }

          const hospitalEquipment = equipment.filter(e => 
            String(e.hospital_id) === String(engineerHospitalId)
          )
          const equipmentIds = hospitalEquipment.map(e => e.id)
          const hospitalErrors = errorLogs.filter(e => 
            equipmentIds.includes(e.equipment_id)
          )

          const totalEquipment = hospitalEquipment.length
          const totalErrors = hospitalErrors.length
          const resolvedErrors = hospitalErrors.filter(e => e.status === 'Resolved' || e.status === 'Closed').length
          const pendingErrors = hospitalErrors.filter(e => e.status === 'Pending').length
          const inProgressErrors = hospitalErrors.filter(e => e.status === 'In Progress').length
          const criticalErrors = hospitalErrors.filter(e => e.priority === 'Critical' || e.severity === 'Critical').length

          let downtimeHours = 0
          hospitalErrors.forEach(e => {
            if (e.status === 'Resolved' || e.status === 'Closed') {
              const start = new Date(e.error_date || e.created_at)
              let end = new Date(e.updated_at || e.created_at)
              if (end <= start) {
                end = new Date(start)
                end.setHours(end.getHours() + 1)
              }
              if (end > start) {
                const hours = (end - start) / (1000 * 60 * 60)
                if (hours > 0 && hours < 8760) downtimeHours += hours
              }
            }
          })

          const totalPossibleHours = totalEquipment * 8760
          const availability = totalPossibleHours > 0 
            ? Number((Math.max(0, ((totalPossibleHours - downtimeHours) / totalPossibleHours) * 100)).toFixed(1))
            : 100

          const resolutionRate = totalErrors > 0 
            ? Number(((resolvedErrors / totalErrors) * 100).toFixed(1))
            : 0

          const hospitalData = [{
            id: engineerHospital.id,
            hospital_id: engineerHospital.id,
            name: engineerHospital.name,
            city: engineerHospital.city || 'N/A',
            state: engineerHospital.state || 'N/A',
            status: engineerHospital.is_active ? 'Active' : 'Inactive',
            hospital_code: engineerHospital.hospital_code || 'N/A',
            total_equipment: totalEquipment,
            active_equipment: hospitalEquipment.filter(e => e.status === 'Active').length,
            inactive_equipment: hospitalEquipment.filter(e => e.status === 'Inactive' || e.status === 'Retired').length,
            maintenance_equipment: hospitalEquipment.filter(e => e.status === 'Maintenance').length,
            total_errors: totalErrors,
            resolved_errors: resolvedErrors,
            pending_errors: pendingErrors,
            in_progress_errors: inProgressErrors,
            critical_errors: criticalErrors,
            total_downtime_hours: Number(downtimeHours.toFixed(1)),
            total_downtime_days: Number((downtimeHours / 24).toFixed(1)),
            availability_percentage: availability,
            resolution_rate: resolutionRate
          }]

          const summary = {
            total_hospitals: 1,
            total_equipment: totalEquipment,
            total_errors: totalErrors,
            total_resolved: resolvedErrors,
            total_pending: pendingErrors,
            total_critical: criticalErrors,
            total_downtime_hours: Number(downtimeHours.toFixed(1)),
            total_downtime_days: Number((downtimeHours / 24).toFixed(1)),
            avg_availability: availability
          }

          hospitalData._summary = summary
          data = hospitalData
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
      console.error('❌ Engineer report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [reportType, period, filters, user])

  // ✅ Fixed useEffect with proper dependencies
  useEffect(() => {
    if (initialLoadDone && !reportData) {
      generateReport(reportType, period)
    }

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing engineer report data...')
      generateReport(reportType, period)
    }, 30000)

    return () => clearInterval(interval)
  }, [reportType, period, initialLoadDone, generateReport])

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
    const filename = (() => {
      const map = {
        'my-downtime': 'My_Equipment_Downtime',
        'my-maintenance': 'My_Maintenance_Tasks',
        'my-spare-parts': 'My_Spare_Parts',
        'my-performance': 'My_Performance',
        'my-hospital': 'My_Hospital_Report'
      }
      return map[reportType] || 'My_Report'
    })()

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
        item.current_status,
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
        item.date,
        item['Serial / Asset No.'],
        item['Equipment ID'],
        item['Department'],
        item.maintenance_type,
        item.frequency,
        item.part_number,
        item.brand,
        item.equipment_names,
        item.hospital_names,
        item.Model,
        item['Serial Number']
      ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase())

      return searchableFields.some(field => field.includes(searchLower))
    })

    return filtered
  }, [reportData?.data, searchTerm, filters.status])

  const totalRecords = filteredData.length

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

  const isMyHospitalReport = reportType === 'my-hospital'
  const isMyMaintenanceReport = reportType === 'my-maintenance'
  const isMySparePartsReport = reportType === 'my-spare-parts'
  const isMyPerformanceReport = reportType === 'my-performance'

  return (
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
            Engineer Reports
          </Typography>
          <Chip
            icon={<Person sx={{ fontSize: 16 }} />}
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

      {/* ✅ STATS CARDS - Engineer Report Stats */}
      {isMyHospitalReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Equipment"
              value={filteredData._summary?.total_equipment || 0}
              color="#0F172A"
              icon={<MedicalServices sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Errors"
              value={filteredData._summary?.total_errors || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<ErrorOutline sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Resolved"
              value={filteredData._summary?.total_resolved || 0}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Critical"
              value={filteredData._summary?.total_critical || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Availability"
              value={filteredData._summary?.avg_availability || '100.0%'}
              color="#6f42c1"
              bgColor="#f3e5f5"
              icon={<TrendingUp sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isMyMaintenanceReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Tasks"
              value={filteredData._summary?.total || filteredData.length}
              color="#0F172A"
              icon={<Assessment sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Scheduled"
              value={filteredData._summary?.scheduled || 0}
              color="#3B82F6"
              bgColor="#3B82F610"
              icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="In Progress"
              value={filteredData._summary?.in_progress || 0}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Build sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Overdue"
              value={filteredData._summary?.overdue || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Downtime"
              value={filteredData._summary?.total_downtime_days || '0'}
              subtitle="Days"
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isMySparePartsReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Parts"
              value={filteredData.length}
              color="#0F172A"
              icon={<Inventory sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="In Stock"
              value={filteredData._summary?.in_stock || 0}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Low Stock"
              value={filteredData._summary?.low_stock || 0}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Warning sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Out of Stock"
              value={filteredData._summary?.out_of_stock || 0}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<Cancel sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Downtime"
              value={filteredData._summary?.total_downtime_days || '0'}
              subtitle="Days"
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : isMyPerformanceReport ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Total Repairs"
              value={filteredData[0]?.total_repairs || 0}
              color="#0F172A"
              icon={<Build sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Completed"
              value={filteredData[0]?.completed || 0}
              color="#22C55E"
              bgColor="#22C55E10"
              icon={<CheckCircle sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Pending"
              value={filteredData[0]?.pending || 0}
              color="#F59E0B"
              bgColor="#F59E0B10"
              icon={<Schedule sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Avg Days"
              value={`${filteredData[0]?.avg_days || 0} days`}
              color="#6f42c1"
              bgColor="#f3e5f5"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <StatsCard
              title="Completion Rate"
              value={filteredData[0]?.completion_rate || '0%'}
              color="#6f42c1"
              bgColor="#f3e5f5"
              icon={<BarChart sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
          </Grid>
        </Grid>
      ) : reportType === 'my-downtime' ? (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
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
              value={`${Number(filteredData.reduce((sum, row) => sum + parseFloat(row['Total Downtime (Days)'] || 0), 0)).toFixed(1)} days`}
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
        </Grid>
      ) : (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
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
              value={`${Number(filteredData.reduce((sum, row) => sum + parseFloat(row['Total Downtime (Days)'] || row.downtime_days || 0), 0)).toFixed(1)} days`}
              color="#EF4444"
              bgColor="#EF444410"
              icon={<TimerOff sx={{ fontSize: 20, color: 'white' }} />}
              loading={loading}
            />
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
        reportTypes={engineerReportTypes}
        selectedReportType={reportType}
        onReportTypeChange={handleReportTypeChange}
        additionalFilters={additionalFilters}
      />

      {/* ✅ TABLE - Engineer Report Table */}
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
                {isMyHospitalReport ? (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hospital</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>City</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>State</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Errors</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Resolved</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Availability</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : isMyMaintenanceReport ? (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Next Due</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Engineer</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Availability</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : isMySparePartsReport ? (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Part Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Part #</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Brand</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Qty</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Min Stock</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Used</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Times Out</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : isMyPerformanceReport ? (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Engineer</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hospital</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Total Repairs</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Completed</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Pending</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Avg Days</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Completion Rate</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : reportType === 'my-downtime' ? (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hospital</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Failures</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Downtime (Days)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Availability</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Date</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <LinearProgress sx={{ my: 2, bgcolor: 'rgba(103, 232, 249, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#67E8F9' } }} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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
                    {isMyHospitalReport ? (
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                            {item.name || 'N/A'}
                          </Typography>
                          {item.hospital_code && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                              Code: {item.hospital_code}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.city || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.state || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status || 'Active'}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'Active' ? '#22C55E' : '#EF4444',
                              color: 'white',
                              fontWeight: 500,
                              height: 22,
                              fontSize: '10px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#0F172A', fontWeight: 600 }}>
                          {item.total_equipment || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {item.total_errors || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>
                          {item.resolved_errors || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {item.critical_errors || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 700 }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${item.availability_percentage || 100}%`}
                            size="small"
                            sx={{
                              bgcolor: (item.availability_percentage || 100) >= 90 ? '#22C55E' :
                                       (item.availability_percentage || 100) >= 70 ? '#F59E0B' : '#EF4444',
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
                    ) : isMyMaintenanceReport ? (
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                            {item.equipment_name || item.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>
                          <Chip 
                            label={item.maintenance_type || 'Preventive'} 
                            size="small"
                            sx={{
                              bgcolor: item.maintenance_type === 'Emergency' ? '#EF4444' :
                                       item.maintenance_type === 'Corrective' ? '#F59E0B' : '#3B82F6',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '10px',
                              height: 22
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: item.is_overdue ? '#EF4444' : '#0F172A' }}>
                            {item.next_due_date ? new Date(item.next_due_date).toLocaleDateString() : '-'}
                          </Typography>
                          {item.is_overdue && !item.is_completed && (
                            <Typography variant="caption" sx={{ color: '#EF4444', display: 'block' }}>
                              ⚠️ Overdue
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status || 'Scheduled'}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'Completed' ? '#22C55E' :
                                       item.status === 'In Progress' ? '#F59E0B' :
                                       item.status === 'Overdue' ? '#EF4444' : '#3B82F6',
                              color: 'white',
                              fontWeight: 500,
                              height: 24,
                              fontSize: '11px'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>
                          {item.engineer_name || 'Unassigned'}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)} days
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${item.availability || '100.0'}%`}
                            size="small"
                            sx={{
                              bgcolor: parseFloat(item.availability) >= 95 ? '#22C55E' :
                                       parseFloat(item.availability) >= 80 ? '#F59E0B' : '#EF4444',
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
                    ) : isMySparePartsReport ? (
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                            {item.part_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.part_number || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.brand || 'N/A'}</TableCell>
                        <TableCell align="center" sx={{ 
                          color: item.quantity <= 0 ? '#EF4444' : 
                                 item.quantity <= item.minimum_stock_level ? '#F59E0B' : '#0F172A',
                          fontWeight: 600 
                        }}>
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748B' }}>
                          {item.minimum_stock_level || 5}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status || 'Unknown'}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'In Stock' ? '#22C55E' :
                                       item.status === 'Low Stock' ? '#F59E0B' :
                                       item.status === 'Out of Stock' ? '#EF4444' : '#64748B',
                              color: 'white',
                              fontWeight: 600,
                              height: 24,
                              fontSize: '11px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#3B82F6', fontWeight: 600 }}>
                          {item.times_used || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {item.times_out_of_stock || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          color: item.total_downtime_days > 0 ? '#EF4444' : '#0F172A',
                          fontWeight: 700 
                        }}>
                          {Number(item.total_downtime_days || 0).toFixed(1)}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                          {item.equipment_names || 'N/A'}
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
                    ) : isMyPerformanceReport ? (
                      <>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: '#0F172A',
                              fontSize: '14px',
                              border: `2px solid #67E8F9`,
                            }}>
                              {item.engineer_name?.charAt(0) || 'E'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                                {item.engineer_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {item.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.hospital_name}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: '#0F172A' }}>{item.total_repairs}</TableCell>
                        <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600 }}>{item.completed}</TableCell>
                        <TableCell align="center" sx={{ color: '#F59E0B', fontWeight: 600 }}>{item.pending}</TableCell>
                        <TableCell align="center" sx={{ color: '#EF4444', fontWeight: 600 }}>{item.critical}</TableCell>
                        <TableCell align="center" sx={{ color: '#0F172A', fontWeight: 600 }}>
                          {item.avg_days} days
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.completion_rate}
                            size="small"
                            sx={{
                              bgcolor: parseFloat(item.completion_rate) >= 80 ? '#22C55E' :
                                       parseFloat(item.completion_rate) >= 50 ? '#F59E0B' : '#EF4444',
                              color: 'white',
                              fontWeight: 600,
                              height: 22,
                              fontSize: '10px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status}
                            size="small"
                            sx={{
                              bgcolor: item.status === 'Active' ? '#22C55E' : '#EF4444',
                              color: 'white',
                              fontWeight: 500,
                              height: 22,
                              fontSize: '10px'
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
                    ) : reportType === 'my-downtime' ? (
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
                          {Number(item['Total Downtime (Days)'] || 0).toFixed(1)} days
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

      {/* VIEW DIALOG - Engineer */}
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
                    {selectedItem.equipment_name || selectedItem.name || selectedItem.title || selectedItem['Equipment Name'] || selectedItem.engineer_name || selectedItem.part_name || 'Report'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedItem.maintenance_type || selectedItem.type || selectedItem.category || selectedItem.current_status || selectedItem.status || reportType || 'Report'}
                      size="small"
                      sx={{ bgcolor: '#0F172A', color: 'white', fontWeight: 600 }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Maintenance Schedule Section */}
              {selectedItem.last_maintenance_date !== undefined && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    📅 Schedule
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Last Maintenance</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.last_maintenance_date ? new Date(selectedItem.last_maintenance_date).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Next Due</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: selectedItem.is_overdue ? '#EF4444' : '#0F172A' }}>
                        {selectedItem.next_due_date ? new Date(selectedItem.next_due_date).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Frequency</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.frequency || 'Monthly'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Downtime & Availability Section */}
              {selectedItem.total_downtime_days !== undefined && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    📊 Downtime & Availability
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.total_errors || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Resolved Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#22C55E' }}>
                        {selectedItem.resolved_errors || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Critical Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                        {selectedItem.critical_errors || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Downtime</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#EF4444' }}>
                        {Number(selectedItem.total_downtime_days || 0).toFixed(1)} days
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Availability</Typography>
                      <Chip
                        label={selectedItem.availability || '100.0%'}
                        size="small"
                        sx={{
                          bgcolor: parseFloat(selectedItem.availability || 100) >= 95 ? '#22C55E' :
                                   parseFloat(selectedItem.availability || 100) >= 80 ? '#F59E0B' : '#EF4444',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Spare Parts Details */}
              {selectedItem.part_name !== undefined && !isMySparePartsReport && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    🔧 Spare Part Details
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Part Name</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.part_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Part Number</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.part_number || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Brand</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.brand || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Quantity</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.quantity || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Minimum Stock</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.minimum_stock_level || 5}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Unit Cost</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatPKR(selectedItem.unit_cost)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Cost</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {formatPKR(selectedItem.total_cost)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Report Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                  Report Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Status</Typography>
                    <Chip
                      label={selectedItem.status || selectedItem.current_status || 'N/A'}
                      size="small"
                      sx={{
                        bgcolor: selectedItem.status === 'Completed' || selectedItem.status === 'Resolved' || selectedItem.status === 'In Stock' || selectedItem.current_status === 'Active' ? '#22C55E' :
                          selectedItem.status === 'Pending' || selectedItem.status === 'Low Stock' ? '#F59E0B' :
                          selectedItem.status === 'In Progress' ? '#3B82F6' :
                          selectedItem.status === 'Critical' || selectedItem.status === 'Out of Stock' || selectedItem.current_status === 'Under Repair' ? '#EF4444' : '#64748B',
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '10px'
                      }}
                    />
                  </Box>
                  {selectedItem.total_errors !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.total_errors}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.resolved_errors !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Resolved Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#22C55E' }}>
                        {selectedItem.resolved_errors}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.critical_errors !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Critical Errors</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                        {selectedItem.critical_errors}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.total_repairs !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Repairs</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#3B82F6' }}>
                        {selectedItem.total_repairs}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.total_downtime_days !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Downtime</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#EF4444' }}>
                        {Number(selectedItem.total_downtime_days || 0).toFixed(1)} days
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.availability !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Availability</Typography>
                      <Chip
                        label={selectedItem.availability}
                        size="small"
                        sx={{
                          bgcolor: parseFloat(selectedItem.availability) >= 95 ? '#22C55E' :
                                   parseFloat(selectedItem.availability) >= 80 ? '#F59E0B' : '#EF4444',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}
                  {/* Performance Fields */}
                  {selectedItem.avg_days && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Average Days</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0F172A' }}>
                        {selectedItem.avg_days} days
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.completion_rate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Completion Rate</Typography>
                      <Chip
                        label={selectedItem.completion_rate}
                        size="small"
                        sx={{
                          bgcolor: parseFloat(selectedItem.completion_rate) >= 80 ? '#22C55E' :
                                   parseFloat(selectedItem.completion_rate) >= 50 ? '#F59E0B' : '#EF4444',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Location Information */}
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
                  {selectedItem.department_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Department</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.department_name}
                      </Typography>
                    </Box>
                  )}
                  {selectedItem.engineer_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Engineer</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0F172A' }}>
                        {selectedItem.engineer_name}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Date & Time */}
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

              {/* Description */}
              {selectedItem.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, fontWeight: 600 }}>
                    📝 Description
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.1)` }}>
                    <Typography variant="body2" sx={{ color: '#0F172A' }}>
                      {selectedItem.description}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Export Buttons */}
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