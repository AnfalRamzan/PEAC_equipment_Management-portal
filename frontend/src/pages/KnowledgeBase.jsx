// src/pages/KnowledgeBase.jsx
// ✅ FIXED: Solution Card - View, Edit (Super Admin), Delete (Super Admin)
// ✅ FIXED: Date removed from Solution Card

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
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  Dialog as PreviewDialog,
  Menu,
  Switch,
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
  ZoomIn,
  OpenInNew,
  VideoLibrary,
  Lock,
  LockOpen,
  People,
  Download,
  FileDownload,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import FileUpload from '../components/FileUpload'
import AccessDenied from '../components/Auth/AccessDenied'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
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
`

// ✅ Helper function for image URLs
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

// ✅ Helper function to check file type
const isImageFile = (url) => {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

const isVideoFile = (url) => {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'].includes(ext)
}

const getFileName = (url) => {
  if (!url) return 'File'
  const parts = url.split('/')
  return parts[parts.length - 1] || 'File'
}

// ============================================================
// ✅ COMPONENT: Attachment Grid with Preview
// ============================================================
const AttachmentGrid = ({ attachments, onFileClick }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState('')

  if (!attachments || attachments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, bgcolor: colors.mainBg, borderRadius: 2 }}>
        <AttachFile sx={{ fontSize: 48, color: colors.lightText, opacity: 0.3 }} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          No attachments
        </Typography>
      </Box>
    )
  }

  const handlePreview = (url) => {
    const fullUrl = getFullUrl(url)
    const isImg = isImageFile(url)
    const isVideo = isVideoFile(url)
    
    setPreviewUrl(fullUrl)
    setPreviewType(isImg ? 'image' : isVideo ? 'video' : 'document')
    setPreviewOpen(true)
  }

  return (
    <Box>
      <ImageList cols={4} gap={12} sx={{ mb: 0 }}>
        {attachments.map((url, index) => {
          const isImg = isImageFile(url)
          const isVideo = isVideoFile(url)
          const fileName = getFileName(url)
          const fullUrl = getFullUrl(url)

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
                    e.target.onerror = null
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160"%3E%3Crect width="200" height="160" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'
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
                  <Typography variant="caption" sx={{ color: colors.textLight, mt: 1, px: 1 }}>
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
                      e.stopPropagation()
                      handlePreview(url)
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
                      e.stopPropagation()
                      window.open(fullUrl, '_blank')
                    }}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ImageListItem>
          )
        })}
      </ImageList>

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
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
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
// ✅ ENHANCED STAT CARD COMPONENT
// ============================================================
const StatCard = ({ title, value, icon, subtext }) => (
  <Grow in timeout={300}>
    <Card sx={{ 
      borderRadius: 3,
      border: `1px solid ${colors.borderColor}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-4px) scale(1.02)',
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
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative', zIndex: 1 }}>
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
                fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: colors.darkNavy,
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
                mt: 0.5,
                fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              }}
            >
              {value}
            </Typography>
            {subtext && (
              <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 0.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {subtext}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              background: 'rgba(103, 232, 249, 0.08)',
              borderRadius: '14px',
              p: 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              color: colors.lightCyan,
              transition: 'all 0.3s ease',
            }}
          >
            {React.cloneElement(icon, { 
              sx: { 
                fontSize: 22,
                color: colors.lightCyan,
              } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  </Grow>
)

// ============================================================
// ✅ EQUIPMENT CARD - ONLY EQUIPMENT DATA (NO System Admin, NO Date)
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
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${colors.lightCyan}, ${hasSolutions ? colors.accentGold : colors.lightText})`,
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Badge
              badgeContent={equipment.solution_count || 0}
              color={hasSolutions ? 'primary' : 'default'}
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: hasSolutions ? colors.lightCyan : colors.lightText,
                  color: hasSolutions ? colors.darkNavy : colors.text,
                  fontWeight: 700,
                  fontSize: '10px',
                  height: 20,
                  minWidth: 20,
                  border: `2px solid ${colors.text}`,
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
                <MedicalServices sx={{ fontSize: 28, color: colors.text }} />
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 0.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {equipment.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {equipment.model || 'No Model'}
                </Typography>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: colors.borderColor }} />
                <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
                color: colors.text,
                fontWeight: 600,
                fontSize: '11px',
                borderRadius: 2,
              }}
              icon={hasSolutions ? <Verified sx={{ fontSize: 14, color: colors.lightCyan }} /> : <FolderOpen sx={{ fontSize: 14, color: colors.text }} />}
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
                  borderRadius: 2,
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
            <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
            <Typography variant="caption" sx={{ color: colors.lightText, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
// ✅ SOLUTION CARD - View, Edit (Super Admin), Delete (Super Admin) + No Date
// ============================================================
const SolutionCard = ({ solution, onView, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false)
  const { user } = useSelector((state) => state.auth)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const getAttachmentCount = (value) => {
    if (!value) return 0
    return value.split(',').filter(Boolean).length
  }
  
  const totalAttachments = 
    getAttachmentCount(solution.spare_part_images) +
    getAttachmentCount(solution.before_repair_images) +
    getAttachmentCount(solution.after_repair_images) +
    getAttachmentCount(solution.images) +
    getAttachmentCount(solution.attachments)
  
  return (
    <Fade in timeout={300}>
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          bgcolor: isHovered ? colors.mainBg : colors.cardBg,
          boxShadow: isHovered ? `0 4px 20px ${colors.lightCyanGlow}` : '0 2px 8px rgba(0,0,0,0.02)',
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
                <ErrorIcon sx={{ fontSize: 18, color: colors.text }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {solution.error_title}
              </Typography>
              {totalAttachments > 0 && (
                <Chip
                  icon={<AttachFile sx={{ fontSize: 12 }} />}
                  label={totalAttachments}
                  size="small"
                  sx={{
                    bgcolor: colors.info + '15',
                    color: colors.info,
                    height: 20,
                    fontSize: '9px',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                />
              )}
            </Box>
            
            {/* ✅ Code aur System Admin show - DATE REMOVE */}
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
                    fontSize: '10px',
                    borderRadius: 2,
                  }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person sx={{ fontSize: 13, color: colors.lightText }} />
                <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {solution.created_by_name || 'Unknown'}
                </Typography>
              </Box>
              {/* ⛔ DATE REMOVED - YAHAN SE DATE HATAYA */}
            </Box>
          </Box>
          
          {/* ✅ VIEW, EDIT (Super Admin), DELETE (Super Admin) */}
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="View Details">
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => onView(solution)}
                sx={{ 
                  color: colors.darkNavy,
                  borderColor: colors.lightCyan,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  '&:hover': { 
                    color: colors.lightCyanDark,
                    borderColor: colors.lightCyanDark,
                    backgroundColor: 'rgba(103, 232, 249, 0.08)'
                  }
                }}
              >
                View
              </Button>
            </Tooltip>
            
            {isSuperAdmin && (
              <>
                <Tooltip title="Edit Solution">
                  <IconButton 
                    size="small" 
                    onClick={() => onEdit(solution)}
                    sx={{ 
                      color: colors.info,
                      '&:hover': { 
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        color: colors.info,
                      }
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Solution">
                  <IconButton 
                    size="small" 
                    onClick={() => onDelete(solution)}
                    sx={{ 
                      color: colors.error,
                      '&:hover': { 
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        color: colors.error,
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Fade>
  )
}

// ============================================================
// ✅ MAIN KNOWLEDGE BASE COMPONENT
// ============================================================
const KnowledgeBase = () => {
  const { user } = useSelector((state) => state.auth)
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isEngineer = user?.role === 'ENGINEER'
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN'
  
  const canView = !isHospitalAdmin
  const canAdd = !isHospitalAdmin
  const canEdit = isSuperAdmin
  const canDelete = isSuperAdmin
  
  if (isHospitalAdmin) {
    return <AccessDenied message="Hospital Administrators cannot access Knowledge Base." />
  }

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
  const [viewTabValue, setViewTabValue] = useState(0)

  const [totalSolutions, setTotalSolutions] = useState(0)
  const [equipmentWithSolutions, setEquipmentWithSolutions] = useState(0)
  const [solutionsWithImages, setSolutionsWithImages] = useState(0)

  const [uploadingFiles, setUploadingFiles] = useState(false)

  const [sparePartsList, setSparePartsList] = useState([])
  const [hasSpareParts, setHasSpareParts] = useState(false)

  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [addFormData, setAddFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
    root_cause: '',
    solution: '',
    repair_procedure: '',
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

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToExcel = () => {
    try {
      const data = solutions.map(s => ({
        'Equipment': s.equipment_name || '',
        'Error Code': s.error_code || '',
        'Error Title': s.error_title || '',
        'Error Description': s.error_description || '',
        'Root Cause': s.root_cause || '',
        'Solution': s.solution || '',
        'Reference Document Number': s.repair_procedure || '',
        'Spare Parts Used': s.spare_parts_used || '',
        'Remarks': s.remarks || '',
        'Reported By': s.reported_by || '',
        'Engineer Name': s.engineer_name || '',
        'Hospital': s.hospital_name || '',
        'Department': s.department_name || '',
        'Repair Date': s.repair_date ? formatDate(s.repair_date) : '',
        'Created By': s.created_by_name || '',
        'Created At': s.created_at ? formatDate(s.created_at) : '',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Knowledge Base')
      XLSX.writeFile(wb, `knowledge_base_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Knowledge Base Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Solutions: ${solutions.length}`, 14, 34)
      
      const tableData = solutions.map(s => [
        s.equipment_name || '',
        s.error_title || '',
        s.error_code || '',
        (s.solution || '').substring(0, 30),
        s.repair_date ? formatDate(s.repair_date) : '',
        s.created_by_name || ''
      ])
      autoTable(doc, {
        head: [['Equipment', 'Error', 'Code', 'Solution', 'Date', 'Created By']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`knowledge_base_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const getAttachmentCount = (value) => {
    if (!value) return 0
    return value.split(',').filter(Boolean).length
  }

  const getAllAttachments = (solution) => {
    const all = []
    if (solution.spare_part_images) {
      solution.spare_part_images.split(',').filter(Boolean).forEach(url => all.push(url))
    }
    if (solution.before_repair_images) {
      solution.before_repair_images.split(',').filter(Boolean).forEach(url => all.push(url))
    }
    if (solution.after_repair_images) {
      solution.after_repair_images.split(',').filter(Boolean).forEach(url => all.push(url))
    }
    if (solution.images) {
      solution.images.split(',').filter(Boolean).forEach(url => all.push(url))
    }
    if (solution.attachments) {
      solution.attachments.split(',').filter(Boolean).forEach(url => all.push(url))
    }
    return all
  }

  const fetchEquipment = async () => {
    setLoading(true)
    try {
      const response = await api.get('/knowledge-base/equipment-list')
      let equipment = response.data.equipment || []
      
      equipment = equipment.map(eq => ({
        id: eq.id,
        name: eq.name,
        model: eq.model || 'No Model',
        manufacturer: eq.manufacturer || 'No Manufacturer',
        category_name: eq.category_name || '',
        hospital_name: eq.hospital_name || 'No Hospital Assigned',
        solution_count: eq.solution_count || 0,
      }))
      
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
    setViewTabValue(0)
    setOpenViewDialog(true)
  }

  const handleEditSolution = (solution) => {
    setEditingSolution(solution)
    setSparePartsList([])
    setHasSpareParts(false)
    
    // Parse spare parts if any
    if (solution.spare_parts_used) {
      const parts = solution.spare_parts_used.split(',').filter(Boolean).map(p => {
        const [name, qty, cost] = p.split('|')
        return { part_name: name || '', quantity: parseInt(qty) || 1, unit_cost: parseFloat(cost) || 0 }
      })
      setSparePartsList(parts)
      if (parts.length > 0) setHasSpareParts(true)
    }
    
    setAddFormData({
      equipment_id: solution.equipment_id || '',
      error_code: solution.error_code || '',
      error_title: solution.error_title || '',
      error_description: solution.error_description || '',
      root_cause: solution.root_cause || '',
      solution: solution.solution || '',
      repair_procedure: solution.repair_procedure || '',
      spare_parts_used: solution.spare_parts_used || '',
      spare_part_images: solution.spare_part_images || '',
      before_repair_images: solution.before_repair_images || '',
      after_repair_images: solution.after_repair_images || '',
      images: solution.images || '',
      attachments: solution.attachments || '',
      repair_date: solution.repair_date || '',
      remarks: solution.remarks || '',
      reported_by: solution.reported_by || '',
      engineer_name: solution.engineer_name || '',
      hospital_name: solution.hospital_name || '',
      department_name: solution.department_name || ''
    })
    setOpenAddDialog(true)
  }

  const handleDeleteSolution = (solution) => {
    setDeletingSolution(solution)
    setOpenDeleteDialog(true)
  }

  const confirmDeleteSolution = async () => {
    if (!deletingSolution) return
    setDeleteLoading(true)
    try {
      await api.delete(`/knowledge-base/${deletingSolution.id}`)
      toast.success('Solution deleted successfully')
      setOpenDeleteDialog(false)
      setDeletingSolution(null)
      if (selectedEquipment) {
        await fetchSolutions(selectedEquipment.id)
        await fetchEquipment()
      }
    } catch (error) {
      console.error('Error deleting solution:', error)
      toast.error(error.response?.data?.message || 'Failed to delete solution')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setViewTabValue(newValue)
  }

  const handleAddSolution = () => {
    if (!canAdd) {
      toast.error('You do not have permission to add solutions')
      return
    }
    
    let equipmentId = selectedEquipment?.id
    
    if (!equipmentId) {
      toast.error('Please select an equipment first')
      return
    }
    
    setEditingSolution(null)
    setSparePartsList([])
    setHasSpareParts(false)
    
    const equipment = equipmentList.find(eq => eq.id === parseInt(equipmentId))
    
    setAddFormData({
      equipment_id: equipmentId,
      error_code: '',
      error_title: '',
      error_description: '',
      root_cause: '',
      solution: '',
      repair_procedure: '',
      spare_parts_used: '',
      spare_part_images: '',
      before_repair_images: '',
      after_repair_images: '',
      images: '',
      attachments: '',
      repair_date: '',
      remarks: '',
      reported_by: user?.full_name || '',
      engineer_name: user?.full_name || '',
      hospital_name: equipment?.hospital_name || user?.hospital_name || '',
      department_name: '',
      created_by: user?.id || null,
      created_by_name: user?.full_name || ''
    })
    setOpenAddDialog(true)
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

  const handleAddSparePart = () => {
    if (!sparePartForm.part_name.trim()) {
      toast.error('Please enter part name')
      return
    }
    const qty = parseInt(sparePartForm.quantity) || 1
    const unitCost = parseFloat(sparePartForm.unit_cost) || 0
    const totalCost = qty * unitCost
    
    setSparePartsList([...sparePartsList, {
      part_name: sparePartForm.part_name.trim(),
      quantity: qty,
      unit_cost: unitCost,
      total_cost: totalCost
    }])
    
    // Update spare_parts_used field
    const partsString = sparePartsList.map(p => 
      `${p.part_name}|${p.quantity}|${p.unit_cost}`
    ).join(',')
    setAddFormData(prev => ({
      ...prev,
      spare_parts_used: partsString
    }))
    
    setSparePartForm({ part_name: '', quantity: 1, unit_cost: '', total_cost: '' })
    toast.success('Spare part added')
  }

  const handleRemoveSparePart = (index) => {
    const newList = sparePartsList.filter((_, i) => i !== index)
    setSparePartsList(newList)
    const partsString = newList.map(p => 
      `${p.part_name}|${p.quantity}|${p.unit_cost}`
    ).join(',')
    setAddFormData(prev => ({
      ...prev,
      spare_parts_used: partsString
    }))
  }

  const handleSubmitSolution = async () => {
    try {
      console.log('📤 Submitting solution...')
      
      let equipmentId = addFormData.equipment_id
      if (!equipmentId && selectedEquipment) {
        equipmentId = selectedEquipment.id
      }
      
      if (!equipmentId) {
        toast.error('Equipment is required')
        return
      }
      
      if (!addFormData.error_title) {
        toast.error('Error title is required')
        return
      }

      const payload = {
        equipment_id: parseInt(equipmentId),
        error_code: addFormData.error_code || null,
        error_title: addFormData.error_title,
        error_description: addFormData.error_description || null,
        root_cause: addFormData.root_cause || null,
        solution: addFormData.solution || null,
        repair_procedure: addFormData.repair_procedure || null,
        spare_parts_used: addFormData.spare_parts_used || null,
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

      console.log('📤 Sending payload:', payload)

      let response
      if (editingSolution) {
        response = await api.put(`/knowledge-base/${editingSolution.id}`, payload)
        toast.success('Solution updated successfully')
      } else {
        response = await api.post('/knowledge-base', payload)
        toast.success('Solution added successfully')
      }

      console.log('✅ Response:', response.data)

      setOpenAddDialog(false)
      setSparePartsList([])
      setHasSpareParts(false)
      
      if (selectedEquipment) {
        await fetchSolutions(selectedEquipment.id)
        await fetchEquipment()
      }
    } catch (error) {
      console.error('❌ Error saving solution:', error)
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

  const statsCards = [
    {
      title: 'Total Solutions',
      value: totalSolutions,
      icon: <MenuBook sx={{ fontSize: 22, color: colors.lightCyan }} />,
      subtext: 'All knowledge entries'
    },
    {
      title: 'Equipment with Solutions',
      value: equipmentWithSolutions,
      icon: <Verified sx={{ fontSize: 22, color: colors.lightCyan }} />,
      subtext: `${equipmentList.length} total equipment`
    },
    {
      title: 'With Images',
      value: solutionsWithImages,
      icon: <Image sx={{ fontSize: 22, color: colors.lightCyan }} />,
      subtext: 'Visual documentation'
    },
    {
      title: 'Recent Solutions',
      value: solutions.length || 0,
      icon: <Lightbulb sx={{ fontSize: 22, color: colors.lightCyan }} />,
      subtext: selectedEquipment ? `For ${selectedEquipment.name}` : 'Select equipment'
    },
  ]

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
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
            Knowledge Base
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Solutions and knowledge repository for equipment maintenance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchEquipment} 
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              textTransform: 'none',
              borderRadius: 2,
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
        </Box>
      </Box>

      {/* EXPORT MENU */}
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

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <StatCard 
              title={card.title}
              value={card.value}
              icon={card.icon}
              subtext={card.subtext}
            />
          </Grid>
        ))}
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.7s ease-out',
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
                  <Search sx={{ color: colors.lightText, fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                },
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Filter by Equipment</InputLabel>
            <Select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value)}
              label="Filter by Equipment"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                },
              }}
            >
              <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>All Equipment</MenuItem>
              {equipmentList.map(eq => (
                <MenuItem key={eq.id} value={eq.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{eq.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Equipment Cards Grid */}
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
          <Typography variant="h6" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
            No equipment found
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
            Try adjusting your search or filter
          </Typography>
        </Paper>
      )}

      {/* ===== SOLUTIONS DIALOG ===== */}
      <Dialog 
        open={openSolutionsDialog} 
        onClose={() => setOpenSolutionsDialog(false)} 
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                <MedicalServices sx={{ color: colors.text }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {selectedEquipment?.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
                    bgcolor: colors.text,
                    color: colors.darkNavy,
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { 
                      bgcolor: colors.lightCyan,
                      color: colors.darkNavy,
                      boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                    },
                    boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                  }}
                >
                  Add Solution
                </Button>
              )}
              <IconButton onClick={() => setOpenSolutionsDialog(false)} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {solutions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <EmojiObjects sx={{ fontSize: 64, color: colors.lightText, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                No solutions found
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {canAdd ? 'Click "Add Solution" to add a new solution' : 'No solutions available for this equipment'}
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
                  onDelete={handleDeleteSolution}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenSolutionsDialog(false)} 
            sx={{ 
              color: colors.darkNavy,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
            }}
          >
            Close
          </Button>
          {solutions.length > 0 && (
            <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              {solutions.length} solution{solutions.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </DialogActions>
      </Dialog>

      {/* ===== VIEW SOLUTION DIALOG ===== */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: colors.text,
          borderRadius: '8px 8px 0 0',
          py: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              Solution Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
          <Tabs value={viewTabValue} onChange={handleTabChange} sx={{ mt: 1 }}>
            <Tab label="Details" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", color: colors.textLight, '&.Mui-selected': { color: colors.text } }} />
            <Tab label="Attachments" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", color: colors.textLight, '&.Mui-selected': { color: colors.text } }} />
            <Tab label="Spare Parts" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", color: colors.textLight, '&.Mui-selected': { color: colors.text } }} />
          </Tabs>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {selectedSolution && (
            <>
              {viewTabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: colors.error, fontWeight: 700, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      <ErrorIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Error Information
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Error Title
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedSolution.error_title}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Error Code
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedSolution.error_code || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Error Description
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", bgcolor: colors.mainBg, p: 2, borderRadius: 2 }}>
                      {selectedSolution.error_description || 'No description provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      <Build sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: colors.info }} />
                      Solution Details
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Root Cause
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", bgcolor: colors.mainBg, p: 2, borderRadius: 2 }}>
                      {selectedSolution.root_cause || 'No root cause identified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Solution
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", bgcolor: colors.mainBg, p: 2, borderRadius: 2 }}>
                      {selectedSolution.solution || 'No solution provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Reference Document Number
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", bgcolor: colors.mainBg, p: 2, borderRadius: 2 }}>
                      {selectedSolution.repair_procedure || 'No reference number provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Repair Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedSolution.repair_date ? formatDate(selectedSolution.repair_date) : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      <Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: colors.cyanText }} />
                      Personnel Information
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Reported By
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedSolution.reported_by || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Engineer Name
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedSolution.engineer_name || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Created By
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedSolution.created_by_name || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Remarks
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedSolution.remarks || 'No remarks'}
                    </Typography>
                  </Grid>
                </Grid>
              )}
              
              {viewTabValue === 1 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 2, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    <AttachFile sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Attachments
                  </Typography>
                  <AttachmentGrid attachments={getAllAttachments(selectedSolution)} />
                </Box>
              )}
              
              {viewTabValue === 2 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 2, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    <Inventory sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Spare Parts Used
                  </Typography>
                  {selectedSolution.spare_parts_used ? (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                      <Table>
                        <TableHead sx={{ bgcolor: colors.darkNavy }}>
                          <TableRow>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Part Name</TableCell>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="center">Quantity</TableCell>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">Unit Cost</TableCell>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedSolution.spare_parts_used.split(',').filter(Boolean).map((part, idx) => {
                            const [name, qty, cost] = part.split('|')
                            const quantity = parseInt(qty) || 1
                            const unitCost = parseFloat(cost) || 0
                            return (
                              <TableRow key={idx}>
                                <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{name || 'N/A'}</TableCell>
                                <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="center">{quantity}</TableCell>
                                <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">${unitCost.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">${(quantity * unitCost).toFixed(2)}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      No spare parts listed
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)}
            variant="contained"
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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

      {/* ===== ADD/EDIT SOLUTION DIALOG ===== */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
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
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              {editingSolution ? 'Edit Solution' : 'Add New Solution'}
            </Typography>
            <IconButton onClick={() => setOpenAddDialog(false)} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          <Grid container spacing={3}>
            {/* Equipment */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                <MedicalServices fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Equipment Information
              </Typography>
              <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={addFormData.equipment_id || ''}
                  onChange={handleAddFormChange}
                  label="Equipment *"
                  disabled={!!editingSolution}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                  }}
                >
                  {equipmentList.map(eq => (
                    <MenuItem key={eq.id} value={eq.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {eq.name} - {eq.model || 'No Model'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Error Code"
                name="error_code"
                value={addFormData.error_code || ''}
                onChange={handleAddFormChange}
                placeholder="e.g., ERR-001"
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
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                <ErrorIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: colors.error }} />
                Error Details
              </Typography>
              <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Title *"
                name="error_title"
                value={addFormData.error_title || ''}
                onChange={handleAddFormChange}
                required
                placeholder="Brief description of the error"
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
                label="Error Description"
                name="error_description"
                value={addFormData.error_description || ''}
                onChange={handleAddFormChange}
                multiline
                rows={3}
                placeholder="Detailed description of the error and symptoms"
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
                label="Root Cause"
                name="root_cause"
                value={addFormData.root_cause || ''}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="What caused the error?"
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
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                <Build fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: colors.info }} />
                Solution Details
              </Typography>
              <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Solution *"
                name="solution"
                value={addFormData.solution || ''}
                onChange={handleAddFormChange}
                required
                multiline
                rows={4}
                placeholder="Detailed solution steps and procedures"
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
                label="Reference Document Number"
                name="repair_procedure"
                value={addFormData.repair_procedure || ''}
                onChange={handleAddFormChange}
                multiline
                rows={3}
                placeholder="Enter reference document number (e.g., REF-12345)"
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
                label="Repair Date"
                name="repair_date"
                type="date"
                value={addFormData.repair_date || ''}
                onChange={handleAddFormChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: "2000-01-01",
                  max: "2030-12-31"
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={addFormData.remarks || ''}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="Additional remarks or notes"
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
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                <Person fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: colors.cyanText }} />
                Personnel Information
              </Typography>
              <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reported By"
                name="reported_by"
                value={addFormData.reported_by || ''}
                onChange={handleAddFormChange}
                placeholder="Name of person who reported"
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
                label="Engineer Name"
                name="engineer_name"
                value={addFormData.engineer_name || ''}
                onChange={handleAddFormChange}
                placeholder="Name of the engineer who fixed it"
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
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                <AttachFile fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: colors.warning }} />
                Attachments
              </Typography>
              <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FileUpload
                label="Images"
                fieldName="images"
                onUploadComplete={handleFileUploadComplete('images')}
                onFileDelete={handleFileDelete('images')}
                existingFiles={getExistingFiles('images')}
                multiple
                accept="image/*"
                maxFiles={10}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FileUpload
                label="Attachments"
                fieldName="attachments"
                onUploadComplete={handleFileUploadComplete('attachments')}
                onFileDelete={handleFileDelete('attachments')}
                existingFiles={getExistingFiles('attachments')}
                multiple
                accept="*/*"
                maxFiles={10}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 700, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                <Image fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: colors.success }} />
                Spare Parts Information
              </Typography>
              <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hasSpareParts}
                    onChange={(e) => setHasSpareParts(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colors.lightCyan,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: colors.lightCyan,
                      },
                    }}
                  />
                }
                label="Has Spare Parts Used"
                sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}
              />
            </Grid>

            {hasSpareParts && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Part Name"
                          name="part_name"
                          value={sparePartForm.part_name}
                          onChange={(e) => setSparePartForm({ ...sparePartForm, part_name: e.target.value })}
                          placeholder="e.g., Motor Bearing"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': { borderColor: colors.lightCyan },
                            },
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
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1
                            const unitCost = parseFloat(sparePartForm.unit_cost) || 0
                            setSparePartForm({
                              ...sparePartForm,
                              quantity: qty,
                              total_cost: (qty * unitCost).toFixed(2)
                            })
                          }}
                          inputProps={{ min: 1 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': { borderColor: colors.lightCyan },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Unit Cost"
                          name="unit_cost"
                          type="number"
                          value={sparePartForm.unit_cost}
                          onChange={(e) => {
                            const unitCost = parseFloat(e.target.value) || 0
                            const qty = parseInt(sparePartForm.quantity) || 1
                            setSparePartForm({
                              ...sparePartForm,
                              unit_cost: unitCost,
                              total_cost: (qty * unitCost).toFixed(2)
                            })
                          }}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': { borderColor: colors.lightCyan },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Total"
                          name="total_cost"
                          value={sparePartForm.total_cost || ''}
                          disabled
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': { borderColor: colors.lightCyan },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleAddSparePart}
                          startIcon={<Add />}
                          sx={{
                            bgcolor: colors.darkNavy,
                            color: colors.text,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': {
                              bgcolor: colors.darkNavyHover,
                              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                            },
                          }}
                        >
                          Add
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {sparePartsList.length > 0 && (
                  <Grid item xs={12}>
                    <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.darkNavy }}>
                          <TableRow>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Part Name</TableCell>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="center">Qty</TableCell>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">Unit Cost</TableCell>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">Total</TableCell>
                            <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="center">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sparePartsList.map((part, index) => (
                            <TableRow key={index}>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{part.part_name}</TableCell>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="center">{part.quantity}</TableCell>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">${part.unit_cost || 0}</TableCell>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} align="right">${part.total_cost || 0}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveSparePart(index)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </>
            )}

            <Grid item xs={12}>
              <FileUpload
                label="Spare Parts Images"
                fieldName="spare_part_images"
                onUploadComplete={handleFileUploadComplete('spare_part_images')}
                onFileDelete={handleFileDelete('spare_part_images')}
                existingFiles={getExistingFiles('spare_part_images')}
                multiple
                accept="image/*"
                maxFiles={10}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FileUpload
                label="Before Repair Images"
                fieldName="before_repair_images"
                onUploadComplete={handleFileUploadComplete('before_repair_images')}
                onFileDelete={handleFileDelete('before_repair_images')}
                existingFiles={getExistingFiles('before_repair_images')}
                multiple
                accept="image/*"
                maxFiles={10}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FileUpload
                label="After Repair Images"
                fieldName="after_repair_images"
                onUploadComplete={handleFileUploadComplete('after_repair_images')}
                onFileDelete={handleFileDelete('after_repair_images')}
                existingFiles={getExistingFiles('after_repair_images')}
                multiple
                accept="image/*"
                maxFiles={10}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenAddDialog(false)}
            variant="outlined"
            sx={{ 
              color: colors.darkNavy, 
              borderColor: colors.borderColor,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
            onClick={handleSubmitSolution}
            sx={{
              bgcolor: colors.darkNavy,
              color: colors.text,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              textTransform: 'none',
              borderRadius: 2,
              px: 4,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
            }}
            startIcon={editingSolution ? <Edit /> : <Add />}
          >
            {editingSolution ? 'Update Solution' : 'Add Solution'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== DELETE CONFIRMATION DIALOG ===== */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
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
          bgcolor: colors.error,
          color: colors.text,
          borderRadius: '8px 8px 0 0',
          py: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DeleteForever sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              Delete Solution
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              <strong>Warning:</strong> This action cannot be undone.
            </Typography>
          </Alert>
          <Typography variant="body1" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
            Are you sure you want to delete the solution:
          </Typography>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.error, mt: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
            "{deletingSolution?.error_title}"
          </Typography>
          {deletingSolution?.equipment_name && (
            <Typography variant="body2" sx={{ color: colors.lightText, mt: 0.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              Equipment: {deletingSolution.equipment_name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            variant="outlined"
            sx={{
              color: colors.darkNavy,
              borderColor: colors.borderColor,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteSolution}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteForever />}
            sx={{
              bgcolor: colors.error,
              color: colors.text,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              textTransform: 'none',
              borderRadius: 2,
              px: 4,
              '&:hover': {
                bgcolor: '#DC2626',
                boxShadow: `0 4px 20px ${colors.error}44`,
              },
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default KnowledgeBase