// src/pages/Profile.jsx
// HOSPITAL_ADMIN REMOVED from role display

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Stack,
  TextField,
  Slider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  Crop as CropIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { updateUser } from '../redux/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    username: '',
    role_name: '',
    hospital_name: '',
    profile_image: null,
    _file: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [cropImageUrl, setCropImageUrl] = useState(null);
  
  // Crop state
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState(400);
  
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const cropContainerRef = useRef(null);

  // Helper function to get full image URL
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  // Load profile data from Redux
  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        role_name: user.role_name || user.role || '',
        hospital_name: user.hospital_name || '',
        profile_image: user.profile_image || null,
        _file: null,
      });
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, [user]);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (cropContainerRef.current) {
        const rect = cropContainerRef.current.getBoundingClientRect();
        setContainerSize(rect.width);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users/me');
      if (response.data.success) {
        const userData = response.data.user;
        setProfile({
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          username: userData.username || '',
          role_name: userData.role_name || userData.role || '',
          hospital_name: userData.hospital_name || '',
          profile_image: userData.profile_image || null,
          _file: null,
        });
        dispatch(updateUser(userData));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile picture selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WEBP images are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setSelectedFile(file);
      setImageDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Open Crop Dialog
  const handleOpenCrop = () => {
    setImageDialogOpen(false);
    setCropImageUrl(imagePreview);
    setZoom(100);
    setPosition({ x: 0, y: 0 });
    setCropDialogOpen(true);
    
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.src = imagePreview;
  };

  // Handle Zoom
  const handleZoomChange = (event, newValue) => {
    setZoom(newValue);
  };

  // Handle Mouse Down for Drag
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle Mouse Move for Drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const imgWidth = (imageSize.width * zoom) / 100;
    const imgHeight = (imageSize.height * zoom) / 100;
    const maxX = Math.max(0, (imgWidth - containerSize) / 2);
    const maxY = Math.max(0, (imgHeight - containerSize) / 2);
    
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY)),
    });
  };

  // Handle Mouse Up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Apply Crop
  const applyCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const cropSize = containerSize;
      canvas.width = cropSize;
      canvas.height = cropSize;
      
      const imgWidth = (imageSize.width * zoom) / 100;
      const imgHeight = (imageSize.height * zoom) / 100;
      
      const offsetX = (imgWidth - cropSize) / 2 - position.x;
      const offsetY = (imgHeight - cropSize) / 2 - position.y;
      
      const srcX = Math.max(0, (offsetX / imgWidth) * imageSize.width);
      const srcY = Math.max(0, (offsetY / imgHeight) * imageSize.height);
      const srcWidth = Math.min(imageSize.width, (cropSize / imgWidth) * imageSize.width);
      const srcHeight = Math.min(imageSize.height, (cropSize / imgHeight) * imageSize.height);
      
      ctx.drawImage(
        img,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, cropSize, cropSize
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-profile.jpg', { type: 'image/jpeg' });
          setCroppedImage(file);
          setCropImageUrl(canvas.toDataURL('image/jpeg'));
          
          setCropDialogOpen(false);
          setImagePreview(canvas.toDataURL('image/jpeg'));
          setImageDialogOpen(true);
          
          toast.success('✅ Image cropped successfully! Click "Save Picture" to upload.');
        }
      }, 'image/jpeg', 0.9);
    };
    img.src = cropImageUrl;
  };

  // Upload Profile Picture
  const handleUploadImage = async () => {
    const fileToUpload = croppedImage || selectedFile;
    if (!fileToUpload) {
      toast.error('No file selected');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('profileImage', fileToUpload);

    try {
      const response = await api.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const imageUrl = response.data.profileImage;
        
        // Update local profile state
        setProfile({ ...profile, profile_image: imageUrl, _file: null });
        
        // Update Redux store - This updates the header/AppBar
        dispatch(updateUser({ 
          ...user,
          profile_image: imageUrl
        }));
        
        // Update localStorage directly (backup)
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          profile_image: imageUrl
        }));
        
        setImagePreview(null);
        setSelectedFile(null);
        setCroppedImage(null);
        setImageDialogOpen(false);
        setCropDialogOpen(false);
        
        toast.success('✅ Profile picture uploaded successfully!');
        
        // Force refresh to update header
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to upload profile picture');
      }
    } finally {
      setUploading(false);
    }
  };

  // Delete Profile Picture
  const handleDeleteImage = async () => {
    try {
      setUploading(true);
      const response = await api.delete('/users/profile-picture');
      if (response.data.success) {
        setProfile({ ...profile, profile_image: null });
        setDeleteDialogOpen(false);
        
        // Update Redux store
        dispatch(updateUser({ 
          ...user,
          profile_image: null
        }));
        
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          profile_image: null
        }));
        
        toast.success('Profile picture removed successfully');
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      toast.error('Failed to delete profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ✅ UPDATED: Get role color - HOSPITAL_ADMIN REMOVED
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return '#C9A227';
      // case 'hospital_admin': // ❌ REMOVED
      //   return '#0B5FA5';
      case 'engineer':
        return '#2E7D32';
      default:
        return '#757575';
    }
  };

  // ✅ UPDATED: Get role label - HOSPITAL_ADMIN REMOVED
  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return 'Super Admin';
      // case 'hospital_admin': // ❌ REMOVED
      //   return 'Hospital Admin';
      case 'engineer':
        return 'Engineer';
      default:
        return role || 'User';
    }
  };

  // Info Row Component
  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      py: 1.5,
      borderBottom: '1px solid #f0f0f0',
      '&:last-child': {
        borderBottom: 'none',
      }
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        minWidth: 140,
        color: '#6c757d',
      }}>
        {icon && (
          <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        <Typography variant="body2" fontWeight={500}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ color: '#2C3E50', fontWeight: 500 }}>
        {value || 'N/A'}
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Profile Card */}
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {/* Header with Avatar - CIRCLE AUTO ADJUST */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          {/* ✅ CIRCLE AVATAR - Auto Adjust */}
          <Box sx={{ 
            position: 'relative',
            width: { xs: 120, sm: 150, md: 180 },
            height: { xs: 120, sm: 150, md: 180 },
            bgcolor: 'white',
            borderRadius: '50%', // ✅ CIRCLE
            border: '3px solid #0B5FA5',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {profile.profile_image ? (
              <img
                src={getFullImageUrl(profile.profile_image)}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // ✅ Fills circle perfectly
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <Typography 
                variant="h2" 
                sx={{ 
                  color: '#0B5FA5',
                  fontWeight: 600,
                  fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                }}
              >
                {getInitials(profile.full_name)}
              </Typography>
            )}
            
            {/* Upload Overlay on Hover - Matches Circle */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                p: 1,
                textAlign: 'center',
                cursor: 'pointer',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                borderRadius: '0 0 50% 50%', // ✅ Matches circle bottom
                '&:hover': {
                  opacity: 1,
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={500}>
                Change Photo
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#0B5FA5' }}>
              {profile.full_name || 'User'}
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500, 
                color: getRoleColor(profile.role_name),
                mt: 0.5,
              }}
            >
              {getRoleLabel(profile.role_name)}
            </Typography>
            
            {/* Profile Picture Action Buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              <Tooltip title="Upload New Picture">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{
                    borderColor: '#0B5FA5',
                    color: '#0B5FA5',
                    '&:hover': {
                      borderColor: '#094a80',
                      backgroundColor: 'rgba(11, 95, 165, 0.04)',
                    },
                  }}
                >
                  Upload
                </Button>
              </Tooltip>
              
              <Tooltip title="Change Picture">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    '&:hover': {
                      borderColor: '#e68900',
                      backgroundColor: 'rgba(255, 152, 0, 0.04)',
                    },
                  }}
                >
                  Edit
                </Button>
              </Tooltip>
              
              {profile.profile_image && (
                <Tooltip title="Remove Picture">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={uploading}
                    sx={{
                      borderColor: '#f44336',
                      color: '#f44336',
                      '&:hover': {
                        borderColor: '#d32f2f',
                        backgroundColor: 'rgba(244, 67, 54, 0.04)',
                      },
                    }}
                  >
                    Delete
                  </Button>
                </Tooltip>
              )}
            </Stack>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Profile Info */}
        <Box sx={{ 
          bgcolor: '#f8f9fa', 
          borderRadius: 2, 
          p: 2,
          border: '1px solid #e9ecef'
        }}>
          <InfoRow 
            icon={<PersonIcon sx={{ color: '#0B5FA5', fontSize: 20 }} />}
            label="Full Name"
            value={profile.full_name}
          />
          <InfoRow 
            icon={<PersonIcon sx={{ color: '#0B5FA5', fontSize: 20 }} />}
            label="Username"
            value={profile.username}
          />
          <InfoRow 
            icon={<EmailIcon sx={{ color: '#0B5FA5', fontSize: 20 }} />}
            label="Email"
            value={profile.email}
          />
          <InfoRow 
            icon={<PhoneIcon sx={{ color: '#0B5FA5', fontSize: 20 }} />}
            label="Phone Number"
            value={profile.phone}
          />
          <InfoRow 
            icon={<BusinessIcon sx={{ color: '#0B5FA5', fontSize: 20 }} />}
            label="Hospital"
            value={profile.hospital_name || 'Not Assigned'}
          />
        </Box>
      </Paper>

      {/* ✅ CHANGE PASSWORD SECTION - COMPLETELY REMOVED */}

      {/* Image Preview Dialog with Crop Option */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Preview Profile Picture</Typography>
            <IconButton onClick={() => setImageDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <img
              src={imagePreview}
              alt="Profile Preview"
              style={{
                width: '100%',
                maxWidth: 300,
                height: 'auto',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<CropIcon />}
              onClick={handleOpenCrop}
              sx={{
                bgcolor: '#6f42c1',
                '&:hover': { bgcolor: '#5a32a3' },
              }}
            >
              Crop Image
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImageDialogOpen(false);
            setSelectedFile(null);
            setImagePreview(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadImage}
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#094a80' },
            }}
          >
            {uploading ? 'Uploading...' : 'Save Picture'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Crop Dialog with Cursor Drag */}
      <Dialog open={cropDialogOpen} onClose={() => setCropDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Crop Profile Picture</Typography>
            <IconButton onClick={() => setCropDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {/* Crop Container */}
            <Box 
              ref={cropContainerRef}
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 500,
                height: { xs: 300, sm: 350, md: 420 },
                margin: '0 auto',
                overflow: 'hidden',
                borderRadius: 2,
                border: '2px solid #0B5FA5',
                bgcolor: '#1a1a1a',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
              }}
              onTouchEnd={handleMouseUp}
            >
              {cropImageUrl && (
                <img
                  ref={imageRef}
                  src={cropImageUrl}
                  alt="Crop Preview"
                  style={{
                    width: (imageSize.width * zoom) / 100,
                    height: (imageSize.height * zoom) / 100,
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(${-50 + (position.x / containerSize) * 100}%, ${-50 + (position.y / containerSize) * 100}%)`,
                    transformOrigin: 'center',
                    pointerEvents: 'none',
                    maxWidth: 'none',
                  }}
                />
              )}
              
              {/* Crop Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '3px solid rgba(255,255,255,0.6)',
                  boxShadow: 'inset 0 0 0 1000px rgba(0,0,0,0.45)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: '75%',
                    height: '75%',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    position: 'relative',
                    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '33.33%',
                      left: 0,
                      right: 0,
                      height: '1px',
                      bgcolor: 'rgba(255,255,255,0.2)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '66.66%',
                      left: 0,
                      right: 0,
                      height: '1px',
                      bgcolor: 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '33.33%',
                    width: '1px',
                    bgcolor: 'rgba(255,255,255,0.2)',
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '66.66%',
                    width: '1px',
                    bgcolor: 'rgba(255,255,255,0.2)',
                  }} />
                  
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 30,
                    height: 30,
                    transform: 'translate(-50%, -50%)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      transform: 'translateY(-50%)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '50%',
                      width: '2px',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      transform: 'translateX(-50%)',
                    },
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.9)',
                      transform: 'translate(-50%, -50%)',
                    }} />
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.7rem',
                pointerEvents: 'none',
              }}>
                🖱️ Drag to reposition • 🔄 Zoom to adjust
              </Box>
            </Box>

            {/* Zoom Controls */}
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <ZoomOutIcon sx={{ color: '#0B5FA5' }} />
              <Slider
                value={zoom}
                onChange={handleZoomChange}
                min={50}
                max={200}
                step={5}
                sx={{ width: 250 }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
              <ZoomInIcon sx={{ color: '#0B5FA5' }} />
            </Box>
            
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              💡 Use cursor to drag image • Zoom to fit • Square area will be cropped
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={applyCrop}
            variant="contained"
            startIcon={<CropIcon />}
            sx={{
              bgcolor: '#28a745',
              '&:hover': { bgcolor: '#1e7e34' },
            }}
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Profile Picture</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove your profile picture?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteImage}
            variant="contained"
            color="error"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {uploading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
