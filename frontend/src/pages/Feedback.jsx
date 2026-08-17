// src/pages/Feedback.jsx
// ✅ Feedback Page - View all feedbacks with filters and stats
// ✅ Added: View Button to see full feedback
// ✅ Added: Theme matches MainLayout (Dark Navy + Light Cyan)
// ✅ Added: Engineer cannot delete feedback (only SUPER_ADMIN)
// ✅ Added: Hospital Name & Admin Name fields

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
  Divider,
  Avatar,
  LinearProgress,
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
  useTheme,
  useMediaQuery,
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
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const colors = {
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
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
  lightText: '#64748B',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const FONT_FAMILY = "'Satoshi', 'Segoe UI', 'Roboto', sans-serif";

const API_URL = 'http://localhost:5000/api';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [viewDialog, setViewDialog] = useState({ open: false, feedback: null });
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get auth token and user
  const getToken = () => localStorage.getItem('token');
  const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

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

  // Fallback: Load from localStorage
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
      setStats({ total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      return;
    }

    const total = data.length;
    const validRatings = data.filter(f => f.rating && f.rating > 0);
    const sum = validRatings.reduce((acc, f) => acc + (f.rating || 0), 0);
    const average = validRatings.length > 0 ? parseFloat((sum / validRatings.length).toFixed(1)) : 0;
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(f => {
      const rating = f.rating || 0;
      if (rating >= 1 && rating <= 5) {
        distribution[rating] = (distribution[rating] || 0) + 1;
      }
    });

    setStats({ total, average, distribution });
  };

  const handleDelete = async (id) => {
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

  // Handle View
  const handleView = (feedback) => {
    setViewDialog({ open: true, feedback });
  };

  const handleViewClose = () => {
    setViewDialog({ open: false, feedback: null });
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

  // Check if user is SUPER_ADMIN (can delete)
  const user = getUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1,
            }}
          >
            <RateReview sx={{ color: colors.lightCyan, fontSize: 35 }} />
            Feedback Management
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}
          >
            View and manage all user feedback submissions 
            <strong style={{ color: colors.darkNavy, marginLeft: '8px' }}>
              ({feedbacks.length} total)
            </strong>
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Grow in timeout={300}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${colors.darkNavy}, ${colors.darkNavyLight})`,
                  color: colors.text,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ opacity: 0.7, fontSize: '0.85rem', fontFamily: FONT_FAMILY }}>
                      Total Feedbacks
                    </Typography>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, fontFamily: FONT_FAMILY }}>
                      {stats.total}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(103, 232, 249, 0.15)', borderRadius: '50%', p: 1 }}>
                    <RateReview sx={{ color: colors.lightCyan, fontSize: 28 }} />
                  </Box>
                </Box>
              </Paper>
            </Grow>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Grow in timeout={400}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${colors.accentGold}, ${colors.goldLight})`,
                  color: colors.darkNavy,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ opacity: 0.7, fontSize: '0.85rem', fontFamily: FONT_FAMILY }}>
                      Average Rating
                    </Typography>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, fontFamily: FONT_FAMILY }}>
                      {stats.average || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.1)', borderRadius: '50%', p: 1 }}>
                    <Star sx={{ color: colors.darkNavy, fontSize: 28 }} />
                  </Box>
                </Box>
              </Paper>
            </Grow>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Grow in timeout={500}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${colors.success}, #15803D)`,
                  color: colors.text,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ opacity: 0.7, fontSize: '0.85rem', fontFamily: FONT_FAMILY }}>
                      Positive (4-5⭐)
                    </Typography>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, fontFamily: FONT_FAMILY }}>
                      {feedbacks.filter(f => f.rating >= 4).length}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '50%', p: 1 }}>
                    <ThumbUp sx={{ color: colors.text, fontSize: 28 }} />
                  </Box>
                </Box>
              </Paper>
            </Grow>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Grow in timeout={600}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${colors.error}, #B91C1C)`,
                  color: colors.text,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ opacity: 0.7, fontSize: '0.85rem', fontFamily: FONT_FAMILY }}>
                      Negative (1-2⭐)
                    </Typography>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, fontFamily: FONT_FAMILY }}>
                      {feedbacks.filter(f => f.rating <= 2 && f.rating > 0).length}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '50%', p: 1 }}>
                    <ThumbDown sx={{ color: colors.text, fontSize: 28 }} />
                  </Box>
                </Box>
              </Paper>
            </Grow>
          </Grid>
        </Grid>

        {/* Rating Distribution */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            mb: 4,
            bgcolor: 'white',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: colors.darkNavy,
              mb: 2,
              fontFamily: FONT_FAMILY,
            }}
          >
            Rating Distribution
          </Typography>
          <Grid container spacing={2}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const color = getRatingColor(rating);
              
              return (
                <Grid item xs={12} key={rating}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ minWidth: 80, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: FONT_FAMILY }}>
                        {rating} ★
                      </Typography>
                      <Typography sx={{ color: colors.lightText, fontSize: '0.75rem', fontFamily: FONT_FAMILY }}>
                        ({count})
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(0,0,0,0.05)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: color,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        minWidth: 45,
                        fontSize: '0.75rem',
                        color: colors.lightText,
                        fontFamily: FONT_FAMILY,
                        textAlign: 'right',
                      }}
                    >
                      {percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
            {/* Not Rated */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ minWidth: 80, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: FONT_FAMILY, color: colors.secondaryText }}>
                    Not Rated
                  </Typography>
                  <Typography sx={{ color: colors.lightText, fontSize: '0.75rem', fontFamily: FONT_FAMILY }}>
                    ({feedbacks.filter(f => !f.rating || f.rating === 0).length})
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={stats.total > 0 ? (feedbacks.filter(f => !f.rating || f.rating === 0).length / stats.total) * 100 : 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colors.secondaryText,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    minWidth: 45,
                    fontSize: '0.75rem',
                    color: colors.lightText,
                    fontFamily: FONT_FAMILY,
                    textAlign: 'right',
                  }}
                >
                  {stats.total > 0 ? ((feedbacks.filter(f => !f.rating || f.rating === 0).length / stats.total) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Filters & Actions */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            borderRadius: 3,
            mb: 3,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            bgcolor: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap' }}>
            <FilterList sx={{ color: colors.lightText }} />
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
            <TextField
              size="small"
              placeholder="Search by name, hospital, admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                ),
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export as JSON">
              <IconButton onClick={handleExport} size="small" disabled={feedbacks.length === 0}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Feedbacks List */}
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
                        {/* ✅ View Button */}
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
                        
                        {/* ✅ Delete Button - Only SUPER_ADMIN can delete */}
                        {isSuperAdmin && (
                          <Tooltip title="Delete feedback">
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
                    {/* Feedback Message Box - Preview */}
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

                    {/* Hospital & Admin Info */}
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
      </Container>

      {/* ✅ View Feedback Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={handleViewClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, 
              rgba(255, 255, 255, 0.98) 0%, 
              rgba(248, 250, 252, 0.95) 100%
            )`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 20px 80px rgba(0,0,0,0.2)`,
            border: `1px solid rgba(103, 232, 249, 0.15)`,
            p: 2,
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
            borderBottom: `1px solid rgba(103, 232, 249, 0.1)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RateReview sx={{ color: colors.lightCyan, fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.darkNavy,
                fontFamily: FONT_FAMILY,
              }}
            >
              Feedback Details
            </Typography>
          </Box>
          <IconButton onClick={handleViewClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {viewDialog.feedback && (
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              {/* User Info */}
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

              {/* Rating */}
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

              {/* Hospital & Admin */}
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

              {/* Full Feedback Message */}
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

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleViewClose}
            sx={{
              color: colors.lightText,
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete sx={{ color: colors.error }} />
          Delete Feedback
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: FONT_FAMILY, color: colors.lightText }}>
            Are you sure you want to delete this feedback? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null })}
            sx={{ fontFamily: FONT_FAMILY }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteDialog.id)}
            color="error"
            variant="contained"
            sx={{ fontFamily: FONT_FAMILY }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Feedback;