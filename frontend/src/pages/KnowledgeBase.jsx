// src/pages/KnowledgeBase.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  CardActionArea,
  CardMedia,
  Fade,
  Grow,
  Zoom,
  Badge,
  Stack,
} from '@mui/material'
import {
  Search,
  Add,
  Visibility,
  Edit,
  Delete,
  Close,
  Refresh,
  MedicalServices,
  Build,
  Person,
  CalendarToday,
  LocalHospital,
  Business,
  Description,
  Image,
  AttachFile,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  AccessTime,
  PictureAsPdf,
  Engineering,
  DeleteForever,
  Inventory,
  AddCircle,
  RemoveCircle,
  ToggleOn,
  ToggleOff,
  AdminPanelSettings,
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  School,
  MenuBook,
  Lightbulb,
  EmojiObjects,
  Help,
  Verified,
  Assignment,
  FolderOpen,
  BackupTable,
  Analytics,
  ChevronRight,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import FileUpload from '../components/FileUpload'
import AccessDenied from '../components/Auth/AccessDenied'

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS
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
  
  // Cards/Background
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  mainBg: '#F1F5F9',
  
  // Status colors
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/uploads')) {
    return `http://localhost:5000${url}`
  }
  return url
}

// ============================================================
// ✅ ENHANCED STAT CARD COMPONENT - DARK NAVY + CYAN
// ============================================================
const StatCard = ({ title, value, icon, color, bgColor, subtext }) => (
  <Grow in timeout={300}>
    <Card sx={{ 
      borderRadius: 3, 
      border: `1px solid ${colors.borderColor}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
        borderColor: colors.lightCyan,
      }
    }}>
      <CardContent sx={{ textAlign: 'center', py: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 1.5
        }}>
          <Avatar sx={{ 
            bgcolor: bgColor || color || colors.darkNavy,
            width: 48,
            height: 48,
            boxShadow: `0 4px 16px ${color || colors.darkNavy}44`
          }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" sx={{ color: colors.darkNavy, fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.lightText, fontWeight: 500 }}>
          {title}
        </Typography>
        {subtext && (
          <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 0.5 }}>
            {subtext}
          </Typography>
        )}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color || colors.darkNavy}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      </CardContent>
    </Card>
  </Grow>
)

// ============================================================
// ✅ ENHANCED EQUIPMENT CARD - DARK NAVY + CYAN
// ============================================================
const EquipmentCard = ({ equipment, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  const hasSolutions = (equipment.solution_count || 0) > 0
  
  return (
    <Grow in timeout={300}>
      <Card
        sx={{
          borderRadius: 3,
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${colors.borderColor}`,
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: isHovered ? `0 12px 40px ${colors.lightCyanGlow}` : '0 2px 12px rgba(0,0,0,0.04)',
          '&:hover': {
            borderColor: colors.lightCyan,
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${colors.darkNavy}, ${hasSolutions ? colors.lightCyan : colors.lightText})`,
        }} />
        
        <Box sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.darkNavy}06 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Badge
              badgeContent={equipment.solution_count || 0}
              color={hasSolutions ? 'primary' : 'default'}
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: hasSolutions ? colors.lightCyan : colors.lightText,
                  color: hasSolutions ? colors.darkNavy : colors.white,
                  fontWeight: 700,
                  fontSize: '10px',
                  height: 20,
                  minWidth: 20,
                  border: `2px solid ${colors.white}`,
                }
              }}
            >
              <Avatar sx={{ 
                bgcolor: hasSolutions ? colors.darkNavy : colors.lightText,
                width: 56,
                height: 56,
                boxShadow: hasSolutions ? `0 4px 20px ${colors.darkNavy}44` : 'none',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}>
                <MedicalServices sx={{ fontSize: 28, color: 'white' }} />
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 0.5 }}>
                {equipment.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>
                  {equipment.model || 'No Model'}
                </Typography>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: colors.borderColor }} />
                <Typography variant="body2" sx={{ color: colors.lightText }}>
                  {equipment.manufacturer || 'No Manufacturer'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${equipment.solution_count || 0} Solutions`}
              size="small"
              sx={{
                bgcolor: hasSolutions ? colors.darkNavy : colors.lightText,
                color: 'white',
                fontWeight: 600,
                fontSize: '11px',
                '& .MuiChip-label': { px: 1.5 }
              }}
              icon={hasSolutions ? <Verified sx={{ fontSize: 14 }} /> : <FolderOpen sx={{ fontSize: 14 }} />}
            />
            {equipment.category_name && (
              <Chip 
                label={equipment.category_name} 
                size="small" 
                variant="outlined"
                sx={{ 
                  borderColor: colors.borderColor, 
                  color: colors.lightText,
                  fontSize: '11px',
                  '& .MuiChip-label': { px: 1.5 }
                }}
              />
            )}
          </Box>

          <Box sx={{ 
            mt: 2, 
            pt: 1.5, 
            borderTop: `1px solid ${colors.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <LocalHospital sx={{ fontSize: 16, color: colors.lightText }} />
            <Typography variant="body2" sx={{ color: colors.lightText }}>
              {equipment.hospital_name || 'No Hospital Assigned'}
            </Typography>
          </Box>

          <Box sx={{ 
            mt: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            opacity: isHovered ? 1 : 0.4,
            transition: 'opacity 0.3s ease',
          }}>
            <Typography variant="caption" sx={{ color: colors.lightText, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Click to view solutions
            </Typography>
            <ChevronRight sx={{ fontSize: 16, color: colors.lightText }} />
          </Box>
        </CardContent>
      </Card>
    </Grow>
  )
}

// ============================================================
// ✅ SOLUTION CARD COMPONENT - DARK NAVY + CYAN
// ============================================================
const SolutionCard = ({ solution, onView, onEdit, onDelete, isOwner, canEdit }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <Fade in timeout={300}>
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          bgcolor: isHovered ? colors.mainBg : colors.white,
          boxShadow: isHovered ? `0 4px 20px ${colors.lightCyanGlow}` : 'none',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
          '&:hover': {
            borderColor: colors.lightCyan,
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Avatar sx={{ 
                bgcolor: colors.error, 
                width: 32, 
                height: 32,
                boxShadow: `0 2px 12px ${colors.error}33`
              }}>
                <ErrorIcon sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.darkNavy }}>
                {solution.error_title}
              </Typography>
              {isOwner && (
                <Chip 
                  label="My Solution" 
                  size="small" 
                  sx={{ 
                    bgcolor: colors.lightCyan, 
                    color: colors.darkNavy,
                    height: 20,
                    fontSize: '9px',
                    fontWeight: 600
                  }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', ml: 5 }}>
              {solution.error_code && (
                <Chip 
                  label={`Code: ${solution.error_code}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    borderColor: colors.error, 
                    color: colors.error,
                    height: 20,
                    fontSize: '10px'
                  }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person sx={{ fontSize: 13, color: colors.lightText }} />
                <Typography variant="caption" sx={{ color: colors.lightText }}>
                  {solution.created_by_name || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 13, color: colors.lightText }} />
                <Typography variant="caption" sx={{ color: colors.lightText }}>
                  {formatDate(solution.created_at)}
                </Typography>
              </Box>
              {solution.time_taken && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 13, color: colors.lightText }} />
                  <Typography variant="caption" sx={{ color: colors.lightText }}>
                    {solution.time_taken} min
                  </Typography>
                </Box>
              )}
              {solution.images && (
                <Chip
                  icon={<Image sx={{ fontSize: 12 }} />}
                  label="Has Images"
                  size="small"
                  sx={{
                    bgcolor: colors.success + '15',
                    color: colors.success,
                    height: 20,
                    fontSize: '9px',
                    fontWeight: 500
                  }}
                />
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                onClick={() => onView(solution)}
                sx={{ 
                  color: colors.darkNavy,
                  '&:hover': { 
                    color: colors.lightCyanDark,
                    backgroundColor: 'rgba(103, 232, 249, 0.08)'
                  }
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <Tooltip title="Edit">
                <IconButton 
                  size="small" 
                  onClick={() => onEdit(solution)}
                  sx={{ 
                    color: colors.darkNavy,
                    '&:hover': { 
                      color: colors.lightCyanDark,
                      backgroundColor: 'rgba(103, 232, 249, 0.08)'
                    }
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="Delete">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onDelete(solution)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>
    </Fade>
  )
}

// ============================================================
// ✅ FORMAT DATE HELPER
// ============================================================
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ============================================================
// ✅ MAIN KNOWLEDGE BASE COMPONENT
// ============================================================
const KnowledgeBase = () => {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Knowledge Base." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const canAdd = isEngineer || isSuperAdmin
  const canEdit = isSuperAdmin
  const canDelete = isSuperAdmin

  const [loading, setLoading] = useState(true)
  const [equipmentList, setEquipmentList] = useState([])
  const [filterEquipment, setFilterEquipment] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [solutions, setSolutions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [openSolutionsDialog, setOpenSolutionsDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedSolution, setSelectedSolution] = useState(null)
  const [editingSolution, setEditingSolution] = useState(null)
  const [deletingSolution, setDeletingSolution] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [totalSolutions, setTotalSolutions] = useState(0)
  const [equipmentWithSolutions, setEquipmentWithSolutions] = useState(0)
  const [solutionsWithImages, setSolutionsWithImages] = useState(0)

  const [uploadingFiles, setUploadingFiles] = useState(false)

  const [sparePartsList, setSparePartsList] = useState([])
  const [hasSpareParts, setHasSpareParts] = useState(false)

  const [addFormData, setAddFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
    root_cause: '',
    solution: '',
    repair_procedure: '',
    time_taken: '',
    spare_parts_used: '',
    spare_part_images: '',
    before_repair_images: '',
    after_repair_images: '',
    images: '',
    attachments: '',
    repair_date: '',
    remarks: '',
    reported_by: '',
    engineer_name: '',
    hospital_name: '',
    department_name: ''
  })

  const [sparePartForm, setSparePartForm] = useState({
    part_name: '',
    quantity: 1,
    unit_cost: '',
    total_cost: ''
  })

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    setLoading(true)
    try {
      const response = await api.get('/equipment')
      const equipment = response.data.equipment || []
      setEquipmentList(equipment)
      
      let totalSol = 0
      let equipWithSol = 0
      let solWithImages = 0
      
      for (const eq of equipment) {
        const solRes = await api.get(`/knowledge-base/equipment/${eq.id}`)
        const sols = solRes.data.entries || []
        const solCount = sols.length
        totalSol += solCount
        if (solCount > 0) equipWithSol++
        sols.forEach(sol => {
          if (sol.images || sol.spare_part_images || sol.before_repair_images || sol.after_repair_images) {
            solWithImages++
          }
        })
        eq.solution_count = solCount
      }
      
      setTotalSolutions(totalSol)
      setEquipmentWithSolutions(equipWithSol)
      setSolutionsWithImages(solWithImages)
      
    } catch (error) {
      console.error('Error fetching equipment:', error)
      toast.error('Failed to fetch equipment')
    } finally {
      setLoading(false)
    }
  }

  const fetchSolutions = async (equipmentId) => {
    try {
      const response = await api.get(`/knowledge-base/equipment/${equipmentId}`)
      setSolutions(response.data.entries || [])
    } catch (error) {
      console.error('Error fetching solutions:', error)
      toast.error('Failed to fetch solutions')
    }
  }

  const handleEquipmentClick = (equipment) => {
    setSelectedEquipment(equipment)
    fetchSolutions(equipment.id)
    setOpenSolutionsDialog(true)
  }

  const handleViewSolution = (solution) => {
    setSelectedSolution(solution)
    setOpenViewDialog(true)
  }

  const handleAddSolution = () => {
    setEditingSolution(null)
    setSparePartsList([])
    setHasSpareParts(false)
    setAddFormData({
      equipment_id: selectedEquipment?.id || '',
      error_code: '',
      error_title: '',
      error_description: '',
      root_cause: '',
      solution: '',
      repair_procedure: '',
      time_taken: '',
      spare_parts_used: '',
      spare_part_images: '',
      before_repair_images: '',
      after_repair_images: '',
      images: '',
      attachments: '',
      repair_date: new Date().toISOString().split('T')[0],
      remarks: '',
      reported_by: user?.full_name || '',
      engineer_name: '',
      hospital_name: user?.hospital_name || '',
      department_name: '',
      created_by: user?.id || null,
      created_by_name: user?.full_name || ''
    })
    setOpenAddDialog(true)
  }

  const handleEditSolution = (solution) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can edit solutions')
      return
    }
    
    setEditingSolution(solution)
    
    if (solution.spare_parts_used && solution.spare_parts_used.trim() !== '') {
      setHasSpareParts(true)
      try {
        const parts = solution.spare_parts_used.split(',').filter(Boolean).map(p => {
          const [name, qty, cost] = p.split('|')
          return {
            part_name: name || '',
            quantity: parseInt(qty) || 1,
            unit_cost: parseFloat(cost) || 0,
            total_cost: (parseInt(qty) || 1) * (parseFloat(cost) || 0)
          }
        })
        setSparePartsList(parts)
      } catch (e) {
        setSparePartsList([])
      }
    } else {
      setHasSpareParts(false)
      setSparePartsList([])
    }
    
    setAddFormData({
      equipment_id: solution.equipment_id || '',
      error_code: solution.error_code || '',
      error_title: solution.error_title || '',
      error_description: solution.error_description || '',
      root_cause: solution.root_cause || '',
      solution: solution.solution || '',
      repair_procedure: solution.repair_procedure || '',
      time_taken: solution.time_taken || '',
      spare_parts_used: solution.spare_parts_used || '',
      spare_part_images: solution.spare_part_images || '',
      before_repair_images: solution.before_repair_images || '',
      after_repair_images: solution.after_repair_images || '',
      images: solution.images || '',
      attachments: solution.attachments || '',
      repair_date: solution.repair_date || new Date().toISOString().split('T')[0],
      remarks: solution.remarks || '',
      reported_by: solution.reported_by || user?.full_name || '',
      engineer_name: solution.engineer_name || '',
      hospital_name: solution.hospital_name || user?.hospital_name || '',
      department_name: solution.department_name || '',
      created_by: solution.created_by || user?.id || null,
      created_by_name: solution.created_by_name || user?.full_name || ''
    })
    setOpenAddDialog(true)
  }

  const handleSparePartChange = (e) => {
    const { name, value } = e.target
    setSparePartForm(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'quantity' || name === 'unit_cost') {
        const qty = parseFloat(updated.quantity) || 0
        const cost = parseFloat(updated.unit_cost) || 0
        updated.total_cost = qty * cost
      }
      return updated
    })
  }

  const handleAddSparePart = () => {
    if (!sparePartForm.part_name || sparePartForm.part_name.trim() === '') {
      toast.error('Please enter a part name')
      return
    }
    if (!sparePartForm.quantity || sparePartForm.quantity < 1) {
      toast.error('Please enter a valid quantity')
      return
    }

    setSparePartsList(prev => [...prev, { ...sparePartForm }])
    setSparePartForm({
      part_name: '',
      quantity: 1,
      unit_cost: '',
      total_cost: ''
    })
    toast.success('Spare part added to list')
  }

  const handleRemoveSparePart = (index) => {
    setSparePartsList(prev => prev.filter((_, i) => i !== index))
    toast.info('Spare part removed')
  }

  const formatSparePartsForDB = () => {
    if (sparePartsList.length === 0) return ''
    return sparePartsList.map(p => 
      `${p.part_name}|${p.quantity}|${p.unit_cost}`
    ).join(',')
  }

  const handleDeleteClick = (solution) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete solutions')
      return
    }
    setDeletingSolution(solution)
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingSolution) return
    
    setDeleteLoading(true)
    try {
      await api.delete(`/knowledge-base/${deletingSolution.id}`)
      toast.success('Solution deleted successfully!')
      setOpenDeleteDialog(false)
      setDeletingSolution(null)
      
      if (selectedEquipment) {
        fetchSolutions(selectedEquipment.id)
        fetchEquipment()
      }
    } catch (error) {
      console.error('Error deleting solution:', error)
      toast.error(error.response?.data?.message || 'Failed to delete solution')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddFormChange = (e) => {
    const { name, value } = e.target
    setAddFormData({
      ...addFormData,
      [name]: value
    })
  }

  const handleFileUploadComplete = (fieldName) => (files) => {
    console.log(`📸 ${fieldName} uploaded:`, files)
    const urls = files.map(f => f.url || f.fileUrl).filter(Boolean)
    const currentValue = addFormData[fieldName] || ''
    const existingUrls = currentValue ? currentValue.split(',').filter(Boolean) : []
    const updatedUrls = [...existingUrls, ...urls]
    
    setAddFormData(prev => ({
      ...prev,
      [fieldName]: updatedUrls.join(',')
    }))
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  const handleFileDelete = (fieldName) => (file) => {
    const currentValue = addFormData[fieldName] || ''
    const urls = currentValue.split(',').filter(Boolean)
    const updatedUrls = urls.filter(url => url !== file.url)
    
    setAddFormData(prev => ({
      ...prev,
      [fieldName]: updatedUrls.join(',')
    }))
    toast.info('File removed')
  }

  const getExistingFiles = (fieldName) => {
    const value = addFormData[fieldName] || ''
    if (!value) return []
    return value.split(',').filter(Boolean).map(url => ({
      url: url,
      name: url.split('/').pop(),
      type: url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' :
            url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'document'
    }))
  }

  const handleSubmitSolution = async () => {
    try {
      if (!addFormData.equipment_id) {
        toast.error('Equipment is required')
        return
      }
      if (!addFormData.error_title) {
        toast.error('Error title is required')
        return
      }

      const sparePartsString = hasSpareParts ? formatSparePartsForDB() : ''

      const payload = {
        equipment_id: addFormData.equipment_id,
        error_code: addFormData.error_code || null,
        error_title: addFormData.error_title,
        error_description: addFormData.error_description || null,
        root_cause: addFormData.root_cause || null,
        solution: addFormData.solution || null,
        repair_procedure: addFormData.repair_procedure || null,
        time_taken: addFormData.time_taken ? parseInt(addFormData.time_taken) : null,
        spare_parts_used: sparePartsString || addFormData.spare_parts_used || null,
        spare_part_images: addFormData.spare_part_images || null,
        before_repair_images: addFormData.before_repair_images || null,
        after_repair_images: addFormData.after_repair_images || null,
        images: addFormData.images || null,
        attachments: addFormData.attachments || null,
        repair_date: addFormData.repair_date || null,
        remarks: addFormData.remarks || null,
        reported_by: addFormData.reported_by || null,
        engineer_name: addFormData.engineer_name || null,
        hospital_name: addFormData.hospital_name || null,
        department_name: addFormData.department_name || null,
        created_by: user?.id || null,
        created_by_name: user?.full_name || ''
      }

      console.log('📤 Submitting solution:', payload)

      if (editingSolution) {
        await api.put(`/knowledge-base/${editingSolution.id}`, payload)
        toast.success('Solution updated successfully')
      } else {
        await api.post('/knowledge-base', payload)
        toast.success('Solution added successfully')
      }

      setOpenAddDialog(false)
      setSparePartsList([])
      setHasSpareParts(false)
      if (selectedEquipment) {
        fetchSolutions(selectedEquipment.id)
        fetchEquipment()
      }
    } catch (error) {
      console.error('Error saving solution:', error)
      toast.error(error.response?.data?.message || 'Failed to save solution')
    }
  }

  const filteredEquipment = equipmentList.filter(eq => {
    const matchesSearch = eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterEquipment || eq.id === parseInt(filterEquipment)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: colors.darkNavy,
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
            Knowledge Base
          </Typography>
          <Chip 
            icon={<MenuBook sx={{ fontSize: 16 }} />}
            label={`${totalSolutions} Solutions`}
            size="small"
            sx={{ 
              bgcolor: colors.darkNavy, 
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-icon': { color: colors.lightCyan }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchEquipment} 
            size="small"
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkNavy,
              '&:hover': { 
                borderColor: colors.lightCyan, 
                color: colors.lightCyanDark,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Enhanced Stats Cards - DARK NAVY + CYAN */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="Total Solutions" 
            value={totalSolutions} 
            icon={<MenuBook sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.darkNavy}
            bgColor={colors.darkNavy}
            subtext="All knowledge entries"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="Equipment with Solutions" 
            value={equipmentWithSolutions} 
            icon={<Verified sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.info}
            bgColor={colors.info}
            subtext={`${equipmentList.length} total equipment`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="With Images" 
            value={solutionsWithImages} 
            icon={<Image sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.success}
            bgColor={colors.success}
            subtext="Visual documentation"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="Recent Solutions" 
            value={solutions.length || 0} 
            icon={<Lightbulb sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.lightCyan}
            bgColor={colors.lightCyanDark}
            subtext={selectedEquipment ? `For ${selectedEquipment.name}` : 'Select equipment'}
          />
        </Grid>
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search equipment by name, model or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.lightText }} />
                </InputAdornment>
              ),
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: colors.lightText }}>Filter by Equipment</InputLabel>
            <Select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value)}
              label="Filter by Equipment"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }}
            >
              <MenuItem value="">All Equipment</MenuItem>
              {equipmentList.map(eq => (
                <MenuItem key={eq.id} value={eq.id}>{eq.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Enhanced Equipment Cards Grid */}
      <Grid container spacing={3}>
        {filteredEquipment.map((eq) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={eq.id}>
            <EquipmentCard 
              equipment={eq} 
              onClick={() => handleEquipmentClick(eq)}
            />
          </Grid>
        ))}
      </Grid>

      {filteredEquipment.length === 0 && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
        }}>
          <Typography variant="h6" sx={{ color: colors.lightText }}>
            No equipment found
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText }}>
            Try adjusting your search or filter
          </Typography>
        </Paper>
      )}

      {/* Solutions Dialog - DARK NAVY + CYAN */}
      <Dialog 
        open={openSolutionsDialog} 
        onClose={() => setOpenSolutionsDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                <MedicalServices sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {selectedEquipment?.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {selectedEquipment?.model} - {selectedEquipment?.manufacturer}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {canAdd && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddSolution}
                  sx={{ 
                    bgcolor: 'white', 
                    color: colors.darkNavy, 
                    '&:hover': { 
                      bgcolor: colors.lightCyan, 
                      color: colors.darkNavy 
                    },
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Add Solution
                </Button>
              )}
              <IconButton onClick={() => setOpenSolutionsDialog(false)} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {solutions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <EmojiObjects sx={{ fontSize: 64, color: colors.lightText, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colors.lightText }}>
                No solutions found
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                Click "Add Solution" to add a new solution
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {solutions.map((sol) => (
                <SolutionCard
                  key={sol.id}
                  solution={sol}
                  onView={handleViewSolution}
                  onEdit={handleEditSolution}
                  onDelete={handleDeleteClick}
                  isOwner={isEngineer && (sol.created_by === user?.id || sol.created_by_name === user?.full_name)}
                  canEdit={isSuperAdmin}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenSolutionsDialog(false)} 
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Close
          </Button>
          {solutions.length > 0 && (
            <Typography variant="caption" sx={{ color: colors.lightText }}>
              {solutions.length} solution{solutions.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </DialogActions>
      </Dialog>

      {/* View Dialog - DARK NAVY + CYAN */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Solution Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSolution && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                <Avatar sx={{ bgcolor: colors.error, width: 56, height: 56 }}>
                  <ErrorIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600} sx={{ color: colors.darkNavy }}>
                    {selectedSolution.error_title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    {selectedSolution.error_code && (
                      <Chip label={`Code: ${selectedSolution.error_code}`} size="small" sx={{ bgcolor: colors.error, color: 'white' }} />
                    )}
                    {selectedSolution.time_taken && (
                      <Chip label={`Time: ${selectedSolution.time_taken} min`} size="small" sx={{ bgcolor: colors.info, color: 'white' }} />
                    )}
                    {selectedSolution.repair_date && (
                      <Chip label={`Repair: ${formatDate(selectedSolution.repair_date)}`} size="small" sx={{ bgcolor: colors.darkNavy, color: 'white' }} />
                    )}
                    {isEngineer && selectedSolution.created_by === user?.id && (
                      <Chip label="Your Solution" size="small" sx={{ bgcolor: colors.lightCyan, color: colors.darkNavy }} />
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 3, borderColor: colors.borderColor }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                    <MedicalServices fontSize="small" /> Equipment Information
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, mb: 3, border: `1px solid ${colors.borderColor}` }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>Equipment</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy }}>{selectedSolution.equipment_name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>Hospital</Typography>
                        <Typography variant="body2" sx={{ color: colors.darkNavy }}>{selectedSolution.hospital_name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>Department</Typography>
                        <Typography variant="body2" sx={{ color: colors.darkNavy }}>{selectedSolution.department_name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>Reported By</Typography>
                        <Typography variant="body2" sx={{ color: colors.darkNavy }}>{selectedSolution.reported_by || selectedSolution.created_by_name || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                    <ErrorIcon fontSize="small" /> Error Details
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, mb: 3, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Description</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: colors.darkNavy }}>{selectedSolution.error_description || 'No description'}</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                    <Build fontSize="small" /> Solution Details
                  </Typography>
                  
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, mb: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Root Cause</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: colors.darkNavy }}>{selectedSolution.root_cause || 'Not specified'}</Typography>
                  </Paper>

                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, mb: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Solution</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: colors.darkNavy }}>{selectedSolution.solution || 'Not specified'}</Typography>
                  </Paper>

                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Repair Procedure</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line', color: colors.darkNavy }}>
                      {selectedSolution.repair_procedure || 'Not specified'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Spare Parts Section */}
              {selectedSolution.spare_parts_used && (
                <>
                  <Divider sx={{ my: 3, borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                    <Inventory fontSize="small" /> Spare Parts Used
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="body2" sx={{ color: colors.darkNavy }}>{selectedSolution.spare_parts_used}</Typography>
                  </Paper>
                </>
              )}

              {/* Images Section */}
              {(selectedSolution.spare_part_images || selectedSolution.before_repair_images || selectedSolution.after_repair_images || selectedSolution.images) && (
                <>
                  <Divider sx={{ my: 3, borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                    <Image fontSize="small" /> Images
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {selectedSolution.spare_part_images && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>Spare Part Images</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          {selectedSolution.spare_part_images.split(',').filter(Boolean).map((url, idx) => {
                            const fullUrl = getFullUrl(url.trim())
                            return (
                              <Box
                                key={idx}
                                component="img"
                                src={fullUrl}
                                alt={`Spare part ${idx + 1}`}
                                sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                                onClick={() => window.open(fullUrl, '_blank')}
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            )
                          })}
                        </Box>
                      </Grid>
                    )}

                    {selectedSolution.before_repair_images && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>Before Repair</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          {selectedSolution.before_repair_images.split(',').filter(Boolean).map((url, idx) => {
                            const fullUrl = getFullUrl(url.trim())
                            return (
                              <Box
                                key={idx}
                                component="img"
                                src={fullUrl}
                                alt={`Before repair ${idx + 1}`}
                                sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                                onClick={() => window.open(fullUrl, '_blank')}
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            )
                          })}
                        </Box>
                      </Grid>
                    )}

                    {selectedSolution.after_repair_images && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>After Repair</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          {selectedSolution.after_repair_images.split(',').filter(Boolean).map((url, idx) => {
                            const fullUrl = getFullUrl(url.trim())
                            return (
                              <Box
                                key={idx}
                                component="img"
                                src={fullUrl}
                                alt={`After repair ${idx + 1}`}
                                sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                                onClick={() => window.open(fullUrl, '_blank')}
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            )
                          })}
                        </Box>
                      </Grid>
                    )}

                    {selectedSolution.images && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>General Images</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          {selectedSolution.images.split(',').filter(Boolean).map((url, idx) => {
                            const fullUrl = getFullUrl(url.trim())
                            return (
                              <Box
                                key={idx}
                                component="img"
                                src={fullUrl}
                                alt={`Image ${idx + 1}`}
                                sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                                onClick={() => window.open(fullUrl, '_blank')}
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            )
                          })}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              {/* Remarks */}
              {selectedSolution.remarks && (
                <>
                  <Divider sx={{ my: 3, borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                    <Description fontSize="small" /> Remarks
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="body2" sx={{ color: colors.darkNavy }}>{selectedSolution.remarks}</Typography>
                  </Paper>
                </>
              )}

              {/* People Information */}
              <Divider sx={{ my: 3, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                <Person fontSize="small" /> People Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Engineer Name</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy }}>{selectedSolution.engineer_name || 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Created By</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy }}>{selectedSolution.created_by_name || 'Unknown'}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)} 
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Close
          </Button>
          {isSuperAdmin && selectedSolution && (
            <Button
              variant="outlined"
              onClick={() => {
                setOpenViewDialog(false)
                handleEditSolution(selectedSolution)
              }}
              sx={{ 
                borderColor: colors.darkNavy, 
                color: colors.darkNavy, 
                '&:hover': { 
                  borderColor: colors.lightCyan, 
                  color: colors.lightCyanDark,
                  backgroundColor: 'rgba(103, 232, 249, 0.04)'
                },
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Edit
            </Button>
          )}
          {isSuperAdmin && selectedSolution && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForever />}
              onClick={() => {
                setOpenViewDialog(false)
                handleDeleteClick(selectedSolution)
              }}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Dialog - DARK NAVY + CYAN */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.error, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteForever />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom sx={{ color: colors.darkNavy }}>
            Are you sure you want to delete this solution?
          </Typography>
          {deletingSolution && (
            <Box sx={{ mt: 1, p: 2, bgcolor: colors.mainBg, borderRadius: 1, border: `1px solid ${colors.borderColor}` }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                {deletingSolution.error_title}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                {deletingSolution.error_code && `Code: ${deletingSolution.error_code}`}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                Created: {formatDate(deletingSolution.created_at)}
              </Typography>
            </Box>
          )}
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 2, 
              borderRadius: 2,
              border: `1px solid ${colors.warning}33`,
            }}
          >
            This action cannot be undone. All associated data will be permanently removed.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={deleteLoading}
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteForever />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog - DARK NAVY + CYAN */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {editingSolution ? 'Edit Solution' : 'Add New Solution'}
            </Typography>
            <IconButton onClick={() => setOpenAddDialog(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Equipment"
                value={selectedEquipment?.name || ''}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MedicalServices sx={{ color: colors.lightText }} />
                    </InputAdornment>
                  ),
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Error Code"
                name="error_code"
                value={addFormData.error_code}
                onChange={handleAddFormChange}
                placeholder="e.g., ERR-001"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Error Title *"
                name="error_title"
                value={addFormData.error_title}
                onChange={handleAddFormChange}
                placeholder="Brief error title"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Description"
                name="error_description"
                value={addFormData.error_description}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="Detailed description of the error"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                Solution Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Root Cause"
                name="root_cause"
                value={addFormData.root_cause}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="What caused the failure?"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Solution"
                name="solution"
                value={addFormData.solution}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="How was it fixed?"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Repair Procedure"
                name="repair_procedure"
                value={addFormData.repair_procedure}
                onChange={handleAddFormChange}
                multiline
                rows={3}
                placeholder="Step by step repair procedure"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time Taken (minutes)"
                name="time_taken"
                type="number"
                value={addFormData.time_taken}
                onChange={handleAddFormChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTime sx={{ color: colors.lightText }} />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Repair Date"
                name="repair_date"
                type="date"
                value={addFormData.repair_date}
                onChange={handleAddFormChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ color: colors.lightText }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                  <Inventory sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Spare Parts Used
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={hasSpareParts ? 'yes' : 'no'}
                      onChange={(e) => {
                        const value = e.target.value === 'yes'
                        setHasSpareParts(value)
                        if (!value) {
                          setSparePartsList([])
                        }
                      }}
                    >
                      <FormControlLabel 
                        value="yes" 
                        control={<Radio sx={{ color: colors.darkNavy, '&.Mui-checked': { color: colors.darkNavy } }} />} 
                        label="Yes" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem', fontWeight: 500 } }}
                      />
                      <FormControlLabel 
                        value="no" 
                        control={<Radio sx={{ color: colors.lightText }} />} 
                        label="No" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem', fontWeight: 500 } }}
                      />
                    </RadioGroup>
                  </FormControl>
                  {hasSpareParts ? (
                    <Chip 
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label="Spare parts will be added" 
                      size="small" 
                      sx={{ bgcolor: colors.success, color: 'white' }}
                    />
                  ) : (
                    <Chip 
                      icon={<Close sx={{ fontSize: 16 }} />}
                      label="No spare parts" 
                      size="small" 
                      sx={{ bgcolor: colors.lightText, color: 'white' }}
                    />
                  )}
                </Box>
              </Box>

              {hasSpareParts && (
                <>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, mb: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Part Name *"
                          name="part_name"
                          value={sparePartForm.part_name}
                          onChange={handleSparePartChange}
                          placeholder="e.g., Power Supply Module"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': { borderColor: colors.lightCyan },
                              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Qty"
                          name="quantity"
                          type="number"
                          value={sparePartForm.quantity}
                          onChange={handleSparePartChange}
                          InputProps={{ inputProps: { min: 1 } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': { borderColor: colors.lightCyan },
                              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Unit Cost (Rs.)"
                          name="unit_cost"
                          type="number"
                          value={sparePartForm.unit_cost}
                          onChange={handleSparePartChange}
                          InputProps={{ inputProps: { min: 0 } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': { borderColor: colors.lightCyan },
                              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<AddCircle />}
                          onClick={handleAddSparePart}
                          sx={{ 
                            bgcolor: colors.darkNavy, 
                            '&:hover': { 
                              bgcolor: colors.darkNavyHover,
                              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
                            },
                            boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          Add Part
                        </Button>
                      </Grid>
                    </Grid>
                    {sparePartForm.total_cost > 0 && (
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 1 }}>
                        Total: Rs. {sparePartForm.total_cost.toFixed(0)}
                      </Typography>
                    )}
                  </Paper>

                  {sparePartsList.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderColor: colors.borderColor }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Part Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="center">Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="right">Unit Cost</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="right">Total</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: colors.darkNavy }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sparePartsList.map((part, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ color: colors.darkNavy }}>{part.part_name}</TableCell>
                              <TableCell align="center" sx={{ color: colors.darkNavy }}>{part.quantity}</TableCell>
                              <TableCell align="right" sx={{ color: colors.darkNavy }}>Rs. {parseFloat(part.unit_cost).toFixed(0)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: colors.darkNavy }}>
                                Rs. {(parseFloat(part.quantity) * parseFloat(part.unit_cost)).toFixed(0)}
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveSparePart(idx)}
                                  >
                                    <RemoveCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: colors.mainBg }}>
                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 600, color: colors.darkNavy }}>
                              Total Spare Parts Cost:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: colors.lightCyanDark }}>
                              Rs. {sparePartsList.reduce((sum, p) => sum + (parseFloat(p.quantity) * parseFloat(p.unit_cost)), 0).toFixed(0)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1, borderRadius: 2 }}>
                      No spare parts added yet. Use the form above to add spare parts.
                    </Alert>
                  )}
                </>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                Images & Attachments
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
                Spare Part Images
              </Typography>
              <FileUpload
                endpoint="/upload"
                accept="image/*"
                multiple={true}
                label="Click to upload spare part images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('spare_part_images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('spare_part_images')}
                existingFiles={getExistingFiles('spare_part_images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
                Before Repair Images
              </Typography>
              <FileUpload
                endpoint="/upload"
                accept="image/*"
                multiple={true}
                label="Click to upload before repair images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('before_repair_images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('before_repair_images')}
                existingFiles={getExistingFiles('before_repair_images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
                After Repair Images
              </Typography>
              <FileUpload
                endpoint="/upload"
                accept="image/*"
                multiple={true}
                label="Click to upload after repair images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('after_repair_images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('after_repair_images')}
                existingFiles={getExistingFiles('after_repair_images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
                General Images
              </Typography>
              <FileUpload
                endpoint="/upload"
                accept="image/*,.pdf,.doc,.docx"
                multiple={true}
                label="Click to upload general images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('images')}
                existingFiles={getExistingFiles('images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
                Attachments
              </Typography>
              <FileUpload
                endpoint="/upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                multiple={true}
                label="Click to upload attachments"
                maxFiles={10}
                maxSize={50}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('attachments')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('attachments')}
                existingFiles={getExistingFiles('attachments')}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                People Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reported By"
                name="reported_by"
                value={addFormData.reported_by}
                onChange={handleAddFormChange}
                placeholder="Name of person who reported"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Engineer Name"
                name="engineer_name"
                value={addFormData.engineer_name}
                onChange={handleAddFormChange}
                placeholder="Name of engineer who fixed"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital / Center Name"
                name="hospital_name"
                value={addFormData.hospital_name}
                onChange={handleAddFormChange}
                placeholder="Hospital name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalHospital sx={{ color: colors.lightText }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department Name"
                name="department_name"
                value={addFormData.department_name}
                onChange={handleAddFormChange}
                placeholder="Department name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ color: colors.lightText }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={addFormData.remarks}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="Additional remarks..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description sx={{ color: colors.lightText }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenAddDialog(false)} 
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitSolution}
            sx={{ 
              bgcolor: colors.darkNavy, 
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            {editingSolution ? 'Update Solution' : 'Add Solution'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default KnowledgeBase