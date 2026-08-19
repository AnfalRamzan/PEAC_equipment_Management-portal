// src/pages/Training.jsx
// ✅ CHIP REMOVED - Sirf title aur subtitle rakhna hai

import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Badge,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog as PreviewDialog,
  Fade,
  Grow,
  Menu,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Close,
  Refresh,
  PersonAdd,
  PersonRemove,
  CheckCircle,
  Cancel,
  Schedule,
  LocationOn,
  LocalHospital,
  Engineering,
  School,
  Public,
  Home,
  TrendingUp,
  Assessment,
  CalendarToday,
  People,
  EventNote,
  PlayArrow,
  Check,
  Block,
  MoreVert,
  FilterList,
  Download,
  AttachFile,
  Image as ImageIcon,
  VideoLibrary,
  Description,
  OpenInNew,
  ZoomIn,
  FolderOpen,
  MedicalServices,
  ErrorOutline,
  Build,
  Warning,
  FileDownload,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import FileUpload from '../components/FileUpload';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
};

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
`;

// ============================================================
// ✅ HELPER FUNCTIONS FOR FILES
// ============================================================
const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    return `http://localhost:5000${url}`;
  }
  return url;
};

const isImageFile = (url) => {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

const isVideoFile = (url) => {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'].includes(ext);
};

const getFileName = (url) => {
  if (!url) return 'File';
  const parts = url.split('/');
  return parts[parts.length - 1] || 'File';
};

// ============================================================
// ✅ ATTACHMENT GRID COMPONENT
// ============================================================
const AttachmentGrid = ({ attachments }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('');

  if (!attachments || attachments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, bgcolor: colors.mainBg, borderRadius: 2 }}>
        <AttachFile sx={{ fontSize: 48, color: colors.lightText, opacity: 0.3 }} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          No attachments
        </Typography>
      </Box>
    );
  }

  const handlePreview = (url) => {
    const fullUrl = getFullUrl(url);
    const isImg = isImageFile(url);
    const isVideo = isVideoFile(url);
    
    setPreviewUrl(fullUrl);
    setPreviewType(isImg ? 'image' : isVideo ? 'video' : 'document');
    setPreviewOpen(true);
  };

  return (
    <Box>
      <ImageList cols={3} gap={12} sx={{ mb: 0 }}>
        {attachments.map((url, index) => {
          const isImg = isImageFile(url);
          const isVideo = isVideoFile(url);
          const fileName = getFileName(url);
          const fullUrl = getFullUrl(url);

          return (
            <ImageListItem 
              key={index} 
              sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                border: `1px solid ${colors.borderColor}`,
                position: 'relative',
                cursor: 'pointer',
                bgcolor: colors.mainBg,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
                  '& .attachment-overlay': {
                    opacity: 1,
                  }
                }
              }}
              onClick={() => handlePreview(url)}
            >
              {isImg ? (
                <Box
                  component="img"
                  src={fullUrl}
                  alt={fileName}
                  sx={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    bgcolor: colors.mainBg,
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160"%3E%3Crect width="200" height="160" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : isVideo ? (
                <Box sx={{ 
                  height: 160, 
                  bgcolor: colors.darkNavy,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <VideoLibrary sx={{ fontSize: 48, color: colors.lightCyan, opacity: 0.7 }} />
                  <Typography variant="caption" sx={{ color: colors.text, mt: 1, px: 1 }}>
                    {fileName}
                  </Typography>
                  <Box sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                  }}>
                    <OpenInNew sx={{ color: 'white', fontSize: 22 }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 160, 
                  bgcolor: colors.mainBg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                }}>
                  <Description sx={{ fontSize: 48, color: colors.lightText, opacity: 0.6 }} />
                  <Typography variant="caption" sx={{ 
                    color: colors.lightText, 
                    mt: 1, 
                    textAlign: 'center',
                    maxWidth: '90%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {fileName}
                  </Typography>
                </Box>
              )}
              
              {/* Overlay */}
              <Box 
                className="attachment-overlay"
                sx={{ 
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  p: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                }}
              >
                <Typography variant="caption" sx={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap', 
                  flex: 1, 
                  mr: 1 
                }}>
                  {fileName}
                </Typography>
                <Tooltip title="Preview">
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(url);
                    }}
                  >
                    <ZoomIn fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open in new tab">
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(fullUrl, '_blank');
                    }}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ImageListItem>
          );
        })}
      </ImageList>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.92)',
            border: `1px solid ${colors.borderColor}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: 'white',
        }}>
          <Typography variant="h6">File Preview</Typography>
          <Box>
            <Button
              size="small"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', mr: 1 }}
              onClick={() => window.open(previewUrl, '_blank')}
              startIcon={<OpenInNew />}
            >
              Open in New Tab
            </Button>
            <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          p: 2,
        }}>
          {previewType === 'image' ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
              }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : previewType === 'video' ? (
            <video
              src={previewUrl}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 2,
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <Description sx={{ fontSize: 80, color: colors.lightText, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Document Preview Not Available
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textLight, mb: 2 }}>
                This file type cannot be previewed directly.
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.open(previewUrl, '_blank')}
                sx={{
                  bgcolor: colors.darkNavy,
                  '&:hover': { bgcolor: colors.darkNavyHover },
                }}
              >
                Download File
              </Button>
            </Box>
          )}
        </DialogContent>
      </PreviewDialog>
    </Box>
  );
};

// ============================================================
// ✅ MAIN TRAINING COMPONENT
// ============================================================
const Training = () => {
  const { user } = useSelector((state) => state.auth);
  
  // ✅ UPDATED PERMISSIONS - ENGINEER bhi manage kar sakta hai
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isEngineer = user?.role === 'ENGINEER';
  
  // ✅ SUPER_ADMIN aur ENGINEER dono manage kar sakte hain
  const canManage = isSuperAdmin || isEngineer;
  const canCreate = isSuperAdmin || isEngineer;
  const canEdit = isSuperAdmin || isEngineer;
  const canDelete = isSuperAdmin || isEngineer;
  
  // ✅ Sabhi dekh sakte hain
  const canView = true;

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [viewingTraining, setViewingTraining] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, local: 0, foreign: 0, inProgress: 0, completed: 0 });
  const [viewTabValue, setViewTabValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'local',
    status: 'pending',
    start_date: '',
    end_date: '',
    location: '',
    trainer_name: '',
    participants_count: 0,
    department: '',
    attachments: '',
  });

  // ============================================================
  // ✅ FETCH DATA
  // ============================================================
  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/training');
      setTrainings(response.data.trainings || []);
    } catch (error) {
      console.error('Fetch trainings error:', error);
      toast.error('Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/training/stats/summary');
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  useEffect(() => {
    fetchTrainings();
    fetchStats();
  }, []);

  // ============================================================
  // ✅ HELPERS FOR ATTACHMENTS
  // ============================================================
  const getAllAttachments = (training) => {
    if (!training || !training.attachments) return [];
    return training.attachments.split(',').filter(Boolean);
  };

  const handleFileUploadComplete = (fieldName) => (files) => {
    console.log(`📸 ${fieldName} uploaded:`, files);
    const urls = files.map(f => f.url || f.fileUrl).filter(Boolean);
    const currentValue = formData[fieldName] || '';
    const existingUrls = currentValue ? currentValue.split(',').filter(Boolean) : [];
    const updatedUrls = [...existingUrls, ...urls];
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: updatedUrls.join(',')
    }));
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const handleFileDelete = (fieldName) => (file) => {
    const currentValue = formData[fieldName] || '';
    const urls = currentValue.split(',').filter(Boolean);
    const updatedUrls = urls.filter(url => url !== file.url);
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: updatedUrls.join(',')
    }));
    toast.info('File removed');
  };

  const getExistingFiles = (fieldName) => {
    const value = formData[fieldName] || '';
    if (!value) return [];
    return value.split(',').filter(Boolean).map(url => ({
      url: url,
      name: url.split('/').pop(),
      type: url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' :
            url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'document'
    }));
  };

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportClose = () => setExportAnchorEl(null);

  const exportToExcel = () => {
    try {
      const data = filteredTrainings.map(t => ({
        'Title': t.title || '',
        'Type': t.type || '',
        'Status': t.status || '',
        'Trainer': t.trainer_name || '',
        'Department': t.department || '',
        'Participants': t.participants_count || 0,
        'Start Date': t.start_date ? new Date(t.start_date).toLocaleDateString() : '',
        'End Date': t.end_date ? new Date(t.end_date).toLocaleDateString() : '',
        'Location': t.location || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Trainings');
      XLSX.writeFile(wb, `trainings_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel exported!');
      handleExportClose();
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(colors.darkNavy);
      doc.text('Training Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor('#666666');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Trainings: ${filteredTrainings.length}`, 14, 34);
      
      const tableData = filteredTrainings.map(t => [
        t.title || '',
        t.type || '',
        t.status || '',
        t.trainer_name || '',
        t.participants_count || 0,
      ]);
      autoTable(doc, {
        head: [['Title', 'Type', 'Status', 'Trainer', 'Participants']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      });
      doc.save(`trainings_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported!');
      handleExportClose();
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  // ============================================================
  // ✅ HANDLERS - With Permission Checks
  // ============================================================
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewTabChange = (event, newValue) => {
    setViewTabValue(newValue);
  };

  const handleOpenDialog = (training = null) => {
    if (!canManage) {
      toast.error('Only SUPER_ADMIN and ENGINEER can create or edit trainings');
      return;
    }
    
    if (training) {
      setEditingTraining(training);
      setFormData({
        title: training.title || '',
        description: training.description || '',
        type: training.type || 'local',
        status: training.status || 'pending',
        start_date: training.start_date || '',
        end_date: training.end_date || '',
        location: training.location || '',
        trainer_name: training.trainer_name || '',
        participants_count: training.participants_count || 0,
        department: training.department || '',
        attachments: training.attachments || '',
      });
    } else {
      setEditingTraining(null);
      setFormData({
        title: '',
        description: '',
        type: 'local',
        status: 'pending',
        start_date: '',
        end_date: '',
        location: '',
        trainer_name: '',
        participants_count: 0,
        department: '',
        attachments: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTraining(null);
  };

  const handleView = (training) => {
    setViewingTraining(training);
    setViewTabValue(0);
    setOpenViewDialog(true);
  };

  const handleCloseView = () => {
    setOpenViewDialog(false);
    setViewingTraining(null);
    setViewTabValue(0);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '' });
    setSearchTerm('');
    setFilterAnchorEl(null);
    toast.info('Filters cleared');
  };

  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);

  // ============================================================
  // ✅ CRUD OPERATIONS - With Permission Checks
  // ============================================================
  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('Only SUPER_ADMIN and ENGINEER can create or edit trainings');
      return;
    }
    
    try {
      if (!formData.title) {
        toast.error('Training title is required');
        return;
      }

      setSubmitting(true);

      const submitData = {
        title: formData.title.trim(),
        description: formData.description || null,
        type: formData.type || 'local',
        status: formData.status || 'pending',
        start_date: formData.start_date || '',
        end_date: formData.end_date || '',
        location: formData.location || null,
        trainer_name: formData.trainer_name || null,
        participants_count: parseInt(formData.participants_count) || 0,
        department: formData.department || null,
        attachments: formData.attachments || null,
      };

      if (editingTraining) {
        await api.put(`/training/${editingTraining.id}`, submitData);
        toast.success('Training updated successfully');
      } else {
        await api.post('/training', submitData);
        toast.success('Training created successfully');
      }
      
      fetchTrainings();
      fetchStats();
      handleCloseDialog();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only SUPER_ADMIN and ENGINEER can delete trainings');
      return;
    }
    if (window.confirm('Are you sure you want to delete this training?')) {
      try {
        await api.delete(`/training/${id}`);
        toast.success('Training deleted successfully');
        fetchTrainings();
        fetchStats();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete training');
      }
    }
  };

  // ============================================================
  // ✅ HELPERS
  // ============================================================
  const getStatusChip = (status) => {
    const config = {
      pending: { color: colors.warning, label: 'Pending' },
      in_progress: { color: colors.info, label: 'In Progress' },
      completed: { color: colors.success, label: 'Completed' },
      cancelled: { color: colors.error, label: 'Cancelled' },
    };
    const s = config[status] || config.pending;
    return (
      <Chip
        label={s.label}
        size="small"
        sx={{ bgcolor: s.color, color: colors.text, fontWeight: 600, height: 26, borderRadius: 2 }}
      />
    );
  };

  const getTypeChip = (type) => {
    if (type === 'foreign') {
      return (
        <Chip
          label="Foreign"
          size="small"
          sx={{ bgcolor: colors.accentGold, color: colors.text, fontWeight: 600, height: 26, borderRadius: 2 }}
        />
      );
    }
    return (
      <Chip
        label="Local"
        size="small"
        sx={{ bgcolor: colors.darkNavy, color: colors.text, fontWeight: 600, height: 26, borderRadius: 2 }}
      />
    );
  };

  const getFilteredTrainings = () => {
    let filtered = trainings;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.trainer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (tabValue === 1) {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (tabValue === 2) {
      filtered = filtered.filter(t => t.status === 'in_progress');
    } else if (tabValue === 3) {
      filtered = filtered.filter(t => t.status === 'completed');
    }

    return filtered;
  };

  const filteredTrainings = getFilteredTrainings();

  // ✅ Stats Cards Data
  const statsCards = [
    {
      title: 'Total Trainings',
      value: stats.total || 0,
      icon: <School />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Pending',
      value: stats.pending || 0,
      icon: <Schedule />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'In Progress',
      value: stats.inProgress || 0,
      icon: <PlayArrow />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Completed',
      value: stats.completed || 0,
      icon: <Check />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Foreign',
      value: stats.foreign || 0,
      icon: <Public />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
  ];

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />;
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
          HEADER - ✅ CHIP REMOVED
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
            Training Management
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage all training programs and participants
          </Typography>
          {/* ✅ CHIP REMOVED - Sirf title aur subtitle */}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={() => { fetchTrainings(); fetchStats(); }} 
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
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
          
          {/* ✅ Add Training - SUPER_ADMIN aur ENGINEER dono */}
          {canManage && (
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
              Add Training
            </Button>
          )}
        </Box>
      </Box>

      {/* ============================================================
          STATS CARDS
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
          TABS
          ============================================================ */}
      <Paper sx={{
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.7s ease-out',
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              minHeight: 48,
              color: colors.lightText,
            },
            '& .Mui-selected': {
              color: colors.darkNavy,
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.lightCyan,
            }
          }}
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      {/* ============================================================
          SEARCH
          ============================================================ */}
      <Paper sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.75s ease-out',
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search trainings..."
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
                  fontSize: '0.9rem',
                }
              }
            }}
          />
        </Box>
      </Paper>

      {/* ============================================================
          FILTER MENU
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
          Filter Trainings
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Type</InputLabel>
          <Select 
            name="type" 
            value={filters.type} 
            onChange={handleFilterChange} 
            label="Type"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="local">Local</MenuItem>
            <MenuItem value="foreign">Foreign</MenuItem>
          </Select>
        </FormControl>

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
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

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
          EXPORT MENU
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
          TABLE
          ============================================================ */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflowX: 'auto',
          bgcolor: colors.cardBg,
          animation: 'fadeInUp 0.8s ease-out',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: colors.text, fontWeight: 600, py: 2, minWidth: 150 }}>Training</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, py: 2 }}>Type</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, py: 2 }}>Trainer</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, py: 2 }}>Department</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, py: 2 }} align="center">Participants</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, py: 2 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <School sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText }}>
                      No trainings found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      Try adjusting your search or filters
                    </Typography>
                    {canManage && (
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
                        Create First Training
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTrainings.map((training, index) => (
                <TableRow
                  key={training.id}
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
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy }}>
                      {training.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                      {training.start_date ? new Date(training.start_date).toLocaleDateString() : 'TBD'}
                      {training.end_date && ` - ${new Date(training.end_date).toLocaleDateString()}`}
                    </Typography>
                    {training.attachments && training.attachments.split(',').filter(Boolean).length > 0 && (
                      <Chip
                        icon={<AttachFile sx={{ fontSize: 12 }} />}
                        label={training.attachments.split(',').filter(Boolean).length}
                        size="small"
                        sx={{
                          bgcolor: colors.info + '15',
                          color: colors.info,
                          height: 18,
                          fontSize: '9px',
                          fontWeight: 600,
                          mt: 0.5,
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{getTypeChip(training.type)}</TableCell>
                  <TableCell sx={{ color: colors.lightText }}>
                    {training.trainer_name || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText }}>
                    {training.department || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={training.participants_count || 0}
                      size="small"
                      sx={{
                        bgcolor: colors.darkNavy,
                        color: colors.text,
                        fontWeight: 600,
                        minWidth: 30,
                        height: 26,
                        borderRadius: 2,
                      }}
                    />
                  </TableCell>
                  <TableCell>{getStatusChip(training.status)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      {/* ✅ View - Available to ALL */}
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleView(training)}
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

                      {/* ✅ Edit - SUPER_ADMIN aur ENGINEER dono */}
                      {canManage && (
                        <Tooltip title="Edit Training">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(training)}
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

                      {/* ✅ Delete - SUPER_ADMIN aur ENGINEER dono */}
                      {canManage && (
                        <Tooltip title="Delete Training">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(training.id)}
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
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ============================================================
          ADD/EDIT DIALOG
          ============================================================ */}
      {canManage && (
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
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {editingTraining ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
                {editingTraining ? 'Edit Training' : 'Add New Training'}
              </Typography>
              <IconButton onClick={handleCloseDialog} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
            <Grid container spacing={2.5} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Training Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter training title"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
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
                  rows={2}
                  placeholder="Training description"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    label="Type"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: colors.lightCyan },
                        '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                      }
                    }}
                  >
                    <MenuItem value="local">Local</MenuItem>
                    <MenuItem value="foreign">Foreign</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
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
                      }
                    }}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Optional - leave empty if not applicable"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Optional - leave empty if not applicable"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="Training location"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Trainer Name"
                  name="trainer_name"
                  value={formData.trainer_name}
                  onChange={handleFormChange}
                  placeholder="Trainer name"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  placeholder="Department"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expected Participants"
                  name="participants_count"
                  type="number"
                  value={formData.participants_count}
                  onChange={handleFormChange}
                  InputProps={{ inputProps: { min: 0 } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                />
              </Grid>

              {/* File Upload Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 1 }}>
                  <AttachFile sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
                  Attachments (Images, Videos, Documents)
                </Typography>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mb: 1 }}>
                  Upload training materials, certificates, images, or any related files.
                </Typography>
                <FileUpload
                  endpoint="/upload"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                  multiple={true}
                  label="Click to upload files"
                  maxFiles={10}
                  maxSize={50}
                  showPreview={true}
                  onUploadComplete={handleFileUploadComplete('attachments')}
                  onUploadError={(error) => toast.error('Upload failed: ' + error)}
                  onDelete={handleFileDelete('attachments')}
                  existingFiles={getExistingFiles('attachments')}
                />
                {formData.attachments && formData.attachments.split(',').filter(Boolean).length > 0 && (
                  <Typography variant="caption" sx={{ color: colors.success, display: 'block', mt: 1 }}>
                    {formData.attachments.split(',').filter(Boolean).length} file(s) attached
                  </Typography>
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
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
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
              {submitting ? 'Saving...' : (editingTraining ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
            maxHeight: '90vh',
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
              <School sx={{ fontSize: 28 }} />
              Training Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: colors.borderColor, p: 0 }}>
          {viewingTraining && (
            <Box>
              <Tabs
                value={viewTabValue}
                onChange={handleViewTabChange}
                sx={{
                  px: 2,
                  pt: 1,
                  borderBottom: `1px solid ${colors.borderColor}`,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: colors.lightText,
                    '&.Mui-selected': {
                      color: colors.darkNavy,
                      fontWeight: 600,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    bgcolor: colors.lightCyan,
                  }
                }}
              >
                <Tab label="Details" />
                <Tab 
                  label={`Attachments (${getAllAttachments(viewingTraining).length})`} 
                  disabled={getAllAttachments(viewingTraining).length === 0}
                />
              </Tabs>

              {viewTabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: colors.darkNavy, width: 56, height: 56 }}>
                      <School sx={{ fontSize: 28, color: colors.text }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={600} sx={{ color: colors.darkNavy }}>
                        {viewingTraining.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        {getTypeChip(viewingTraining.type)}
                        {getStatusChip(viewingTraining.status)}
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3, borderColor: colors.borderColor }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>
                        Trainer
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingTraining.trainer_name || '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>
                        Department
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingTraining.department || '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>
                        <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        Start Date
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingTraining.start_date ? new Date(viewingTraining.start_date).toLocaleDateString() : 'TBD'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>
                        <EventNote sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        End Date
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingTraining.end_date ? new Date(viewingTraining.end_date).toLocaleDateString() : 'TBD'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>
                        <LocationOn sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        Location
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingTraining.location || '-'}
                      </Typography>
                    </Grid>

                    {viewingTraining.description && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>
                          Description
                        </Typography>
                        <Paper sx={{
                          p: 2,
                          bgcolor: colors.mainBg,
                          borderRadius: 2,
                          border: `1px solid ${colors.borderColor}`,
                          mt: 0.5,
                        }}>
                          <Typography variant="body2" sx={{ color: colors.darkText }}>
                            {viewingTraining.description}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Divider sx={{ borderColor: colors.borderColor }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <People sx={{ color: colors.lightText }} />
                        <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 600 }}>
                          Participants ({viewingTraining.participants_count || 0})
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {viewTabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2 }}>
                    <AttachFile sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Attachments ({getAllAttachments(viewingTraining).length})
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                    Click on any file to preview it.
                  </Typography>
                  
                  <AttachmentGrid attachments={getAllAttachments(viewingTraining)} />
                </Box>
              )}
            </Box>
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
          {canDelete && viewingTraining && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(viewingTraining.id);
                handleCloseView();
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
    </Box>
  );
};

export default Training;