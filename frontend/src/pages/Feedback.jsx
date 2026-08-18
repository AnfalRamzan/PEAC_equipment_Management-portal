// src/pages/Feedback.jsx
// ✅ Feedback Page - Cards design same as Hospitals page
// ✅ Same prominent click effect
// ✅ Same gradient backgrounds
// ✅ Same hover animations
// ✅ FIXED: Complete imports including InputAdornment and Search
// ✅ FIXED: Rating is now REQUIRED

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Rating,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  Avatar,
  Tooltip,
  Fade,
  Grow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  InputAdornment,  // ✅ IMPORTANT - For search field
} from '@mui/material';
import {
  RateReview,
  Star,
  Delete,
  Refresh,
  ThumbUp,
  ThumbDown,
  FilterList,
  Clear,
  Download,
  Email,
  Person,
  AccessTime,
  LocalHospital,
  AdminPanelSettings,
  Comment,
  Visibility,
  Close as CloseIcon,
  Send,
  Search,  // ✅ IMPORTANT - For search icon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

// ============================================================
// ✅ FONT FAMILY CONSTANT - SATOSHI
// ============================================================
const FONT_FAMILY = "'Satoshi', 'Segoe UI', 'Roboto', sans-serif";

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
};

// ============================================================
// ✅ ANIMATION STYLES
// ============================================================
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

.prominent-active {
  animation: prominentGlow 1.5s ease-in-out 3;
}
`;

const API_URL = 'http://localhost:5000/api';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [viewDialog, setViewDialog] = useState({ open: false, feedback: null });
  
  // ✅ State for prominent card click
  const [clickedCardIndex, setClickedCardIndex] = useState(null);
  const [prominentActive, setProminentActive] = useState(false);
  
  // Feedback Dialog states
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackHospital, setFeedbackHospital] = useState('');
  const [feedbackAdmin, setFeedbackAdmin] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    positive: 0,
    negative: 0,
  });

  // Get auth token and user
  const getToken = () => localStorage.getItem('token');
  const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');
  const user = getUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Load feedbacks
  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/feedback`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const feedbacksData = data.feedbacks || [];
        setFeedbacks(feedbacksData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        calculateStats(feedbacksData);
      } else {
        toast.warning('API unavailable, loading from local storage');
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('all_feedbacks');
      const data = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(data)) {
        setFeedbacks([]);
        calculateStats([]);
        return;
      }
      setFeedbacks(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      calculateStats(data);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setFeedbacks([]);
      calculateStats([]);
    }
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({ total: 0, average: 0, positive: 0, negative: 0 });
      return;
    }

    const total = data.length;
    const validRatings = data.filter(f => f.rating && f.rating > 0);
    const sum = validRatings.reduce((acc, f) => acc + (f.rating || 0), 0);
    const average = validRatings.length > 0 ? parseFloat((sum / validRatings.length).toFixed(1)) : 0;
    const positive = data.filter(f => f.rating >= 4).length;
    const negative = data.filter(f => f.rating <= 2 && f.rating > 0).length;

    setStats({ total, average, positive, negative });
  };

  // ✅ Stats Cards Data - Same as Hospitals page
  const statsCards = [
    {
      title: 'Total Feedbacks',
      value: stats.total,
      icon: <RateReview />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Average Rating',
      value: stats.average || 'N/A',
      icon: <Star />,
      color: colors.accentGold,
      bg: 'rgba(201, 162, 39, 0.08)',
    },
    {
      title: 'Positive (4-5⭐)',
      value: stats.positive,
      icon: <ThumbUp />,
      color: colors.success,
      bg: 'rgba(34, 197, 94, 0.08)',
    },
    {
      title: 'Negative (1-2⭐)',
      value: stats.negative,
      icon: <ThumbDown />,
      color: colors.error,
      bg: 'rgba(239, 68, 68, 0.08)',
    },
  ];

  // ✅ Handle card click with prominent effect
  const handleCardClick = (index) => {
    setClickedCardIndex(index);
    setProminentActive(true);
    
    setTimeout(() => {
      setProminentActive(false);
      setClickedCardIndex(null);
    }, 2000);
  };

  const handleDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('❌ Only SUPER_ADMIN can delete feedback!');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Feedback deleted successfully!');
        loadFeedbacks();
      } else {
        deleteFromLocalStorage(id);
      }
    } catch (error) {
      console.error('API Delete error:', error);
      deleteFromLocalStorage(id);
    }
    setDeleteDialog({ open: false, id: null });
  };

  const deleteFromLocalStorage = (id) => {
    if (!isSuperAdmin) {
      toast.error('❌ Only SUPER_ADMIN can delete feedback!');
      return;
    }

    try {
      const stored = localStorage.getItem('all_feedbacks');
      let data = stored ? JSON.parse(stored) : [];
      data = data.filter(f => f.id !== id);
      localStorage.setItem('all_feedbacks', JSON.stringify(data));
      setFeedbacks(data);
      calculateStats(data);
      toast.success('Feedback deleted from local storage!');
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const handleRefresh = () => {
    loadFeedbacks();
    toast.info('Feedbacks refreshed!');
  };

  const handleExport = () => {
    if (feedbacks.length === 0) {
      toast.warning('No feedbacks to export');
      return;
    }
    const data = JSON.stringify(feedbacks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedbacks_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Feedbacks exported successfully!');
  };

  const handleView = (feedback) => {
    setViewDialog({ open: true, feedback });
  };

  const handleViewClose = () => {
    setViewDialog({ open: false, feedback: null });
  };

  const handleFeedbackOpen = () => {
    setFeedbackDialogOpen(true);
    setFeedbackRating(0);
    setFeedbackMessage('');
    setFeedbackHospital(user?.hospital_name || '');
    setFeedbackAdmin(user?.full_name || '');
  };

  const handleFeedbackClose = () => {
    setFeedbackDialogOpen(false);
    setFeedbackRating(0);
    setFeedbackMessage('');
    setFeedbackHospital('');
    setFeedbackAdmin('');
    setFeedbackSubmitting(false);
  };

  const saveFeedbackToLocalStorage = (feedbackData) => {
    try {
      let existingFeedbacks = [];
      const stored = localStorage.getItem('all_feedbacks');
      if (stored) {
        existingFeedbacks = JSON.parse(stored);
        if (!Array.isArray(existingFeedbacks)) {
          existingFeedbacks = [];
        }
      }
      
      feedbackData.id = Date.now() + Math.random() * 1000;
      existingFeedbacks.push(feedbackData);
      localStorage.setItem('all_feedbacks', JSON.stringify(existingFeedbacks));
      localStorage.setItem('feedbacks', JSON.stringify(existingFeedbacks));
      
      toast.success('✨ Feedback saved locally! (Server unavailable)', {
        style: {
          background: colors.darkNavy,
          color: colors.lightCyan,
        },
      });
      setFeedbackDialogOpen(false);
      setFeedbackRating(0);
      setFeedbackMessage('');
      setFeedbackHospital('');
      setFeedbackAdmin('');
      setFeedbackSubmitting(false);
      loadFeedbacks();
      return true;
    } catch (e) {
      console.error('LocalStorage save error:', e);
      return false;
    }
  };

  // ✅ UPDATED: handleFeedbackSubmit with Rating Required validation
  const handleFeedbackSubmit = async () => {
    // ✅ Message validation
    if (!feedbackMessage || !feedbackMessage.trim()) {
      toast.warning('⚠️ Please write your feedback!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    // ✅ Rating validation - REQUIRED
    if (feedbackRating === 0) {
      toast.warning('⚠️ Please rate your experience!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setFeedbackSubmitting(true);

    try {
      const token = getToken();
      
      const feedbackData = {
        user_name: user?.full_name || user?.email || 'Anonymous User',
        email: user?.email || 'No email',
        rating: feedbackRating,  // ✅ Rating required hai, 0 nahi hoga
        message: feedbackMessage.trim(),
        hospital_name: feedbackHospital || user?.hospital_name || '',
        admin_name: feedbackAdmin || user?.full_name || '',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✨ Thank you for your valuable feedback!', {
          position: 'top-right',
          autoClose: 4000,
          style: {
            background: colors.darkNavy,
            color: colors.lightCyan,
          },
        });
        setFeedbackDialogOpen(false);
        setFeedbackRating(0);
        setFeedbackMessage('');
        setFeedbackHospital('');
        setFeedbackAdmin('');
        setFeedbackSubmitting(false);
        loadFeedbacks();
      } else {
        console.warn('⚠️ API returned error:', data.message);
        const saved = saveFeedbackToLocalStorage(feedbackData);
        if (!saved) {
          toast.error('❌ Failed to submit feedback. Please try again.', {
            position: 'top-right',
            autoClose: 4000,
          });
        }
        setFeedbackSubmitting(false);
      }
    } catch (error) {
      console.error('❌ API Error:', error);
      
      const feedbackData = {
        user_name: user?.full_name || user?.email || 'Anonymous User',
        email: user?.email || 'No email',
        rating: feedbackRating,  // ✅ Rating required hai
        message: feedbackMessage.trim(),
        hospital_name: feedbackHospital || user?.hospital_name || '',
        admin_name: feedbackAdmin || user?.full_name || '',
        timestamp: new Date().toISOString(),
      };
      
      const saved = saveFeedbackToLocalStorage(feedbackData);
      if (!saved) {
        toast.error('❌ Failed to submit feedback. Please try again.', {
          position: 'top-right',
          autoClose: 4000,
        });
      }
      setFeedbackSubmitting(false);
    }
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesRating = filterRating === 'all' || f.rating === parseInt(filterRating);
    const matchesSearch = (f.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.hospital_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.admin_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesSearch;
  });

  const getRatingLabel = (rating) => {
    if (!rating || rating === 0) return 'Not Rated';
    const labels = {
      5: 'Excellent',
      4: 'Good',
      3: 'Average',
      2: 'Poor',
      1: 'Very Poor',
    };
    return labels[rating] || '';
  };

  const getRatingColor = (rating) => {
    if (!rating || rating === 0) return colors.secondaryText;
    const colorsMap = {
      5: colors.success,
      4: colors.info,
      3: colors.warning,
      2: colors.error,
      1: colors.error,
    };
    return colorsMap[rating] || colors.secondaryText;
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography sx={{ fontFamily: FONT_FAMILY, color: colors.lightText }}>
          Loading feedbacks...
        </Typography>
      </Box>
    );
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
            Feedback Management
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              fontFamily: FONT_FAMILY,
              mt: 0.5,
            }}
          >
            View and manage all user feedback submissions
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
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
            }}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<RateReview />}
            onClick={handleFeedbackOpen}
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
            Give Feedback
          </Button>
        </Box>
      </Box>

      {/* ===== STATS CARDS - Same as Hospitals page ===== */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => {
          const isClicked = clickedCardIndex === index && prominentActive;
          
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
                  onClick={() => handleCardClick(index)}
                  className={isClicked ? 'prominent-active' : ''}
                >
                  {/* Prominent Glow Overlay */}
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
                    
                    {/* Prominent indicator dots */}
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
          );
        })}
      </Grid>

      {/* ===== SEARCH & FILTER ===== */}
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
            placeholder="Search feedback by name, hospital, admin..."
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
          
          <TextField
            select
            size="small"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            sx={{ minWidth: 130 }}
            label="Filter by Rating"
          >
            <MenuItem value="all">All Ratings</MenuItem>
            <MenuItem value="5">5 ★</MenuItem>
            <MenuItem value="4">4 ★</MenuItem>
            <MenuItem value="3">3 ★</MenuItem>
            <MenuItem value="2">2 ★</MenuItem>
            <MenuItem value="1">1 ★</MenuItem>
            <MenuItem value="0">Not Rated</MenuItem>
          </TextField>
          
          <Button 
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={feedbacks.length === 0}
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

      {/* ===== FEEDBACKS LIST ===== */}
      {filteredFeedbacks.length === 0 ? (
        <Paper
          elevation={2}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: 'white',
          }}
        >
          <RateReview sx={{ fontSize: 60, color: colors.secondaryText, mb: 2 }} />
          <Typography
            variant="h6"
            sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}
          >
            No feedbacks found
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colors.secondaryText, fontFamily: FONT_FAMILY }}
          >
            {feedbacks.length === 0
              ? 'No feedback has been submitted yet. Click "Give Feedback" to submit.'
              : 'Try adjusting your filters or search terms.'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredFeedbacks.map((feedback, index) => (
            <Fade in timeout={300 + index * 50} key={feedback.id || feedback.id}>
              <Card
                elevation={1}
                sx={{
                  borderRadius: 3,
                  bgcolor: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                  },
                  borderLeft: feedback.rating && feedback.rating > 0 
                    ? `6px solid ${getRatingColor(feedback.rating)}` 
                    : `6px solid ${colors.secondaryText}`,
                  overflow: 'hidden',
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: feedback.rating && feedback.rating > 0 
                          ? getRatingColor(feedback.rating) 
                          : colors.secondaryText,
                        width: 44,
                        height: 44,
                        fontFamily: FONT_FAMILY,
                        fontWeight: 700,
                      }}
                    >
                      {(feedback.user_name || 'A').charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  action={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View full feedback">
                        <IconButton
                          onClick={() => handleView(feedback)}
                          sx={{
                            color: colors.lightCyan,
                            '&:hover': {
                              backgroundColor: `rgba(103, 232, 249, 0.1)`,
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {isSuperAdmin && (
                        <Tooltip title="Delete feedback (Super Admin only)">
                          <IconButton
                            onClick={() => setDeleteDialog({ open: true, id: feedback.id })}
                            sx={{
                              color: colors.secondaryText,
                              '&:hover': { 
                                color: colors.error,
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              },
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  }
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: colors.darkNavy,
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {feedback.user_name || 'Anonymous'}
                      </Typography>
                      {feedback.rating && feedback.rating > 0 ? (
                        <>
                          <Rating
                            value={feedback.rating}
                            readOnly
                            size="small"
                            sx={{
                              '& .MuiRating-iconFilled': {
                                color: colors.accentGold,
                              },
                            }}
                          />
                          <Chip
                            label={getRatingLabel(feedback.rating)}
                            size="small"
                            sx={{
                              bgcolor: getRatingColor(feedback.rating),
                              color: colors.text,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </>
                      ) : (
                        <Chip
                          label="Not Rated"
                          size="small"
                          sx={{
                            bgcolor: colors.secondaryText,
                            color: colors.text,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.lightText }}>
                        <AccessTime sx={{ fontSize: 14 }} />
                        <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY }}>
                          {formatDate(feedback.created_at || feedback.timestamp)}
                        </Typography>
                      </Box>
                      {feedback.user_email && feedback.user_email !== 'No email' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.lightText }}>
                          <Email sx={{ fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY }}>
                            {feedback.user_email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  sx={{ pb: 0 }}
                />

                <CardContent>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'rgba(103, 232, 249, 0.04)',
                      borderRadius: 2,
                      border: `1px solid rgba(103, 232, 249, 0.08)`,
                      mb: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(103, 232, 249, 0.08)',
                        borderColor: colors.lightCyan,
                      },
                    }}
                    onClick={() => handleView(feedback)}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.darkText,
                        fontFamily: FONT_FAMILY,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.8,
                        fontSize: '0.95rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      <Comment sx={{ fontSize: 16, color: colors.lightCyan, mr: 1, verticalAlign: 'middle' }} />
                      {feedback.message || 'No message provided'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.lightCyan,
                        fontFamily: FONT_FAMILY,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      <Visibility sx={{ fontSize: 14 }} />
                      Click to view full feedback
                    </Typography>
                  </Paper>

                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {feedback.hospital_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalHospital sx={{ color: colors.lightCyan, fontSize: 18 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: colors.lightText,
                            fontFamily: FONT_FAMILY,
                          }}
                        >
                          <strong>Hospital:</strong> {feedback.hospital_name}
                        </Typography>
                      </Box>
                    )}
                    {feedback.admin_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AdminPanelSettings sx={{ color: colors.lightCyan, fontSize: 18 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: colors.lightText,
                            fontFamily: FONT_FAMILY,
                          }}
                        >
                          <strong>Admin:</strong> {feedback.admin_name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          ))}
        </Stack>
      )}

      {/* ===== VIEW FEEDBACK DIALOG ===== */}
      <Dialog
        open={viewDialog.open}
        onClose={handleViewClose}
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
              <RateReview sx={{ fontSize: 28 }} />
              Feedback Details
            </Typography>
            <IconButton onClick={handleViewClose} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {viewDialog.feedback && (
          <DialogContent sx={{ pt: 3, px: 4 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: viewDialog.feedback.rating && viewDialog.feedback.rating > 0 
                      ? getRatingColor(viewDialog.feedback.rating) 
                      : colors.secondaryText,
                    width: 56,
                    height: 56,
                    fontFamily: FONT_FAMILY,
                    fontWeight: 700,
                    fontSize: '1.2rem',
                  }}
                >
                  {(viewDialog.feedback.user_name || 'A').charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: colors.darkNavy,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {viewDialog.feedback.user_name || 'Anonymous'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {viewDialog.feedback.user_email && viewDialog.feedback.user_email !== 'No email' && (
                      <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                        📧 {viewDialog.feedback.user_email}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                      🕐 {formatDate(viewDialog.feedback.created_at || viewDialog.feedback.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: colors.darkNavy,
                    mb: 1,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Rating:
                </Typography>
                {viewDialog.feedback.rating && viewDialog.feedback.rating > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Rating
                      value={viewDialog.feedback.rating}
                      readOnly
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: colors.accentGold,
                        },
                      }}
                    />
                    <Chip
                      label={getRatingLabel(viewDialog.feedback.rating)}
                      size="small"
                      sx={{
                        bgcolor: getRatingColor(viewDialog.feedback.rating),
                        color: colors.text,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                ) : (
                  <Chip
                    label="Not Rated"
                    size="small"
                    sx={{
                      bgcolor: colors.secondaryText,
                      color: colors.text,
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {viewDialog.feedback.hospital_name && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: colors.darkNavy,
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      🏥 Hospital
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: colors.lightText,
                        fontFamily: FONT_FAMILY,
                        mt: 0.5,
                      }}
                    >
                      {viewDialog.feedback.hospital_name}
                    </Typography>
                  </Box>
                )}
                {viewDialog.feedback.admin_name && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: colors.darkNavy,
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      👤 Admin
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: colors.lightText,
                        fontFamily: FONT_FAMILY,
                        mt: 0.5,
                      }}
                    >
                      {viewDialog.feedback.admin_name}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: colors.darkNavy,
                    mb: 1,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  💬 Feedback Message
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: 'rgba(103, 232, 249, 0.06)',
                    borderRadius: 2,
                    border: `2px solid rgba(103, 232, 249, 0.15)`,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: colors.darkText,
                      fontFamily: FONT_FAMILY,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 2,
                      fontSize: '1rem',
                    }}
                  >
                    {viewDialog.feedback.message || 'No message provided'}
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          </DialogContent>
        )}

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleViewClose}
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

      {/* ===== GIVE FEEDBACK DIALOG ===== */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={handleFeedbackClose}
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
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <RateReview sx={{ fontSize: 28 }} />
              Share Your Feedback
            </Typography>
            <IconButton onClick={handleFeedbackClose} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, px: 4 }}>
          <Stack spacing={3}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'rgba(103, 232, 249, 0.05)',
                borderRadius: 2,
                border: `1px solid rgba(103, 232, 249, 0.1)`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: colors.lightText,
                  fontFamily: FONT_FAMILY,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Person sx={{ fontSize: 16 }} />
                Submitting as: <strong>{user?.full_name || user?.email || 'Anonymous User'}</strong>
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Hospital Name"
              value={feedbackHospital}
              onChange={(e) => setFeedbackHospital(e.target.value)}
              placeholder="Enter your hospital name"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  color: colors.lightText,
                  fontFamily: FONT_FAMILY,
                },
                '& .MuiInputBase-input': {
                  fontFamily: FONT_FAMILY,
                }
              }}
              InputProps={{
                startAdornment: (
                  <LocalHospital sx={{ color: colors.lightText, mr: 1 }} />
                ),
              }}
            />

            <TextField
              fullWidth
              label="Admin Name"
              value={feedbackAdmin}
              onChange={(e) => setFeedbackAdmin(e.target.value)}
              placeholder="Enter your name"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  color: colors.lightText,
                  fontFamily: FONT_FAMILY,
                },
                '& .MuiInputBase-input': {
                  fontFamily: FONT_FAMILY,
                }
              }}
              InputProps={{
                startAdornment: (
                  <Person sx={{ color: colors.lightText, mr: 1 }} />
                ),
              }}
            />

            {/* ✅ UPDATED: Rating section with Required label and validation hint */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: colors.darkNavy,
                  mb: 1.5,
                  fontFamily: FONT_FAMILY,
                }}
              >
                Rate your experience (Required) ⭐
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Rating
                  value={feedbackRating}
                  onChange={(event, newValue) => {
                    setFeedbackRating(newValue || 0);
                  }}
                  size="large"
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: colors.accentGold,
                    },
                    '& .MuiRating-iconHover': {
                      color: colors.goldLight,
                    },
                  }}
                />
              </Box>
              {feedbackRating > 0 ? (
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.lightText,
                    display: 'block',
                    textAlign: 'center',
                    mt: 0.5,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  You selected {feedbackRating} star{feedbackRating > 1 ? 's' : ''}
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.error,
                    display: 'block',
                    textAlign: 'center',
                    mt: 0.5,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  ⚠️ Please select a rating
                </Typography>
              )}
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'rgba(103, 232, 249, 0.04)',
                borderRadius: 2,
                border: `2px solid ${colors.lightCyan}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: colors.lightCyanDark,
                  boxShadow: `0 0 20px ${colors.lightCyanGlow}`,
                },
              }}
            >
              <TextField
                fullWidth
                label="Your Feedback"
                multiline
                rows={5}
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Please share your feedback, suggestions, or report any issues..."
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    '&:hover fieldset': { borderColor: colors.lightCyanDark },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 600,
                    color: colors.darkNavy,
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Comment sx={{ color: colors.lightCyan, mr: 1, mt: 1 }} />
                  ),
                }}
              />
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleFeedbackClose}
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
            onClick={handleFeedbackSubmit}
            variant="contained"
            disabled={feedbackSubmitting}
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
            startIcon={<Send />}
          >
            {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== DELETE CONFIRMATION DIALOG ===== */}
      {isSuperAdmin && (
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, id: null })}
          maxWidth="xs"
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
            py: 2,
          }}>
            <Typography sx={{ fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Delete sx={{ color: colors.error }} />
              Delete Feedback
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, px: 4 }}>
            <Typography sx={{ fontFamily: FONT_FAMILY, color: colors.lightText }}>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              onClick={() => setDeleteDialog({ open: false, id: null })}
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
              onClick={() => handleDelete(deleteDialog.id)}
              color="error"
              variant="contained"
              sx={{ 
                fontFamily: FONT_FAMILY,
                textTransform: 'none',
                borderRadius: 2,
                px: 4,
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Feedback;