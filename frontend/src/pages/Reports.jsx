// src/pages/Reports.jsx
// Equipment Reports
//
// Availability:
//   Fixed reporting basis = 260 working days
//
// Formula:
//   Availability (%) = ((260 - Unique Downtime Working Days) / 260) * 100
//
// IMPORTANT:
// - 0% availability is valid.
// - Never use availability || 100.
// - Availability is clamped between 0% and 100%.
// - Overlapping error periods are merged before calculating downtime.
// - Saturday and Sunday are NOT counted as working downtime days.
// - Maximum availability basis is always 260 working days.

import React, {
  useState,
  useEffect,
  useCallback,
} from 'react'

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
  Typography,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tooltip,
  Menu,
  CircularProgress,
  Divider,
  Badge,
} from '@mui/material'

import {
  Search,
  Visibility,
  Download,
  Close,
  Refresh,
  MedicalServices,
  FilterList,
  FileDownload,
  TableChart,
  PictureAsPdf,
  Clear,
  FilterAlt,
} from '@mui/icons-material'

import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

// ============================================================
// COLORS
// ============================================================

const colors = {
  darkNavy: '#0F172A',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  text: '#FFFFFF',
  lightText: '#64748B',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

// ============================================================
// FIXED TOTAL WORKING DAYS
// ============================================================

const TOTAL_WORKING_DAYS = 260

// ============================================================
// HELPERS
// ============================================================

const safeToFixed = (value, decimals = 2) => {
  const n = Number(value)

  return Number.isFinite(n)
    ? n.toFixed(decimals)
    : '0.00'
}

const formatDate = (date) => {
  if (!date) return 'N/A'

  const d = new Date(date)

  if (Number.isNaN(d.getTime())) {
    return 'N/A'
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase()

  if (
    s === 'active' ||
    s === 'resolved' ||
    s === 'completed' ||
    s === 'operational' ||
    s === 'working'
  ) {
    return colors.success
  }

  if (
    s === 'pending' ||
    s === 'in progress'
  ) {
    return colors.warning
  }

  if (
    s === 'inactive' ||
    s === 'cancelled' ||
    s === 'maintenance' ||
    s === 'under repair' ||
    s === 'broken'
  ) {
    return colors.error
  }

  if (s === 'warranty') {
    return '#8B5CF6'
  }

  return colors.lightText
}

// ============================================================
// DATE HELPERS
// ============================================================

const startOfDay = (date) => {
  const d = new Date(date)

  d.setHours(0, 0, 0, 0)

  return d
}

const endOfDay = (date) => {
  const d = new Date(date)

  d.setHours(23, 59, 59, 999)

  return d
}

const isValidDate = (date) => {
  return (
    date instanceof Date &&
    !Number.isNaN(date.getTime())
  )
}

// ============================================================
// WORKING DAYS CALCULATOR
//
// Monday-Friday only.
//
// This counts UNIQUE working calendar days.
// Saturday/Sunday are excluded.
// ============================================================

const calculateWorkingDays = (
  startDate,
  endDate
) => {
  if (!startDate || !endDate) {
    return 0
  }

  let start = new Date(startDate)
  let end = new Date(endDate)

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0
  }

  start = startOfDay(start)
  end = endOfDay(end)

  if (end < start) {
    return 0
  }

  let workingDays = 0

  const current = new Date(start)

  current.setHours(0, 0, 0, 0)

  while (current <= end) {
    const day = current.getDay()

    // Sunday = 0
    // Saturday = 6
    if (day !== 0 && day !== 6) {
      workingDays++
    }

    current.setDate(
      current.getDate() + 1
    )
  }

  return workingDays
}

// ============================================================
// MERGE OVERLAPPING DATE RANGES
//
// Example:
//
// Error 1: Jan 1 - Jan 10
// Error 2: Jan 5 - Jan 15
//
// Instead of:
// 10 + 11 = 21
//
// We calculate:
// Jan 1 - Jan 15 = 11 working days
// ============================================================

const mergeDateRanges = (ranges) => {
  if (!Array.isArray(ranges)) {
    return []
  }

  const validRanges = ranges
    .map((range) => {
      const start = new Date(range.start)
      const end = new Date(range.end)

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return null
      }

      return {
        start,
        end,
      }
    })
    .filter(Boolean)
    .filter(
      (range) =>
        range.end >= range.start
    )
    .sort(
      (a, b) =>
        a.start.getTime() -
        b.start.getTime()
    )

  if (validRanges.length === 0) {
    return []
  }

  const merged = [
    {
      start: new Date(
        validRanges[0].start
      ),
      end: new Date(
        validRanges[0].end
      ),
    },
  ]

  for (
    let i = 1;
    i < validRanges.length;
    i++
  ) {
    const current = validRanges[i]

    const last =
      merged[merged.length - 1]

    if (
      current.start <= last.end
    ) {
      if (
        current.end > last.end
      ) {
        last.end = new Date(
          current.end
        )
      }
    } else {
      merged.push({
        start: new Date(
          current.start
        ),
        end: new Date(
          current.end
        ),
      })
    }
  }

  return merged
}

// ============================================================
// DOWNTIME CALCULATOR
//
// IMPORTANT:
//
// - Only resolved/closed/completed errors are counted.
// - Error periods are clipped to the report period.
// - Overlapping periods are merged.
// - Only unique Monday-Friday days are counted.
// ============================================================

const calculateDowntimeFromErrors = (
  errors,
  periodStart = null,
  periodEnd = null
) => {
  if (
    !Array.isArray(errors) ||
    errors.length === 0
  ) {
    return 0
  }

  const ranges = []

  errors.forEach((error) => {
    const status = String(
      error.status || ''
    ).toLowerCase()

    if (
      status !== 'resolved' &&
      status !== 'closed' &&
      status !== 'completed'
    ) {
      return
    }

    const rawStart =
      error.error_date ||
      error.created_at

    const rawEnd =
      error.resolved_at ||
      error.updated_at

    if (!rawStart || !rawEnd) {
      return
    }

    let start = new Date(rawStart)
    let end = new Date(rawEnd)

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return
    }

    // Make sure the order is correct.
    if (end < start) {
      return
    }

    // --------------------------------------------------------
    // CLIP ERROR TO REPORT PERIOD
    // --------------------------------------------------------

    if (periodStart) {
      const reportStart =
        new Date(periodStart)

      if (start < reportStart) {
        start = new Date(
          reportStart
        )
      }
    }

    if (periodEnd) {
      const reportEnd =
        new Date(periodEnd)

      if (end > reportEnd) {
        end = new Date(
          reportEnd
        )
      }
    }

    if (end < start) {
      return
    }

    ranges.push({
      start,
      end,
    })
  })

  // Merge overlapping periods.
  const mergedRanges =
    mergeDateRanges(ranges)

  // Calculate unique working days.
  return mergedRanges.reduce(
    (total, range) =>
      total +
      calculateWorkingDays(
        range.start,
        range.end
      ),
    0
  )
}

// ============================================================
// AVAILABILITY CALCULATOR
// ============================================================

const calculateAvailability = (
  downtimeDays
) => {
  const downtime = Math.max(
    0,
    Number(downtimeDays) || 0
  )

  const availableDays = Math.max(
    0,
    TOTAL_WORKING_DAYS -
      downtime
  )

  const availability =
    (availableDays /
      TOTAL_WORKING_DAYS) *
    100

  return Math.max(
    0,
    Math.min(
      100,
      availability
    )
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const Reports = () => {
  const { user } = useSelector(
    (state) => state.auth
  )

  if (
    user?.role ===
    'HOSPITAL_ADMIN'
  ) {
    return (
      <AccessDenied
        message="Hospital Administrators cannot access Reports."
      />
    )
  }

  const [loading, setLoading] =
    useState(false)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [reportData, setReportData] =
    useState([])

  const [filteredData, setFilteredData] =
    useState([])

  const [
    openViewDialog,
    setOpenViewDialog,
  ] = useState(false)

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null)

  const [
    exportAnchorEl,
    setExportAnchorEl,
  ] = useState(null)

  const [
    filterAnchorEl,
    setFilterAnchorEl,
  ] = useState(null)

  const [error, setError] =
    useState(null)

  const [
    hospitalOptions,
    setHospitalOptions,
  ] = useState([])

  const [
    equipmentOptions,
    setEquipmentOptions,
  ] = useState([])

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [filters, setFilters] =
    useState({
      hospital_id: '',
      equipment_id: '',
      status: '',
      date_from: '',
      date_to: '',
      min_availability: '',
      max_downtime: '',
    })

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const [
    summaryStats,
    setSummaryStats,
  ] = useState({
    total: 0,
    functional: 0,
    nonFunctional: 0,
    total_errors: 0,
    total_repairs: 0,
    total_downtime_days: 0,
    avg_availability: 0,
  })

  // ==========================================================
  // FETCH FILTER OPTIONS
  // ==========================================================

  useEffect(() => {
    const fetchOptions =
      async () => {
        try {
          const [
            hospitalsRes,
            equipmentRes,
          ] = await Promise.all([
            api.get('/hospitals'),
            api.get('/equipment'),
          ])

          const hospitalOpts = (
            hospitalsRes.data
              ?.hospitals || []
          ).map((h) => ({
            value: String(h.id),
            label: h.name,
          }))

          setHospitalOptions(
            hospitalOpts
          )

          const equipOpts = (
            equipmentRes.data
              ?.equipment || []
          ).map((e) => ({
            value: String(e.id),
            label:
              e.name || 'N/A',
          }))

          setEquipmentOptions(
            equipOpts
          )
        } catch (err) {
          console.error(
            'Failed to fetch filter options:',
            err
          )
        }
      }

    fetchOptions()
  }, [])

  // ==========================================================
  // GENERATE REPORT
  // ==========================================================

  const generateReport =
    useCallback(async () => {
      setLoading(true)
      setError(null)

      try {
        console.log(
          '📊 Fetching data for report...'
        )

        console.log(
          '📋 Filters:',
          filters
        )

        const [
          equipmentRes,
          errorsRes,
          repairsRes,
        ] = await Promise.all([
          api.get('/equipment'),
          api.get('/errors'),
          api.get('/repairs'),
        ])

        const equipment =
          equipmentRes.data
            ?.equipment || []

        const errors =
          errorsRes.data
            ?.errors || []

        const repairs =
          repairsRes.data
            ?.repairs || []

        console.log(
          'Equipment:',
          equipment.length
        )

        console.log(
          'Errors:',
          errors.length
        )

        console.log(
          'Repairs:',
          repairs.length
        )

        // ======================================================
        // REPORT PERIOD
        // ======================================================

        let periodStart =
          filters.date_from
            ? new Date(
                filters.date_from
              )
            : new Date(
                '2000-01-01T00:00:00'
              )

        let periodEnd =
          filters.date_to
            ? new Date(
                filters.date_to
              )
            : new Date()

        if (
          Number.isNaN(
            periodStart.getTime()
          )
        ) {
          periodStart =
            new Date(
              '2000-01-01T00:00:00'
            )
        }

        if (
          Number.isNaN(
            periodEnd.getTime()
          )
        ) {
          periodEnd =
            new Date()
        }

        periodStart =
          startOfDay(
            periodStart
          )

        periodEnd =
          endOfDay(
            periodEnd
          )

        console.log(
          `📅 Error report period: ${periodStart.toISOString()} → ${periodEnd.toISOString()}`
        )

        console.log(
          `📅 Availability denominator: ${TOTAL_WORKING_DAYS} working days`
        )

        // ======================================================
        // ERROR PERIOD CHECK
        // ======================================================

        const isErrorInPeriod =
          (error) => {
            const startDate =
              error.error_date ||
              error.created_at

            const resolvedDate =
              error.resolved_at ||
              error.updated_at

            if (
              !startDate ||
              !resolvedDate
            ) {
              return false
            }

            const errorStart =
              new Date(
                startDate
              )

            const errorEnd =
              new Date(
                resolvedDate
              )

            if (
              !isValidDate(
                errorStart
              ) ||
              !isValidDate(
                errorEnd
              )
            ) {
              return false
            }

            return (
              errorStart <=
                periodEnd &&
              errorEnd >=
                periodStart
            )
          }

        // ======================================================
        // BUILD REPORT ITEMS
        // ======================================================

        let items =
          equipment.map(
            (eq) => {
              const eqErrors =
                errors.filter(
                  (e) =>
                    Number(
                      e.equipment_id
                    ) ===
                      Number(
                        eq.id
                      ) &&
                    isErrorInPeriod(e)
                )

              const resolvedErrors =
                eqErrors.filter(
                  (e) => {
                    const status =
                      String(
                        e.status ||
                          ''
                      ).toLowerCase()

                    return (
                      status ===
                        'resolved' ||
                      status ===
                        'closed' ||
                      status ===
                        'completed'
                    )
                  }
                )

              const eqRepairs =
                repairs.filter(
                  (r) =>
                    Number(
                      r.equipment_id
                    ) ===
                    Number(eq.id)
                )

              // =================================================
              // UNIQUE DOWNTIME
              // =================================================

              const downtimeWorkingDays =
                calculateDowntimeFromErrors(
                  resolvedErrors,
                  periodStart,
                  periodEnd
                )

              // =================================================
              // AVAILABILITY
              // =================================================

              const availability =
                calculateAvailability(
                  downtimeWorkingDays
                )

              console.log(
                `📊 ${eq.name}: Downtime=${downtimeWorkingDays} working days | Availability=${availability.toFixed(
                  2
                )}%`
              )

              const resolvedErrorsCount =
                resolvedErrors.length

              return {
                id: eq.id,

                equipment_name:
                  eq.name ||
                  'N/A',

                model:
                  eq.model ||
                  'N/A',

                serial_number:
                  eq.serial_number ||
                  'N/A',

                hospital_name:
                  eq.hospital_name ||
                  'N/A',

                hospital_id:
                  eq.hospital_id ||
                  null,

                department_name:
                  eq.department_name ||
                  'N/A',

                current_status:
                  eq.status ||
                  'Active',

                total_errors:
                  eqErrors.length,

                resolved_errors:
                  resolvedErrorsCount,

                open_errors:
                  eqErrors.length -
                  resolvedErrorsCount,

                total_repairs:
                  eqRepairs.length,

                completed_repairs:
                  eqRepairs.filter(
                    (r) =>
                      String(
                        r.status ||
                          ''
                      ).toLowerCase() ===
                      'completed'
                  ).length,

                total_downtime_days:
                  downtimeWorkingDays,

                // IMPORTANT:
                // 0 is valid.
                availability_percentage:
                  availability,

                equipment_added_on:
                  eq.created_at ||
                  eq.date_of_installation ||
                  null,

                category_name:
                  eq.category_name ||
                  'N/A',

                manufacturer:
                  eq.manufacturer ||
                  'N/A',

                location:
                  eq.location ||
                  'N/A',
              }
            }
          )

        // ======================================================
        // APPLY FILTERS
        // ======================================================

        if (
          filters.hospital_id
        ) {
          items =
            items.filter(
              (item) =>
                Number(
                  item.hospital_id
                ) ===
                Number(
                  filters.hospital_id
                )
            )
        }

        if (
          filters.equipment_id
        ) {
          items =
            items.filter(
              (item) =>
                Number(
                  item.id
                ) ===
                Number(
                  filters.equipment_id
                )
            )
        }

        if (filters.status) {
          items =
            items.filter(
              (item) =>
                String(
                  item.current_status ||
                    ''
                ).toLowerCase() ===
                String(
                  filters.status ||
                    ''
                ).toLowerCase()
            )
        }

        // ======================================================
        // EQUIPMENT ADDED FROM
        // ======================================================

        if (
          filters.date_from
        ) {
          const fromDate =
            startOfDay(
              new Date(
                filters.date_from
              )
            )

          items =
            items.filter(
              (item) => {
                if (
                  !item.equipment_added_on
                ) {
                  return false
                }

                const added =
                  new Date(
                    item.equipment_added_on
                  )

                return (
                  isValidDate(
                    added
                  ) &&
                  added >=
                    fromDate
                )
              }
            )
        }

        // ======================================================
        // EQUIPMENT ADDED TO
        // ======================================================

        if (
          filters.date_to
        ) {
          const toDate =
            endOfDay(
              new Date(
                filters.date_to
              )
            )

          items =
            items.filter(
              (item) => {
                if (
                  !item.equipment_added_on
                ) {
                  return false
                }

                const added =
                  new Date(
                    item.equipment_added_on
                  )

                return (
                  isValidDate(
                    added
                  ) &&
                  added <=
                    toDate
                )
              }
            )
        }

        // ======================================================
        // MIN AVAILABILITY
        // ======================================================

        if (
          filters.min_availability !==
          ''
        ) {
          const minAvail =
            Number(
              filters.min_availability
            )

          items =
            items.filter(
              (item) =>
                (
                  item.availability_percentage ?? 
                  0
                ) >= minAvail
            )
        }

        // ======================================================
        // MAX DOWNTIME
        // ======================================================

        if (
          filters.max_downtime !==
          ''
        ) {
          const maxDowntime =
            Number(
              filters.max_downtime
            )

          items =
            items.filter(
              (item) =>
                (
                  item.total_downtime_days ?? 
                  0
                ) <=
                maxDowntime
            )
        }

        console.log(
          '📊 Final report items:',
          items.length
        )

        // ======================================================
        // SAVE DATA
        // ======================================================

        setReportData(items)
        setFilteredData(items)

        // ======================================================
        // SUMMARY
        // ======================================================

        const totalEquipment =
          items.length

        const functionalCount =
          items.filter(
            (i) => {
              const status =
                String(
                  i.current_status ||
                    ''
                ).toLowerCase()

              return (
                status ===
                  'active' ||
                status ===
                  'operational' ||
                status ===
                  'working'
              )
            }
          ).length

        const nonFunctionalCount =
          items.filter(
            (i) => {
              const status =
                String(
                  i.current_status ||
                    ''
                ).toLowerCase()

              return (
                status ===
                  'maintenance' ||
                status ===
                  'under repair' ||
                status ===
                  'inactive' ||
                status ===
                  'broken'
              )
            }
          ).length

        const totalErrors =
          items.reduce(
            (sum, i) =>
              sum +
              (
                Number(
                  i.total_errors
                ) || 0
              ),
            0
          )

        const totalRepairs =
          items.reduce(
            (sum, i) =>
              sum +
              (
                Number(
                  i.total_repairs
                ) || 0
              ),
            0
          )

        const totalDowntimeDays =
          items.reduce(
            (sum, i) =>
              sum +
              (
                Number(
                  i.total_downtime_days
                ) || 0
              ),
            0
          )

        // IMPORTANT:
        // ?? keeps 0 as a valid value.

        const avgAvailability =
          items.length > 0
            ? items.reduce(
                (sum, i) =>
                  sum +
                  (
                    i.availability_percentage ?? 
                    0
                  ),
                0
              ) /
              items.length
            : 0

        setSummaryStats({
          total:
            totalEquipment,

          functional:
            functionalCount,

          nonFunctional:
            nonFunctionalCount,

          total_errors:
            totalErrors,

          total_repairs:
            totalRepairs,

          total_downtime_days:
            totalDowntimeDays,

          avg_availability:
            avgAvailability,
        })

        toast.success(
          `✅ Report generated! (${items.length} equipment records)`
        )
      } catch (err) {
        console.error(
          '❌ Report generation error:',
          err
        )

        setError(
          err.response?.data
            ?.message ||
            'Failed to generate report'
        )

        toast.error(
          'Failed to generate report'
        )
      } finally {
        setLoading(false)
      }
    }, [filters])

  // ==========================================================
  // AUTO GENERATE
  // ==========================================================

  useEffect(() => {
    generateReport()
  }, [generateReport])

  // ==========================================================
  // SEARCH
  // ==========================================================

  useEffect(() => {
    if (
      !searchTerm.trim()
    ) {
      setFilteredData(
        reportData
      )

      return
    }

    const search =
      searchTerm.toLowerCase()

    const filtered =
      reportData.filter(
        (item) =>
          (
            item.equipment_name ||
            ''
          )
            .toLowerCase()
            .includes(search) ||

          (
            item.model ||
            ''
          )
            .toLowerCase()
            .includes(search) ||

          (
            item.hospital_name ||
            ''
          )
            .toLowerCase()
            .includes(search) ||

          (
            item.department_name ||
            ''
          )
            .toLowerCase()
            .includes(search) ||

          (
            item.serial_number ||
            ''
          )
            .toLowerCase()
            .includes(search) ||

          (
            item.manufacturer ||
            ''
          )
            .toLowerCase()
            .includes(search)
      )

    setFilteredData(
      filtered
    )
  }, [
    searchTerm,
    reportData,
  ])

  // ==========================================================
  // FILTER COUNT
  // ==========================================================

  const getActiveFilterCount =
    () => {
      let count = 0

      if (
        filters.hospital_id
      ) count++

      if (
        filters.equipment_id
      ) count++

      if (filters.status) count++

      if (
        filters.date_from
      ) count++

      if (
        filters.date_to
      ) count++

      if (
        filters.min_availability !==
        ''
      ) count++

      if (
        filters.max_downtime !==
        ''
      ) count++

      return count
    }

  const activeFilterCount =
    getActiveFilterCount()

  // ==========================================================
  // FILTER HANDLERS
  // ==========================================================

  const handleFilterChange =
    (e) => {
      const {
        name,
        value,
      } = e.target

      setFilters(
        (prev) => ({
          ...prev,
          [name]: value,
        })
      )
    }

  const handleFilterClick =
    (event) => {
      setFilterAnchorEl(
        event.currentTarget
      )
    }

  const handleFilterClose =
    () => {
      setFilterAnchorEl(null)
    }

  const applyFilters = () => {
    handleFilterClose()

    toast.info(
      '📊 Filters applied!'
    )
  }

  const clearFilters = () => {
    setFilters({
      hospital_id: '',
      equipment_id: '',
      status: '',
      date_from: '',
      date_to: '',
      min_availability: '',
      max_downtime: '',
    })

    setSearchTerm('')

    handleFilterClose()

    toast.info(
      '🧹 Filters cleared'
    )
  }

  // ==========================================================
  // VIEW
  // ==========================================================

  const handleView = (
    item
  ) => {
    setSelectedItem(item)
    setOpenViewDialog(true)
  }

  const displayData =
    filteredData

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const exportToCSV = () => {
    if (
      !displayData.length
    ) {
      toast.warning(
        'No data'
      )

      return
    }

    try {
      const headers = [
        'Equipment Name',
        'Model',
        'Serial Number',
        'Hospital',
        'Department',
        'Status',
        'Manufacturer',
        'Location',
        'Total Errors',
        'Resolved Errors',
        'Open Errors',
        'Total Repairs',
        'Completed Repairs',
        'Downtime (Working Days)',
        'Availability %',
        'Added On',
      ]

      let csv =
        headers.join(',') +
        '\n'

      displayData.forEach(
        (item) => {
          const row = [
            `"${item.equipment_name || 'N/A'}"`,
            `"${item.model || 'N/A'}"`,
            `"${item.serial_number || 'N/A'}"`,
            `"${item.hospital_name || 'N/A'}"`,
            `"${item.department_name || 'N/A'}"`,
            `"${item.current_status || 'N/A'}"`,
            `"${item.manufacturer || 'N/A'}"`,
            `"${item.location || 'N/A'}"`,

            item.total_errors ?? 
              0,

            item.resolved_errors ?? 
              0,

            item.open_errors ?? 
              0,

            item.total_repairs ?? 
              0,

            item.completed_repairs ?? 
              0,

            safeToFixed(
              item.total_downtime_days ?? 
                0,
              2
            ),

            safeToFixed(
              item.availability_percentage ?? 
                0,
              1
            ),

            formatDate(
              item.equipment_added_on
            ),
          ]

          csv +=
            row.join(',') +
            '\n'
        }
      )

      const blob =
        new Blob(
          [csv],
          {
            type:
              'text/csv;charset=utf-8;',
          }
        )

      const url =
        URL.createObjectURL(
          blob
        )

      const link =
        document.createElement(
          'a'
        )

      link.href = url

      link.download =
        `equipment_report_${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.csv`

      document.body.appendChild(
        link
      )

      link.click()

      document.body.removeChild(
        link
      )

      URL.revokeObjectURL(
        url
      )

      toast.success(
        '✅ CSV exported!'
      )

      setExportAnchorEl(
        null
      )
    } catch (err) {
      console.error(err)

      toast.error(
        'Export failed'
      )
    }
  }

  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================

  const exportToExcel =
    async () => {
      if (
        !displayData.length
      ) {
        toast.warning(
          'No data'
        )

        return
      }

      try {
        const data =
          displayData.map(
            (item) => ({
              'Equipment Name':
                item.equipment_name ||
                'N/A',

              Model:
                item.model ||
                'N/A',

              'Serial Number':
                item.serial_number ||
                'N/A',

              Hospital:
                item.hospital_name ||
                'N/A',

              Department:
                item.department_name ||
                'N/A',

              Status:
                item.current_status ||
                'N/A',

              Manufacturer:
                item.manufacturer ||
                'N/A',

              Location:
                item.location ||
                'N/A',

              'Total Errors':
                item.total_errors ?? 
                0,

              'Resolved Errors':
                item.resolved_errors ?? 
                0,

              'Open Errors':
                item.open_errors ?? 
                0,

              'Total Repairs':
                item.total_repairs ?? 
                0,

              'Completed Repairs':
                item.completed_repairs ?? 
                0,

              'Downtime (Working Days)':
                safeToFixed(
                  item.total_downtime_days ?? 
                    0,
                  2
                ),

              'Availability %':
                safeToFixed(
                  item.availability_percentage ?? 
                    0,
                  1
                ),

              'Added On':
                formatDate(
                  item.equipment_added_on
                ),
            })
          )

        const XLSX =
          await import('xlsx')

        const ws =
          XLSX.utils.json_to_sheet(
            data
          )

        const wb =
          XLSX.utils.book_new()

        XLSX.utils.book_append_sheet(
          wb,
          ws,
          'Equipment Report'
        )

        XLSX.writeFile(
          wb,
          `equipment_report_${new Date()
            .toISOString()
            .slice(
              0,
              10
            )}.xlsx`
        )

        toast.success(
          '✅ Excel exported!'
        )

        setExportAnchorEl(
          null
        )
      } catch (err) {
        console.error(err)

        toast.error(
          'Export failed'
        )
      }
    }

  // ==========================================================
  // EXPORT PDF / PRINT
  // ==========================================================

  const exportToPDF = () => {
    if (
      !displayData.length
    ) {
      toast.warning(
        'No data'
      )

      return
    }

    try {
      const printWindow =
        window.open(
          '',
          '_blank',
          'width=1200,height=800'
        )

      if (!printWindow) {
        toast.warning(
          'Please allow pop-ups'
        )

        return
      }

      const headers = [
        'Equipment',
        'Model',
        'Hospital',
        'Department',
        'Status',
        'Errors',
        'Repairs',
        'Downtime (Working Days)',
        'Availability',
      ]

      const totalDowntime =
        displayData.reduce(
          (sum, item) =>
            sum +
            (
              Number(
                item.total_downtime_days
              ) || 0
            ),
          0
        )

      const avgAvailability =
        displayData.length > 0
          ? displayData.reduce(
              (sum, item) =>
                sum +
                (
                  item.availability_percentage ?? 
                  0
                ),
              0
            ) /
            displayData.length
          : 0

      const rows =
        displayData
          .map(
            (item) => {
              const downtime =
                Number(
                  item.total_downtime_days
                ) || 0

              const availability =
                item.availability_percentage ?? 
                0

              const downtimeColor =
                downtime > 10
                  ? '#EF4444'
                  : downtime > 5
                    ? '#F59E0B'
                    : '#0F172A'

              return `
                <tr>
                  <td>${item.equipment_name || 'N/A'}</td>
                  <td>${item.model || 'N/A'}</td>
                  <td>${item.hospital_name || 'N/A'}</td>
                  <td>${item.department_name || 'N/A'}</td>
                  <td>${item.current_status || 'N/A'}</td>
                  <td>${item.total_errors ?? 0}</td>
                  <td>${item.total_repairs ?? 0}</td>

                  <td style="font-weight:700;color:${downtimeColor}">
                    ${safeToFixed(
                      downtime,
                      2
                    )}d
                  </td>

                  <td style="font-weight:700">
                    ${safeToFixed(
                      availability,
                      1
                    )}%
                  </td>
                </tr>
              `
            }
          )
          .join('')

      printWindow.document.write(`
        <html>
          <head>
            <title>Equipment Report</title>

            <style>
              @page {
                size: A4 landscape;
                margin: 10mm;
              }

              body {
                font-family: Arial, sans-serif;
                padding: 15px;
              }

              h1 {
                text-align: center;
                font-size: 18px;
              }

              .sub {
                text-align: center;
                color: #64748B;
                font-size: 9px;
                margin-bottom: 10px;
              }

              .summary {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 6px;
                margin-bottom: 10px;
              }

              .card {
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                padding: 6px;
                text-align: center;
              }

              .label {
                font-size: 7px;
                color: #64748B;
              }

              .value {
                font-size: 12px;
                font-weight: 700;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 7px;
              }

              th {
                background: #0F172A;
                color: white;
                padding: 4px;
                border: 1px solid #1E293B;
              }

              td {
                padding: 3px;
                border: 1px solid #e5e7eb;
                text-align: center;
              }

              tr:nth-child(even) {
                background: #f8fafc;
              }
            </style>
          </head>

          <body>

            <h1>
              Equipment Report
            </h1>

            <div class="sub">
              PAEC Equipment Management System
              • Total Working Days: ${TOTAL_WORKING_DAYS}
              • ${new Date().toLocaleString()}
            </div>

            <div class="summary">

              <div class="card">
                <div class="label">
                  Total Equipment
                </div>

                <div class="value">
                  ${displayData.length}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Functional
                </div>

                <div class="value">
                  ${summaryStats.functional ?? 0}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Non-Functional
                </div>

                <div class="value">
                  ${summaryStats.nonFunctional ?? 0}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Total Downtime
                </div>

                <div class="value">
                  ${safeToFixed(
                    totalDowntime,
                    2
                  )}d
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Avg Availability
                </div>

                <div class="value">
                  ${safeToFixed(
                    avgAvailability,
                    1
                  )}%
                </div>
              </div>

            </div>

            <table>

              <thead>
                <tr>
                  ${headers
                    .map(
                      (h) =>
                        `<th>${h}</th>`
                    )
                    .join('')}
                </tr>
              </thead>

              <tbody>
                ${rows}
              </tbody>

            </table>

            <script>
              setTimeout(() => {
                window.print();

                window.onafterprint = () => {
                  window.close();
                };
              }, 500);
            </script>

          </body>
        </html>
      `)

      printWindow.document.close()

      toast.info(
        '🖨️ PDF print dialog opened'
      )

      setExportAnchorEl(
        null
      )
    } catch (err) {
      console.error(err)

      toast.error(
        'Export failed'
      )
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      sx={{
        p: {
          xs: 1,
          sm: 2,
          md: 3,
        },

        background:
          `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,

        minHeight: '100vh',
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },

          justifyContent:
            'space-between',

          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },

          mb: 3,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color:
                colors.darkNavy,

              fontSize: {
                xs: '1.25rem',
                sm: '1.5rem',
                md: '1.75rem',
              },
            }}
          >
            Equipment Report
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color:
                colors.lightText,
              mt: 1,
            }}
          >
            Equipment analysis with
            downtime and availability
            based on{' '}
            {TOTAL_WORKING_DAYS}{' '}
            working days.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            onClick={
              generateReport
            }
            disabled={loading}
            sx={{
              borderColor:
                colors.lightCyanDark,
              color:
                colors.darkNavy,
              borderRadius: 2,
              textTransform:
                'none',
            }}
          >
            {loading ? (
              <CircularProgress
                size={18}
              />
            ) : (
              <Refresh />
            )}

            <Typography
              variant="button"
              sx={{
                display: {
                  xs: 'none',
                  sm: 'inline',
                },
                ml: 0.5,
              }}
            >
              {loading
                ? 'Loading...'
                : 'Refresh'}
            </Typography>
          </Button>

          <Badge
            badgeContent={
              activeFilterCount
            }
            color="error"
            invisible={
              activeFilterCount ===
              0
            }
          >
            <Button
              variant="contained"
              onClick={
                handleFilterClick
              }
              size="small"
              sx={{
                bgcolor:
                  colors.darkNavy,
                color:
                  colors.text,
                borderRadius: 2,
                textTransform:
                  'none',
              }}
            >
              <FilterList />

              <Typography
                variant="button"
                sx={{
                  display: {
                    xs: 'none',
                    sm: 'inline',
                  },
                  ml: 0.5,
                }}
              >
                Filter
              </Typography>
            </Button>
          </Badge>

          <Button
            variant="contained"
            onClick={(e) =>
              setExportAnchorEl(
                e.currentTarget
              )
            }
            disabled={
              loading ||
              displayData.length ===
                0
            }
            size="small"
            sx={{
              bgcolor:
                colors.darkNavy,
              color:
                colors.text,
              borderRadius: 2,
              textTransform:
                'none',
            }}
          >
            <Download />

            <Typography
              variant="button"
              sx={{
                display: {
                  xs: 'none',
                  sm: 'inline',
                },
                ml: 0.5,
              }}
            >
              Export
            </Typography>
          </Button>
        </Box>
      </Box>

      {/* ======================================================
          FILTER MENU
      ====================================================== */}

      <Menu
        anchorEl={
          filterAnchorEl
        }
        open={
          Boolean(
            filterAnchorEl
          )
        }
        onClose={
          handleFilterClose
        }
        PaperProps={{
          sx: {
            p: 2.5,
            width: 320,
            borderRadius: 3,
            maxHeight:
              '80vh',
          },
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{
            color:
              colors.darkNavy,
            mb: 2,
          }}
        >
          Advanced Filters

          {activeFilterCount >
            0 && (
            <Chip
              label={`${activeFilterCount} active`}
              size="small"
              sx={{
                ml: 1,
                bgcolor:
                  colors.error,
                color:
                  'white',
                height: 20,
                fontSize:
                  '10px',
              }}
            />
          )}
        </Typography>

        <FormControl
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        >
          <InputLabel>
            Hospital
          </InputLabel>

          <Select
            name="hospital_id"
            value={
              filters.hospital_id
            }
            onChange={
              handleFilterChange
            }
            label="Hospital"
          >
            <MenuItem value="">
              All Hospitals
            </MenuItem>

            {hospitalOptions.map(
              (h) => (
                <MenuItem
                  key={h.value}
                  value={
                    h.value
                  }
                >
                  {h.label}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        >
          <InputLabel>
            Equipment
          </InputLabel>

          <Select
            name="equipment_id"
            value={
              filters.equipment_id
            }
            onChange={
              handleFilterChange
            }
            label="Equipment"
          >
            <MenuItem value="">
              All Equipment
            </MenuItem>

            {equipmentOptions.map(
              (e) => (
                <MenuItem
                  key={e.value}
                  value={
                    e.value
                  }
                >
                  {e.label}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        >
          <InputLabel>
            Status
          </InputLabel>

          <Select
            name="status"
            value={
              filters.status
            }
            onChange={
              handleFilterChange
            }
            label="Status"
          >
            <MenuItem value="">
              All Status
            </MenuItem>

            <MenuItem value="Active">
              Active
            </MenuItem>

            <MenuItem value="Inactive">
              Inactive
            </MenuItem>

            <MenuItem value="Maintenance">
              Maintenance
            </MenuItem>

            <MenuItem value="Under Repair">
              Under Repair
            </MenuItem>

            <MenuItem value="Warranty">
              Warranty
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label="Added From"
          name="date_from"
          type="date"
          value={
            filters.date_from
          }
          onChange={
            handleFilterChange
          }
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          size="small"
          label="Added To"
          name="date_to"
          type="date"
          value={
            filters.date_to
          }
          onChange={
            handleFilterChange
          }
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          size="small"
          label="Min Availability %"
          name="min_availability"
          type="number"
          value={
            filters.min_availability
          }
          onChange={
            handleFilterChange
          }
          inputProps={{
            min: 0,
            max: 100,
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          size="small"
          label="Max Downtime (Working Days)"
          name="max_downtime"
          type="number"
          value={
            filters.max_downtime
          }
          onChange={
            handleFilterChange
          }
          inputProps={{
            min: 0,
          }}
          sx={{ mb: 2 }}
        />

        <Box
          sx={{
            display: 'flex',
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            onClick={
              applyFilters
            }
            fullWidth
            size="small"
            sx={{
              bgcolor:
                colors.darkNavy,
              borderRadius: 2,
              textTransform:
                'none',
            }}
          >
            <FilterAlt
              sx={{
                mr: 0.5,
              }}
            />

            Apply
          </Button>

          <Button
            variant="outlined"
            onClick={
              clearFilters
            }
            fullWidth
            size="small"
            sx={{
              borderRadius: 2,
              textTransform:
                'none',
            }}
          >
            Clear
          </Button>
        </Box>
      </Menu>

      {/* ======================================================
          EXPORT MENU
      ====================================================== */}

      <Menu
        anchorEl={
          exportAnchorEl
        }
        open={
          Boolean(
            exportAnchorEl
          )
        }
        onClose={() =>
          setExportAnchorEl(
            null
          )
        }
      >
        <MenuItem
          onClick={
            exportToCSV
          }
        >
          <FileDownload
            sx={{
              mr: 1.5,
              color:
                '#3B82F6',
            }}
          />

          CSV
        </MenuItem>

        <MenuItem
          onClick={
            exportToExcel
          }
        >
          <TableChart
            sx={{
              mr: 1.5,
              color:
                '#22C55E',
            }}
          />

          Excel
        </MenuItem>

        <MenuItem
          onClick={
            exportToPDF
          }
        >
          <PictureAsPdf
            sx={{
              mr: 1.5,
              color:
                '#EF4444',
            }}
          />

          PDF
        </MenuItem>
      </Menu>

      {loading && (
        <LinearProgress
          sx={{
            mb: 2,
            borderRadius: 2,
          }}
        />
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={
                generateReport
              }
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search by equipment name, model, hospital, serial number, manufacturer..."
          value={
            searchTerm
          }
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search
                  sx={{
                    color:
                      colors.lightText,
                  }}
                />
              </InputAdornment>
            ),

            endAdornment:
              searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setSearchTerm(
                        ''
                      )
                    }
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
          }}
        />
      </Paper>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <Paper
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table
            size="small"
            sx={{
              minWidth: 1100,
            }}
          >
            <TableHead
              sx={{
                bgcolor:
                  colors.darkNavy,
              }}
            >
              <TableRow>
                {[
                  'Equipment',
                  'Model',
                  'Hospital',
                  'Department',
                  'Status',
                  'Errors',
                  'Repairs',
                  'Downtime (Working Days)',
                  'Availability',
                  'Actions',
                ].map(
                  (heading) => (
                    <TableCell
                      key={
                        heading
                      }
                      align={
                        [
                          'Status',
                          'Errors',
                          'Repairs',
                          'Downtime (Working Days)',
                          'Availability',
                          'Actions',
                        ].includes(
                          heading
                        )
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        color:
                          'white',
                        fontWeight: 700,
                        py: 2,
                      }}
                    >
                      {heading}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    align="center"
                    sx={{
                      py: 5,
                    }}
                  >
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : displayData.length ===
                0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    align="center"
                    sx={{
                      py: 5,
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          colors.lightText,
                      }}
                    >
                      No data found
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={
                        clearFilters
                      }
                      sx={{
                        mt: 1,
                      }}
                    >
                      Clear Filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map(
                  (
                    item,
                    index
                  ) => {
                    const availability =
                      item.availability_percentage ?? 
                      0

                    const downtimeDays =
                      Number(
                        item.total_downtime_days
                      ) || 0

                    const availabilityColor =
                      availability >=
                      90
                        ? colors.success
                        : availability >=
                            70
                          ? colors.warning
                          : colors.error

                    const downtimeColor =
                      downtimeDays >
                      10
                        ? colors.error
                        : downtimeDays >
                            5
                          ? colors.warning
                          : colors.darkNavy

                    return (
                      <TableRow
                        key={
                          item.id ??
                          index
                        }
                        hover
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={
                              600
                            }
                            sx={{
                              color:
                                colors.darkNavy,
                            }}
                          >
                            {
                              item.equipment_name
                            }
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              color:
                                colors.lightText,
                              display:
                                'block',
                            }}
                          >
                            SN:{' '}
                            {
                              item.serial_number
                            }
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              color:
                                colors.lightText,
                            }}
                          >
                            {
                              item.manufacturer
                            }
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={{
                            color:
                              colors.lightText,
                          }}
                        >
                          {item.model}
                        </TableCell>

                        <TableCell
                          sx={{
                            color:
                              colors.lightText,
                          }}
                        >
                          {
                            item.hospital_name
                          }
                        </TableCell>

                        <TableCell
                          sx={{
                            color:
                              colors.lightText,
                          }}
                        >
                          {
                            item.department_name
                          }
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={
                              item.current_status
                            }
                            size="small"
                            sx={{
                              bgcolor:
                                getStatusColor(
                                  item.current_status
                                ),
                              color:
                                'white',
                              fontWeight:
                                600,
                              height: 22,
                              fontSize:
                                '10px',
                            }}
                          />
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            fontWeight:
                              600,
                          }}
                        >
                          {
                            item.total_errors ?? 
                            0
                          }
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            fontWeight:
                              600,
                          }}
                        >
                          {
                            item.total_repairs ?? 
                            0
                          }
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            fontWeight:
                              700,
                            color:
                              downtimeColor,
                          }}
                        >
                          {safeToFixed(
                            downtimeDays,
                            2
                          )}
                          d
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip
                            title={`Downtime: ${safeToFixed(
                              downtimeDays,
                              2
                            )} unique working days / ${TOTAL_WORKING_DAYS} working days`}
                          >
                            <Chip
                              label={`${safeToFixed(
                                availability,
                                1
                              )}%`}
                              size="small"
                              sx={{
                                bgcolor:
                                  availabilityColor,
                                color:
                                  'white',
                                fontWeight:
                                  700,
                                height: 24,
                                minWidth:
                                  58,
                              }}
                            />
                          </Tooltip>
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleView(
                                  item
                                )
                              }
                              sx={{
                                color:
                                  colors.darkNavy,
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ======================================================
          VIEW DIALOG
      ====================================================== */}

      <Dialog
        open={
          openViewDialog
        }
        onClose={() =>
          setOpenViewDialog(
            false
          )
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor:
              colors.darkNavy,
            color: 'white',
          }}
        >
          <Box
            sx={{
              display:
                'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
            >
              <MedicalServices
                sx={{
                  mr: 1,
                  verticalAlign:
                    'middle',
                }}
              />

              Equipment Details
            </Typography>

            <IconButton
              onClick={() =>
                setOpenViewDialog(
                  false
                )
              }
              sx={{
                color:
                  'white',
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            py: 3,
          }}
        >
          {selectedItem && (
            <>
              <Paper
                sx={{
                  p: 2.5,
                  mb: 2,
                  bgcolor:
                    'rgba(103,232,249,0.04)',
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{
                    color:
                      colors.darkNavy,
                  }}
                >
                  {
                    selectedItem.equipment_name
                  }
                </Typography>

                <Box
                  sx={{
                    display:
                      'flex',
                    gap: 1,
                    mt: 1,
                    flexWrap:
                      'wrap',
                  }}
                >
                  <Chip
                    label={`Model: ${selectedItem.model}`}
                    size="small"
                  />

                  <Chip
                    label={`SN: ${selectedItem.serial_number}`}
                    size="small"
                  />

                  <Chip
                    label={
                      selectedItem.current_status
                    }
                    size="small"
                    sx={{
                      bgcolor:
                        getStatusColor(
                          selectedItem.current_status
                        ),
                      color:
                        'white',
                    }}
                  />

                  <Chip
                    label={`${safeToFixed(
                      selectedItem.availability_percentage ?? 
                        0,
                      1
                    )}% Availability`}
                    size="small"
                    sx={{
                      bgcolor:
                        (
                          selectedItem.availability_percentage ?? 
                          0
                        ) >= 90
                          ? colors.success
                          : (
                                selectedItem.availability_percentage ?? 
                                0
                              ) >= 70
                            ? colors.warning
                            : colors.error,

                      color:
                        'white',

                      fontWeight:
                        700,
                    }}
                  />
                </Box>
              </Paper>

              <Box
                sx={{
                  display:
                    'grid',

                  gridTemplateColumns:
                    {
                      xs: '1fr',
                      md: '1fr 1fr',
                    },

                  gap: 2,
                }}
              >
                {/* LOCATION */}

                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      mb: 1,
                    }}
                  >
                    📍 Location Details
                  </Typography>

                  <MetricRow
                    label="Hospital"
                    value={
                      selectedItem.hospital_name
                    }
                  />

                  <MetricRow
                    label="Department"
                    value={
                      selectedItem.department_name
                    }
                  />

                  <MetricRow
                    label="Location"
                    value={
                      selectedItem.location
                    }
                  />

                  <MetricRow
                    label="Added On"
                    value={formatDate(
                      selectedItem.equipment_added_on
                    )}
                  />
                </Paper>

                {/* METRICS */}

                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      mb: 1,
                    }}
                  >
                    📊 Equipment Metrics
                  </Typography>

                  <MetricRow
                    label="Total Errors"
                    value={
                      selectedItem.total_errors ?? 
                      0
                    }
                  />

                  <MetricRow
                    label="Resolved Errors"
                    value={
                      selectedItem.resolved_errors ?? 
                      0
                    }
                  />

                  <MetricRow
                    label="Open Errors"
                    value={
                      selectedItem.open_errors ?? 
                      0
                    }
                  />

                  <Divider
                    sx={{
                      my: 1,
                    }}
                  />

                  <MetricRow
                    label="Total Repairs"
                    value={
                      selectedItem.total_repairs ?? 
                      0
                    }
                  />

                  <MetricRow
                    label="Completed Repairs"
                    value={
                      selectedItem.completed_repairs ?? 
                      0
                    }
                  />

                  <Divider
                    sx={{
                      my: 1,
                    }}
                  />

                  <MetricRow
                    label="Unique Downtime (Working Days)"
                    value={`${safeToFixed(
                      selectedItem.total_downtime_days ?? 
                        0,
                      2
                    )}d`}
                  />

                  <MetricRow
                    label={`Availability (${TOTAL_WORKING_DAYS} Days)`}
                    value={`${safeToFixed(
                      selectedItem.availability_percentage ?? 
                        0,
                      1
                    )}%`}
                    bold
                  />
                </Paper>
              </Box>

              <Paper
                sx={{
                  p: 2,
                  mt: 2,
                  borderRadius: 2,
                  bgcolor:
                    'rgba(103,232,249,0.04)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      colors.lightText,
                  }}
                >
                  Availability Formula:{' '}
                  (({TOTAL_WORKING_DAYS} −{' '}
                  {safeToFixed(
                    selectedItem.total_downtime_days ?? 
                      0,
                    2
                  )}) ÷{' '}
                  {TOTAL_WORKING_DAYS}) ×
                  100. Result is limited
                  to 0%–100%. Overlapping
                  downtime periods are counted
                  only once.
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
          }}
        >
          <Button
            onClick={() =>
              setOpenViewDialog(
                false
              )
            }
            variant="contained"
            sx={{
              bgcolor:
                colors.darkNavy,
              textTransform:
                'none',
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

// ============================================================
// SMALL METRIC ROW COMPONENT
// ============================================================

const MetricRow = ({
  label,
  value,
  bold = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent:
          'space-between',
        gap: 2,
        py: 0.6,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color:
            colors.lightText,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={
          bold ? 700 : 500
        }
        sx={{
          color: bold
            ? colors.darkNavy
            : 'inherit',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

export default Reports