// src/pages/Feedback.jsx
// ✅ UPDATED: Fetch feedbacks from API instead of localStorage

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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const colors = {
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
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

// ✅ API Base URL
const API_URL = 'http://localhost:5000/api';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  // ✅ Get auth token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // ✅ Load feedbacks from API
  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/feedback`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        const data = response.data.feedbacks || [];
        setFeedbacks(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        calculateStats(data);
      } else {
        toast.error(response.data.message || 'Failed to load feedbacks');
        // ✅ Fallback to localStorage if API fails
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast.warning('API unavailable, loading from local storage');
      // ✅ Fallback to localStorage
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fallback: Load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('feedbacks');
      const data = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(data)) {
        localStorage.setItem('feedbacks', '[]');
        setFeedbacks([]);
        calculateStats([]);
        return;
      }
      setFeedbacks(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      calculateStats(data);
    } catch (error) {
      console.error('Error loading feedbacks from localStorage:', error);
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
    const sum = data.reduce((acc, f) => acc + (f.rating || 0), 0);
    const average = parseFloat((sum / total).toFixed(1));
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(f => {
      const rating = f.rating || 0;
      if (rating >= 1 && rating <= 5) {
        distribution[rating] = (distribution[rating] || 0) + 1;
      }
    });

    setStats({ total, average, distribution });
  };

  // ✅ Delete feedback from API
  const handleDelete = async (id) => {
    try {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/feedback/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success('Feedback deleted successfully!');
        loadFeedbacks(); // Refresh list
      } else {
        toast.error(response.data.message || 'Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      
      // ✅ Fallback: Delete from localStorage
      try {
        const updated = feedbacks.filter(f => f.id !== id);
        localStorage.setItem('feedbacks', JSON.stringify(updated));
        setFeedbacks(updated);
        calculateStats(updated);
        toast.success('Feedback deleted from local storage!');
      } catch (e) {
        toast.error('Failed to delete feedback');
      }
    }
    setDeleteDialog({ open: false, id: null });
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

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesRating = filterRating === 'all' || f.rating === parseInt(filterRating);
    const matchesSearch = (f.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.user || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesSearch;
  });

  const getRatingLabel = (rating) => {
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
            View and manage all user feedback submissions ({feedbacks.length} total)
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
                      {feedbacks.filter(f => f.rating <= 2).length}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
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
            </TextField>
            <TextField
              size="small"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 150 }}
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
                ? 'No feedback has been submitted yet.'
                : 'Try adjusting your filters or search terms.'}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredFeedbacks.map((feedback, index) => (
              <Fade in timeout={300 + index * 50} key={feedback.id}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)',
                    },
                    borderLeft: `4px solid ${getRatingColor(feedback.rating)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: colors.darkNavy,
                          width: 42,
                          height: 42,
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {(feedback.user || 'A').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              color: colors.darkNavy,
                              fontFamily: FONT_FAMILY,
                            }}
                          >
                            {feedback.user || 'Anonymous'}
                          </Typography>
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
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: colors.lightText,
                            fontFamily: FONT_FAMILY,
                            mt: 1,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {feedback.message}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 1.5,
                            color: colors.secondaryText,
                            fontSize: '0.75rem',
                          }}
                        >
                          <AccessTime sx={{ fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY }}>
                            {formatDate(feedback.timestamp)}
                          </Typography>
                          {feedback.email && feedback.email !== 'No email' && (
                            <>
                              <Divider orientation="vertical" flexItem />
                              <Email sx={{ fontSize: 14 }} />
                              <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY }}>
                                {feedback.email}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Tooltip title="Delete feedback">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, id: feedback.id })}
                        sx={{
                          color: colors.secondaryText,
                          '&:hover': { color: colors.error },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Fade>
            ))}
          </Stack>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: FONT_FAMILY }}>
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