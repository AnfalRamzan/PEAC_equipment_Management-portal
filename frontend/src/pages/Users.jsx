// src/pages/Users.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Equipment page
// ✅ UPDATED: Stats cards design matches Equipment page
// ✅ UPDATED: Header with Filter and Export buttons
// ✅ ADDED: Animations

import React, { useState, useEffect } from 'react'
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
  Avatar,
  Switch,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  FormHelperText,
  Alert,
  Collapse,
  Input,
  Card,
  CardContent,
  Fade,
  Grow,
  Menu,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  Close,
  PersonAdd,
  Lock,
  CheckCircle,
  Cancel,
  Refresh,
  Email,
  Phone,
  Business,
  Person,
  AdminPanelSettings,
  SupervisorAccount,
  Engineering,
  VisibilityOff,
  Check,
  Warning as WarningIcon,
  FilterList,
  FileDownload,
  People,
  MedicalServices,
  ErrorOutline,
  Build,
  Schedule,
} from '@mui/icons-material'
import { userService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS - Matching Equipment page
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

// ✅ Animation Styles - Same as Equipment page
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

@keyframes prominentGlow {
  0% {
    box-shadow: 0 0 20px rgba(103, 232, 249, 0.2), 0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(103, 232, 249, 0.4), 0 0 80px rgba(103, 232, 249, 0.2);
    border-color: rgba(103, 232, 249, 0.6);
  }
  100% {
    box-shadow: 0 0 20px rgba(103, 232, 249, 0.2), 0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
}

@keyframes gradientShine {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`

const Users = () => {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'ENGINEER') {
    return <AccessDenied message="Biomedical Engineers cannot access User Management." />
  }
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const [users, setUsers] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const [filters, setFilters] = useState({
    role: '',
    hospital: '',
    status: ''
  })
  
  const [errors, setErrors] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role_id: '',
    phone: ''
  })

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role_id: '',
    hospital_id: '',
    phone: '',
    is_active: true
  })

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: 'Weak',
    color: '#dc3545',
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  })

  const ROLE_NAMES = {
    1: 'SUPER_ADMIN',
    3: 'ENGINEER'
  }

  const ROLE_DISPLAY = {
    'SUPER_ADMIN': 'Super Admin',
    'ENGINEER': 'Engineer'
  }

  const getAvailableRoles = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { id: 1, name: 'SUPER_ADMIN', display: 'Super Admin' },
        { id: 3, name: 'ENGINEER', display: 'Engineer' }
      ]
    }
    return []
  }

  const availableRoles = getAvailableRoles()

  const getRoleName = (roleId) => {
    return ROLE_NAMES[roleId] || 'USER'
  }

  const getRoleDisplay = (roleName) => {
    return ROLE_DISPLAY[roleName] || roleName
  }

  useEffect(() => {
    fetchUsers()
    fetchHospitals()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await userService.getAll()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Fetch users error:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll()
      setHospitals(response.data.hospitals || [])
    } catch (error) {
      console.error('Failed to fetch hospitals:', error)
    }
  }

  // ============================================================
  // ✅ FILTER HANDLERS
  // ============================================================
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget)
  const handleFilterClose = () => setFilterAnchorEl(null)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ role: '', hospital: '', status: '' })
    setSearchTerm('')
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToCSV = () => {
    try {
      const headers = ['Full Name', 'Username', 'Email', 'Role', 'Hospital', 'Phone', 'Status']
      const rows = filteredUsers.map(u => [
        u.full_name || '',
        u.username || '',
        u.email || '',
        getRoleDisplay(u.role_name) || '',
        u.hospital_name || 'N/A',
        u.phone || 'N/A',
        u.is_active ? 'Active' : 'Inactive'
      ])
      let csv = headers.join(',') + '\n'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('CSV exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportToExcel = () => {
    try {
      const data = filteredUsers.map(u => ({
        'Full Name': u.full_name || '',
        'Username': u.username || '',
        'Email': u.email || '',
        'Role': getRoleDisplay(u.role_name) || '',
        'Hospital': u.hospital_name || 'N/A',
        'Phone': u.phone || 'N/A',
        'Status': u.is_active ? 'Active' : 'Inactive'
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Users')
      XLSX.writeFile(wb, `users_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.setTextColor(colors.darkNavy)
      doc.text('Users Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Users: ${filteredUsers.length}`, 14, 34)
      
      const tableData = filteredUsers.map(u => [
        u.full_name || '',
        u.username || '',
        u.email || '',
        getRoleDisplay(u.role_name) || '',
        u.is_active ? 'Active' : 'Inactive'
      ])
      autoTable(doc, {
        head: [['Full Name', 'Username', 'Email', 'Role', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`users_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  // ============================================================
  // ✅ VALIDATION FUNCTIONS
  // ============================================================
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Please enter a valid email (e.g., user@domain.com)'
    return ''
  }

  const validateUsername = (username) => {
    if (!username) return 'Username is required'
    if (username.length < 3) return 'Username must be at least 3 characters'
    if (username.length > 30) return 'Username must be less than 30 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscore'
    return ''
  }

  const validateFullName = (name) => {
    if (!name) return 'Full name is required'
    if (name.length < 2) return 'Full name must be at least 2 characters'
    if (name.length > 100) return 'Full name must be less than 100 characters'
    return ''
  }

  const validatePhone = (phone) => {
    if (!phone) return ''
    const phoneRegex = /^[0-9+\-\s()]{7,20}$/
    if (!phoneRegex.test(phone)) return 'Enter a valid phone number'
    return ''
  }

  const validatePassword = (password) => {
    if (!password && !editingUser) return 'Password is required'
    if (password && password.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        label: 'Weak',
        color: '#dc3545',
        checks: { length: false, uppercase: false, lowercase: false, number: false, special: false }
      })
      return
    }

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const score = Object.values(checks).filter(Boolean).length

    const strengthMap = {
      0: { label: 'Very Weak', color: '#dc3545' },
      1: { label: 'Weak', color: '#dc3545' },
      2: { label: 'Fair', color: '#ff9800' },
      3: { label: 'Good', color: colors.darkNavy },
      4: { label: 'Strong', color: '#28a745' },
      5: { label: 'Very Strong', color: '#28a745' }
    }

    setPasswordStrength({
      score,
      ...strengthMap[score],
      checks
    })
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setFormData({ ...formData, password: value })
    checkPasswordStrength(value)
    const error = validatePassword(value)
    setErrors({ ...errors, password: error })
  }

  const handleBlur = (field) => (e) => {
    const value = e.target.value
    let error = ''
    switch (field) {
      case 'full_name':
        error = validateFullName(value)
        break
      case 'username':
        error = validateUsername(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'phone':
        error = validatePhone(value)
        break
      case 'role_id':
        if (!value) error = 'Role is required'
        break
      default:
        break
    }
    setErrors({ ...errors, [field]: error })
  }

  const isFormValid = () => {
    const nameError = validateFullName(formData.full_name)
    const usernameError = validateUsername(formData.username)
    const emailError = validateEmail(formData.email)
    const phoneError = validatePhone(formData.phone)
    const passwordError = validatePassword(formData.password)
    const roleError = formData.role_id ? '' : 'Role is required'

    setErrors({
      full_name: nameError,
      username: usernameError,
      email: emailError,
      phone: phoneError,
      password: passwordError,
      role_id: roleError
    })

    return !nameError && !usernameError && !emailError && !phoneError && !passwordError && !roleError
  }

  const handleOpenDialog = (userData = null) => {
    setErrors({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role_id: '',
      phone: ''
    })
    setPasswordStrength({
      score: 0,
      label: 'Weak',
      color: '#dc3545',
      checks: { length: false, uppercase: false, lowercase: false, number: false, special: false }
    })
    setShowPassword(false)

    if (userData) {
      setEditingUser(userData)
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        full_name: userData.full_name || '',
        password: '',
        role_id: userData.role_id || '',
        hospital_id: userData.hospital_id || '',
        phone: userData.phone || '',
        is_active: userData.is_active !== undefined ? userData.is_active : true
      })
    } else {
      setEditingUser(null)
      const defaultRoleId = ''
      setFormData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role_id: defaultRoleId,
        hospital_id: user?.hospital_id || '',
        phone: '',
        is_active: true
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
    setErrors({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role_id: '',
      phone: ''
    })
  }

  const handleViewUser = (userData) => {
    setViewingUser(userData)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingUser(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleToggleActive = (e) => {
    setFormData({
      ...formData,
      is_active: e.target.checked
    })
  }

  const checkExisting = (field, value) => {
    if (!value) return false
    return users.some(u => 
      u[field]?.toLowerCase() === value.toLowerCase() && 
      (editingUser ? u.id !== editingUser.id : true)
    )
  }

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Please fix all validation errors')
      return
    }

    try {
      if (checkExisting('username', formData.username)) {
        toast.error('Username already exists. Please choose a different username')
        return
      }

      if (checkExisting('email', formData.email)) {
        toast.error('Email already exists. Please use a different email')
        return
      }

      const submitData = {
        full_name: formData.full_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        role_id: parseInt(formData.role_id),
        hospital_id: formData.hospital_id ? parseInt(formData.hospital_id) : null,
        phone: formData.phone || '',
        is_active: formData.is_active
      }

      if (editingUser) {
        if (formData.password && formData.password.trim() !== '') {
          if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
          }
          submitData.password = formData.password
        }
      } else {
        if (!formData.password || formData.password.trim() === '') {
          toast.error('Password is required for new users')
          return
        }
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }
        submitData.password = formData.password
      }

      if (editingUser) {
        await userService.update(editingUser.id, submitData)
        toast.success('User updated successfully')
      } else {
        await userService.create(submitData)
        toast.success('User created successfully')
      }
      fetchUsers()
      handleCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      
      if (error.response?.data?.message?.includes('Duplicate entry')) {
        if (error.response.data.message.includes('email')) {
          toast.error('Email already exists. Please use a different email')
        } else if (error.response.data.message.includes('username')) {
          toast.error('Username already exists. Please choose a different username')
        } else {
          toast.error('Duplicate entry. Please check your input')
        }
      } else {
        const errorMsg = error.response?.data?.message || 'Operation failed'
        toast.error(errorMsg)
      }
    }
  }

  const handleDelete = async (id) => {
    if (id === user?.id) {
      toast.error('You cannot delete your own account')
      return
    }
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.delete(id)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error.response?.data?.message || 'Failed to delete user')
      }
    }
  }

  const roleFilterOptions = [
    { id: 'SUPER_ADMIN', name: 'Super Admin' },
    { id: 'ENGINEER', name: 'Engineer' }
  ]

  const filteredUsers = users.filter(userData => {
    const matchesSearch = userData.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          userData.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          userData.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = !filters.role || userData.role_name === filters.role
    const matchesHospital = !filters.hospital || userData.hospital_id === parseInt(filters.hospital)
    const matchesStatus = !filters.status || (filters.status === 'active' ? userData.is_active : !userData.is_active)
    
    if (user?.role === 'HOSPITAL_ADMIN') {
      return matchesSearch && matchesRole && matchesHospital && matchesStatus && 
             userData.hospital_id === user.hospital_id
    }
    
    return matchesSearch && matchesRole && matchesHospital && matchesStatus
  })

  // ✅ Stats Cards Data - Same design as Equipment page
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.is_active).length
  const inactiveUsers = users.filter(u => !u.is_active).length
  const superAdmins = users.filter(u => u.role_name === 'SUPER_ADMIN').length
  const engineers = users.filter(u => u.role_name === 'ENGINEER').length

  const statsCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: <People />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Active',
      value: activeUsers,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Inactive',
      value: inactiveUsers,
      icon: <Cancel />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Super Admins',
      value: superAdmins,
      icon: <AdminPanelSettings />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Engineers',
      value: engineers,
      icon: <Engineering />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
  ]

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  const getVisibleColumns = () => {
    if (isMobile) {
      return ['user', 'role', 'status', 'actions']
    }
    if (isTablet) {
      return ['user', 'email', 'role', 'status', 'actions']
    }
    return ['user', 'email', 'role', 'hospital', 'phone', 'status', 'actions']
  }

  const visibleColumns = getVisibleColumns()

  const PasswordStrengthIndicator = () => (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 500, color: passwordStrength.color, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
          Password Strength: {passwordStrength.label}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              bgcolor: index <= passwordStrength.score ? passwordStrength.color : '#e0e0e0',
              transition: 'background-color 0.3s'
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.length ? <Check sx={{ fontSize: 14, color: colors.success }} /> : <Cancel sx={{ fontSize: 14, color: colors.error }} />}
          <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>8+ chars</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.uppercase ? <Check sx={{ fontSize: 14, color: colors.success }} /> : <Cancel sx={{ fontSize: 14, color: colors.error }} />}
          <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Uppercase</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.lowercase ? <Check sx={{ fontSize: 14, color: colors.success }} /> : <Cancel sx={{ fontSize: 14, color: colors.error }} />}
          <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Lowercase</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.number ? <Check sx={{ fontSize: 14, color: colors.success }} /> : <Cancel sx={{ fontSize: 14, color: colors.error }} />}
          <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Number</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.special ? <Check sx={{ fontSize: 14, color: colors.success }} /> : <Cancel sx={{ fontSize: 14, color: colors.error }} />}
          <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Special</Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
      borderRadius: 0,
      position: 'relative',
    }}>
      <style>{animationStyles}</style>

      {/* ============================================================
          HEADER - Same as Equipment page
          ============================================================ */}
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
            User Management
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage system users and their roles
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* ✅ REFRESH BUTTON - BORDER STYLE */}
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchUsers} 
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
          
          {/* ✅ FILTER BUTTON */}
          <Button 
            variant="contained"
            startIcon={<FilterList />} 
            onClick={handleFilterClick}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
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
          
          {/* ✅ EXPORT BUTTON */}
          <Button 
            variant="contained"
            startIcon={<Download />} 
            onClick={handleExportClick}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
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
          
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Add User
            </Button>
          )}
        </Box>
      </Box>

      {/* ============================================================
          STATS CARDS - Same design as Equipment page
          ============================================================ */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={2.4} key={index}>
            <Grow in timeout={300 + index * 100}>
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
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold})`,
                  borderRadius: '3px 3px 0 0',
                }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: colors.lightText,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontSize: '0.6rem',
                        }}
                      >
                        {card.title}
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700,
                          color: colors.darkNavy,
                          fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
                          mt: 0.5,
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        background: card.bg,
                        borderRadius: '14px',
                        p: 1.2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 42,
                        height: 42,
                        color: card.color,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {React.cloneElement(card.icon, { 
                        sx: { 
                          fontSize: 22,
                          color: card.color,
                        } 
                      })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* ============================================================
          SEARCH - Only search bar
          ============================================================ */}
      <Paper sx={{ 
        p: 2, 
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
            placeholder="Search users..."
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
                  fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  fontSize: '0.9rem',
                }
              }
            }}
          />
        </Box>
      </Paper>

      {/* ============================================================
          FILTER MENU - Same as Equipment page
          ============================================================ */}
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
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
          Filter Users
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Role</InputLabel>
          <Select 
            name="role" 
            value={filters.role} 
            onChange={handleFilterChange} 
            label="Role"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>All</MenuItem>
            {roleFilterOptions.map(role => (
              <MenuItem key={role.id} value={role.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Hospital</InputLabel>
          <Select 
            name="hospital" 
            value={filters.hospital} 
            onChange={handleFilterChange} 
            label="Hospital"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>All</MenuItem>
            {hospitals.map(h => (
              <MenuItem key={h.id} value={h.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{h.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Status</InputLabel>
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
              }
            }}
          >
            <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>All</MenuItem>
            <MenuItem value="active" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Active</MenuItem>
            <MenuItem value="inactive" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Inactive</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth 
          size="small" 
          label="Search" 
          name="search"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, username, email..." 
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': { borderColor: colors.lightCyan },
              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
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
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
              },
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { 
                borderColor: colors.lightCyan,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            }}
          >
            Clear
          </Button>
        </Box>
      </Menu>

      {/* ============================================================
          EXPORT MENU - Same as Equipment page
          ============================================================ */}
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
        <MenuItem 
          onClick={exportToCSV} 
          sx={{ 
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} /> 
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>CSV</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Comma separated values</Typography>
          </Box>
        </MenuItem>
        <MenuItem 
          onClick={exportToExcel} 
          sx={{ 
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Excel</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>.xlsx format</Typography>
          </Box>
        </MenuItem>
        <MenuItem 
          onClick={exportToPDF} 
          sx={{ 
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>PDF</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Print ready document</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* ============================================================
          TABLE
          ============================================================ */}
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
          <TableHead sx={{ 
            bgcolor: colors.darkNavy,
          }}>
            <TableRow>
              {visibleColumns.includes('user') && (
                <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>
                  User
                </TableCell>
              )}
              {visibleColumns.includes('email') && (
                <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>
                  Email
                </TableCell>
              )}
              {visibleColumns.includes('role') && (
                <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>
                  Role
                </TableCell>
              )}
              {visibleColumns.includes('hospital') && (
                <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>
                  Hospital
                </TableCell>
              )}
              {visibleColumns.includes('phone') && (
                <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>
                  Phone
                </TableCell>
              )}
              {visibleColumns.includes('status') && (
                <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>
                  Status
                </TableCell>
              )}
              {visibleColumns.includes('actions') && (
                <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }} align="center">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <People sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      No users found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((userData) => (
                <TableRow 
                  key={userData.id} 
                  hover
                  sx={{
                    transition: 'all 0.2s ease',
                    animation: `fadeInUp 0.4s ease-out ${filteredUsers.indexOf(userData) * 0.05}s both`,
                    '&:hover': {
                      backgroundColor: 'rgba(103, 232, 249, 0.04)',
                    },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  {visibleColumns.includes('user') && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ 
                          width: { xs: 28, sm: 32 }, 
                          height: { xs: 28, sm: 32 }, 
                          bgcolor: colors.darkNavy,
                          fontSize: { xs: '0.7rem', sm: '0.875rem' },
                          border: `2px solid ${colors.lightCyan}`,
                          boxShadow: `0 0 20px ${colors.lightCyanGlow}`,
                        }}>
                          {userData.full_name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy, fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                            {userData.full_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.lightText, fontSize: { xs: '0.6rem', sm: '0.75rem' }, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                            @{userData.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  )}
                  {visibleColumns.includes('email') && (
                    <TableCell sx={{ color: colors.darkNavy, fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {userData.email}
                    </TableCell>
                  )}
                  {visibleColumns.includes('role') && (
                    <TableCell>
                      <Chip 
                        label={getRoleDisplay(userData.role_name)} 
                        size="small"
                        sx={{
                          bgcolor: userData.role_name === 'SUPER_ADMIN' ? colors.accentGold : colors.darkNavy,
                          color: colors.text,
                          fontWeight: 600,
                          height: 26,
                          fontSize: '11px',
                          borderRadius: 2,
                          boxShadow: userData.role_name === 'SUPER_ADMIN' 
                            ? `0 4px 16px ${colors.accentGold}44` 
                            : `0 4px 16px ${colors.lightCyanGlow}`,
                        }}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.includes('hospital') && (
                    <TableCell sx={{ color: colors.lightText, fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {userData.hospital_name || 'N/A'}
                    </TableCell>
                  )}
                  {visibleColumns.includes('phone') && (
                    <TableCell sx={{ color: colors.lightText, fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {userData.phone || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.includes('status') && (
                    <TableCell>
                      <Chip 
                        label={userData.is_active ? 'Active' : 'Inactive'} 
                        size="small"
                        sx={{
                          bgcolor: userData.is_active ? colors.success : colors.lightText,
                          color: colors.text,
                          fontWeight: 600,
                          height: 26,
                          fontSize: '11px',
                          borderRadius: 2,
                          boxShadow: userData.is_active 
                            ? `0 4px 16px ${colors.success}44` 
                            : 'none',
                        }}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.includes('actions') && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewUser(userData)}
                            sx={{ 
                              color: colors.darkNavy, 
                              '&:hover': { 
                                color: colors.lightCyanDark,
                                backgroundColor: 'rgba(103, 232, 249, 0.08)'
                              },
                              padding: { xs: 0.5, sm: 1 },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                          </IconButton>
                        </Tooltip>
                        
                        {(user?.role === 'SUPER_ADMIN' || 
                          (user?.role === 'HOSPITAL_ADMIN' && userData.role_name === 'ENGINEER')) && (
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(userData)}
                              sx={{ 
                                color: colors.darkNavy, 
                                '&:hover': { 
                                  color: colors.lightCyanDark,
                                  backgroundColor: 'rgba(103, 232, 249, 0.08)'
                                },
                                padding: { xs: 0.5, sm: 1 },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <Edit fontSize={isMobile ? 'small' : 'medium'} />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {(user?.role === 'SUPER_ADMIN' || 
                          (user?.role === 'HOSPITAL_ADMIN' && userData.role_name === 'ENGINEER')) && userData.id !== user?.id && (
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(userData.id)}
                              sx={{
                                padding: { xs: 0.5, sm: 1 },
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)'
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <Delete fontSize={isMobile ? 'small' : 'medium'} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ============================================================
          VIEW DIALOG
          ============================================================ */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseView} 
        maxWidth="sm" 
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
          color: colors.text,
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              <Person sx={{ fontSize: 28 }} />
              User Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {viewingUser && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: colors.darkNavy, 
                  mx: 'auto', 
                  fontSize: 32,
                  border: `3px solid ${colors.lightCyan}`,
                  boxShadow: `0 4px 24px ${colors.lightCyanGlowStrong}`,
                }}>
                  {viewingUser.full_name?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", mt: 1 }}>
                  {viewingUser.full_name}
                </Typography>
                <Chip 
                  label={getRoleDisplay(viewingUser.role_name)} 
                  size="small"
                  sx={{
                    bgcolor: viewingUser.role_name === 'SUPER_ADMIN' ? colors.accentGold : colors.darkNavy,
                    color: colors.text,
                    fontWeight: 600,
                    height: 26,
                    fontSize: '11px',
                    borderRadius: 2,
                    mt: 0.5,
                    boxShadow: viewingUser.role_name === 'SUPER_ADMIN' 
                      ? `0 4px 16px ${colors.accentGold}44` 
                      : `0 4px 16px ${colors.lightCyanGlow}`,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Username
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  @{viewingUser.username}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingUser.email}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Role
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {getRoleDisplay(viewingUser.role_name)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Hospital
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingUser.hospital_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Phone
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingUser.phone || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Status
                </Typography>
                <Chip 
                  label={viewingUser.is_active ? 'Active' : 'Inactive'} 
                  size="small"
                  sx={{
                    bgcolor: viewingUser.is_active ? colors.success : colors.lightText,
                    color: colors.text,
                    fontWeight: 600,
                    height: 26,
                    fontSize: '11px',
                    borderRadius: 2,
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseView} 
            variant="contained"
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          ADD/EDIT DIALOG
          ============================================================ */}
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
          color: colors.text,
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              {editingUser ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
              {editingUser ? 'Edit User' : 'Add New User'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name *"
                name="full_name"
                value={formData.full_name}
                onChange={handleFormChange}
                onBlur={handleBlur('full_name')}
                required
                error={!!errors.full_name}
                helperText={errors.full_name || 'Enter the user\'s full name'}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: colors.lightText }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username *"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                onBlur={handleBlur('username')}
                required
                error={!!errors.username}
                helperText={errors.username || 'Min 3 chars, letters, numbers, underscore only'}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: colors.lightText }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                onBlur={handleBlur('email')}
                required
                error={!!errors.email}
                helperText={errors.email || 'Enter a valid email address'}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: colors.lightText }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={editingUser ? "Password (optional)" : "Password *"}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handlePasswordChange}
                onBlur={handleBlur('password')}
                required={!editingUser}
                error={!!errors.password}
                helperText={errors.password || (editingUser ? 'Leave blank to keep current password' : 'Min 6 characters')}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: colors.lightText }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => setShowPassword(!showPassword)} 
                        edge="end"
                        sx={{ color: colors.lightText, '&:hover': { color: colors.lightCyan } }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
              {formData.password && <PasswordStrengthIndicator />}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.role_id}>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Role *</InputLabel>
                <Select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleFormChange}
                  onBlur={handleBlur('role_id')}
                  label="Role *"
                  disabled={user?.role === 'HOSPITAL_ADMIN'}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiSelect-select': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Select Role</MenuItem>
                  {availableRoles.map(role => (
                    <MenuItem key={role.id} value={role.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {role.display}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role_id && <FormHelperText error sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{errors.role_id}</FormHelperText>}
                {user?.role === 'HOSPITAL_ADMIN' && (
                  <FormHelperText sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>You can only create Engineer accounts</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Hospital</InputLabel>
                <Select
                  name="hospital_id"
                  value={formData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital"
                  disabled={user?.role === 'HOSPITAL_ADMIN'}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiSelect-select': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>No Hospital</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{h.name}</MenuItem>
                  ))}
                </Select>
                {user?.role === 'HOSPITAL_ADMIN' && (
                  <FormHelperText sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Users will be assigned to your hospital</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                onBlur={handleBlur('phone')}
                error={!!errors.phone}
                helperText={errors.phone || 'Optional - Enter a valid phone number'}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: colors.lightText }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: colors.darkNavy, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Active</Typography>
                <Switch
                  checked={formData.is_active}
                  onChange={handleToggleActive}
                  sx={{ 
                    ml: 2,
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colors.lightCyan,
                      '&:hover': { backgroundColor: `${colors.lightCyan}22` }
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.lightCyan
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              color: colors.darkNavy,
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Users