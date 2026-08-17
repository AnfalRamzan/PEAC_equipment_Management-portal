// src/pages/Hospitals.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Premium Design
// ✅ FONT: SATOSHI - Premium, Sleek, Modern
// ✅ CARDS PROMINENT ON CLICK - Same Theme Colors
// ✅ BIOMEDICAL HEAD SHOWING PROPERLY IN TABLE

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Grid,
  Typography,
  LinearProgress,
  Divider,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Card,
  CardContent,
  Fade,
  Grow,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  FilterList,
  Close,
  Email,
  Lock,
  Person,
  Phone,
  LocationOn,
  Business,
  FileDownload,
  Refresh,
  MedicalServices,
  ErrorOutline,
  CheckCircle,
  Engineering,
  LocalHospital,
  People,
  Build,
  Warning,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { hospitalService, equipmentService, errorService, userService } from '../api/services'
import { toast } from 'react-toastify'

// ============================================================
// ✅ FONT FAMILY CONSTANT - SATOSHI
// ============================================================
const FONT_FAMILY = "'Satoshi', 'Segoe UI', 'Roboto', sans-serif"

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
  mainBg: '#F1F5F9',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
}

// ✅ Animation Styles
const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.2);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(103, 232, 249, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 232, 249, 0);
  }
}

@keyframes prominentPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(103, 232, 249, 0);
    transform: scale(1.04);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 232, 249, 0);
    transform: scale(1);
  }
}

@keyframes prominentGlow {
  0% {
    box-shadow: 
      0 0 20px rgba(103, 232, 249, 0.2),
      0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(103, 232, 249, 0.4),
      0 0 80px rgba(103, 232, 249, 0.2);
    border-color: rgba(103, 232, 249, 0.6);
  }
  100% {
    box-shadow: 
      0 0 20px rgba(103, 232, 249, 0.2),
      0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
}

@keyframes gradientShine {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-slideInLeft {
  animation: slideInLeft 0.5s ease-out forwards;
}

.animate-pulseGlow {
  animation: pulseGlow 2s ease-in-out infinite;
}

.prominent-active {
  animation: prominentGlow 1.5s ease-in-out 3;
}
`

const Hospitals = () => {
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [equipment, setEquipment] = useState([])
  const [errors, setErrors] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [editingHospital, setEditingHospital] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filters, setFilters] = useState({
    status: 'all',
    city: ''
  })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  // ✅ State for prominent card click
  const [clickedCardIndex, setClickedCardIndex] = useState(null)
  const [prominentActive, setProminentActive] = useState(false)

  const { user } = useSelector((state) => state.auth)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const [formData, setFormData] = useState({
    name: '',
    hospital_code: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    phone: '',
    email: '',
    director: '',
    biomedical_head: '',
    is_active: true
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [hospitalsRes, equipmentRes, errorsRes, usersRes] = await Promise.all([
        hospitalService.getAll(),
        equipmentService.getAll(),
        errorService.getAll(),
        userService.getAll()
      ])
      
      setHospitals(hospitalsRes.data.hospitals || [])
      setEquipment(equipmentRes.data.equipment || [])
      setErrors(errorsRes.data.errors || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Stats Cards Data - ALL ICONS SAME THEME COLOR (Light Cyan)
  const statsCards = [
    {
      title: 'Total Hospitals',
      value: hospitals.length,
      icon: <LocalHospital />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/hospitals'
    },
    {
      title: 'Total Equipment',
      value: equipment.length,
      icon: <MedicalServices />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/equipment'
    },
    {
      title: 'Total Engineers',
      value: users.filter(u => u.role === 'ENGINEER').length,
      icon: <Engineering />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/users?role=ENGINEER'
    },
    {
      title: 'Total Errors',
      value: errors.length,
      icon: <ErrorOutline />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/errors'
    },
  ]

  // ✅ Handle card click with prominent effect
  const handleCardClick = (path, index) => {
    setClickedCardIndex(index)
    setProminentActive(true)
    
    setTimeout(() => {
      setProminentActive(false)
      setClickedCardIndex(null)
    }, 2000)
    
    if (path) {
      navigate(path)
    }
  }

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const clearFilters = () => {
    setFilters({ status: 'all', city: '' })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  // ✅ IMPROVED EXCEL EXPORT WITH PROPER FORMATTING
  const exportToExcel = () => {
    try {
      import('xlsx').then((XLSX) => {
        // Prepare data with proper formatting
        const data = filteredHospitals.map((h, index) => ({
          'S.No': index + 1,
          'Hospital Name': h.name || '',
          'Hospital Code': h.hospital_code || '',
          'Address': h.address || '',
          'City': h.city || '',
          'State': h.state || '',
          'Country': h.country || 'Pakistan',
          'Phone': h.phone || '',
          'Email': h.email || '',
          'Director': h.director || '',
          'Biomedical Head': h.biomedical_head || '',
          'Status': h.is_active ? 'Active' : 'Inactive'
        }))
        
        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        
        // Set column widths for better readability
        const columnWidths = [
          { wch: 6 },   // S.No
          { wch: 35 },  // Hospital Name
          { wch: 18 },  // Hospital Code
          { wch: 40 },  // Address
          { wch: 15 },  // City
          { wch: 15 },  // State
          { wch: 12 },  // Country
          { wch: 18 },  // Phone
          { wch: 30 },  // Email
          { wch: 25 },  // Director
          { wch: 25 },  // Biomedical Head
          { wch: 10 },  // Status
        ]
        ws['!cols'] = columnWidths
        
        // Apply styling to all cells
        const range = XLSX.utils.decode_range(ws['!ref'])
        for (let R = range.s.r; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
            if (!ws[cellAddress]) continue
            
            // Header row styling (row 0)
            if (R === 0) {
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  color: { rgb: "FFFFFF" },
                  sz: 11
                },
                fill: { fgColor: { rgb: "0F172A" } },
                alignment: { 
                  horizontal: 'center', 
                  vertical: 'center',
                  wrapText: true 
                },
                border: {
                  top: { style: 'thin', color: { rgb: "CCCCCC" } },
                  bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
                  left: { style: 'thin', color: { rgb: "CCCCCC" } },
                  right: { style: 'thin', color: { rgb: "CCCCCC" } }
                }
              }
            } else {
              // Status column (index 11) - color coded
              if (C === 11) {
                const statusValue = ws[cellAddress]?.v || ''
                const isActive = statusValue === 'Active'
                ws[cellAddress].s = {
                  font: { 
                    color: { rgb: isActive ? "22C55E" : "EF4444" },
                    bold: true,
                    sz: 10
                  },
                  alignment: { horizontal: 'center', vertical: 'center' },
                  border: {
                    top: { style: 'thin', color: { rgb: "E5E7EB" } },
                    bottom: { style: 'thin', color: { rgb: "E5E7EB" } },
                    left: { style: 'thin', color: { rgb: "E5E7EB" } },
                    right: { style: 'thin', color: { rgb: "E5E7EB" } }
                  }
                }
              } else {
                // Regular cells
                const isAddress = C === 3 // Address column
                const isSNo = C === 0 // S.No column
                ws[cellAddress].s = {
                  font: { sz: 10 },
                  alignment: { 
                    horizontal: isAddress ? 'left' : (isSNo ? 'center' : 'left'),
                    vertical: 'center',
                    wrapText: true 
                  },
                  border: {
                    top: { style: 'thin', color: { rgb: "E5E7EB" } },
                    bottom: { style: 'thin', color: { rgb: "E5E7EB" } },
                    left: { style: 'thin', color: { rgb: "E5E7EB" } },
                    right: { style: 'thin', color: { rgb: "E5E7EB" } }
                  }
                }
              }
            }
          }
        }
        
        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Hospitals')
        
        // Add a summary sheet with statistics
        const summaryData = [
          ['🏥 HOSPITAL REPORT SUMMARY'],
          [''],
          ['Generated On:', new Date().toLocaleString()],
          ['Total Hospitals:', filteredHospitals.length],
          ['Active Hospitals:', filteredHospitals.filter(h => h.is_active).length],
          ['Inactive Hospitals:', filteredHospitals.filter(h => !h.is_active).length],
          [''],
          ['Report generated from PAEC Hospitals Management System']
        ]
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
        summaryWs['!cols'] = [{ wch: 25 }, { wch: 35 }]
        
        // Style summary sheet
        const summaryRange = XLSX.utils.decode_range(summaryWs['!ref'])
        for (let R = summaryRange.s.r; R <= summaryRange.e.r; R++) {
          for (let C = summaryRange.s.c; C <= summaryRange.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
            if (!summaryWs[cellAddress]) continue
            
            if (R === 0) {
              summaryWs[cellAddress].s = {
                font: { bold: true, sz: 16, color: { rgb: "0F172A" } },
                alignment: { horizontal: 'center', vertical: 'center' }
              }
            } else if (R === 7) {
              summaryWs[cellAddress].s = {
                font: { italic: true, sz: 10, color: { rgb: "6B7280" } },
                alignment: { horizontal: 'center', vertical: 'center' }
              }
            } else if (R >= 2 && R <= 5) {
              summaryWs[cellAddress].s = {
                font: { 
                  bold: C === 0, 
                  sz: 11,
                  color: { rgb: C === 0 ? "4B5563" : "0F172A" } 
                },
                alignment: { 
                  horizontal: C === 0 ? 'right' : 'left', 
                  vertical: 'center' 
                }
              }
            }
          }
        }
        
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
        
        // Save the file
        const fileName = `hospitals_${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
        
        toast.success('Excel exported successfully!')
        handleExportClose()
      }).catch((err) => {
        toast.error('Excel library not loaded. Please check your installation.')
        console.error('Excel export error:', err)
      })
    } catch (error) {
      toast.error('Failed to export Excel: ' + error.message)
      console.error('Excel export error:', error)
    }
  }

  // ✅ IMPROVED PDF EXPORT WITH BETTER FORMATTING
  const exportToPDF = () => {
    try {
      Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]).then(([jsPDFModule, autoTableModule]) => {
        const { default: jsPDF } = jsPDFModule
        const { default: autoTable } = autoTableModule
        
        const doc = new jsPDF('landscape', 'mm', 'a4')
        
        // Header
        doc.setFontSize(20)
        doc.setTextColor(colors.darkNavy)
        doc.text('🏥 Hospitals Report', 14, 20)
        
        doc.setFontSize(11)
        doc.setTextColor('#666666')
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
        doc.text(`Total Hospitals: ${filteredHospitals.length}`, 14, 34)
        doc.text(`Active: ${filteredHospitals.filter(h => h.is_active).length} | Inactive: ${filteredHospitals.filter(h => !h.is_active).length}`, 14, 40)
        
        // Table data
        const tableData = filteredHospitals.map(h => [
          h.name || '',
          h.hospital_code || '',
          h.city || '',
          h.phone || '',
          h.director || '',
          h.biomedical_head || '',
          h.is_active ? 'Active' : 'Inactive'
        ])
        
        autoTable(doc, {
          head: [['Hospital Name', 'Code', 'City', 'Phone', 'Director', 'Biomedical Head', 'Status']],
          body: tableData,
          startY: 48,
          styles: { 
            fontSize: 9, 
            cellPadding: 3,
            font: 'helvetica'
          },
          headStyles: { 
            fillColor: [15, 23, 42], // Dark navy
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: {
            0: { cellWidth: 45, halign: 'left' },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 25, halign: 'left' },
            3: { cellWidth: 30, halign: 'left' },
            4: { cellWidth: 35, halign: 'left' },
            5: { cellWidth: 35, halign: 'left' },
            6: { cellWidth: 20, halign: 'center' }
          },
          margin: { left: 14, right: 14 },
          didDrawCell: function(data) {
            // Color code status cells
            if (data.column.index === 6 && data.cell.section === 'body') {
              const status = data.cell.raw
              if (status === 'Active') {
                doc.setTextColor(34, 197, 94) // Green
              } else {
                doc.setTextColor(239, 68, 68) // Red
              }
              doc.setFont('helvetica', 'bold')
              doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 3, {
                align: 'center'
              })
              doc.setTextColor(0, 0, 0)
              doc.setFont('helvetica', 'normal')
            }
          }
        })
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          doc.setFontSize(8)
          doc.setTextColor('#999999')
          doc.text(
            `Page ${i} of ${pageCount} | PAEC Hospitals Management System`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          )
        }
        
        doc.save(`hospitals_${new Date().toISOString().split('T')[0]}.pdf`)
        
        toast.success('PDF exported successfully!')
        handleExportClose()
      }).catch((err) => {
        toast.error('PDF export failed: ' + err.message)
        console.error('PDF export error:', err)
      })
    } catch (error) {
      toast.error('Failed to export PDF: ' + error.message)
      console.error('PDF export error:', error)
    }
  }

  const handleViewDetails = (hospital) => {
    setSelectedHospital(hospital)
    setOpenViewDialog(true)
  }

  const generateHospitalCode = () => {
    const prefix = 'HOS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleOpenDialog = (hospital = null) => {
    if (hospital) {
      setEditingHospital(hospital)
      setFormData({
        name: hospital.name || '',
        hospital_code: hospital.hospital_code || '',
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        country: hospital.country || 'Pakistan',
        phone: hospital.phone || '',
        email: hospital.email || '',
        director: hospital.director || '',
        biomedical_head: hospital.biomedical_head || '',
        is_active: hospital.is_active !== undefined ? hospital.is_active : true
      })
    } else {
      setEditingHospital(null)
      setFormData({
        name: '',
        hospital_code: generateHospitalCode(),
        address: '',
        city: '',
        state: '',
        country: 'Pakistan',
        phone: '',
        email: '',
        director: '',
        biomedical_head: '',
        is_active: true
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingHospital(null)
    setFormData({
      name: '',
      hospital_code: '',
      address: '',
      city: '',
      state: '',
      country: 'Pakistan',
      phone: '',
      email: '',
      director: '',
      biomedical_head: '',
      is_active: true
    })
  }

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false)
    setSelectedHospital(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    try {
      const submitData = {
        name: formData.name,
        hospital_code: formData.hospital_code || generateHospitalCode(),
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        director: formData.director,
        biomedical_head: formData.biomedical_head,
        is_active: formData.is_active !== undefined ? formData.is_active : true
      }

      if (editingHospital) {
        await hospitalService.update(editingHospital.id, submitData)
        toast.success('Hospital updated successfully')
      } else {
        await hospitalService.create(submitData)
        toast.success(`Hospital "${formData.name}" created successfully!`)
      }
      fetchAllData()
      handleCloseDialog()
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Operation failed'
      toast.error(errorMsg)
      console.error('Error:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      try {
        await hospitalService.delete(id)
        toast.success('Hospital deleted successfully')
        fetchAllData()
      } catch (error) {
        toast.error('Failed to delete hospital')
      }
    }
  }

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.biomedical_head?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.hospital_code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && hospital.is_active) ||
      (filters.status === 'inactive' && !hospital.is_active)
    
    const matchesCity = !filters.city || 
      hospital.city?.toLowerCase().includes(filters.city.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesCity
  })

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress 
          sx={{ 
            bgcolor: colors.borderColor, 
            height: 4,
            borderRadius: 2,
            '& .MuiLinearProgress-bar': { 
              bgcolor: colors.lightCyan,
              borderRadius: 2,
            } 
          }} 
        />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
      borderRadius: 0,
      position: 'relative',
    }}>
      <style>{animationStyles}</style>

      {/* ===== HEADER ===== */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        flexWrap: 'wrap', 
        gap: 2,
        animation: 'fadeInUp 0.6s ease-out',
      }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
              '&::after': {
                content: '""',
                display: 'block',
                width: '40px',
                height: '3px',
                background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.darkNavy})`,
                borderRadius: '2px',
                marginTop: '4px',
              }
            }}
          >
            Hospitals
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              fontFamily: FONT_FAMILY,
              mt: 0.5,
            }}
          >
            Manage all hospitals and their details
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* ✅ REFRESH BUTTON - BORDER STYLE (Fills on hover/click) */}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAllData}
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                transform: 'translateY(-2px)',
              },
              '&:active': {
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                transform: 'scale(0.96)',
              }
            }}
          >
            Refresh
          </Button>
          
          {isSuperAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: colors.darkNavy,
                color: colors.text,
                fontFamily: FONT_FAMILY,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Add Hospital
            </Button>
          )}
        </Box>
      </Box>

      {/* ===== STATS CARDS - WITH PROMINENT CLICK EFFECT ===== */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => {
          const isClicked = clickedCardIndex === index && prominentActive
          
          return (
            <Grid item xs={6} sm={3} key={index}>
              <Grow in timeout={300 + index * 100}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    border: `1px solid ${isClicked ? colors.lightCyan : colors.borderColor}`,
                    boxShadow: isClicked 
                      ? `0 0 40px ${colors.lightCyanGlowStrong}, 0 0 80px ${colors.lightCyanGlow}, 0 8px 30px rgba(0,0,0,0.1)`
                      : '0 2px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transform: isClicked ? 'scale(1.04)' : 'scale(1)',
                    ...(isClicked && {
                      animation: 'prominentGlow 1.5s ease-in-out 3',
                    }),
                    '&:hover': {
                      transform: isClicked ? 'scale(1.04)' : 'translateY(-4px) scale(1.02)',
                      boxShadow: isClicked 
                        ? `0 0 50px ${colors.lightCyanGlowStrong}, 0 0 100px ${colors.lightCyanGlow}`
                        : `0 8px 30px ${colors.lightCyanGlow}`,
                      borderColor: colors.lightCyan,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: isClicked ? 4 : 3,
                      background: isClicked 
                        ? `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold}, ${colors.lightCyan})`
                        : `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold})`,
                      animation: isClicked ? 'gradientShine 1.5s ease-in-out infinite' : 'none',
                    }
                  }}
                  onClick={() => handleCardClick(card.path, index)}
                  className={isClicked ? 'prominent-active' : ''}
                >
                  {/* ✅ Prominent Glow Overlay */}
                  {isClicked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: `
                          radial-gradient(circle at 30% 50%, ${colors.lightCyan}15 0%, transparent 70%),
                          radial-gradient(circle at 70% 30%, ${colors.accentGold}08 0%, transparent 50%)
                        `,
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: isClicked ? colors.darkNavy : colors.lightText,
                            fontFamily: FONT_FAMILY,
                            fontWeight: isClicked ? 700 : 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.6rem',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {card.title}
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: isClicked ? 900 : 700,
                            color: isClicked ? colors.darkNavy : colors.darkNavy,
                            fontFamily: FONT_FAMILY,
                            fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
                            mt: 0.5,
                            transition: 'all 0.3s ease',
                            ...(isClicked && {
                              textShadow: `0 0 30px ${colors.lightCyanGlow}`,
                            }),
                          }}
                        >
                          {card.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          background: isClicked 
                            ? `linear-gradient(135deg, ${colors.lightCyan}, ${colors.accentGold})`
                            : card.bg,
                          borderRadius: '14px',
                          p: 1.2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: isClicked ? 48 : 42,
                          height: isClicked ? 48 : 42,
                          color: isClicked ? '#FFFFFF' : colors.lightCyan,
                          transition: 'all 0.3s ease',
                          boxShadow: isClicked 
                            ? `0 0 30px ${colors.lightCyanGlowStrong}`
                            : 'none',
                          transform: isClicked ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                        }}
                      >
                        {React.cloneElement(card.icon, { 
                          sx: { 
                            fontSize: isClicked ? 24 : 22,
                            color: isClicked ? '#FFFFFF' : colors.lightCyan,
                            transition: 'all 0.3s ease',
                          } 
                        })}
                      </Box>
                    </Box>
                    
                    {/* ✅ Prominent indicator dots */}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      <Box sx={{
                        width: isClicked ? 8 : 6,
                        height: isClicked ? 8 : 6,
                        borderRadius: '50%',
                        bgcolor: isClicked ? colors.accentGold : colors.lightCyan,
                        opacity: isClicked ? 1 : 0.4,
                        transition: 'all 0.3s ease',
                        boxShadow: isClicked 
                          ? `0 0 20px ${colors.accentGold}`
                          : 'none',
                      }} />
                      <Box sx={{
                        width: isClicked ? 7 : 6,
                        height: isClicked ? 7 : 6,
                        borderRadius: '50%',
                        bgcolor: colors.lightCyan,
                        opacity: isClicked ? 0.8 : 0.2,
                        transition: 'all 0.3s ease',
                        transitionDelay: '0.1s',
                      }} />
                      <Box sx={{
                        width: isClicked ? 6 : 6,
                        height: isClicked ? 6 : 6,
                        borderRadius: '50%',
                        bgcolor: colors.lightCyan,
                        opacity: isClicked ? 0.6 : 0.1,
                        transition: 'all 0.3s ease',
                        transitionDelay: '0.2s',
                      }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          )
        })}
      </Grid>

      {/* ===== SEARCH & FILTER - PROMINENT BUTTONS ===== */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.7s ease-out',
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search hospitals by name, code, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.lightText, fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                },
                '& .MuiInputBase-input': {
                  fontFamily: FONT_FAMILY,
                  fontSize: '0.9rem',
                }
              }
            }}
          />
          
          {/* ✅ FILTER BUTTON - PROMINENT SOLID */}
          <Button 
            variant="contained"
            startIcon={<FilterList />}
            onClick={handleFilterClick}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Filter
          </Button>
          
          {/* ✅ EXPORT BUTTON - PROMINENT SOLID */}
          <Button 
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportClick}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Export
          </Button>
        </Box>
      </Paper>

      {/* ===== FILTER MENU ===== */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ 
          sx: { 
            p: 2.5, 
            width: 280,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            borderRadius: 3,
          } 
        }}
      >
        <Typography 
          variant="subtitle2" 
          fontWeight={600} 
          sx={{ 
            color: colors.darkNavy,
            fontFamily: FONT_FAMILY,
            mb: 2,
          }} 
        >
          Filter Hospitals
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>Status</InputLabel>
          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            label="Status"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              },
              '& .MuiSelect-select': {
                fontFamily: FONT_FAMILY,
              }
            }}
          >
            <MenuItem sx={{ fontFamily: FONT_FAMILY }} value="all">All</MenuItem>
            <MenuItem sx={{ fontFamily: FONT_FAMILY }} value="active">Active</MenuItem>
            <MenuItem sx={{ fontFamily: FONT_FAMILY }} value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          size="small"
          label="City"
          name="city"
          value={filters.city}
          onChange={handleFilterChange}
          placeholder="Filter by city"
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': { borderColor: colors.lightCyan },
              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
            },
            '& .MuiInputBase-input': {
              fontFamily: FONT_FAMILY,
            },
            '& .MuiInputLabel-root': {
              fontFamily: FONT_FAMILY,
            }
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleFilterClose} 
            fullWidth 
            size="small"
            sx={{ 
              bgcolor: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
              },
            }}
          >
            Apply
          </Button>
          <Button 
            variant="outlined" 
            onClick={clearFilters} 
            fullWidth 
            size="small"
            sx={{ 
              borderColor: colors.borderColor,
              color: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { 
                borderColor: colors.lightCyan,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              }
            }}
          >
            Clear
          </Button>
        </Box>
      </Menu>

      {/* ===== EXPORT MENU - CSV REMOVED, KEEPING EXCEL & PDF ===== */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{ 
          sx: { 
            p: 1, 
            width: 200,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            borderRadius: 3,
          } 
        }}
      >
        {/* ✅ Excel Export Option */}
        <MenuItem 
          onClick={exportToExcel} 
          sx={{ 
            fontFamily: FONT_FAMILY,
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: FONT_FAMILY }}>Excel</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>.xlsx format</Typography>
          </Box>
        </MenuItem>
        
        {/* ✅ PDF Export Option */}
        <MenuItem 
          onClick={exportToPDF} 
          sx={{ 
            fontFamily: FONT_FAMILY,
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: FONT_FAMILY }}>PDF</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>Print ready document</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* ===== TABLE - WITH BIOMEDICAL HEAD DISPLAY ===== */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          overflowX: 'auto', 
          border: `1px solid ${colors.borderColor}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          animation: 'fadeInUp 0.8s ease-out',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY, py: 2 }}>Hospital Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY, py: 2 }}>Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY, py: 2 }}>Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY, py: 2 }}>Contact</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY, py: 2 }}>Biomedical Head</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY, py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY, py: 2 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHospitals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <LocalHospital sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                      No hospitals found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredHospitals.map((hospital, index) => (
                <TableRow 
                  key={hospital.id} 
                  hover
                  sx={{
                    transition: 'all 0.2s ease',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                    '&:hover': {
                      backgroundColor: 'rgba(103, 232, 249, 0.04)',
                    },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          bgcolor: 'rgba(103, 232, 249, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.lightCyanDark,
                        }}
                      >
                        <Business sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                          {hospital.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                          {hospital.director || 'No director assigned'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: '12px', 
                        color: colors.lightText,
                        bgcolor: 'rgba(103, 232, 249, 0.05)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                      }}
                    >
                      {hospital.hospital_code || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: colors.darkText, fontFamily: FONT_FAMILY }}>
                      {hospital.city || 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                      {hospital.state || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                      {hospital.phone || 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                      {hospital.email || ''}
                    </Typography>
                  </TableCell>
                  {/* ✅ BIOMEDICAL HEAD - Properly Displayed */}
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: colors.darkText, fontFamily: FONT_FAMILY, fontWeight: 600 }}>
                        {hospital.biomedical_head || 'Not Assigned'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                        Biomedical Head
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={hospital.is_active ? 'Active' : 'Inactive'} 
                      size="small"
                      sx={{
                        bgcolor: hospital.is_active ? colors.success : colors.lightText,
                        color: 'white',
                        fontWeight: 600,
                        height: 24,
                        fontSize: '11px',
                        fontFamily: FONT_FAMILY,
                        borderRadius: 2,
                        px: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(hospital)}
                        sx={{ 
                          color: colors.darkNavy, 
                          '&:hover': { 
                            color: colors.lightCyanDark,
                            backgroundColor: 'rgba(103, 232, 249, 0.08)'
                          } 
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {isSuperAdmin && (
                      <>
                        <Tooltip title="Edit Hospital">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(hospital)}
                            sx={{ 
                              color: colors.darkNavy, 
                              '&:hover': { 
                                color: colors.lightCyanDark,
                                backgroundColor: 'rgba(103, 232, 249, 0.08)'
                              } 
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Hospital">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(hospital.id)}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.08)'
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ===== VIEW DETAILS DIALOG ===== */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalHospital sx={{ fontSize: 28 }} />
              Hospital Details
            </Typography>
            <IconButton onClick={handleCloseViewDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2, px: 4, py: 3 }}>
          {selectedHospital && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      bgcolor: 'rgba(103, 232, 249, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.lightCyanDark,
                    }}
                  >
                    <Business sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                      {selectedHospital.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={selectedHospital.is_active ? 'Active' : 'Inactive'} 
                        size="small"
                        sx={{
                          bgcolor: selectedHospital.is_active ? colors.success : colors.lightText,
                          color: 'white',
                          fontWeight: 600,
                          height: 24,
                          fontSize: '11px',
                          fontFamily: FONT_FAMILY,
                          borderRadius: 2,
                        }}
                      />
                      {selectedHospital.hospital_code && (
                        <Chip 
                          label={`Code: ${selectedHospital.hospital_code}`} 
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: colors.borderColor,
                            color: colors.lightText,
                            fontWeight: 500,
                            height: 24,
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY, mb: 0.5, fontWeight: 600 }}>
                  <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Address
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.address || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY, mb: 0.5, fontWeight: 600 }}>
                  City
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.city || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY, mb: 0.5, fontWeight: 600 }}>
                  State
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.state || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY, mb: 0.5, fontWeight: 600 }}>
                  <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Phone Number
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.phone || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY, mb: 0.5, fontWeight: 600 }}>
                  <Email sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.email || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY, mb: 0.5, fontWeight: 600 }}>
                  <Person sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Hospital Director
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.director || 'Not Assigned'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY, mb: 0.5, fontWeight: 600 }}>
                  <Engineering sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Biomedical Head
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.biomedical_head || 'Not Assigned'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseViewDialog}
            variant="contained"
            sx={{ 
              bgcolor: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              px: 4,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ADD/EDIT DIALOG ===== */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {editingHospital ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
              {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontFamily: FONT_FAMILY }}>
                <Business fontSize="small" /> Basic Information
              </Typography>
              <Divider sx={{ mt: 1, borderColor: colors.borderColor }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                placeholder="e.g., PAEC Karachi Hospital"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Code"
                name="hospital_code"
                value={formData.hospital_code || ''}
                onChange={handleFormChange}
                placeholder="Auto-generated"
                disabled={!!editingHospital}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                multiline
                rows={2}
                required
                placeholder="Enter complete address"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                placeholder="e.g., Karachi"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State / Province"
                name="state"
                value={formData.state}
                onChange={handleFormChange}
                placeholder="e.g., Sindh"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleFormChange}
                placeholder="Pakistan"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="+92-XX-XXXXXXX"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="hospital@domain.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mt: 1, fontFamily: FONT_FAMILY }}>
                <Person fontSize="small" /> Hospital Leadership
              </Typography>
              <Divider sx={{ mt: 1, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Director"
                name="director"
                value={formData.director || ''}
                onChange={handleFormChange}
                placeholder="Enter Hospital Director name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Biomedical Engineering Head"
                name="biomedical_head"
                value={formData.biomedical_head || ''}
                onChange={handleFormChange}
                placeholder="Enter Biomedical Head name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 1, 
                  borderRadius: 2, 
                  border: `1px solid rgba(103, 232, 249, 0.2)`,
                  backgroundColor: 'rgba(103, 232, 249, 0.04)',
                  '& .MuiAlert-icon': { color: colors.lightCyanDark },
                  '& .MuiAlert-message': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: FONT_FAMILY }}>
                  <strong>Note:</strong> Hospital code is automatically generated and serves as a unique identifier.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ 
              color: colors.darkNavy, 
              borderColor: colors.borderColor,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': { 
                borderColor: colors.lightCyan,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              borderRadius: 2,
              px: 4,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
            }}
            startIcon={editingHospital ? <Edit /> : <Add />}
          >
            {editingHospital ? 'Update Hospital' : 'Create Hospital'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Hospitals