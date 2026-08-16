// src/pages/PurchaseOrders.jsx
// ✅ COMPLETE PURCHASE ORDERS MANAGEMENT
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Equipment page
// ✅ All CRUD operations working
// ✅ Enhanced stats cards
// ✅ Order cards with status
// ✅ File upload for documents
// ✅ Print functionality
// ✅ Status workflow management
// ✅ UPDATED: Stats cards design matches Equipment page
// ✅ UPDATED: Header with Filter and Export buttons
// ✅ ADDED: Animations

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
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
  ShoppingCart,
  CheckCircle,
  Cancel,
  Print,
  Refresh,
  AttachFile,
  FileDownload,
  Person,
  Business,
  Receipt,
  LocalShipping,
  Check,
  Description,
  Image,
  PictureAsPdf,
  Warning as WarningIcon,
  Info,
  Verified,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  FilterList,
  MedicalServices,
  ErrorOutline,
  Build,
  Schedule,
} from '@mui/icons-material'
import { purchaseOrderService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'
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

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================
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

const safeToFixed = (value, decimals = 2) => {
  const num = parseFloat(value)
  return isNaN(num) ? '0.00' : num.toFixed(decimals)
}

const safeFormatDate = (date) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

// ============================================================
// ✅ ENHANCED ORDER CARD
// ============================================================
const OrderCard = ({ order, onView, onEdit, onDelete, onApprove, onReject, onPrint, canEdit, canDelete, canApprove }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const getStatusColor = (status) => {
    const statusColors = {
      'Draft': colors.lightText,
      'Pending Approval': colors.warning,
      'Approved': colors.success,
      'Ordered': colors.info,
      'Received': colors.success,
      'Cancelled': colors.error
    }
    return statusColors[status] || colors.lightText
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Draft': return <Description sx={{ fontSize: 20 }} />
      case 'Pending Approval': return <Info sx={{ fontSize: 20 }} />
      case 'Approved': return <CheckCircle sx={{ fontSize: 20 }} />
      case 'Ordered': return <LocalShipping sx={{ fontSize: 20 }} />
      case 'Received': return <Check sx={{ fontSize: 20 }} />
      case 'Cancelled': return <Cancel sx={{ fontSize: 20 }} />
      default: return <ShoppingCart sx={{ fontSize: 20 }} />
    }
  }

  return (
    <Grow in timeout={300}>
      <Card
        sx={{
          borderRadius: 3,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${colors.borderColor}`,
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: isHovered ? `0 12px 40px ${colors.cardShadow}` : `0 2px 8px ${colors.cardShadow}`,
          bgcolor: colors.cardBg,
          '&:hover': {
            borderColor: colors.lightCyan,
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Gradient Bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${getStatusColor(order.status)}, ${colors.lightCyan})`,
        }} />
        
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Badge
              badgeContent={order.items?.length || 0}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: colors.lightCyan,
                  color: colors.darkNavy,
                  fontWeight: 700,
                  fontSize: '10px',
                  height: 20,
                  minWidth: 20,
                  border: `2px solid ${colors.bgWhite}`,
                }
              }}
            >
              <Avatar sx={{ 
                bgcolor: `${getStatusColor(order.status)}15`,
                width: 56,
                height: 56,
                border: `2px solid ${getStatusColor(order.status)}30`,
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05) rotate(-5deg)' : 'scale(1)',
              }}>
                {getStatusIcon(order.status)}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 0.5, fontSize: '1rem' }} noWrap>
                {order.po_number}
              </Typography>
              <Chip
                label={order.status}
                size="small"
                sx={{
                  bgcolor: getStatusColor(order.status),
                  color: colors.text,
                  fontWeight: 600,
                  height: 22,
                  fontSize: '10px',
                  borderRadius: 2,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: colors.lightText }}>
              <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Vendor: <strong style={{ color: colors.darkNavy }}>{order.vendor_name}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: colors.lightText }}>
              <ShoppingCart sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Hospital: <span style={{ color: colors.darkNavy }}>{order.hospital_name}</span>
            </Typography>
            <Typography variant="body2" sx={{ color: colors.darkNavy }}>
              <Receipt sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Amount: <strong style={{ color: colors.lightCyanDark }}>${safeToFixed(order.total_amount)}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>
              <Description sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Items: {order.items?.length || 0}
              {order.order_date && ` • Ordered: ${new Date(order.order_date).toLocaleDateString()}`}
              {order.delivery_date && ` • Delivery: ${new Date(order.delivery_date).toLocaleDateString()}`}
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
              Click to view details
            </Typography>
            <ChevronRight sx={{ fontSize: 16, color: colors.lightText }} />
          </Box>
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              startIcon={<Visibility />} 
              onClick={() => onView(order)}
              sx={{ 
                color: colors.darkNavy,
                '&:hover': { 
                  color: colors.lightCyanDark,
                  backgroundColor: 'rgba(103, 232, 249, 0.08)'
                },
                fontSize: '12px',
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              View
            </Button>
          </Tooltip>
          
          {canEdit && order.status === 'Draft' && (
            <Tooltip title="Edit">
              <IconButton 
                size="small" 
                onClick={() => onEdit(order)}
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
          
          {canDelete && order.status === 'Draft' && (
            <Tooltip title="Delete">
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => onDelete(order.id)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.08)'
                  }
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {canApprove && order.status === 'Pending Approval' && (
            <>
              <Tooltip title="Approve">
                <IconButton 
                  size="small" 
                  onClick={() => onApprove(order.id)}
                  sx={{ 
                    color: colors.success, 
                    '&:hover': { 
                      color: colors.lightCyanDark,
                      backgroundColor: 'rgba(103, 232, 249, 0.08)'
                    } 
                  }}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onReject(order.id)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)'
                    }
                  }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {(order.status === 'Approved' || order.status === 'Ordered' || order.status === 'Received') && (
            <Tooltip title="Print">
              <IconButton 
                size="small" 
                onClick={() => onPrint(order)}
                sx={{ 
                  color: colors.darkNavy, 
                  '&:hover': { 
                    color: colors.lightCyanDark,
                    backgroundColor: 'rgba(103, 232, 249, 0.08)'
                  } 
                }}
              >
                <Print fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      </Card>
    </Grow>
  )
}

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const PurchaseOrders = () => {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Purchase Orders." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const canCreate = isEngineer || isSuperAdmin
  const canEdit = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin
  const canApprove = isSuperAdmin
  const canView = isEngineer || isSuperAdmin

  const [orders, setOrders] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  const [filters, setFilters] = useState({
    status: '',
    hospital_id: ''
  })
  
  const [itemsList, setItemsList] = useState([
    { id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  const [itemIdCounter, setItemIdCounter] = useState(2)

  const [formData, setFormData] = useState({
    hospital_id: '',
    vendor_name: '',
    vendor_contact: '',
    vendor_email: '',
    vendor_address: '',
    po_number: '',
    order_date: '',
    delivery_date: '',
    total_amount: '',
    notes: '',
    status: 'Draft',
    approved_by: '',
    documents: ''
  })

  useEffect(() => {
    fetchOrders()
    fetchHospitals()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await purchaseOrderService.getAll()
      setOrders(response.data.orders || [])
    } catch (error) {
      toast.error('Failed to fetch purchase orders')
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
    setFilters({ status: '', hospital_id: '' })
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
      const headers = ['PO Number', 'Vendor', 'Hospital', 'Status', 'Order Date', 'Delivery Date', 'Total Amount']
      const rows = filteredOrders.map(o => [
        o.po_number || '',
        o.vendor_name || '',
        o.hospital_name || '',
        o.status || '',
        o.order_date ? new Date(o.order_date).toLocaleDateString() : '',
        o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '',
        o.total_amount || ''
      ])
      let csv = headers.join(',') + '\n'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`
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
      const data = filteredOrders.map(o => ({
        'PO Number': o.po_number || '',
        'Vendor': o.vendor_name || '',
        'Hospital': o.hospital_name || '',
        'Status': o.status || '',
        'Order Date': o.order_date ? new Date(o.order_date).toLocaleDateString() : '',
        'Delivery Date': o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '',
        'Total Amount': o.total_amount || ''
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders')
      XLSX.writeFile(wb, `purchase_orders_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Purchase Orders Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Orders: ${filteredOrders.length}`, 14, 34)
      
      const tableData = filteredOrders.map(o => [
        o.po_number || '',
        o.vendor_name || '',
        o.hospital_name || '',
        o.status || '',
        o.order_date ? new Date(o.order_date).toLocaleDateString() : '',
        o.total_amount || ''
      ])
      autoTable(doc, {
        head: [['PO Number', 'Vendor', 'Hospital', 'Status', 'Order Date', 'Total Amount']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`purchase_orders_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const handleOpenDialog = (order = null) => {
    if (order && !canEdit) {
      toast.error('You do not have permission to edit purchase orders')
      return
    }
    
    if (order) {
      setEditingOrder(order)
      setFormData({
        hospital_id: order.hospital_id || '',
        vendor_name: order.vendor_name || '',
        vendor_contact: order.vendor_contact || '',
        vendor_email: order.vendor_email || '',
        vendor_address: order.vendor_address || '',
        po_number: order.po_number || '',
        order_date: order.order_date || '',
        delivery_date: order.delivery_date || '',
        total_amount: order.total_amount || '',
        notes: order.notes || '',
        status: order.status || 'Draft',
        approved_by: order.approved_by || '',
        documents: order.documents || ''
      })
      if (order.items && order.items.length > 0) {
        setItemsList(order.items.map((item, index) => ({
          id: index + 1,
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: item.total || 0
        })))
        setItemIdCounter(order.items.length + 1)
      } else {
        setItemsList([{ id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }])
        setItemIdCounter(2)
      }
    } else {
      setEditingOrder(null)
      setFormData({
        hospital_id: '',
        vendor_name: '',
        vendor_contact: '',
        vendor_email: '',
        vendor_address: '',
        po_number: `PO-${Date.now().toString().slice(-8)}`,
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        total_amount: '',
        notes: '',
        status: 'Draft',
        approved_by: '',
        documents: ''
      })
      setItemsList([{ id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }])
      setItemIdCounter(2)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingOrder(null)
  }

  const handleView = (order) => {
    if (!canView) {
      toast.error('You do not have permission to view purchase orders')
      return
    }
    setViewingOrder(order)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingOrder(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...itemsList]
    updatedItems[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = (parseFloat(updatedItems[index].quantity) || 0) * (parseFloat(updatedItems[index].unit_price) || 0)
    }
    setItemsList(updatedItems)
  }

  const addItem = () => {
    setItemsList([...itemsList, { id: itemIdCounter, description: '', quantity: 1, unit_price: 0, total: 0 }])
    setItemIdCounter(itemIdCounter + 1)
  }

  const removeItem = (index) => {
    if (itemsList.length > 1) {
      const updatedItems = itemsList.filter((_, i) => i !== index)
      setItemsList(updatedItems)
    } else {
      toast.warning('At least one item is required')
    }
  }

  const calculateTotal = () => {
    return itemsList.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.hospital_id) {
        toast.error('Please select a hospital')
        return
      }
      if (!formData.vendor_name || formData.vendor_name.trim() === '') {
        toast.error('Vendor name is required')
        return
      }
      if (!formData.po_number || formData.po_number.trim() === '') {
        toast.error('PO number is required')
        return
      }

      const items = itemsList
        .filter(item => item.description && item.description.trim() !== '')
        .map(item => ({
          description: item.description.trim(),
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          total: parseFloat(item.total) || 0
        }))

      const submitData = {
        hospital_id: parseInt(formData.hospital_id),
        vendor_name: formData.vendor_name.trim(),
        po_number: formData.po_number.trim(),
        order_date: formData.order_date || null,
        delivery_date: formData.delivery_date || null,
        total_amount: calculateTotal(),
        notes: formData.notes || '',
        status: formData.status || 'Draft',
        items: items,
        documents: formData.documents || ''
      }

      if (editingOrder) {
        await purchaseOrderService.update(editingOrder.id, submitData)
        toast.success('Purchase order updated successfully')
      } else {
        await purchaseOrderService.create(submitData)
        toast.success('Purchase order created successfully')
      }

      fetchOrders()
      handleCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete purchase orders')
      return
    }
    
    const order = orders.find(o => o.id === id)
    if (!order) {
      toast.error('Order not found')
      return
    }
    
    if (order.status !== 'Draft') {
      toast.error('Only Draft orders can be deleted')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete purchase order ${order.po_number}?`)) {
      try {
        await purchaseOrderService.delete(id)
        toast.success('Purchase order deleted successfully')
        fetchOrders()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error.response?.data?.message || 'Failed to delete purchase order')
      }
    }
  }

  const handleApprove = async (id) => {
    if (!canApprove) {
      toast.error('Only Super Admin can approve orders')
      return
    }
    
    try {
      const order = orders.find(o => o.id === id)
      if (!order) {
        toast.error('Order not found')
        return
      }

      if (order.status !== 'Pending Approval') {
        toast.error(`Cannot approve order with status '${order.status}'. Only 'Pending Approval' orders can be approved.`)
        return
      }

      await purchaseOrderService.update(id, { status: 'Approved' })
      toast.success('Purchase order approved')
      fetchOrders()
      handleCloseView()
    } catch (error) {
      console.error('Approve error:', error)
      toast.error(error.response?.data?.message || 'Failed to approve order')
    }
  }

  const handleReject = async (id) => {
    if (!canApprove) {
      toast.error('Only Super Admin can reject orders')
      return
    }
    
    try {
      const order = orders.find(o => o.id === id)
      if (!order) {
        toast.error('Order not found')
        return
      }

      if (order.status !== 'Pending Approval') {
        toast.error(`Cannot reject order with status '${order.status}'. Only 'Pending Approval' orders can be rejected.`)
        return
      }

      await purchaseOrderService.update(id, { status: 'Cancelled' })
      toast.success('Purchase order cancelled')
      fetchOrders()
      handleCloseView()
    } catch (error) {
      console.error('Reject error:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel order')
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const order = orders.find(o => o.id === id)
      if (!order) {
        toast.error('Order not found')
        return
      }

      const allowedTransitions = {
        'Draft': ['Pending Approval'],
        'Pending Approval': ['Approved', 'Cancelled'],
        'Approved': ['Ordered'],
        'Ordered': ['Received'],
        'Received': [],
        'Cancelled': []
      }

      if (!allowedTransitions[order.status]?.includes(newStatus)) {
        toast.error(`Cannot change status from '${order.status}' to '${newStatus}'`)
        return
      }

      if ((newStatus === 'Approved' || newStatus === 'Cancelled') && !canApprove) {
        toast.error('Only Super Admin can approve or cancel orders')
        return
      }

      await purchaseOrderService.update(id, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}`)
      fetchOrders()
      handleCloseView()
    } catch (error) {
      console.error('Status update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const handlePrint = (order) => {
    if (!order) {
      toast.error('No order selected to print')
      return
    }

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        toast.error('Please allow popups for printing')
        return
      }

      const orderDate = safeFormatDate(order.order_date)
      const deliveryDate = safeFormatDate(order.delivery_date)

      const getStatusColorPrint = (status) => {
        const colors_map = {
          'Draft': '#6c757d',
          'Pending Approval': '#ff9800',
          'Approved': '#28a745',
          'Ordered': '#2196f3',
          'Received': '#4caf50',
          'Cancelled': '#dc3545'
        }
        return colors_map[status] || '#6c757d'
      }

      const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order ${order.po_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #0F172A; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #0F172A; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .po-number { text-align: right; font-size: 18px; font-weight: bold; color: #0F172A; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; margin-bottom: 20px; }
          .info-item { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-item .label { font-weight: 600; min-width: 120px; color: #666; }
          .info-item .value { color: #333; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${getStatusColorPrint(order.status)}; color: white; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #0F172A; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: 600; font-size: 16px; }
          .total-row td { border-top: 2px solid #0F172A; padding-top: 12px; }
          .total-amount { font-size: 18px; color: #0F172A; }
          .notes { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          .documents { margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAEC Equipment Management Portal</h1>
          <p>Purchase Order</p>
        </div>
        <div class="po-number">
          ${order.po_number || 'N/A'}
          <span class="status-badge" style="margin-left: 15px;">${order.status || 'Draft'}</span>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="label">Hospital:</span><span class="value">${order.hospital_name || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Vendor:</span><span class="value">${order.vendor_name || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Order Date:</span><span class="value">${orderDate}</span></div>
          <div class="info-item"><span class="label">Delivery Date:</span><span class="value">${deliveryDate}</span></div>
          ${order.vendor_contact ? `<div class="info-item"><span class="label">Contact Person:</span><span class="value">${order.vendor_contact}</span></div>` : ''}
          ${order.vendor_email ? `<div class="info-item"><span class="label">Email:</span><span class="value">${order.vendor_email}</span></div>` : ''}
          ${order.vendor_address ? `<div class="info-item" style="grid-column: span 2;"><span class="label">Address:</span><span class="value">${order.vendor_address}</span></div>` : ''}
        </div>
        <h3 style="margin: 20px 0 10px 0; color: #0F172A;">Order Items</h3>
        <table>
          <thead><tr><th>#</th><th>Description</th><th style="text-align: center;">Quantity</th><th style="text-align: right;">Unit Price</th><th style="text-align: right;">Total</th></tr></thead>
          <tbody>
            ${order.items && order.items.length > 0 ? order.items.map((item, index) => `
            <tr><td>${index + 1}</td><td>${item.description || 'N/A'}</td><td style="text-align: center;">${item.quantity || 0}</td><td style="text-align: right;">$${safeToFixed(item.unit_price)}</td><td style="text-align: right;">$${safeToFixed(item.total)}</td></tr>
            `).join('') : `<tr><td colspan="5" style="text-align: center; color: #999;">No items</td></tr>`}
            <tr class="total-row"><td colspan="4" style="text-align: right;">Total Amount:</td><td style="text-align: right;"><span class="total-amount">$${safeToFixed(order.total_amount)}</span></td></tr>
          </tbody>
        </table>
        ${order.notes ? `<div class="notes"><strong>Notes:</strong><p style="margin-top: 5px;">${order.notes}</p></div>` : ''}
        ${order.documents && order.documents.split(',').filter(Boolean).length > 0 ? `
        <div class="documents"><strong>Attached Documents:</strong><ul style="margin-top: 5px; list-style: none; padding: 0;">
          ${order.documents.split(',').filter(Boolean).map(url => `<li style="padding: 2px 0;">📎 ${url.split('/').pop()}</li>`).join('')}
        </ul></div>` : ''}
        <div class="footer">Generated on ${new Date().toLocaleString()}<br>This is a system-generated document from PAEC Equipment Management Portal</div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);<\/script>
      </body>
      </html>
      `

      printWindow.document.write(content)
      printWindow.document.close()
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to print: ' + error.message)
    }
  }

  const getStatusSteps = () => {
    return ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Received']
  }

  const getCurrentStep = (status) => {
    const steps = getStatusSteps()
    const index = steps.indexOf(status)
    return index !== -1 ? index : 0
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || order.status === filters.status
    const matchesHospital = !filters.hospital_id || order.hospital_id === parseInt(filters.hospital_id)
    return matchesSearch && matchesStatus && matchesHospital
  })

  const totalOrders = orders.length
  const draftOrders = orders.filter(o => o.status === 'Draft').length
  const pendingOrders = orders.filter(o => o.status === 'Pending Approval').length
  const completedOrders = orders.filter(o => o.status === 'Approved' || o.status === 'Received' || o.status === 'Ordered').length
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length

  // ✅ Stats Cards Data - Same design as Equipment page
  const statsCards = [
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: <ShoppingCart />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Draft',
      value: draftOrders,
      icon: <Description />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Pending Approval',
      value: pendingOrders,
      icon: <Info />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Completed',
      value: completedOrders,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Cancelled',
      value: cancelledOrders,
      icon: <Cancel />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
  ]

  // ✅ Get status color for chips
  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved':
      case 'Received': return colors.success
      case 'Pending Approval': return colors.warning
      case 'Ordered': return colors.info
      case 'Draft': return colors.lightText
      case 'Cancelled': return colors.error
      default: return colors.lightText
    }
  }

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
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
            Purchase Orders
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage purchase orders and vendor contracts
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* ✅ REFRESH BUTTON - BORDER STYLE */}
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchOrders} 
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
          
          {canCreate && (
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
              Create Purchase Order
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
            placeholder="Search purchase orders..."
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
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2 }}>
          Filter Orders
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
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
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Pending Approval">Pending Approval</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Ordered">Ordered</MenuItem>
            <MenuItem value="Received">Received</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Hospital</InputLabel>
          <Select 
            name="hospital_id" 
            value={filters.hospital_id} 
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
            <MenuItem value="">All Hospitals</MenuItem>
            {hospitals.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth 
          size="small" 
          label="Search" 
          name="search"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by PO, vendor..." 
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
              }
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
            <Typography variant="body2" fontWeight={500}>CSV</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>Comma separated values</Typography>
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
            <Typography variant="body2" fontWeight={500}>Excel</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>.xlsx format</Typography>
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
            <Typography variant="body2" fontWeight={500}>PDF</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>Print ready document</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* ============================================================
          ORDER CARDS GRID
          ============================================================ */}
      <Grid container spacing={3}>
        {filteredOrders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <OrderCard
              order={order}
              onView={handleView}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onPrint={handlePrint}
              canEdit={canEdit}
              canDelete={canDelete}
              canApprove={canApprove}
            />
          </Grid>
        ))}
      </Grid>

      {/* ============================================================
          EMPTY STATE
          ============================================================ */}
      {filteredOrders.length === 0 && !loading && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          bgcolor: colors.cardBg,
        }}>
          <ShoppingCart sx={{ fontSize: 64, color: colors.lightText, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ color: colors.lightText, mt: 2, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
            No purchase orders found
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mb: 2, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
            Try adjusting your search or filters
          </Typography>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                mt: 2,
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Create First Purchase Order
            </Button>
          )}
        </Paper>
      )}

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
            bgcolor: colors.cardBg,
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
              {editingOrder ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
              {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Hospital</InputLabel>
                <Select
                  name="hospital_id"
                  value={formData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital"
                  required
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
                  <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Select Hospital</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{h.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PO Number"
                name="po_number"
                value={formData.po_number}
                onChange={handleFormChange}
                required
                disabled={editingOrder}
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
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  <Business sx={{ fontSize: 16, mr: 1 }} />
                  Vendor Details
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleFormChange}
                required
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
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Contact Person"
                name="vendor_contact"
                value={formData.vendor_contact}
                onChange={handleFormChange}
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
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Email"
                name="vendor_email"
                type="email"
                value={formData.vendor_email}
                onChange={handleFormChange}
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
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Phone"
                name="vendor_phone"
                value={formData.vendor_phone}
                onChange={handleFormChange}
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
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vendor Address"
                name="vendor_address"
                value={formData.vendor_address}
                onChange={handleFormChange}
                multiline
                rows={2}
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
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  <Receipt sx={{ fontSize: 16, mr: 1 }} />
                  Order Details
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order Date"
                name="order_date"
                type="date"
                value={formData.order_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Date"
                name="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
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
                  <MenuItem value="Draft" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Draft</MenuItem>
                  <MenuItem value="Pending Approval" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Pending Approval</MenuItem>
                  <MenuItem value="Approved" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Approved</MenuItem>
                  <MenuItem value="Ordered" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Ordered</MenuItem>
                  <MenuItem value="Received" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Received</MenuItem>
                  <MenuItem value="Cancelled" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Approved By"
                name="approved_by"
                value={formData.approved_by}
                onChange={handleFormChange}
                placeholder="Name of approver"
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
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  <ShoppingCart sx={{ fontSize: 16, mr: 1 }} />
                  Order Items
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderColor: colors.borderColor, borderRadius: 2 }}>
                {itemsList.map((item, index) => (
                  <Grid container spacing={1} key={item.id} sx={{ mb: 1 }}>
                    <Grid item xs={4}>
                      <TextField
                        size="small"
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        fullWidth
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
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        size="small"
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        fullWidth
                        InputProps={{ inputProps: { min: 1, step: 1 } }}
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
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={2.5}>
                      <TextField
                        size="small"
                        label="Unit Price ($)"
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        fullWidth
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
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
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={2.5}>
                      <TextField
                        size="small"
                        label="Total ($)"
                        value={item.total.toFixed(2)}
                        fullWidth
                        disabled
                        sx={{ 
                          '& .MuiInputBase-root': { bgcolor: colors.mainBg },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          },
                          '& .MuiInputBase-input': {
                            fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => removeItem(index)}
                        disabled={itemsList.length <= 1}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.08)'
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button 
                  size="small" 
                  startIcon={<Add />} 
                  onClick={addItem}
                  sx={{ 
                    mt: 1,
                    color: colors.darkNavy,
                    borderRadius: 2,
                    '&:hover': { 
                      color: colors.lightCyanDark,
                      backgroundColor: 'rgba(103, 232, 249, 0.08)'
                    },
                    textTransform: 'none',
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }}
                >
                  Add Item
                </Button>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    Total Amount: ${calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="Additional notes or special instructions..."
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
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} gutterBottom>
                <AttachFile sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                Documents (Quotation, Invoice, etc.)
              </Typography>
              
              <FileUpload
                endpoint="/upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                multiple={true}
                label="Click to upload documents"
                maxFiles={5}
                maxSize={20}
                showPreview={true}
                onUploadComplete={(files) => {
                  const urls = files.map(f => f.url || f.fileUrl).filter(Boolean)
                  const currentFiles = formData.documents ? formData.documents.split(',') : []
                  const updatedFiles = [...currentFiles, ...urls]
                  setFormData(prev => ({
                    ...prev,
                    documents: updatedFiles.join(',')
                  }))
                  toast.success(`${files.length} document(s) uploaded successfully`)
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  const currentFiles = formData.documents?.split(',') || []
                  const updatedFiles = currentFiles.filter(f => f !== file.url)
                  setFormData(prev => ({
                    ...prev,
                    documents: updatedFiles.join(',')
                  }))
                  toast.info('Document removed')
                }}
                existingFiles={formData.documents ? formData.documents.split(',').filter(Boolean).map(url => ({
                  url: url,
                  name: url.split('/').pop(),
                  type: 'document'
                })) : []}
              />
              
              {formData.documents && formData.documents.split(',').filter(Boolean).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {formData.documents.split(',').filter(Boolean).length} document(s) attached
                  </Typography>
                </Box>
              )}
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
            {editingOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          VIEW DIALOG
          ============================================================ */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseView} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            bgcolor: colors.cardBg,
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
              <ShoppingCart sx={{ fontSize: 28 }} />
              Purchase Order Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
          {viewingOrder && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingOrder.po_number}
                  </Typography>
                  <Chip 
                    label={viewingOrder.status} 
                    sx={{
                      bgcolor: getStatusColor(viewingOrder.status),
                      color: colors.text,
                      fontWeight: 600,
                      height: 26,
                      fontSize: '11px',
                      borderRadius: 2,
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mb: 2, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Order Status Timeline
                </Typography>
                <Stepper activeStep={getCurrentStep(viewingOrder.status)} orientation="vertical">
                  {getStatusSteps().map((step, index) => (
                    <Step key={step}>
                      <StepLabel 
                        StepIconComponent={({ active, completed }) => {
                          const stepColors = {
                            'Draft': colors.lightText,
                            'Pending Approval': colors.warning,
                            'Approved': colors.success,
                            'Ordered': colors.info,
                            'Received': colors.success
                          }
                          return (
                            <Avatar sx={{ 
                              bgcolor: active || completed ? stepColors[step] : colors.borderColor,
                              width: 24, 
                              height: 24,
                              fontSize: 14,
                              color: colors.text
                            }}>
                              {index + 1}
                            </Avatar>
                          )
                        }}
                      >
                        <Typography sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                          {step}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                          {step === viewingOrder.status ? 'Current status' : 
                           getCurrentStep(viewingOrder.status) > index ? 'Completed' : 'Pending'}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Hospital
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingOrder.hospital_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Vendor
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingOrder.vendor_name}
                </Typography>
              </Grid>
              {viewingOrder.vendor_contact && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Vendor Contact
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingOrder.vendor_contact}
                  </Typography>
                </Grid>
              )}
              {viewingOrder.vendor_email && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Vendor Email
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingOrder.vendor_email}
                  </Typography>
                </Grid>
              )}
              {viewingOrder.vendor_address && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Vendor Address
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingOrder.vendor_address}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Order Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingOrder.order_date ? new Date(viewingOrder.order_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Delivery Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingOrder.delivery_date ? new Date(viewingOrder.delivery_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Total Amount
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.lightCyanDark, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  ${safeToFixed(viewingOrder.total_amount)}
                </Typography>
              </Grid>

              {viewingOrder.items && viewingOrder.items.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ borderColor: colors.borderColor }} />
                    <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mt: 2, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                      Order Items
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderColor: colors.borderColor, borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="center">Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">Unit Price</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {viewingOrder.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{index + 1}</TableCell>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{item.description}</TableCell>
                              <TableCell align="center" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{item.quantity}</TableCell>
                              <TableCell align="right" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>${parseFloat(item.total).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </>
              )}

              {viewingOrder.notes && (
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, mt: 2 }}>
                    Notes
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingOrder.notes}
                  </Typography>
                </Grid>
              )}

              {viewingOrder.documents && viewingOrder.documents.split(',').filter(Boolean).length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, mt: 2, mb: 1 }}>
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                    Attached Documents ({viewingOrder.documents.split(',').filter(Boolean).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {viewingOrder.documents.split(',').filter(Boolean).map((url, index) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                      const isPDF = url.match(/\.(pdf)$/i)
                      
                      return (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          startIcon={isImage ? <Image /> : isPDF ? <PictureAsPdf /> : <Description />}
                          href={getFullUrl(url)}
                          target="_blank"
                          sx={{ 
                            textTransform: 'none',
                            borderColor: colors.borderColor,
                            color: colors.darkNavy,
                            borderRadius: 2,
                            '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark }
                          }}
                        >
                          {url.split('/').pop().substring(0, 20)}
                        </Button>
                      )
                    })}
                  </Box>
                </Grid>
              )}

              {viewingOrder.status !== 'Cancelled' && viewingOrder.status !== 'Received' && canEdit && (
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mt: 2, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Update Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewingOrder.status === 'Draft' && canCreate && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Pending Approval')}
                        sx={{ 
                          borderColor: colors.warning,
                          color: colors.warning,
                          borderRadius: 2,
                          '&:hover': { 
                            borderColor: colors.lightCyan, 
                            color: colors.lightCyanDark,
                            backgroundColor: 'rgba(103, 232, 249, 0.04)'
                          },
                          textTransform: 'none',
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                        }}
                      >
                        Submit for Approval
                      </Button>
                    )}
                    {viewingOrder.status === 'Pending Approval' && canApprove && (
                      <>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => handleApprove(viewingOrder.id)}
                          startIcon={<CheckCircle />}
                          sx={{ 
                            bgcolor: colors.success,
                            color: colors.text,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                            '&:hover': { bgcolor: '#1B5E20' },
                          }}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="error"
                          onClick={() => handleReject(viewingOrder.id)}
                          startIcon={<Cancel />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {viewingOrder.status === 'Pending Approval' && !canApprove && (
                      <Alert severity="info" sx={{ mt: 1, width: '100%', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.2)` }}>
                        <Typography variant="body2" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                          <strong>Waiting for Super Admin approval.</strong> Only Super Admin can approve or reject orders.
                        </Typography>
                      </Alert>
                    )}
                    {viewingOrder.status === 'Approved' && canEdit && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Ordered')}
                        startIcon={<LocalShipping />}
                        sx={{ 
                          bgcolor: colors.info,
                          color: colors.text,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                          '&:hover': { bgcolor: '#1D4ED8' },
                        }}
                      >
                        Mark as Ordered
                      </Button>
                    )}
                    {viewingOrder.status === 'Ordered' && canEdit && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Received')}
                        startIcon={<Check />}
                        sx={{ 
                          bgcolor: colors.success,
                          color: colors.text,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                          '&:hover': { bgcolor: '#1B5E20' },
                        }}
                      >
                        Mark as Received
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}

              {viewingOrder.status === 'Cancelled' && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.error}33` }}>
                    <Typography variant="body2" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      <strong>This order has been cancelled.</strong> No further actions can be taken.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {viewingOrder.status === 'Received' && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.success}33` }}>
                    <Typography variant="body2" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      <strong>Order completed!</strong> All items have been received.
                    </Typography>
                  </Alert>
                </Grid>
              )}
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
          <Button 
            variant="contained" 
            startIcon={<Print />} 
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
            onClick={() => handlePrint(viewingOrder)}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PurchaseOrders