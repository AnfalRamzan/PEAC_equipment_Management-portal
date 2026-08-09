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
  Input
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
  Warning as WarningIcon
} from '@mui/icons-material'
import { userService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'

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
  
  // ✅ VALIDATION STATE
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

  // ✅ PASSWORD STRENGTH
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

  // ✅ UPDATED: HOSPITAL_ADMIN REMOVED
  const ROLE_NAMES = {
    1: 'SUPER_ADMIN',
    // 2: 'HOSPITAL_ADMIN', // ❌ REMOVED
    3: 'ENGINEER'
  }

  // ✅ UPDATED: HOSPITAL_ADMIN REMOVED
  const ROLE_DISPLAY = {
    'SUPER_ADMIN': 'Super Admin',
    // 'HOSPITAL_ADMIN': 'Hospital Admin', // ❌ REMOVED
    'ENGINEER': 'Engineer'
  }

  // ✅ UPDATED: HOSPITAL_ADMIN REMOVED FROM AVAILABLE ROLES
  const getAvailableRoles = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { id: 1, name: 'SUPER_ADMIN', display: 'Super Admin' },
        // { id: 2, name: 'HOSPITAL_ADMIN', display: 'Hospital Admin' }, // ❌ REMOVED
        { id: 3, name: 'ENGINEER', display: 'Engineer' }
      ]
    }
    // Hospital Admin can no longer exist
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

  // ✅ VALIDATION FUNCTIONS
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
      3: { label: 'Good', color: '#0B5FA5' },
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
      // ✅ Default role is now empty since HOSPITAL_ADMIN is removed
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

  // ✅ CHECK EXISTING USERNAME/EMAIL
  const checkExisting = (field, value) => {
    if (!value) return false
    return users.some(u => 
      u[field]?.toLowerCase() === value.toLowerCase() && 
      (editingUser ? u.id !== editingUser.id : true)
    )
  }

  const handleSubmit = async () => {
    // ✅ Validate all fields
    if (!isFormValid()) {
      toast.error('Please fix all validation errors')
      return
    }

    try {
      // ✅ Check if username already exists
      if (checkExisting('username', formData.username)) {
        toast.error('Username already exists. Please choose a different username')
        return
      }

      // ✅ Check if email already exists
      if (checkExisting('email', formData.email)) {
        toast.error('Email already exists. Please use a different email')
        return
      }

      console.log('📤 Submitting user data:', formData)

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

      console.log('📤 Final submit data:', submitData)

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
      console.error('❌ Submit error:', error)
      console.error('❌ Error response:', error.response?.data)
      
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

  const handleExportCSV = () => {
    try {
      const headers = ['Full Name', 'Username', 'Email', 'Role', 'Hospital', 'Phone', 'Status']
      const rows = filteredUsers.map(u => [
        u.full_name,
        u.username,
        u.email,
        getRoleDisplay(u.role_name),
        u.hospital_name || 'N/A',
        u.phone || 'N/A',
        u.is_active ? 'Active' : 'Inactive'
      ])
      
      let csv = headers.join(',') + '\n'
      rows.forEach(row => {
        csv += row.join(',') + '\n'
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  // ✅ UPDATED: HOSPITAL_ADMIN REMOVED FROM FILTER OPTIONS
  const roleFilterOptions = [
    { id: 'SUPER_ADMIN', name: 'Super Admin' },
    // { id: 'HOSPITAL_ADMIN', name: 'Hospital Admin' }, // ❌ REMOVED
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

  if (loading) {
    return <LinearProgress />
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

  // ✅ Password strength indicator
  const PasswordStrengthIndicator = () => (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 500, color: passwordStrength.color }}>
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
          {passwordStrength.checks.length ? <Check sx={{ fontSize: 14, color: '#28a745' }} /> : <Cancel sx={{ fontSize: 14, color: '#dc3545' }} />}
          <Typography variant="caption">8+ chars</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.uppercase ? <Check sx={{ fontSize: 14, color: '#28a745' }} /> : <Cancel sx={{ fontSize: 14, color: '#dc3545' }} />}
          <Typography variant="caption">Uppercase</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.lowercase ? <Check sx={{ fontSize: 14, color: '#28a745' }} /> : <Cancel sx={{ fontSize: 14, color: '#dc3545' }} />}
          <Typography variant="caption">Lowercase</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.number ? <Check sx={{ fontSize: 14, color: '#28a745' }} /> : <Cancel sx={{ fontSize: 14, color: '#dc3545' }} />}
          <Typography variant="caption">Number</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {passwordStrength.checks.special ? <Check sx={{ fontSize: 14, color: '#28a745' }} /> : <Cancel sx={{ fontSize: 14, color: '#dc3545' }} />}
          <Typography variant="caption">Special</Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            User Management
          </Typography>
          {/* REMOVED Super Admin Chip - No longer showing */}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            size="small"
          >
            Export
          </Button>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: '#0B5FA5',
                '&:hover': { bgcolor: '#084a8a' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
              size={isMobile ? 'small' : 'medium'}
            >
              Add User
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          {!isMobile && (
            <>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="">All</MenuItem>
                  {roleFilterOptions.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Hospital</InputLabel>
                <Select
                  value={filters.hospital}
                  onChange={(e) => setFilters({ ...filters, hospital: e.target.value })}
                  label="Hospital"
                >
                  <MenuItem value="">All</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </Box>
        {isMobile && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                displayEmpty
                size="small"
              >
                <MenuItem value="">Role</MenuItem>
                {roleFilterOptions.map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={filters.hospital}
                onChange={(e) => setFilters({ ...filters, hospital: e.target.value })}
                displayEmpty
                size="small"
              >
                <MenuItem value="">Hospital</MenuItem>
                {hospitals.map(h => (
                  <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                displayEmpty
                size="small"
              >
                <MenuItem value="">Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              {visibleColumns.includes('user') && (
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  User
                </TableCell>
              )}
              {visibleColumns.includes('email') && (
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Email
                </TableCell>
              )}
              {visibleColumns.includes('role') && (
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Role
                </TableCell>
              )}
              {visibleColumns.includes('hospital') && (
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Hospital
                </TableCell>
              )}
              {visibleColumns.includes('phone') && (
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Phone
                </TableCell>
              )}
              {visibleColumns.includes('status') && (
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Status
                </TableCell>
              )}
              {visibleColumns.includes('actions') && (
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }} align="center">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((userData) => (
                <TableRow key={userData.id} hover>
                  {visibleColumns.includes('user') && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ 
                          width: { xs: 28, sm: 32 }, 
                          height: { xs: 28, sm: 32 }, 
                          bgcolor: '#0B5FA5',
                          fontSize: { xs: '0.7rem', sm: '0.875rem' }
                        }}>
                          {userData.full_name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500} fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>
                            {userData.full_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" fontSize={{ xs: '0.6rem', sm: '0.75rem' }}>
                            @{userData.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  )}
                  {visibleColumns.includes('email') && (
                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {userData.email}
                    </TableCell>
                  )}
                  {visibleColumns.includes('role') && (
                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {getRoleDisplay(userData.role_name)}
                    </TableCell>
                  )}
                  {visibleColumns.includes('hospital') && (
                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {userData.hospital_name || 'N/A'}
                    </TableCell>
                  )}
                  {visibleColumns.includes('phone') && (
                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {userData.phone || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.includes('status') && (
                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {userData.is_active ? 'Active' : 'Inactive'}
                    </TableCell>
                  )}
                  {visibleColumns.includes('actions') && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleViewUser(userData)}
                            sx={{ padding: { xs: 0.5, sm: 1 } }}
                          >
                            <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                          </IconButton>
                        </Tooltip>
                        
                        {(user?.role === 'SUPER_ADMIN' || 
                          (user?.role === 'HOSPITAL_ADMIN' && userData.role_name === 'ENGINEER')) && (
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              color="info" 
                              onClick={() => handleOpenDialog(userData)}
                              sx={{ padding: { xs: 0.5, sm: 1 } }}
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
                              sx={{ padding: { xs: 0.5, sm: 1 } }}
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

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              User Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2 }}>
          {viewingUser && (
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#0B5FA5', mx: 'auto', fontSize: 32 }}>
                  {viewingUser.full_name?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="h6" fontWeight={600} sx={{ mt: 1 }}>
                  {viewingUser.full_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getRoleDisplay(viewingUser.role_name)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Username</Typography>
                <Typography variant="body1" fontWeight={500}>@{viewingUser.username}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1">{viewingUser.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Role</Typography>
                <Typography variant="body1">{getRoleDisplay(viewingUser.role_name)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Hospital</Typography>
                <Typography variant="body1">{viewingUser.hospital_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Phone</Typography>
                <Typography variant="body1">{viewingUser.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Typography variant="body1">{viewingUser.is_active ? 'Active' : 'Inactive'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView} variant="contained" sx={{ bgcolor: '#0B5FA5' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ ADD/EDIT DIALOG WITH VALIDATION */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Full Name - REQUIRED */}
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
                  startAdornment: <Person sx={{ mr: 1, color: '#6c757d' }} />
                }}
              />
            </Grid>

            {/* Username - REQUIRED with validation */}
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
                  startAdornment: <Person sx={{ mr: 1, color: '#6c757d' }} />
                }}
              />
            </Grid>

            {/* Email - REQUIRED with validation */}
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
                  startAdornment: <Email sx={{ mr: 1, color: '#6c757d' }} />
                }}
              />
            </Grid>

            {/* Password - With Strength Indicator */}
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
                  startAdornment: <Lock sx={{ mr: 1, color: '#6c757d' }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {formData.password && <PasswordStrengthIndicator />}
            </Grid>

            {/* Role - REQUIRED - HOSPITAL_ADMIN REMOVED */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.role_id}>
                <InputLabel>Role *</InputLabel>
                <Select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleFormChange}
                  onBlur={handleBlur('role_id')}
                  label="Role *"
                  disabled={user?.role === 'HOSPITAL_ADMIN'}
                >
                  <MenuItem value="">Select Role</MenuItem>
                  {availableRoles.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.display}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role_id && <FormHelperText error>{errors.role_id}</FormHelperText>}
                {user?.role === 'HOSPITAL_ADMIN' && (
                  <FormHelperText>You can only create Engineer accounts</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Hospital */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hospital</InputLabel>
                <Select
                  name="hospital_id"
                  value={formData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital"
                  disabled={user?.role === 'HOSPITAL_ADMIN'}
                >
                  <MenuItem value="">No Hospital</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                  ))}
                </Select>
                {user?.role === 'HOSPITAL_ADMIN' && (
                  <FormHelperText>Users will be assigned to your hospital</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Phone - With validation */}
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
                  startAdornment: <Phone sx={{ mr: 1, color: '#6c757d' }} />
                }}
              />
            </Grid>

            {/* Active Status */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Active</Typography>
                <Switch
                  checked={formData.is_active}
                  onChange={handleToggleActive}
                  color="primary"
                  sx={{ ml: 2 }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#084a8a' }
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