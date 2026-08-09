// src/pages/EquipmentCategories.jsx - REMOVED ROLE LABEL

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
    Grid,
    Typography,
    LinearProgress,
    Tooltip,
    Switch,
    FormControlLabel,
    Alert
} from '@mui/material'
import {
    Add,
    Search,
    Edit,
    Delete,
    Refresh,
    Close,
    Inventory,
    CheckCircle,
    Cancel,
    Warning,
    Info
} from '@mui/icons-material'
import { equipmentService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'

const EquipmentCategories = () => {
    const { user } = useSelector((state) => state.auth)
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openDialog, setOpenDialog] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState(null)
    const [editingCategory, setEditingCategory] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState(null)
    const [equipmentCount, setEquipmentCount] = useState(0)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    })

    // Only Super Admin can access Equipment Categories
    if (user?.role !== 'SUPER_ADMIN') {
        return <AccessDenied message="Only Super Administrator can manage Equipment Categories." />
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const response = await equipmentService.getCategories()
            setCategories(response.data.categories || [])
        } catch (error) {
            toast.error('Failed to fetch categories')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (category = null) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                name: category.name || '',
                description: category.description || '',
                is_active: category.is_active !== undefined ? category.is_active : true
            })
        } else {
            setEditingCategory(null)
            setFormData({
                name: '',
                description: '',
                is_active: true
            })
        }
        setOpenDialog(true)
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
        setEditingCategory(null)
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    const handleSwitchChange = (e) => {
        setFormData({
            ...formData,
            is_active: e.target.checked
        })
    }

    const handleSubmit = async () => {
        try {
            if (!formData.name || formData.name.trim() === '') {
                toast.error('Category name is required')
                return
            }

            const submitData = {
                name: formData.name.trim(),
                description: formData.description || '',
                is_active: formData.is_active
            }

            if (editingCategory) {
                await equipmentService.updateCategory(editingCategory.id, submitData)
                toast.success('Category updated successfully')
            } else {
                await equipmentService.createCategory(submitData)
                toast.success('Category created successfully')
            }
            fetchCategories()
            handleCloseDialog()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed')
        }
    }

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await equipmentService.updateCategory(id, { is_active: !currentStatus })
            toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
            fetchCategories()
        } catch (error) {
            toast.error('Failed to update category status')
        }
    }

    const handleDeleteClick = async (category) => {
        setDeleteError(null)
        setCategoryToDelete(category)
        
        try {
            const allEquipment = await equipmentService.getAll()
            const count = allEquipment.data?.equipment?.filter(e => e.category_id === category.id).length || 0
            setEquipmentCount(count)
        } catch (error) {
            setEquipmentCount(0)
        }
        
        setOpenDeleteDialog(true)
    }

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return
        
        setDeleting(true)
        setDeleteError(null)
        
        try {
            await equipmentService.deleteCategory(categoryToDelete.id)
            toast.success(`Category "${categoryToDelete.name}" deleted successfully`)
            fetchCategories()
            setOpenDeleteDialog(false)
            setCategoryToDelete(null)
            setEquipmentCount(0)
        } catch (error) {
            console.error('Delete error:', error)
            const errorMessage = error.response?.data?.message || 'Failed to delete category'
            
            if (errorMessage.includes('assigned to equipment') || errorMessage.includes('equipment')) {
                setDeleteError({
                    type: 'has_equipment',
                    message: 'This category has equipment assigned to it.'
                })
                toast.error('Cannot delete: Category has equipment assigned')
            } else {
                toast.error(errorMessage)
            }
        } finally {
            setDeleting(false)
        }
    }

    const filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return <LinearProgress />
    }

    return (
        <Box>
            {/* ✅ Header - REMOVED icon and label */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
                    Equipment Categories
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
                >
                    Add Category
                </Button>
            </Box>

            {/* Search */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ minWidth: 250, flexGrow: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchCategories}
                    >
                        Refresh
                    </Button>
                </Box>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#0B5FA5' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                                        No categories found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((cat) => (
                                <TableRow key={cat.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {cat.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{cat.description || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={cat.is_active ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={cat.is_active ? 'success' : 'default'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(cat.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit Category">
                                            <IconButton 
                                                size="small" 
                                                color="info" 
                                                onClick={() => handleOpenDialog(cat)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={cat.is_active ? 'Deactivate' : 'Activate'}>
                                            <IconButton
                                                size="small"
                                                color={cat.is_active ? 'warning' : 'success'}
                                                onClick={() => handleToggleStatus(cat.id, cat.is_active)}
                                            >
                                                {cat.is_active ? <Cancel /> : <CheckCircle />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Category">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteClick(cat)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                    <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Category Name"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                required
                                placeholder="e.g., Ventilator, Patient Monitor"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                multiline
                                rows={3}
                                placeholder="Brief description of this category"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={handleSwitchChange}
                                        color="primary"
                                    />
                                }
                                label="Active"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
                    >
                        {editingCategory ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={openDeleteDialog} 
                onClose={() => {
                    if (!deleting) {
                        setOpenDeleteDialog(false)
                        setCategoryToDelete(null)
                        setDeleteError(null)
                        setEquipmentCount(0)
                    }
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Warning sx={{ color: '#f44336', fontSize: 28 }} />
                        <Typography variant="h6">Delete Category</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        {deleteError?.type === 'has_equipment' ? (
                            <Alert 
                                severity="error" 
                                icon={<Info />}
                                sx={{ mb: 2 }}
                            >
                                <Typography variant="body2" fontWeight={600}>
                                    Cannot Delete Category
                                </Typography>
                                <Typography variant="body2">
                                    This category has equipment assigned to it. Please reassign or delete the equipment first before deleting this category.
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        💡 To delete this category:
                                    </Typography>
                                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                        <li>Go to Equipment list</li>
                                        <li>Reassign equipment to another category</li>
                                        <li>Then try deleting this category again</li>
                                    </ul>
                                </Box>
                            </Alert>
                        ) : (
                            <>
                                <Typography variant="body1" gutterBottom>
                                    Are you sure you want to delete this category?
                                </Typography>
                                
                                <Paper 
                                    sx={{ 
                                        p: 2, 
                                        bgcolor: '#fff3e0', 
                                        borderRadius: 1,
                                        border: '1px solid #ffcc80'
                                    }}
                                >
                                    <Typography variant="body2" fontWeight={600}>
                                        Category: {categoryToDelete?.name}
                                    </Typography>
                                    {categoryToDelete?.description && (
                                        <Typography variant="body2" color="textSecondary">
                                            Description: {categoryToDelete.description}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" color="textSecondary">
                                        Status: {categoryToDelete?.is_active ? 'Active' : 'Inactive'}
                                    </Typography>
                                    {equipmentCount > 0 && (
                                        <Typography variant="body2" color="error">
                                            ⚠️ {equipmentCount} equipment item(s) using this category
                                        </Typography>
                                    )}
                                </Paper>

                                <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
                                    ⚠️ This action cannot be undone. {equipmentCount > 0 ? 'Equipment will lose category assignment.' : ''}
                                </Typography>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={() => {
                            setOpenDeleteDialog(false)
                            setCategoryToDelete(null)
                            setDeleteError(null)
                            setEquipmentCount(0)
                        }}
                        disabled={deleting}
                    >
                        {deleteError?.type === 'has_equipment' ? 'Close' : 'Cancel'}
                    </Button>
                    {!deleteError?.type && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            startIcon={deleting ? <LinearProgress size={20} color="inherit" /> : <Delete />}
                        >
                            {deleting ? 'Deleting...' : 'Delete Category'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default EquipmentCategories