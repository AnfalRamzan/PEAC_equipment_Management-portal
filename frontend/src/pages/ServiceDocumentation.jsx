// src/pages/ServiceDocumentationWithPO.jsx
// ✅ SERVICE DOCUMENTATION WITH PURCHASE ORDERS TAB
// ✅ DARK NAVY + LIGHT CYAN THEME
// ✅ ALL USERS CAN VIEW AND UPLOAD
// ✅ ONLY SUPER ADMIN CAN EDIT AND DELETE
// ✅ REMOVED: Status from Purchase Orders
// ✅ ADDED: Manual input for Equipment (not dropdown)
// ✅ ADDED: Currency support (PKR / USD)

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
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  CircularProgress,
  Fade,
  Grow,
  Badge,
  Stack,
  Menu,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Upload,
  Search,
  Download,
  Visibility,
  Delete,
  Edit,
  Description,
  PictureAsPdf,
  VideoFile,
  InsertDriveFile,
  Close,
  Folder,
  Image,
  FilePresent,
  Refresh,
  CheckCircle,
  ErrorOutline,
  MedicalServices,
  Build,
  CalendarToday,
  Person,
  Engineering as EngineeringIcon,
  AdminPanelSettings,
  AttachFile,
  TrendingUp,
  Verified,
  MenuBook,
  Lightbulb,
  FilterList,
  FileDownload,
  ShoppingCart,
  Add,
  Cancel,
  Print,
  Business,
  Receipt,
  LocalShipping,
  Check,
  Info,
  Warning as WarningIcon,
  ChevronRight,
  MonetizationOn,
  CurrencyExchange,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { purchaseOrderService, hospitalService, equipmentService } from '../api/services'
import FileUpload from '../components/FileUpload'

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
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
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
// ✅ GET FILE COLOR
// ============================================================
const getFileColor = (type) => {
  switch(type) {
    case 'PDF': return colors.error
    case 'Video': return colors.info
    case 'Image': return colors.success
    default: return colors.lightText
  }
}

const getFileIcon = (type) => {
  switch(type) {
    case 'PDF': return <PictureAsPdf sx={{ color: colors.error }} />
    case 'Video': return <VideoFile sx={{ color: colors.info }} />
    case 'Image': return <Image sx={{ color: colors.success }} />
    default: return <InsertDriveFile sx={{ color: colors.lightText }} />
  }
}

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const ServiceDocumentationWithPO = () => {
  const { user } = useSelector((state) => state.auth)
  
  console.log('🔐 ServiceDocumentationWithPO - User:', user)
  console.log('🔐 Token exists:', !!localStorage.getItem('token'))
  
  if (!user) {
    console.warn('⚠️ No user found, redirecting to login')
    window.location.href = '/login'
    return null
  }
  
  // ✅ ALL USERS CAN ACCESS - No restriction
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  // ✅ PERMISSIONS:
  // All users can View and Upload
  // Only Super Admin can Edit and Delete
  const canView = true
  const canUpload = true
  const canEdit = isSuperAdmin
  const canDelete = isSuperAdmin
  const canCreatePO = true
  const canEditPO = isSuperAdmin
  const canDeletePO = isSuperAdmin

  // ============================================================
  // ✅ TAB STATE
  // ============================================================
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  // ============================================================
  // ✅ DOCUMENTS STATE
  // ============================================================
  const [documents, setDocuments] = useState([])
  const [equipmentList, setEquipmentList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [editingDocument, setEditingDocument] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [error, setError] = useState(null)
  const [docFilterAnchorEl, setDocFilterAnchorEl] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    document_type: 'PDF',
    category: 'Service Manual',
    equipment: '',
    equipment_id: '',
    description: '',
    file: null,
    fileUrl: ''
  })

  const categories = [
    'All',
    'Service Manual',
    'Calibration',
    'Repair Guide',
    'User Manual',
    'Warranty',
    'Other'
  ]

  // ============================================================
  // ✅ PURCHASE ORDERS STATE
  // ============================================================
  const [orders, setOrders] = useState([])
  const [loadingPO, setLoadingPO] = useState(false)
  const [openPODialog, setOpenPODialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [openPOViewDialog, setOpenPOViewDialog] = useState(false)
  const [poFilterAnchorEl, setPoFilterAnchorEl] = useState(null)
  const [poExportAnchorEl, setPoExportAnchorEl] = useState(null)
  const [searchTermPO, setSearchTermPO] = useState('')
  
  // ✅ Currency state
  const [currency, setCurrency] = useState('PKR')
  
  const [poFilters, setPoFilters] = useState({
    equipment: '',
    hospital: ''
  })
  
  const [itemsList, setItemsList] = useState([
    { id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  const [itemIdCounter, setItemIdCounter] = useState(2)

  const [poFormData, setPoFormData] = useState({
    hospital: '',
    equipment: '',
    vendor_name: '',
    vendor_contact: '',
    vendor_email: '',
    vendor_address: '',
    vendor_phone: '',
    po_number: '',
    order_date: '',
    delivery_date: '',
    total_amount: '',
    notes: '',
    documents: '',
    currency: 'PKR'
  })

  // ============================================================
  // ✅ FETCH FUNCTIONS - DOCUMENTS
  // ============================================================
  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('📄 Fetching service documentation...')
      const response = await api.get('/service-documentation')
      console.log('✅ Documents fetched:', response.data)
      
      const equipmentResponse = await api.get('/equipment')
      const equipmentMap = {}
      ;(equipmentResponse.data.equipment || []).forEach(eq => {
        equipmentMap[eq.id] = eq.status || 'Warranty'
      })
      
      const docsWithStatus = (response.data.documents || []).map(doc => ({
        ...doc,
        equipment_status: doc.equipment_id ? equipmentMap[doc.equipment_id] : 'Warranty'
      }))
      
      setDocuments(docsWithStatus)
    } catch (error) {
      console.error('❌ Error fetching documents:', error)
      
      if (error.response?.status === 401) {
        console.warn('⚠️ Unauthorized, redirecting to login')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return
      }
      
      setError(error.response?.data?.message || 'Failed to fetch documents')
      toast.error(error.response?.data?.message || 'Failed to fetch documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipmentList = async () => {
    try {
      const response = await equipmentService.getAll()
      setEquipmentList(response.data.equipment || [])
      console.log('✅ Equipment list loaded:', response.data.equipment?.length || 0, 'items')
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  // ============================================================
  // ✅ FETCH FUNCTIONS - PURCHASE ORDERS
  // ============================================================
  const fetchOrders = async () => {
    setLoadingPO(true)
    try {
      const response = await purchaseOrderService.getAll()
      setOrders(response.data.orders || [])
    } catch (error) {
      toast.error('Failed to fetch purchase orders')
    } finally {
      setLoadingPO(false)
    }
  }

  // ============================================================
  // ✅ USE EFFECT
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('⚠️ No token found, redirecting to login')
      window.location.href = '/login'
      return
    }
    fetchDocuments()
    fetchEquipmentList()
    fetchOrders()
  }, [])

  // ============================================================
  // ✅ DOCUMENT HANDLERS
  // ============================================================
  const handleDocFilterClick = (event) => setDocFilterAnchorEl(event.currentTarget)
  const handleDocFilterClose = () => setDocFilterAnchorEl(null)

  const handleDocFilterChange = (e) => {
    setCategoryFilter(e.target.value)
  }

  const clearDocFilters = () => {
    setCategoryFilter('all')
    setSearchTerm('')
    setDocFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handleDocFormChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      console.log('📎 File selected:', file.name, file.size, file.type)
      setFormData({
        ...formData,
        file: file,
        file_name: file.name,
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }

  const handleDocUpload = async () => {
    console.log('📤 Uploading document with data:', formData)
    
    if (!formData.title || formData.title.trim() === '') {
      toast.error('Please enter a document title')
      return
    }

    if (!formData.equipment || formData.equipment.trim() === '') {
      toast.error('Please enter equipment name')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      let fileUrl = ''
      let fileName = ''
      let fileSize = ''

      if (formData.file) {
        const fileFormData = new FormData()
        fileFormData.append('file', formData.file)
        
        console.log('📤 Uploading file:', formData.file.name)
        
        const uploadResponse = await api.post('/service-documentation/upload', fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          },
          timeout: 120000
        })
        
        console.log('✅ File upload response:', uploadResponse.data)
        
        if (uploadResponse.data.success) {
          fileUrl = uploadResponse.data.file.url
          fileName = uploadResponse.data.file.name
          fileSize = `${(uploadResponse.data.file.size / 1024 / 1024).toFixed(2)} MB`
        } else {
          throw new Error(uploadResponse.data.message || 'File upload failed')
        }
      } else if (formData.fileUrl) {
        fileUrl = formData.fileUrl
        fileName = formData.file_name || 'document'
        fileSize = formData.file_size || '0 KB'
      }

      const payload = {
        title: formData.title.trim(),
        document_type: formData.document_type || 'PDF',
        category: formData.category || 'Other',
        equipment: formData.equipment.trim(),
        description: formData.description || '',
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        version: '1.0',
        hospital_id: user?.hospital_id || null,
        uploaded_by: user?.id || null,
        uploaded_by_name: user?.full_name || ''
      }

      console.log('📤 Creating document record:', payload)

      let response
      if (editingDocument) {
        if (!isSuperAdmin) {
          toast.error('Only Super Admin can edit documents')
          return
        }
        response = await api.put(`/service-documentation/${selectedDoc.id}`, payload)
        toast.success('Document updated successfully')
      } else {
        response = await api.post('/service-documentation', payload)
        toast.success('Document uploaded successfully')
      }
      
      console.log('✅ Document saved:', response.data)
      
      setOpenDialog(false)
      setEditingDocument(false)
      setFormData({
        title: '',
        document_type: 'PDF',
        category: 'Service Manual',
        equipment: '',
        equipment_id: '',
        description: '',
        file: null,
        fileUrl: ''
      })
      setUploadProgress(0)
      fetchDocuments()
    } catch (error) {
      console.error('❌ Upload error:', error)
      toast.error(error.response?.data?.message || error.message || 'Operation failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDocView = (doc) => {
    setSelectedDoc(doc)
    setOpenViewDialog(true)
  }

  const handleDocEdit = (doc) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can edit documents')
      return
    }
    setSelectedDoc(doc)
    setEditingDocument(true)
    setFormData({
      title: doc.title || '',
      document_type: doc.document_type || 'PDF',
      category: doc.category || 'Other',
      equipment: doc.equipment || '',
      equipment_id: doc.equipment_id || '',
      description: doc.description || '',
      file: null,
      fileUrl: doc.file_url || ''
    })
    setOpenDialog(true)
  }

  const handleDocDownload = async (doc) => {
    try {
      if (doc.file_url) {
        const fullUrl = doc.file_url.startsWith('http') ? doc.file_url : `http://localhost:5000${doc.file_url}`
        window.open(fullUrl, '_blank')
        toast.success('Download started')
      } else {
        const response = await api.get(`/service-documentation/${doc.id}/download`, {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', doc.file_name || 'document')
        document.body.appendChild(link)
        link.click()
        link.remove()
        toast.success('Download started')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    }
  }

  const handleDocDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete documents')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/service-documentation/${id}`)
        toast.success('Document deleted successfully')
        fetchDocuments()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error.response?.data?.message || 'Delete failed')
      }
    }
  }

  const getDocStats = () => {
    const total = documents.length
    const pdfCount = documents.filter(d => d.document_type === 'PDF').length
    const videoCount = documents.filter(d => d.document_type === 'Video').length
    const imageCount = documents.filter(d => d.document_type === 'Image').length
    return { total, pdfCount, videoCount, imageCount }
  }

  const docStats = getDocStats()

  // ============================================================
  // ✅ PURCHASE ORDER HANDLERS
  // ============================================================
  const handlePOFilterClick = (event) => setPoFilterAnchorEl(event.currentTarget)
  const handlePOFilterClose = () => setPoFilterAnchorEl(null)

  const handlePOFilterChange = (e) => {
    setPoFilters({ ...poFilters, [e.target.name]: e.target.value })
  }

  const clearPOFilters = () => {
    setPoFilters({ equipment: '', hospital: '' })
    setSearchTermPO('')
    setPoFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handlePOExportClick = (event) => setPoExportAnchorEl(event.currentTarget)
  const handlePOExportClose = () => setPoExportAnchorEl(null)

  const exportPOToCSV = () => {
    try {
      const headers = ['PO Number', 'Equipment', 'Hospital', 'Vendor', 'Currency', 'Order Date', 'Delivery Date', 'Total Amount']
      const rows = filteredOrders.map(o => [
        o.po_number || '',
        o.equipment || '',
        o.hospital || '',
        o.vendor_name || '',
        o.currency || 'PKR',
        o.order_date ? new Date(o.order_date).toLocaleDateString() : '',
        o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '',
        `${o.currency || 'PKR'} ${o.total_amount || ''}`
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
      handlePOExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportPOToExcel = () => {
    try {
      const data = filteredOrders.map(o => ({
        'PO Number': o.po_number || '',
        'Equipment': o.equipment || '',
        'Hospital': o.hospital || '',
        'Vendor': o.vendor_name || '',
        'Currency': o.currency || 'PKR',
        'Order Date': o.order_date ? new Date(o.order_date).toLocaleDateString() : '',
        'Delivery Date': o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '',
        'Total Amount': `${o.currency || 'PKR'} ${o.total_amount || ''}`
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders')
      XLSX.writeFile(wb, `purchase_orders_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel exported!')
      handlePOExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportPOToPDF = () => {
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
        o.equipment || '',
        o.hospital || '',
        o.vendor_name || '',
        o.currency || 'PKR',
        o.order_date ? new Date(o.order_date).toLocaleDateString() : '',
        `${o.currency || 'PKR'} ${o.total_amount || ''}`
      ])
      autoTable(doc, {
        head: [['PO Number', 'Equipment', 'Hospital', 'Vendor', 'Currency', 'Order Date', 'Total Amount']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`purchase_orders_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handlePOExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const handlePOOpenDialog = (order = null) => {
    if (order && !canEditPO) {
      toast.error('Only Super Admin can edit purchase orders')
      return
    }
    
    if (order) {
      setEditingOrder(order)
      setPoFormData({
        hospital: order.hospital || '',
        equipment: order.equipment || '',
        vendor_name: order.vendor_name || '',
        vendor_contact: order.vendor_contact || '',
        vendor_email: order.vendor_email || '',
        vendor_address: order.vendor_address || '',
        vendor_phone: order.vendor_phone || '',
        po_number: order.po_number || '',
        order_date: order.order_date || '',
        delivery_date: order.delivery_date || '',
        total_amount: order.total_amount || '',
        notes: order.notes || '',
        documents: order.documents || '',
        currency: order.currency || 'PKR'
      })
      setCurrency(order.currency || 'PKR')
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
      setPoFormData({
        hospital: '',
        equipment: '',
        vendor_name: '',
        vendor_contact: '',
        vendor_email: '',
        vendor_address: '',
        vendor_phone: '',
        po_number: `PO-${Date.now().toString().slice(-8)}`,
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        total_amount: '',
        notes: '',
        documents: '',
        currency: 'PKR'
      })
      setCurrency('PKR')
      setItemsList([{ id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }])
      setItemIdCounter(2)
    }
    setOpenPODialog(true)
  }

  const handlePOCloseDialog = () => {
    setOpenPODialog(false)
    setEditingOrder(null)
  }

  const handlePOView = (order) => {
    setViewingOrder(order)
    setOpenPOViewDialog(true)
  }

  const handlePOCloseView = () => {
    setOpenPOViewDialog(false)
    setViewingOrder(null)
  }

  const handlePOFormChange = (e) => {
    const { name, value } = e.target
    setPoFormData({
      ...poFormData,
      [name]: value
    })
  }

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value
    setCurrency(newCurrency)
    setPoFormData({
      ...poFormData,
      currency: newCurrency
    })
  }

  const handlePOItemChange = (index, field, value) => {
    const updatedItems = [...itemsList]
    updatedItems[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = (parseFloat(updatedItems[index].quantity) || 0) * (parseFloat(updatedItems[index].unit_price) || 0)
    }
    setItemsList(updatedItems)
  }

  const addPOItem = () => {
    setItemsList([...itemsList, { id: itemIdCounter, description: '', quantity: 1, unit_price: 0, total: 0 }])
    setItemIdCounter(itemIdCounter + 1)
  }

  const removePOItem = (index) => {
    if (itemsList.length > 1) {
      const updatedItems = itemsList.filter((_, i) => i !== index)
      setItemsList(updatedItems)
    } else {
      toast.warning('At least one item is required')
    }
  }

  const calculatePOTotal = () => {
    return itemsList.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
  }

  const handlePOSubmit = async () => {
    try {
      if (!poFormData.hospital || poFormData.hospital.trim() === '') {
        toast.error('Please enter hospital name')
        return
      }
      if (!poFormData.equipment || poFormData.equipment.trim() === '') {
        toast.error('Please enter equipment name')
        return
      }
      if (!poFormData.vendor_name || poFormData.vendor_name.trim() === '') {
        toast.error('Vendor name is required')
        return
      }
      if (!poFormData.po_number || poFormData.po_number.trim() === '') {
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
        hospital: poFormData.hospital.trim(),
        equipment: poFormData.equipment.trim(),
        vendor_name: poFormData.vendor_name.trim(),
        vendor_contact: poFormData.vendor_contact || '',
        vendor_email: poFormData.vendor_email || '',
        vendor_address: poFormData.vendor_address || '',
        vendor_phone: poFormData.vendor_phone || '',
        po_number: poFormData.po_number.trim(),
        order_date: poFormData.order_date || null,
        delivery_date: poFormData.delivery_date || null,
        total_amount: calculatePOTotal(),
        notes: poFormData.notes || '',
        items: items,
        documents: poFormData.documents || '',
        currency: poFormData.currency || 'PKR'
      }

      if (editingOrder) {
        if (!isSuperAdmin) {
          toast.error('Only Super Admin can edit purchase orders')
          return
        }
        await purchaseOrderService.update(editingOrder.id, submitData)
        toast.success('Purchase order updated successfully')
      } else {
        await purchaseOrderService.create(submitData)
        toast.success('Purchase order created successfully')
      }

      fetchOrders()
      handlePOCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handlePODelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete purchase orders')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
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

  const handlePOPrint = (order) => {
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
      const currencySymbol = order.currency === 'PKR' ? 'Rs.' : '$'

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
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #0F172A; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: 600; font-size: 16px; }
          .total-row td { border-top: 2px solid #0F172A; padding-top: 12px; }
          .total-amount { font-size: 18px; color: #0F172A; }
          .notes { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          .documents { margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
          .currency-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #0F172A; color: white; margin-left: 10px; }
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
          <span class="currency-badge">${order.currency || 'PKR'}</span>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="label">Hospital:</span><span class="value">${order.hospital || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Equipment:</span><span class="value">${order.equipment || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Vendor:</span><span class="value">${order.vendor_name || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Order Date:</span><span class="value">${orderDate}</span></div>
          <div class="info-item"><span class="label">Delivery Date:</span><span class="value">${deliveryDate}</span></div>
          ${order.vendor_contact ? `<div class="info-item"><span class="label">Contact Person:</span><span class="value">${order.vendor_contact}</span></div>` : ''}
          ${order.vendor_email ? `<div class="info-item"><span class="label">Email:</span><span class="value">${order.vendor_email}</span></div>` : ''}
          ${order.vendor_phone ? `<div class="info-item"><span class="label">Phone:</span><span class="value">${order.vendor_phone}</span></div>` : ''}
          ${order.vendor_address ? `<div class="info-item" style="grid-column: span 2;"><span class="label">Address:</span><span class="value">${order.vendor_address}</span></div>` : ''}
        </div>
        <h3 style="margin: 20px 0 10px 0; color: #0F172A;">Order Items</h3>
        <table>
          <thead><tr><th>#</th><th>Description</th><th style="text-align: center;">Quantity</th><th style="text-align: right;">Unit Price</th><th style="text-align: right;">Total</th></tr></thead>
          <tbody>
            ${order.items && order.items.length > 0 ? order.items.map((item, index) => `
            <tr><td>${index + 1}</td><td>${item.description || 'N/A'}</td><td style="text-align: center;">${item.quantity || 0}</td><td style="text-align: right;">${currencySymbol}${safeToFixed(item.unit_price)}</td><td style="text-align: right;">${currencySymbol}${safeToFixed(item.total)}</td></tr>
            `).join('') : `<tr><td colspan="5" style="text-align: center; color: #999;">No items</td></tr>`}
            <tr class="total-row"><td colspan="4" style="text-align: right;">Total Amount:</td><td style="text-align: right;"><span class="total-amount">${currencySymbol}${safeToFixed(order.total_amount)}</span></td></tr>
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

  // ============================================================
  // ✅ FILTERED DATA
  // ============================================================
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.equipment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.po_number?.toLowerCase().includes(searchTermPO.toLowerCase()) ||
                          order.vendor_name?.toLowerCase().includes(searchTermPO.toLowerCase()) ||
                          order.equipment?.toLowerCase().includes(searchTermPO.toLowerCase()) ||
                          order.hospital?.toLowerCase().includes(searchTermPO.toLowerCase())
    const matchesEquipment = !poFilters.equipment || order.equipment?.toLowerCase().includes(poFilters.equipment.toLowerCase())
    const matchesHospital = !poFilters.hospital || order.hospital?.toLowerCase().includes(poFilters.hospital.toLowerCase())
    return matchesSearch && matchesEquipment && matchesHospital
  })

  // ============================================================
  // ✅ STATS
  // ============================================================
  const totalOrders = orders.length

  const poStatsCards = [
    { title: 'Total Orders', value: totalOrders, icon: <ShoppingCart />, color: colors.lightCyan, bg: 'rgba(103, 232, 249, 0.08)' },
  ]

  const docStatsCards = [
    { title: 'Total Documents', value: docStats.total, icon: <MenuBook />, color: colors.lightCyan, bg: 'rgba(103, 232, 249, 0.08)' },
    { title: 'PDF Files', value: docStats.pdfCount, icon: <PictureAsPdf />, color: colors.lightCyan, bg: 'rgba(103, 232, 249, 0.08)' },
    { title: 'Videos', value: docStats.videoCount, icon: <VideoFile />, color: colors.lightCyan, bg: 'rgba(103, 232, 249, 0.08)' },
    { title: 'Images', value: docStats.imageCount, icon: <Image />, color: colors.lightCyan, bg: 'rgba(103, 232, 249, 0.08)' },
  ]

  // ============================================================
  // ✅ PO ORDER CARD COMPONENT
  // ============================================================
  const POOrderCard = ({ order, onView, onEdit, onDelete, onPrint, canEdit, canDelete }) => {
    const [isHovered, setIsHovered] = useState(false)
    const currencySymbol = order.currency === 'PKR' ? 'Rs.' : '$'
    
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
            boxShadow: isHovered ? `0 12px 40px ${colors.shadowColor}` : `0 2px 8px ${colors.shadowColor}`,
            bgcolor: colors.cardBg,
            '&:hover': {
              borderColor: colors.lightCyan,
            }
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold})`,
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
                    border: `2px solid ${colors.cardBg}`,
                  }
                }}
              >
                <Avatar sx={{ 
                  bgcolor: `${colors.lightCyan}15`,
                  width: 56,
                  height: 56,
                  border: `2px solid ${colors.lightCyan}30`,
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'scale(1.05) rotate(-5deg)' : 'scale(1)',
                }}>
                  <ShoppingCart sx={{ color: colors.lightCyanDark }} />
                </Avatar>
              </Badge>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 0.5, fontSize: '1rem' }} noWrap>
                  {order.po_number}
                </Typography>
                <Chip
                  label={order.currency || 'PKR'}
                  size="small"
                  sx={{
                    bgcolor: colors.darkNavy,
                    color: colors.text,
                    fontWeight: 600,
                    height: 20,
                    fontSize: '9px',
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                <MedicalServices sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Equipment: <strong style={{ color: colors.darkNavy }}>{order.equipment || 'N/A'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Hospital: <span style={{ color: colors.darkNavy }}>{order.hospital || 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Vendor: <strong style={{ color: colors.darkNavy }}>{order.vendor_name}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                <Receipt sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Amount: <strong style={{ color: colors.lightCyanDark }}>{currencySymbol}{safeToFixed(order.total_amount)}</strong>
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
            
            {canEdit && (
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
            
            {canDelete && (
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
          </CardActions>
        </Card>
      </Grow>
    )
  }

  // ============================================================
  // ✅ RENDER DOCUMENTS TAB
  // ============================================================
  const renderDocumentsTab = () => (
    <>
      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {docStatsCards.map((card, index) => (
          <Grid item xs={6} sm={3} key={index}>
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

      {/* Search and Filters */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search documents..."
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
          
          <Button 
            variant="outlined"
            startIcon={<FilterList />} 
            onClick={handleDocFilterClick}
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
              }
            }}
          >
            Filter
          </Button>
          
          {canUpload && (
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => {
                setEditingDocument(false)
                setFormData({
                  title: '',
                  document_type: 'PDF',
                  category: 'Service Manual',
                  equipment: '',
                  equipment_id: '',
                  description: '',
                  file: null,
                  fileUrl: ''
                })
                setOpenDialog(true)
              }}
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                },
              }}
            >
              Upload Document
            </Button>
          )}
        </Box>
      </Paper>

      {/* Document Cards Grid */}
      <Grid container spacing={3}>
        {filteredDocs.map((doc) => {
          const isImage = doc.document_type === 'Image' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
              <Grow in timeout={300}>
                <Card
                  sx={{
                    borderRadius: 3,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `1px solid ${colors.borderColor}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
                      borderColor: colors.lightCyan,
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Top Gradient Bar */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${colors.darkNavy}, ${colors.lightCyan})`,
                  }} />
                  
                  <CardContent sx={{ p: 3, position: 'relative', flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Badge
                        badgeContent={doc.document_type}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: getFileColor(doc.document_type),
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '8px',
                            height: 18,
                            minWidth: 18,
                            border: `2px solid white`,
                            textTransform: 'uppercase'
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          bgcolor: `${getFileColor(doc.document_type)}15`,
                          width: 56,
                          height: 56,
                          border: `2px solid ${getFileColor(doc.document_type)}33`,
                          boxShadow: `0 4px 20px ${getFileColor(doc.document_type)}33`,
                        }}>
                          {getFileIcon(doc.document_type)}
                        </Avatar>
                      </Badge>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 0.5, fontSize: '0.95rem' }}>
                          {doc.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={doc.category}
                            size="small"
                            sx={{
                              bgcolor: colors.darkNavy + '10',
                              color: colors.darkNavy,
                              fontWeight: 500,
                              fontSize: '10px',
                              height: 20,
                              borderRadius: 2,
                              border: `1px solid ${colors.darkNavy}20`
                            }}
                          />
                          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: colors.borderColor }} />
                          <Typography variant="caption" sx={{ color: colors.lightText }}>
                            {doc.file_size || '0 KB'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <MedicalServices sx={{ fontSize: 16, color: colors.lightText }} />
                        <Typography variant="body2" sx={{ color: colors.lightText, fontSize: '0.8rem' }}>
                          {doc.equipment || 'No Equipment'}
                        </Typography>
                        {doc.equipment_status && (
                          <Chip
                            label={doc.equipment_status}
                            size="small"
                            sx={{
                              bgcolor: '#3B82F6',
                              color: 'white',
                              fontWeight: 500,
                              height: 18,
                              fontSize: '8px',
                              borderRadius: 1,
                              '& .MuiChip-label': { px: 0.5 }
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ fontSize: 16, color: colors.lightText }} />
                        <Typography variant="body2" sx={{ color: colors.lightText, fontSize: '0.8rem' }}>
                          {doc.uploaded_by_name || doc.uploaded_by || 'System'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: colors.lightText }} />
                        <Typography variant="body2" sx={{ color: colors.lightText, fontSize: '0.8rem' }}>
                          {formatDate(doc.created_at || doc.uploaded_at)}
                        </Typography>
                      </Box>
                    </Box>

                    {doc.description && (
                      <Typography variant="body2" sx={{ 
                        mt: 1.5, 
                        color: colors.lightText,
                        fontSize: '0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {doc.description}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
                    <Tooltip title="View Details">
                      <Button 
                        size="small" 
                        startIcon={<Visibility sx={{ fontSize: 18 }} />}
                        onClick={() => handleDocView(doc)}
                        sx={{ 
                          color: colors.darkNavy,
                          '&:hover': { 
                            color: colors.lightCyanDark, 
                            bgcolor: 'rgba(103, 232, 249, 0.08)' 
                          },
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      >
                        View
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Download">
                      <Button 
                        size="small" 
                        startIcon={<Download sx={{ fontSize: 18 }} />}
                        onClick={() => handleDocDownload(doc)}
                        sx={{ 
                          color: colors.darkNavy,
                          '&:hover': { 
                            color: colors.lightCyanDark, 
                            bgcolor: 'rgba(103, 232, 249, 0.08)' 
                          },
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      >
                        Download
                      </Button>
                    </Tooltip>
                    
                    {canEdit && (
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDocEdit(doc)}
                          sx={{ 
                            color: colors.darkNavy,
                            '&:hover': { 
                              color: colors.lightCyanDark, 
                              bgcolor: 'rgba(103, 232, 249, 0.08)' 
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDocDelete(doc.id)}
                          sx={{ '&:hover': { bgcolor: `${colors.error}10` } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grow>
            </Grid>
          )
        })}
      </Grid>

      {filteredDocs.length === 0 && !loading && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          bgcolor: colors.cardBg,
        }}>
          <MenuBook sx={{ fontSize: 64, color: colors.lightText, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ color: colors.lightText, mt: 2 }}>
            No documents found
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mb: 2 }}>
            Try adjusting your search or filters
          </Typography>
        </Paper>
      )}

      {/* Document Filter Menu */}
      <Menu
        anchorEl={docFilterAnchorEl}
        open={Boolean(docFilterAnchorEl)}
        onClose={handleDocFilterClose}
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
          Filter Documents
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Category</InputLabel>
          <Select 
            name="category" 
            value={categoryFilter} 
            onChange={handleDocFilterChange} 
            label="Category"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.filter(c => c !== 'All').map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleDocFilterClose} 
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
            onClick={clearDocFilters} 
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
    </>
  )

  // ============================================================
  // ✅ RENDER PURCHASE ORDERS TAB
  // ============================================================
  const renderPurchaseOrdersTab = () => (
    <>
      {/* PO Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {poStatsCards.map((card, index) => (
          <Grid item xs={6} sm={3} key={index}>
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

      {/* PO Search and Filters */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search purchase orders..."
            value={searchTermPO}
            onChange={(e) => setSearchTermPO(e.target.value)}
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
          
          <Button 
            variant="outlined"
            startIcon={<FilterList />} 
            onClick={handlePOFilterClick}
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
              }
            }}
          >
            Filter
          </Button>
          
          <Button 
            variant="outlined"
            startIcon={<Download />} 
            onClick={handlePOExportClick}
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
              }
            }}
          >
            Export
          </Button>
          
          {canCreatePO && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handlePOOpenDialog()}
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                },
              }}
            >
              Create Purchase Order
            </Button>
          )}
        </Box>
      </Paper>

      {/* PO Cards Grid */}
      <Grid container spacing={3}>
        {filteredOrders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <POOrderCard
              order={order}
              onView={handlePOView}
              onEdit={handlePOOpenDialog}
              onDelete={handlePODelete}
              onPrint={handlePOPrint}
              canEdit={canEditPO}
              canDelete={canDeletePO}
            />
          </Grid>
        ))}
      </Grid>

      {filteredOrders.length === 0 && !loadingPO && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          bgcolor: colors.cardBg,
        }}>
          <ShoppingCart sx={{ fontSize: 64, color: colors.lightText, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ color: colors.lightText, mt: 2 }}>
            No purchase orders found
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mb: 2 }}>
            Try adjusting your search or filters
          </Typography>
          {canCreatePO && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handlePOOpenDialog()}
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
              }}
            >
              Create First Purchase Order
            </Button>
          )}
        </Paper>
      )}

      {/* PO Filter Menu */}
      <Menu
        anchorEl={poFilterAnchorEl}
        open={Boolean(poFilterAnchorEl)}
        onClose={handlePOFilterClose}
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
        
        <TextField
          fullWidth
          size="small"
          label="Equipment Name"
          name="equipment"
          value={poFilters.equipment}
          onChange={handlePOFilterChange}
          placeholder="Search by equipment name..."
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': { borderColor: colors.lightCyan },
              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
            }
          }}
        />

        <TextField
          fullWidth
          size="small"
          label="Hospital Name"
          name="hospital"
          value={poFilters.hospital}
          onChange={handlePOFilterChange}
          placeholder="Search by hospital name..."
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
            onClick={handlePOFilterClose} 
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
            onClick={clearPOFilters} 
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

      {/* PO Export Menu */}
      <Menu
        anchorEl={poExportAnchorEl}
        open={Boolean(poExportAnchorEl)}
        onClose={handlePOExportClose}
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
          onClick={exportPOToCSV} 
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
          onClick={exportPOToExcel} 
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
          onClick={exportPOToPDF} 
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
    </>
  )

  // ============================================================
  // ✅ RENDER
  // ============================================================
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: colors.darkNavy }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ErrorOutline sx={{ fontSize: 64, color: colors.error }} />
        <Typography variant="h6" sx={{ color: colors.error, mt: 2 }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={fetchDocuments} 
          sx={{ 
            mt: 2,
            bgcolor: colors.darkNavy,
            '&:hover': { 
              bgcolor: colors.darkNavyHover,
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
            },
            textTransform: 'none',
            borderRadius: 2,
          }}
        >
          Try Again
        </Button>
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

      {/* Header */}
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
            Service Documentation
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage service manuals, calibration guides, and purchase orders
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={() => {
              fetchDocuments()
              fetchOrders()
            }} 
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
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        overflow: 'hidden',
        mb: 3,
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            borderBottom: `1px solid ${colors.borderColor}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              color: colors.lightText,
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                color: colors.darkNavy,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colors.lightCyan,
              height: 3,
            }
          }}
        >
          <Tab 
            icon={<MenuBook sx={{ fontSize: 20 }} />} 
            iconPosition="start"
            label="Documents" 
          />
          <Tab 
            icon={<ShoppingCart sx={{ fontSize: 20 }} />} 
            iconPosition="start"
            label="Purchase Orders" 
          />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderDocumentsTab()}
          {tabValue === 1 && renderPurchaseOrdersTab()}
        </Box>
      </Paper>

      {/* ============================================================
          DOCUMENT UPLOAD/EDIT DIALOG
          ============================================================ */}
      {canUpload && (
        <Dialog 
          open={openDialog} 
          onClose={() => {
            setOpenDialog(false)
            setEditingDocument(false)
          }} 
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
            color: 'white',
            borderRadius: '8px 8px 0 0',
            py: 2.5,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {editingDocument ? <Edit sx={{ fontSize: 28 }} /> : <Upload sx={{ fontSize: 28 }} />}
                {editingDocument ? 'Edit Document' : 'Upload Document'}
              </Typography>
              <IconButton onClick={() => {
                setOpenDialog(false)
                setEditingDocument(false)
              }} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 4, py: 3 }}>
            <Box>
              <TextField
                fullWidth
                label="Document Title *"
                name="title"
                value={formData.title}
                onChange={handleDocFormChange}
                required
                sx={{ mb: 2 }}
                placeholder="Enter document title"
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    },
                  }
                }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: colors.lightText }}>Document Type</InputLabel>
                <Select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleDocFormChange}
                  label="Document Type"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                  }}
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="Word">Word Document</MenuItem>
                  <MenuItem value="Excel">Excel Spreadsheet</MenuItem>
                  <MenuItem value="Video">Video</MenuItem>
                  <MenuItem value="Image">Image</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: colors.lightText }}>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleDocFormChange}
                  label="Category"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                  }}
                >
                  <MenuItem value="Service Manual">Service Manual</MenuItem>
                  <MenuItem value="Calibration">Calibration</MenuItem>
                  <MenuItem value="Repair Guide">Repair Guide</MenuItem>
                  <MenuItem value="User Manual">User Manual</MenuItem>
                  <MenuItem value="Warranty">Warranty</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              {/* ✅ EQUIPMENT - Manual Input (No Dropdown) */}
              <TextField
                fullWidth
                label="Equipment Name *"
                name="equipment"
                value={formData.equipment}
                onChange={handleDocFormChange}
                required
                placeholder="Enter equipment name"
                sx={{ 
                  mb: 2,
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

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleDocFormChange}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                placeholder="Brief description of the document"
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                  }
                }}
              />
              
              {!editingDocument && (
                <>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<FilePresent />}
                    fullWidth
                    sx={{ 
                      py: 3, 
                      borderStyle: 'dashed',
                      borderColor: colors.borderColor,
                      color: colors.lightText,
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: colors.lightCyan,
                        borderStyle: 'dashed',
                        color: colors.lightCyanDark
                      },
                    }}
                  >
                    {formData.file ? formData.file.name : 'Choose File (Max: 50MB)'}
                    <input 
                      type="file" 
                      hidden 
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.webp"
                    />
                  </Button>
                  <Typography variant="caption" sx={{ color: colors.lightText, mt: 1, display: 'block' }}>
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, MP4, JPG, PNG (Max: 50MB)
                  </Typography>
                  {formData.file && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.2)` }}>
                      Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </Alert>
                  )}
                </>
              )}

              {editingDocument && formData.fileUrl && (
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.success}33` }}>
                  Current file: {formData.file_name || 'document'}
                  <Button 
                    size="small" 
                    href={formData.fileUrl} 
                    target="_blank"
                    sx={{ 
                      ml: 2,
                      color: colors.darkNavy,
                      '&:hover': { color: colors.lightCyanDark },
                    }}
                  >
                    View
                  </Button>
                </Alert>
              )}

              {uploading && uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      Uploading...
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: colors.borderColor,
                      '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan }
                    }} 
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={() => {
                setOpenDialog(false)
                setEditingDocument(false)
              }}
              variant="outlined"
              sx={{ 
                color: colors.darkNavy, 
                borderColor: colors.borderColor,
                '&:hover': { 
                  borderColor: colors.lightCyan,
                  backgroundColor: 'rgba(103, 232, 249, 0.04)'
                },
                textTransform: 'none',
                borderRadius: 2,
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDocUpload}
              disabled={uploading}
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
              }}
              startIcon={editingDocument ? <Edit /> : <Upload />}
            >
              {uploading ? 'Uploading...' : (editingDocument ? 'Update' : 'Upload')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ============================================================
          DOCUMENT VIEW DIALOG
          ============================================================ */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
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
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MenuBook sx={{ fontSize: 28 }} />
              Document Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {selectedDoc && (
            <Box>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h5" fontWeight={600} sx={{ color: colors.darkNavy }}>
                      {selectedDoc.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedDoc.document_type}
                        size="small"
                        sx={{
                          bgcolor: getFileColor(selectedDoc.document_type),
                          color: 'white',
                          fontWeight: 600,
                          height: 26,
                          borderRadius: 2,
                        }}
                      />
                      <Chip
                        label={selectedDoc.category}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: colors.borderColor, color: colors.lightText, borderRadius: 2 }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Equipment
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                    {selectedDoc.equipment || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Uploaded By
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                    {selectedDoc.uploaded_by_name || selectedDoc.uploaded_by || 'System'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Uploaded Date
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                    {formatDate(selectedDoc.created_at || selectedDoc.uploaded_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    File Size
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                    {selectedDoc.file_size || '-'}
                  </Typography>
                </Grid>

                {selectedDoc.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, color: colors.darkNavy }}>
                      {selectedDoc.description}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => handleDocDownload(selectedDoc)}
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
                      }}
                    >
                      Download Document
                    </Button>
                    {selectedDoc.file_url && (
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => window.open(selectedDoc.file_url, '_blank')}
                        sx={{ 
                          px: 4,
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
                        Open in Browser
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)}
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
            }}
          >
            Close
          </Button>
          {isSuperAdmin && selectedDoc && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDocDelete(selectedDoc.id)
                setOpenViewDialog(false)
              }}
              startIcon={<Delete />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ============================================================
          PURCHASE ORDER CREATE/EDIT DIALOG (Remains same)
          ============================================================ */}
      <Dialog 
        open={openPODialog} 
        onClose={handlePOCloseDialog} 
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
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {editingOrder ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
              {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </Typography>
            <IconButton onClick={handlePOCloseDialog} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Hospital - Manual Input */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Name *"
                name="hospital"
                value={poFormData.hospital}
                onChange={handlePOFormChange}
                required
                placeholder="Enter hospital name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>

            {/* Equipment - Manual Input */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Equipment Name *"
                name="equipment"
                value={poFormData.equipment}
                onChange={handlePOFormChange}
                required
                placeholder="Enter equipment name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PO Number *"
                name="po_number"
                value={poFormData.po_number}
                onChange={handlePOFormChange}
                required
                disabled={editingOrder}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>

            {/* Currency Selector */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Currency *</InputLabel>
                <Select
                  name="currency"
                  value={poFormData.currency || 'PKR'}
                  onChange={handleCurrencyChange}
                  label="Currency *"
                  required
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                  }}
                >
                  <MenuItem value="PKR">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonetizationOn sx={{ fontSize: 20 }} />
                      PKR - Pakistani Rupee (Rs.)
                    </Box>
                  </MenuItem>
                  <MenuItem value="USD">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CurrencyExchange sx={{ fontSize: 20 }} />
                      USD - US Dollar ($)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText }}>
                  <Business sx={{ fontSize: 16, mr: 1 }} />
                  Vendor Details
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Name *"
                name="vendor_name"
                value={poFormData.vendor_name}
                onChange={handlePOFormChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Contact Person"
                name="vendor_contact"
                value={poFormData.vendor_contact}
                onChange={handlePOFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Email"
                name="vendor_email"
                type="email"
                value={poFormData.vendor_email}
                onChange={handlePOFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Phone"
                name="vendor_phone"
                value={poFormData.vendor_phone}
                onChange={handlePOFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vendor Address"
                name="vendor_address"
                value={poFormData.vendor_address}
                onChange={handlePOFormChange}
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText }}>
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
                value={poFormData.order_date}
                onChange={handlePOFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Date"
                name="delivery_date"
                type="date"
                value={poFormData.delivery_date}
                onChange={handlePOFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText }}>
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
                        onChange={(e) => handlePOItemChange(index, 'description', e.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        size="small"
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handlePOItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        fullWidth
                        InputProps={{ inputProps: { min: 1, step: 1 } }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={2.5}>
                      <TextField
                        size="small"
                        label="Unit Price"
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handlePOItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        fullWidth
                        InputProps={{ 
                          inputProps: { min: 0, step: 0.01 },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography sx={{ fontWeight: 500, color: colors.lightText }}>
                                {currency === 'PKR' ? 'Rs.' : '$'}
                              </Typography>
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={2.5}>
                      <TextField
                        size="small"
                        label="Total"
                        value={item.total.toFixed(2)}
                        fullWidth
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography sx={{ fontWeight: 500, color: colors.lightText }}>
                                {currency === 'PKR' ? 'Rs.' : '$'}
                              </Typography>
                            </InputAdornment>
                          )
                        }}
                        sx={{ 
                          '& .MuiInputBase-root': { bgcolor: colors.mainBg },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => removePOItem(index)}
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
                  onClick={addPOItem}
                  sx={{ 
                    mt: 1,
                    color: colors.darkNavy,
                    borderRadius: 2,
                    '&:hover': { 
                      color: colors.lightCyanDark,
                      backgroundColor: 'rgba(103, 232, 249, 0.08)'
                    },
                    textTransform: 'none',
                  }}
                >
                  Add Item
                </Button>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.darkNavy }}>
                    Total Amount: {currency === 'PKR' ? 'Rs.' : '$'} {calculatePOTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={poFormData.notes}
                onChange={handlePOFormChange}
                multiline
                rows={3}
                placeholder="Additional notes or special instructions..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
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
                  const currentFiles = poFormData.documents ? poFormData.documents.split(',') : []
                  const updatedFiles = [...currentFiles, ...urls]
                  setPoFormData(prev => ({
                    ...prev,
                    documents: updatedFiles.join(',')
                  }))
                  toast.success(`${files.length} document(s) uploaded successfully`)
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  const currentFiles = poFormData.documents?.split(',') || []
                  const updatedFiles = currentFiles.filter(f => f !== file.url)
                  setPoFormData(prev => ({
                    ...prev,
                    documents: updatedFiles.join(',')
                  }))
                  toast.info('Document removed')
                }}
                existingFiles={poFormData.documents ? poFormData.documents.split(',').filter(Boolean).map(url => ({
                  url: url,
                  name: url.split('/').pop(),
                  type: 'document'
                })) : []}
              />
              
              {poFormData.documents && poFormData.documents.split(',').filter(Boolean).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.lightText }}>
                    {poFormData.documents.split(',').filter(Boolean).length} document(s) attached
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handlePOCloseDialog} 
            sx={{ 
              color: colors.darkNavy,
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePOSubmit}
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
            }}
          >
            {editingOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          PURCHASE ORDER VIEW DIALOG (Remains same)
          ============================================================ */}
      <Dialog 
        open={openPOViewDialog} 
        onClose={handlePOCloseView} 
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
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ShoppingCart sx={{ fontSize: 28 }} />
              Purchase Order Details
            </Typography>
            <IconButton onClick={handlePOCloseView} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
          {viewingOrder && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={600} sx={{ color: colors.darkNavy }}>
                    {viewingOrder.po_number}
                  </Typography>
                  <Chip
                    label={viewingOrder.currency || 'PKR'}
                    size="small"
                    sx={{
                      bgcolor: colors.darkNavy,
                      color: colors.text,
                      fontWeight: 600,
                      height: 24,
                      fontSize: '11px',
                      borderRadius: 2,
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                  Hospital
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                  {viewingOrder.hospital || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                  Equipment
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                  {viewingOrder.equipment || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                  Vendor
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                  {viewingOrder.vendor_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                  Order Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                  {viewingOrder.order_date ? new Date(viewingOrder.order_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                  Delivery Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                  {viewingOrder.delivery_date ? new Date(viewingOrder.delivery_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                  Total Amount
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.lightCyanDark }}>
                  {viewingOrder.currency === 'PKR' ? 'Rs.' : '$'} {safeToFixed(viewingOrder.total_amount)}
                </Typography>
              </Grid>

              {viewingOrder.items && viewingOrder.items.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ borderColor: colors.borderColor }} />
                    <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mt: 2, mb: 1, fontWeight: 600 }}>
                      Order Items
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderColor: colors.borderColor, borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="center">Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="right">Unit Price</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {viewingOrder.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right">
                                {viewingOrder.currency === 'PKR' ? 'Rs.' : '$'} {parseFloat(item.unit_price).toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                {viewingOrder.currency === 'PKR' ? 'Rs.' : '$'} {parseFloat(item.total).toFixed(2)}
                              </TableCell>
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
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600, mt: 2 }}>
                    Notes
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                    {viewingOrder.notes}
                  </Typography>
                </Grid>
              )}

              {viewingOrder.documents && viewingOrder.documents.split(',').filter(Boolean).length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600, mt: 2, mb: 1 }}>
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
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handlePOCloseView} 
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
            }}
            onClick={() => handlePOPrint(viewingOrder)}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  )
}

export default ServiceDocumentationWithPO