// src/pages/Reports.jsx
// ✅ WHITE BACKGROUND - Matching sidebar theme
// ✅ DARK NAVY + LIGHT CYAN THEME
// ✅ Downtime calculation fixed (only resolved errors)
// ✅ Availability % fixed (100% if no downtime)
// ✅ Days/Weeks/Months added in export
// ✅ Charts on screen for downtime reports
// ✅ Charts in Excel/PDF exports
// ✅ Super Admin + Engineer roles supported
// ✅ NO SCROLL - Fixed height

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
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Skeleton,
  Collapse,
  Snackbar,
  Avatar,
  CircularProgress,
} from '@mui/material'
import {
  Search,
  Refresh,
  Assessment,
  ErrorOutline,
  Warning,
  CheckCircle,
  Schedule,
  BarChart,
  Person,
  FilterList,
  Clear,
  FileDownload,
  TableChart,
  PictureAsPdf,
  Download,
  Close,
  Visibility,
  KeyboardArrowDown,
  KeyboardArrowUp,
  TimerOff,
  TrendingUp,
  MedicalServices,
  Dashboard,
  Engineering,
  Business,
  Inventory,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

// ============================================================
// ✅ THEME COLORS - MATCHING SIDEBAR
// ============================================================
const colors = {
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textLight: '#64748B',
  textWhite: '#FFFFFF',
  bgWhite: '#FFFFFF',
  bgLight: '#F8FAFC',
  bgGray: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  borderColor: 'rgba(103, 232, 249, 0.2)',
  borderDark: '#E2E8F0',
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
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const num = (value, fallback = 0) => {
  const n = Number(value)
  return isFinite(n) ? n : fallback
}

const firstValue = (obj, keys, fallback = null) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') return obj[key]
  }
  return fallback
}

const percentage = (value, total) => (total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0.0%')

const average = (values) => {
  const valid = values.filter((v) => isFinite(v))
  return valid.length ? valid.reduce((sum, v) => sum + v, 0) / valid.length : 0
}

const getRecordDate = (item) => item?.created_at || item?.reported_at || item?.date || item?.repair_date

// ✅ DOWNTIME CALCULATION - ONLY RESOLVED ERRORS
const getDowntimeHours = (item) => {
  const status = String(item.status || '').toLowerCase()
  if (!['resolved', 'closed', 'completed'].includes(status)) return 0

  const start = firstValue(item, ['created_at', 'reported_at', 'breakdown_at'])
  const end = firstValue(item, ['updated_at', 'resolved_at', 'completed_at', 'closed_at'])
  if (!start || !end) return 0

  const startDate = new Date(start)
  const endDate = new Date(end)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0

  return Math.max(0, (endDate.getTime() - startDate.getTime()) / 3600000)
}

const getDowntimeBreakdown = (hours) => ({
  hours,
  days: hours / 24,
  weeks: hours / 24 / 7,
  months: hours / 24 / 30.44,
})

const equipmentName = (x) => firstValue(x, ['equipment_name', 'name', 'equipment', 'asset_name'], 'N/A')

// ============================================================
// ✅ REPORT BUILDERS
// ============================================================
const buildErrorSummaryRows = (errors, period) => {
  const groups = new Map()

  errors.forEach((error) => {
    const key = getPeriodKey(getRecordDate(error), period)
    if (!groups.has(key)) {
      groups.set(key, {
        period: formatPeriodLabel(key, period),
        total_errors: 0,
        resolved: 0,
        open: 0,
        critical: 0,
        resolution_hours: [],
      })
    }

    const row = groups.get(key)
    const status = String(error.status || '').toLowerCase()
    const severity = String(error.severity || '').toLowerCase()

    row.total_errors += 1
    if (['resolved', 'closed', 'completed'].includes(status)) row.resolved += 1
    if (['pending', 'in progress', 'open'].includes(status)) row.open += 1
    if (severity === 'critical') row.critical += 1

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
      resolution_rate: percentage(row.resolved, row.total_errors),
      avg_resolution_time: row.resolution_hours.length
        ? `${average(row.resolution_hours).toFixed(1)} hrs`
        : 'N/A',
    }))
}

const buildDowntimeRows = (equipment, errors) => {
  return equipment
    .map((eq) => {
      const name = equipmentName(eq)
      const eqErrors = errors.filter(
        (e) => equipmentName(e) === name || firstValue(e, ['equipment_id']) === firstValue(eq, ['id'])
      )

      const resolved = eqErrors.filter((e) =>
        ['resolved', 'closed', 'completed'].includes(String(e.status || '').toLowerCase())
      )
      const critical = eqErrors.filter((e) => String(e.severity || '').toLowerCase() === 'critical').length
      const downtime = resolved.reduce((sum, e) => sum + getDowntimeHours(e), 0)

      const availability = resolved.length === 0 ? 100 : Math.max(0, 100 - downtime / 24)

      return {
        'Equipment Name': name,
        Hospital: firstValue(eq, ['hospital_name', 'hospital'], 'N/A'),
        'Total Failures': eqErrors.length,
        'Critical Failures': critical,
        'Total Downtime (Hours)': downtime.toFixed(1),
        'Availability %': `${availability.toFixed(1)}%`,
      }
    })
    .filter((r) => num(r['Total Downtime (Hours)']) > 0 || num(r['Total Failures']) > 0)
    .sort((a, b) => num(b['Total Downtime (Hours)']) - num(a['Total Downtime (Hours)']))
}

const getPeriodKey = (date, period) => {
  if (!date) return 'Unknown'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Unknown'

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
  const week = Math.ceil(((temp - yearStart) / 86400000 + 1) / 7)
  return `${weekYear}-W${String(week).padStart(2, '0')}`
}

const formatPeriodLabel = (key, period) => {
  if (key === 'Unknown' || period === 'yearly' || period === 'weekly') return key
  if (period === 'monthly') {
    const [year, month] = key.split('-')
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }
  return formatDate(key)
}

const applyCommonFilters = (items, filters) => {
  if (!Array.isArray(items)) return []
  return items.filter((item) => {
    if (filters?.status && item.status !== filters.status) return false
    if (filters?.hospital && item.hospital_id !== parseInt(filters.hospital, 10)) return false

    const recordDate = getRecordDate(item)
    if (filters?.startDate && recordDate) {
      const start = new Date(`${filters.startDate}T00:00:00`)
      if (new Date(recordDate) < start) return false
    }
    if (filters?.endDate && recordDate) {
      const end = new Date(`${filters.endDate}T23:59:59`)
      if (new Date(recordDate) > end) return false
    }
    return true
  })
}

// ============================================================
// ✅ CHART COMPONENTS
// ============================================================
const DowntimeBarChart = ({ data }) => {
  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.downtime), 1)
  const sortedData = [...data].sort((a, b) => b.downtime - a.downtime).slice(0, 8)

  return (
    <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${colors.borderColor}`, height: '100%', bgcolor: colors.cardBg }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.textPrimary, mb: 2 }}>
        📊 Top Equipment by Downtime
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 180, pt: 1 }}>
        {sortedData.map((item, index) => {
          const height = Math.max((item.downtime / maxValue) * 150, 5)
          const barColor = item.downtime > 50 ? colors.error : item.downtime > 20 ? colors.warning : colors.darkNavy
          return (
            <Box key={index} sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <Tooltip title={`${item.name}: ${item.downtime.toFixed(1)} hrs`}>
                <Box
                  sx={{
                    height,
                    bgcolor: barColor,
                    borderRadius: '4px 4px 0 0',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': { opacity: 0.8, transform: 'scaleY(1.05)', transformOrigin: 'bottom' },
                  }}
                />
              </Tooltip>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  fontSize: '8px',
                  color: colors.textLight,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name.length > 12 ? item.name.substring(0, 10) + '…' : item.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: colors.textPrimary, fontSize: '8px' }}>
                {item.downtime.toFixed(1)}h
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Card>
  )
}

const AvailabilityGauge = ({ value }) => {
  const color = value >= 95 ? colors.success : value >= 80 ? colors.warning : colors.error

  return (
    <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${colors.borderColor}`, height: '100%', textAlign: 'center', bgcolor: colors.cardBg }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.textPrimary, mb: 1 }}>
        📈 Average Availability
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <CircularProgress
          variant="determinate"
          value={Math.min(value, 100)}
          size={120}
          thickness={8}
          sx={{
            color,
            '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {value.toFixed(1)}%
          </Typography>
          <Typography variant="caption" sx={{ color: colors.textLight }}>
            Availability
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}

const DowntimeBreakdown = ({ hours, days, weeks, months }) => {
  const items = [
    { label: 'Hours', value: hours, color: colors.darkNavy },
    { label: 'Days', value: days, color: colors.accentGold },
    { label: 'Weeks', value: weeks, color: colors.warning },
    { label: 'Months', value: months, color: colors.error },
  ]

  return (
    <Card sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${colors.borderColor}`, height: '100%', bgcolor: colors.cardBg }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.textPrimary, mb: 1.5 }}>
        Downtime Summary
      </Typography>
      <Grid container spacing={1}>
        {items.map((item) => (
          <Grid item xs={6} key={item.label}>
            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: `${item.color}10`, border: `1px solid ${item.color}22` }}>
              <Typography variant="caption" sx={{ color: colors.textLight, display: 'block' }}>
                {item.label}
              </Typography>
              <Typography variant="h6" sx={{ color: item.color, fontWeight: 700 }}>
                {num(item.value).toFixed(1)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Typography variant="caption" sx={{ color: colors.textLight, display: 'block', mt: 1.25 }}>
        Same downtime converted into different time units.
      </Typography>
    </Card>
  )
}

const FailureComparisonChart = ({ data }) => {
  if (!data || data.length === 0) return null

  const sortedData = [...data].sort((a, b) => (b.failures || 0) - (a.failures || 0)).slice(0, 8)
  const maxValue = Math.max(...sortedData.map((d) => d.failures || 0), 1)

  return (
    <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${colors.borderColor}`, height: '100%', bgcolor: colors.cardBg }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.textPrimary, mb: 2 }}>
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
                  <Box sx={{ height: criticalHeight, bgcolor: colors.error, borderRadius: '2px 2px 0 0', width: '100%', minHeight: 2 }} />
                )}
                {item.failures > 0 && (
                  <Box
                    sx={{
                      height: totalHeight - criticalHeight,
                      bgcolor: colors.darkNavy,
                      borderRadius: item.critical > 0 ? '0' : '2px 2px 0 0',
                      width: '100%',
                      minHeight: 2,
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  fontSize: '7px',
                  color: colors.textLight,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name.length > 10 ? item.name.substring(0, 8) + '…' : item.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: colors.textPrimary, fontSize: '7px' }}>
                {item.failures}
              </Typography>
            </Box>
          )
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, bgcolor: colors.darkNavy, borderRadius: 1 }} />
          <Typography variant="caption" sx={{ fontSize: '9px', color: colors.textLight }}>
            Total
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, bgcolor: colors.error, borderRadius: 1 }} />
          <Typography variant="caption" sx={{ fontSize: '9px', color: colors.textLight }}>
            Critical
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}

// ============================================================
// ✅ STATS CARD
// ============================================================
const StatsCard = ({ title, value, color, bgColor, icon, loading }) => (
  <Grow in timeout={300}>
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: colors.cardBg,
        transition: 'all 0.3s ease',
        border: `1px solid ${colors.borderColor}`,
        boxShadow: `0 2px 8px ${colors.cardShadow}`,
        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${colors.cardShadow}` },
        height: '100%',
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 2.5 }, px: { xs: 1.5, sm: 2 } }}>
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto' }} />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: bgColor || color || colors.darkNavy, width: 40, height: 40 }}>
                {icon}
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ color: color || colors.darkNavy, fontWeight: 700 }}>
              {value !== undefined && value !== null ? value : 0}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textLight, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              {title}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  </Grow>
)

// ============================================================
// ✅ EXPORT FUNCTIONS
// ============================================================
const getCleanExportData = (data, reportType) => {
  if (!Array.isArray(data)) return []

  if (['downtime', 'my-downtime'].includes(reportType)) {
    return data.map((r) => ({
      Equipment: r['Equipment Name'] || 'N/A',
      Hospital: r.Hospital || 'N/A',
      Failures: r['Total Failures'] || 0,
      Critical: r['Critical Failures'] || 0,
      'Downtime (Hrs)': r['Total Downtime (Hours)'] || 0,
      'Availability %': r['Availability %'] || '100.0%',
    }))
  }

  if (['monthly', 'weekly', 'daily', 'yearly', 'my-errors'].includes(reportType)) {
    return data.map((r) => ({
      Period: r.period || 'N/A',
      Total: r.total_errors || 0,
      Resolved: r.resolved || 0,
      Open: r.open || 0,
      Critical: r.critical || 0,
    }))
  }

  return data.map((r) => ({
    Title: r.title || r.name || r.equipment_name || 'N/A',
    Status: r.status || 'N/A',
    Date: formatDate(getRecordDate(r)),
  }))
}

const exportToCSV = (data, filename = 'report') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    const rows = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')),
    ]

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success(`✅ CSV exported successfully! (${data.length} rows)`)
  } catch (error) {
    console.error('CSV export error:', error)
    toast.error('Failed to export CSV')
  }
}

const exportToExcel = (data, filename = 'report', reportType = '') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])

    let chartHtml = ''
    if (reportType === 'downtime' || reportType === 'my-downtime') {
      const chartData = data
        .map((row) => ({
          name: row.Equipment || 'N/A',
          value: parseFloat(row['Downtime (Hrs)'] || 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      const maxValue = Math.max(...chartData.map((d) => d.value), 1)

      let bars = chartData
        .map((item) => {
          const barHeight = (item.value / maxValue) * 150
          const color = item.value > 50 ? '#EF4444' : item.value > 20 ? '#F59E0B' : '#0F172A'
          return `
            <td style="text-align:center;vertical-align:bottom;padding:2px;width:${100 / chartData.length}%;">
              <div style="height:${barHeight + 20}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
                <div style="height:${barHeight}px;width:80%;max-width:35px;background:${color};border-radius:4px 4px 0 0;min-height:5px;"></div>
                <div style="font-size:8px;color:#64748B;margin-top:2px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  ${item.name.length > 10 ? item.name.substring(0, 8) + '..' : item.name}
                </div>
                <div style="font-size:8px;font-weight:600;color:#0F172A;">${item.value.toFixed(1)}h</div>
              </div>
            </td>
          `
        })
        .join('')

      chartHtml = `
        <tr>
          <td colspan="${headers.length}" style="padding:10px;background:#F8FAFC;border:1px solid rgba(103,232,249,0.2);">
            <div style="font-size:12px;font-weight:600;color:#0F172A;text-align:center;margin-bottom:8px;">
              📊 Top Equipment by Downtime (Hours)
            </div>
            <table style="width:100%;border:none;">
              <tr>${bars}</tr>
            </table>
            <div style="font-size:8px;color:#64748B;text-align:center;margin-top:4px;">
              🔴 High (&gt;50hrs) • 🟠 Medium (20-50hrs) • 🟢 Low (&lt;20hrs)
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
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        th{background:#0F172A;color:white;padding:8px;border:1px solid #1E293B;text-align:center}
        td{padding:7px;border:1px solid #E2E8F0;text-align:center;vertical-align:middle;word-break:break-word}
        tr:nth-child(even){background:#F8FAFC}
        .chart-row td{background:#F8FAFC;padding:12px}
      </style></head><body>
        <h1>${String(filename).replace(/_/g, ' ').toUpperCase()}</h1>
        <div class="sub">PAEC Equipment Management System • ${new Date().toLocaleString()}</div>
        ${chartHtml}
        <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </body></html>
    `

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xls`
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success(`✅ Excel file exported successfully! (${data.length} rows)`)
  } catch (error) {
    console.error('Excel export error:', error)
    toast.error('Failed to export Excel')
  }
}

const exportToPDF = (data, filename = 'report', reportType = '') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])

    let chartHtml = ''
    if (reportType === 'downtime' || reportType === 'my-downtime') {
      const chartData = data
        .map((row) => ({
          name: row.Equipment || 'N/A',
          value: parseFloat(row['Downtime (Hrs)'] || 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      const maxValue = Math.max(...chartData.map((d) => d.value), 1)

      let bars = chartData
        .map((item) => {
          const barHeight = Math.max((item.value / maxValue) * 120, 5)
          const color = item.value > 50 ? '#EF4444' : item.value > 20 ? '#F59E0B' : '#0F172A'
          return `
            <div style="flex:1;text-align:center;min-width:25px;">
              <div style="height:${barHeight}px;background:${color};border-radius:4px 4px 0 0;min-height:5px;width:100%;max-width:30px;margin:0 auto;"></div>
              <div style="font-size:7px;color:#64748B;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:50px;">
                ${item.name.length > 12 ? item.name.substring(0, 10) + '..' : item.name}
              </div>
              <div style="font-size:7px;font-weight:600;color:#0F172A;">${item.value.toFixed(1)}h</div>
            </div>
          `
        })
        .join('')

      chartHtml = `
        <div style="border:1px solid #E2E8F0;border-radius:4px;padding:12px;margin:12px 0;background:#F8FAFC;">
          <div style="font-size:11px;font-weight:600;color:#0F172A;text-align:center;margin-bottom:8px;">
            📊 Top Equipment by Downtime (Hours)
          </div>
          <div style="display:flex;align-items:flex-end;height:160px;gap:3px;padding:4px;">
            ${bars}
          </div>
          <div style="font-size:7px;color:#64748B;text-align:center;margin-top:4px;">
            🔴 High (&gt;50hrs) • 🟠 Medium (20-50hrs) • 🟢 Low (&lt;20hrs)
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
      <html><head><title>${filename}</title><style>
        @page{size:A4 landscape;margin:12mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;color:#0F172A;margin:0;padding:12px}
        h1{color:#0F172A;text-align:center;margin:0 0 4px;font-size:18px}
        .sub{text-align:center;color:#64748B;font-size:9px;margin-bottom:10px}
        table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7px}
        th{background:#0F172A;color:#fff;padding:5px 3px;border:1px solid #1E293B;text-align:center}
        td{padding:4px 3px;border:1px solid #E2E8F0;text-align:center;vertical-align:middle;overflow-wrap:anywhere}
        tr:nth-child(even){background:#F8FAFC}
        .footer{margin-top:8px;text-align:center;font-size:7px;color:#64748B}
        .chart-container{border:1px solid #E2E8F0;border-radius:4px;padding:10px;margin:10px 0;background:#F8FAFC}
        .chart-title{font-size:10px;font-weight:600;color:#0F172A;text-align:center;margin-bottom:6px}
        .chart-bars{display:flex;align-items:flex-end;height:140px;gap:3px;padding:3px;justify-content:center}
        .legend{font-size:7px;color:#64748B;text-align:center;margin-top:3px}
      </style></head><body>
        <h1>${String(filename).replace(/_/g, ' ').toUpperCase()}</h1>
        <div class="sub">PAEC Equipment Management System • ${new Date().toLocaleString()}</div>
        ${chartHtml}
        <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
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
    toast.error('Failed to export PDF')
  }
}

// ============================================================
// ✅ MAIN REPORTS COMPONENT
// ============================================================
const Reports = () => {
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
  const [period, setPeriod] = useState('monthly')
  const [filters, setFilters] = useState({ status: '', hospital: '', startDate: '', endDate: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [error, setError] = useState(null)
  const [hospitalOptions, setHospitalOptions] = useState([])

  const role = String(user?.role || '').toUpperCase()
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isEngineer = role === 'ENGINEER'

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  const reportTypes = isSuperAdmin
    ? [
        { value: 'downtime', label: 'Equipment Downtime' },
        { value: 'monthly', label: 'Monthly Errors' },
        { value: 'weekly', label: 'Weekly Errors' },
        { value: 'daily', label: 'Daily Errors' },
        { value: 'yearly', label: 'Yearly Errors' },
      ]
    : [
        { value: 'my-downtime', label: 'My Downtime' },
        { value: 'my-errors', label: 'My Errors' },
      ]

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await api.get('/hospitals')
        setHospitalOptions((response.data.hospitals || []).map((h) => ({ value: h.id.toString(), label: h.name })))
      } catch (error) {
        console.error('Failed to fetch hospitals:', error)
      }
    }
    if (isSuperAdmin) fetchHospitals()
  }, [isSuperAdmin])

  const generateReport = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let data = []

      if (isSuperAdmin) {
        if (['monthly', 'weekly', 'daily', 'yearly'].includes(reportType)) {
          const response = await api.get('/errors')
          const filtered = applyCommonFilters(response.data.errors || [], filters)
          data = buildErrorSummaryRows(filtered, period)
        } else if (reportType === 'downtime') {
          const [equipmentRes, errorsRes] = await Promise.all([api.get('/equipment'), api.get('/errors')])
          const equipment = equipmentRes.data.equipment || []
          const errors = applyCommonFilters(errorsRes.data.errors || [], filters)
          data = buildDowntimeRows(equipment, errors)
        }
      } else if (isEngineer) {
        const engineerId = user?.id || user?.user_id
        if (!engineerId) {
          toast.error('Engineer ID not found')
          setLoading(false)
          return
        }

        if (reportType === 'my-errors') {
          const response = await api.get(`/errors?engineer_id=${engineerId}`)
          const errors = (response.data.errors || []).filter(
            (e) => String(e.assigned_engineer_id || e.engineer_id) === String(engineerId)
          )
          data = buildErrorSummaryRows(errors, period)
        } else if (reportType === 'my-downtime') {
          const [equipmentRes, errorsRes] = await Promise.all([api.get('/equipment'), api.get('/errors')])
          const equipment = equipmentRes.data.equipment || []
          const errors = (errorsRes.data.errors || [])
            .filter((e) => String(e.assigned_engineer_id || e.engineer_id) === String(engineerId))
          data = buildDowntimeRows(equipment, errors)
        }
      }

      setReportData({ data, total: data.length, type: reportType })
      toast.success(`✅ Report generated! (${data.length} records)`)
    } catch (error) {
      console.error('Report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [reportType, period, filters, isSuperAdmin, isEngineer, user])

  useEffect(() => {
    generateReport()
  }, [])

  const filteredData = useMemo(() => {
    const data = reportData?.data || []
    if (!Array.isArray(data)) return []

    if (!searchTerm) return data

    const searchLower = searchTerm.toLowerCase().trim()
    return data.filter((item) => {
      const searchable = [
        item.period,
        item['Equipment Name'],
        item.name,
        item.title,
        item.Hospital,
        item.hospital_name,
        item.status,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
      return searchable.some((field) => field.includes(searchLower))
    })
  }, [reportData?.data, searchTerm])

  const chartData = useMemo(() => {
    if (!['downtime', 'my-downtime'].includes(reportType) || !filteredData.length) return null

    const topEquipment = filteredData.map((item) => ({
      name: item['Equipment Name'] || 'N/A',
      downtime: num(item['Total Downtime (Hours)']),
      failures: num(item['Total Failures']),
      critical: num(item['Critical Failures']),
      availability: num(item['Availability %']),
    }))

    const totalHours = filteredData.reduce((sum, item) => sum + num(item['Total Downtime (Hours)']), 0)

    return {
      topEquipment,
      totalHours,
      totalDays: totalHours / 24,
      totalWeeks: totalHours / 24 / 7,
      totalMonths: totalHours / 24 / 30.44,
      avgAvailability: average(filteredData.map((item) => num(item['Availability %']))),
    }
  }, [reportType, filteredData])

  const handleExport = (format) => {
    const sourceData = filteredData
    if (!sourceData || sourceData.length === 0) {
      toast.warning('No data to export')
      return
    }

    const exportData = getCleanExportData(sourceData, reportType)
    const filename = reportType.replace('-', '_')

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

  const handleFilterApply = () => {
    setFilterAnchorEl(null)
    generateReport()
    toast.info('📊 Filters applied!')
  }

  const handleFilterClear = () => {
    setFilters({ status: '', hospital: '', startDate: '', endDate: '' })
    setSearchTerm('')
    setFilterAnchorEl(null)
    toast.info('🧹 Filters cleared')
  }

  const isErrorReport = ['monthly', 'weekly', 'daily', 'yearly', 'my-errors'].includes(reportType)

  if (!isSuperAdmin && !isEngineer) {
    return <AccessDenied message="You do not have permission to view reports." />
  }

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: '100vh',
        bgcolor: colors.bgWhite,
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.darkNavy,
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
            }}
          >
            Reports & Analytics
          </Typography>
          <Chip
            icon={<Assessment sx={{ fontSize: 16 }} />}
            label={`${filteredData.length} Records`}
            size="small"
            sx={{ bgcolor: colors.lightCyan, color: colors.darkNavy, fontWeight: 600 }}
          />
          {isEngineer && (
            <Chip
              icon={<Person sx={{ fontSize: 16 }} />}
              label={user?.full_name || user?.name || 'Engineer'}
              size="small"
              sx={{ bgcolor: colors.accentGold, color: colors.darkNavy, fontWeight: 600 }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            onClick={generateReport}
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              borderColor: colors.darkNavy,
              color: colors.darkNavy,
              '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyan, bgcolor: colors.lightCyanGlow },
            }}
            startIcon={loading ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={loading || filteredData.length === 0}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              bgcolor: colors.darkNavy,
              '&:hover': { bgcolor: colors.darkNavyHover },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
            }}
            startIcon={<Download />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {loading && (
        <LinearProgress
          sx={{
            mb: 2,
            borderRadius: 2,
            bgcolor: colors.bgGray,
            '& .MuiLinearProgress-bar': { bgcolor: colors.darkNavy },
          }}
        />
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={generateReport}>
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
        onClose={() => setExportAnchorEl(null)}
        PaperProps={{
          sx: {
            p: 1,
            width: 200,
            borderRadius: 2,
            border: `1px solid ${colors.borderColor}`,
          },
        }}
      >
        <MenuItem onClick={() => handleExport('CSV')} sx={{ gap: 1 }}>
          <FileDownload fontSize="small" /> CSV
        </MenuItem>
        <MenuItem onClick={() => handleExport('Excel')} sx={{ gap: 1 }}>
          <TableChart fontSize="small" /> Excel
        </MenuItem>
        <MenuItem onClick={() => handleExport('PDF')} sx={{ gap: 1 }}>
          <PictureAsPdf fontSize="small" /> PDF
        </MenuItem>
      </Menu>

      {/* STATS CARDS */}
      <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
        {reportType === 'downtime' || reportType === 'my-downtime' ? (
          <>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Equipment"
                value={filteredData.length}
                color={colors.darkNavy}
                icon={<MedicalServices sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Total Failures"
                value={filteredData.reduce((sum, row) => sum + num(row['Total Failures']), 0)}
                color={colors.warning}
                bgColor="rgba(245,158,11,0.15)"
                icon={<ErrorOutline sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Critical"
                value={filteredData.reduce((sum, row) => sum + num(row['Critical Failures']), 0)}
                color={colors.error}
                bgColor="rgba(239,68,68,0.15)"
                icon={<Warning sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Total Downtime"
                value={`${filteredData.reduce((sum, row) => sum + num(row['Total Downtime (Hours)']), 0).toFixed(1)}h`}
                color={colors.error}
                bgColor="rgba(239,68,68,0.15)"
                icon={<TimerOff sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Avg Availability"
                value={`${average(filteredData.map((row) => num(row['Availability %']))).toFixed(1)}%`}
                color={colors.success}
                bgColor="rgba(34,197,94,0.15)"
                icon={<TrendingUp sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Total Errors"
                value={filteredData.reduce((sum, row) => sum + num(row.total_errors), 0)}
                color={colors.darkNavy}
                icon={<Assessment sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Resolved"
                value={filteredData.reduce((sum, row) => sum + num(row.resolved), 0)}
                color={colors.success}
                bgColor="rgba(34,197,94,0.15)"
                icon={<CheckCircle sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Open"
                value={filteredData.reduce((sum, row) => sum + num(row.open), 0)}
                color={colors.warning}
                bgColor="rgba(245,158,11,0.15)"
                icon={<Schedule sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <StatsCard
                title="Critical"
                value={filteredData.reduce((sum, row) => sum + num(row.critical), 0)}
                color={colors.error}
                bgColor="rgba(239,68,68,0.15)"
                icon={<Warning sx={{ fontSize: 20, color: colors.textWhite }} />}
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
                color={colors.accentGold}
                bgColor="rgba(201,162,39,0.15)"
                icon={<BarChart sx={{ fontSize: 20, color: colors.textWhite }} />}
                loading={loading}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* CHARTS */}
      {chartData && chartData.topEquipment.length > 0 && (
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
                  hours={chartData.totalHours}
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
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          borderRadius: 3,
          bgcolor: colors.bgWhite,
          border: `1px solid ${colors.borderColor}`,
          boxShadow: `0 2px 8px ${colors.cardShadow}`,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.textLight }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: colors.textLight }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                },
              },
            }}
          />

          {isMobile && (
            <Button
              variant="outlined"
              onClick={() => setShowFilters(!showFilters)}
              endIcon={showFilters ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              fullWidth
              size="small"
              sx={{
                borderColor: colors.borderDark,
                color: colors.darkNavy,
                '&:hover': { borderColor: colors.darkNavy },
                borderRadius: 2,
              }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          )}

          {!isMobile && (
            <>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Report Type"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colors.borderDark },
                      '&:hover fieldset': { borderColor: colors.darkNavy },
                      '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                    },
                  }}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  label="Period"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colors.borderDark },
                      '&:hover fieldset': { borderColor: colors.darkNavy },
                      '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                    },
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
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                sx={{
                  borderColor: colors.borderDark,
                  color: colors.darkNavy,
                  '&:hover': { borderColor: colors.darkNavy },
                  borderRadius: 2,
                }}
                startIcon={<FilterList />}
              >
                Filter
              </Button>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading}
                sx={{
                  bgcolor: colors.darkNavy,
                  '&:hover': { bgcolor: colors.darkNavyHover },
                  boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                  borderRadius: 2,
                }}
                startIcon={<Refresh />}
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </>
          )}
        </Box>

        {isMobile && showFilters && (
          <Collapse in={showFilters}>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Report Type"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colors.borderDark },
                      '&:hover fieldset': { borderColor: colors.darkNavy },
                      '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                    },
                  }}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  label="Period"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colors.borderDark },
                      '&:hover fieldset': { borderColor: colors.darkNavy },
                      '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                    },
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
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  fullWidth
                  size="small"
                  sx={{
                    borderColor: colors.borderDark,
                    color: colors.darkNavy,
                    '&:hover': { borderColor: colors.darkNavy },
                    borderRadius: 2,
                  }}
                  startIcon={<FilterList />}
                >
                  Filter
                </Button>
                <Button
                  variant="contained"
                  onClick={generateReport}
                  disabled={loading}
                  fullWidth
                  size="small"
                  sx={{
                    bgcolor: colors.darkNavy,
                    '&:hover': { bgcolor: colors.darkNavyHover },
                    borderRadius: 2,
                  }}
                  startIcon={<Refresh />}
                >
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        )}
      </Paper>

      {/* FILTER MENU */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{
          sx: {
            p: 2,
            width: 350,
            maxHeight: '80vh',
            borderRadius: 3,
            bgcolor: colors.bgWhite,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: `0 8px 40px ${colors.cardShadow}`,
          },
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 2 }}>
          Filter Reports
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, [e.target.name]: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                },
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
              onChange={(e) => setFilters({ ...filters, [e.target.name]: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                },
              }}
            />
          </Grid>
        </Grid>

        {isSuperAdmin && hospitalOptions.length > 0 && (
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Hospital</InputLabel>
            <Select
              value={filters.hospital || ''}
              onChange={(e) => setFilters({ ...filters, hospital: e.target.value })}
              label="Hospital"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
                },
              }}
            >
              <MenuItem value="">All</MenuItem>
              {hospitalOptions.map((h) => (
                <MenuItem key={h.value} value={h.value}>
                  {h.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            label="Status"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: colors.borderDark },
                '&:hover fieldset': { borderColor: colors.darkNavy },
                '&.Mui-focused fieldset': { borderColor: colors.darkNavy },
              },
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleFilterApply}
            fullWidth
            sx={{
              bgcolor: colors.darkNavy,
              '&:hover': { bgcolor: colors.darkNavyHover },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              borderRadius: 2,
            }}
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            onClick={handleFilterClear}
            fullWidth
            sx={{
              borderColor: colors.borderDark,
              color: colors.darkNavy,
              '&:hover': { borderColor: colors.darkNavy },
              borderRadius: 2,
            }}
          >
            Clear
          </Button>
        </Box>
      </Menu>

      {/* TABLE */}
      <Paper
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: colors.bgWhite,
          border: `1px solid ${colors.borderColor}`,
          boxShadow: `0 2px 8px ${colors.cardShadow}`,
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: colors.darkNavy }}>
              <TableRow>
                {['downtime', 'my-downtime'].includes(reportType) ? (
                  <>
                    <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Equipment</TableCell>
                    <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Hospital</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Failures</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Downtime</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Availability</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Actions</TableCell>
                  </>
                ) : isErrorReport ? (
                  <>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Period</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Total</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Resolved</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Open</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Critical</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Actions</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Title</TableCell>
                    <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Date</TableCell>
                    <TableCell align="center" sx={{ color: colors.textWhite, fontWeight: 600 }}>Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <LinearProgress
                      sx={{
                        my: 2,
                        bgcolor: colors.bgGray,
                        '& .MuiLinearProgress-bar': { bgcolor: colors.darkNavy },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 4 }}>
                      <Search sx={{ fontSize: 48, color: colors.textLight, mb: 1 }} />
                      <Typography variant="body1" color="textSecondary">
                        {searchTerm || filters.status || filters.hospital
                          ? 'No results found matching your search/filters'
                          : 'No reports found. Click "Generate Report" to create a report.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={index} hover sx={{ '&:hover': { bgcolor: colors.bgLight } }}>
                    {['downtime', 'my-downtime'].includes(reportType) ? (
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                            {item['Equipment Name'] || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: colors.textPrimary }}>{item.Hospital || 'N/A'}</TableCell>
                        <TableCell align="center" sx={{ color: colors.textPrimary }}>
                          {item['Total Failures'] || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.error, fontWeight: 600 }}>
                          {item['Critical Failures'] || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.error, fontWeight: 700 }}>
                          {item['Total Downtime (Hours)'] || 0}h
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item['Availability %'] || 'N/A'}
                            size="small"
                            sx={{
                              bgcolor:
                                parseFloat(item['Availability %']) >= 90 ? colors.success : colors.warning,
                              color: colors.textWhite,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedItem(item)
                              setOpenViewDialog(true)
                            }}
                            sx={{ color: colors.darkNavy, '&:hover': { color: colors.lightCyanDark } }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </>
                    ) : isErrorReport ? (
                      <>
                        <TableCell align="center" sx={{ color: colors.darkNavy, fontWeight: 600 }}>
                          {item.period}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.textPrimary }}>
                          {item.total_errors}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.success, fontWeight: 600 }}>
                          {item.resolved}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.warning, fontWeight: 600 }}>
                          {item.open}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.error, fontWeight: 600 }}>
                          {item.critical}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedItem(item)
                              setOpenViewDialog(true)
                            }}
                            sx={{ color: colors.darkNavy, '&:hover': { color: colors.lightCyanDark } }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ color: colors.textPrimary }}>
                          {item.title || item.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status || 'N/A'}
                            size="small"
                            sx={{
                              bgcolor:
                                item.status === 'Resolved' || item.status === 'Completed'
                                  ? colors.success
                                  : colors.warning,
                              color: colors.textWhite,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: colors.textLight }}>
                          {formatDate(getRecordDate(item))}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedItem(item)
                              setOpenViewDialog(true)
                            }}
                            sx={{ color: colors.darkNavy, '&:hover': { color: colors.lightCyanDark } }}
                          >
                            <Visibility />
                          </IconButton>
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
            bgcolor: colors.bgWhite,
            border: `1px solid ${colors.borderColor}`,
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: colors.darkNavy, color: colors.textWhite }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Report Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: colors.textWhite }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedItem && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: colors.bgLight, borderRadius: 2, border: `1px solid ${colors.lightCyan}` }}>
                  <Typography variant="h6" sx={{ color: colors.darkNavy, fontWeight: 600 }}>
                    {selectedItem.title ||
                      selectedItem.name ||
                      selectedItem['Equipment Name'] ||
                      selectedItem.period ||
                      'Report'}
                  </Typography>
                  <Chip
                    label={selectedItem.status || 'N/A'}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor:
                        selectedItem.status === 'Resolved' || selectedItem.status === 'Completed'
                          ? colors.success
                          : colors.warning,
                      color: colors.textWhite,
                      fontWeight: 600,
                    }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.textLight, mb: 1, fontWeight: 600 }}>
                  Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: colors.bgLight, borderRadius: 2, border: `1px solid ${colors.borderDark}` }}>
                  {Object.entries(selectedItem)
                    .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
                    .slice(0, 5)
                    .map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: colors.textLight }}>
                          {key}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                          {String(value || 'N/A')}
                        </Typography>
                      </Box>
                    ))}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.textLight, mb: 1, fontWeight: 600 }}>
                  Date
                </Typography>
                <Paper sx={{ p: 2, bgcolor: colors.bgLight, borderRadius: 2, border: `1px solid ${colors.borderDark}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.textLight }}>
                      Record Date
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                      {formatDateTime(getRecordDate(selectedItem))}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenViewDialog(false)}
            variant="contained"
            sx={{
              bgcolor: colors.darkNavy,
              '&:hover': { bgcolor: colors.darkNavyHover },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              borderRadius: 2,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Reports