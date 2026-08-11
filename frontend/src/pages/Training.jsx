// src/pages/Training.jsx
// ✅ COMPLETE TRAINING MANAGEMENT PAGE
// ✅ WHITE BACKGROUND - Matching sidebar theme
// ✅ DARK NAVY + LIGHT CYAN THEME
// ✅ All CRUD operations working
// ✅ Participant management
// ✅ Stats cards
// ✅ Tabs for filtering
// ✅ Search and filters

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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import api from '../api/axios';

// ============================================================
// ✅ THEME COLORS - MATCHING SIDEBAR
// ============================================================
const colors = {
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textLight: '#64748B',
  textWhite: '#FFFFFF',
  bgWhite: '#FFFFFF',
  bgLight: '#F8FAFC',
  bgGray: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  borderColor: 'rgba(103, 232, 249, 0.2)',
  borderDark: '#E2E8F0',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// ============================================================
// ✅ STATS CARD COMPONENT
// ============================================================
const StatsCard = ({ title, value, icon, color, bgColor, subtitle }) => (
  <Card sx={{
    borderRadius: 3,
    border: `1px solid ${colors.borderColor}`,
    bgcolor: colors.cardBg,
    boxShadow: `0 2px 8px ${colors.cardShadow}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 30px ${colors.cardShadow}`,
      borderColor: color || colors.darkNavy,
    },
    height: '100%'
  }}>
    <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
      <Avatar sx={{
        bgcolor: bgColor || color || colors.darkNavy,
        width: 40,
        height: 40,
        mx: 'auto',
        mb: 1,
        boxShadow: `0 4px 16px ${color || colors.darkNavy}44`
      }}>
        {icon}
      </Avatar>
      <Typography variant="h4" sx={{ color: color || colors.darkNavy, fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.textLight, fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: colors.textLight, display: 'block', mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ============================================================
// ✅ TRAINING COMPONENT
// ============================================================
const Training = () => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isEngineer = user?.role === 'ENGINEER';

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openParticipantDialog, setOpenParticipantDialog] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [viewingTraining, setViewingTraining] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, local: 0, foreign: 0, inProgress: 0, completed: 0 });
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

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

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  useEffect(() => {
    fetchTrainings();
    fetchStats();
    if (isSuperAdmin || isEngineer) {
      fetchUsers();
    }
  }, []);

  // ============================================================
  // ✅ HANDLERS
  // ============================================================
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (training = null) => {
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
    setOpenViewDialog(true);
  };

  const handleCloseView = () => {
    setOpenViewDialog(false);
    setViewingTraining(null);
  };

  const handleOpenParticipantDialog = (training) => {
    setSelectedTraining(training);
    setSelectedUserId('');
    setOpenParticipantDialog(true);
  };

  const handleCloseParticipantDialog = () => {
    setOpenParticipantDialog(false);
    setSelectedTraining(null);
    setSelectedUserId('');
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
  };

  // ============================================================
  // ✅ CRUD OPERATIONS
  // ============================================================
  const handleSubmit = async () => {
    try {
      if (!formData.title) {
        toast.error('Training title is required');
        return;
      }

      const submitData = {
        ...formData,
        participants_count: parseInt(formData.participants_count) || 0,
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
    }
  };

  const handleDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete trainings');
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

  const handleAddParticipant = async () => {
    if (!selectedUserId) {
      toast.error('Please select a participant');
      return;
    }
    try {
      await api.post(`/training/${selectedTraining.id}/participants`, {
        user_id: parseInt(selectedUserId),
      });
      toast.success('Participant added successfully');
      fetchTrainings();
      handleCloseParticipantDialog();
    } catch (error) {
      console.error('Add participant error:', error);
      toast.error(error.response?.data?.message || 'Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (trainingId, userId) => {
    if (!window.confirm('Remove this participant?')) return;
    try {
      await api.delete(`/training/${trainingId}/participants/${userId}`);
      toast.success('Participant removed successfully');
      fetchTrainings();
    } catch (error) {
      console.error('Remove participant error:', error);
      toast.error('Failed to remove participant');
    }
  };

  // ============================================================
  // ✅ HELPERS
  // ============================================================
  const getStatusChip = (status) => {
    const config = {
      pending: { color: colors.warning, label: 'Pending', icon: <Schedule sx={{ fontSize: 14 }} /> },
      in_progress: { color: colors.info, label: 'In Progress', icon: <PlayArrow sx={{ fontSize: 14 }} /> },
      completed: { color: colors.success, label: 'Completed', icon: <Check sx={{ fontSize: 14 }} /> },
      cancelled: { color: colors.error, label: 'Cancelled', icon: <Cancel sx={{ fontSize: 14 }} /> },
    };
    const s = config[status] || config.pending;
    return (
      <Chip
        label={s.label}
        size="small"
        icon={s.icon}
        sx={{ bgcolor: s.color, color: colors.textWhite, fontWeight: 500, height: 24 }}
      />
    );
  };

  const getTypeChip = (type) => {
    if (type === 'foreign') {
      return (
        <Chip
          icon={<Public sx={{ fontSize: 14 }} />}
          label="Foreign"
          size="small"
          sx={{ bgcolor: colors.info, color: colors.textWhite, fontWeight: 500, height: 24 }}
        />
      );
    }
    return (
      <Chip
        icon={<Home sx={{ fontSize: 14 }} />}
        label="Local"
        size="small"
        sx={{ bgcolor: colors.darkNavy, color: colors.textWhite, fontWeight: 500, height: 24 }}
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

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.bgGray, '& .MuiLinearProgress-bar': { bgcolor: colors.darkNavy } }} />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: colors.bgWhite, minHeight: '100vh' }}>
      {/* ============================================================
          HEADER
          ============================================================ */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: colors.darkNavy,
            '&::after': {
              content: '""',
              display: 'block',
              width: '40px',
              height: '3px',
              background: `linear-gradient(90deg, ${colors.accentGold}, ${colors.darkNavy})`,
              borderRadius: '2px',
              marginTop: '4px',
            }
          }}>
            Training Management
          </Typography>
          <Badge
            badgeContent={trainings.length}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: colors.accentGold,
                color: colors.textWhite,
                fontWeight: 700,
              }
            }}
          >
            <School sx={{ fontSize: 32, color: colors.darkNavy }} />
          </Badge>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { fetchTrainings(); fetchStats(); }}
            size="small"
            sx={{
              borderColor: colors.darkNavy,
              color: colors.darkNavy,
              '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark, bgcolor: colors.lightCyanGlow }
            }}
          >
            Refresh
          </Button>
          {(isSuperAdmin || isEngineer) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: colors.darkNavy,
                '&:hover': { bgcolor: colors.darkNavyHover },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2.4}>
          <StatsCard
            title="Total"
            value={stats.total || 0}
            icon={<Assessment sx={{ fontSize: 20, color: colors.textWhite }} />}
            color={colors.darkNavy}
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatsCard
            title="Pending"
            value={stats.pending || 0}
            icon={<Schedule sx={{ fontSize: 20, color: colors.textWhite }} />}
            color={colors.warning}
            bgColor={`${colors.warning}15`}
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatsCard
            title="In Progress"
            value={stats.inProgress || 0}
            icon={<PlayArrow sx={{ fontSize: 20, color: colors.textWhite }} />}
            color={colors.info}
            bgColor={`${colors.info}15`}
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatsCard
            title="Completed"
            value={stats.completed || 0}
            icon={<Check sx={{ fontSize: 20, color: colors.textWhite }} />}
            color={colors.success}
            bgColor={`${colors.success}15`}
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatsCard
            title="Foreign"
            value={stats.foreign || 0}
            icon={<Public sx={{ fontSize: 20, color: colors.textWhite }} />}
            color={colors.accentGold}
            bgColor={`${colors.accentGold}15`}
          />
        </Grid>
      </Grid>

      {/* ============================================================
          TABS
          ============================================================ */}
      <Paper sx={{
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: `0 2px 8px ${colors.cardShadow}`,
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
              color: colors.textLight,
            },
            '& .Mui-selected': {
              color: colors.darkNavy,
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.accentGold,
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
          SEARCH & FILTERS
          ============================================================ */}
      <Paper sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: `0 2px 8px ${colors.cardShadow}`,
        bgcolor: colors.bgWhite,
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
                  <Search sx={{ color: colors.textLight }} />
                </InputAdornment>
              ),
              sx: {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
                }
              }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.textLight }}>Type</InputLabel>
            <Select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              label="Type"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
                }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="local">Local</MenuItem>
              <MenuItem value="foreign">Foreign</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.textLight }}>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              label="Status"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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

          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={clearFilters}
            size="small"
            sx={{
              borderColor: colors.borderDark,
              color: colors.textLight,
              '&:hover': { borderColor: colors.darkNavy, color: colors.darkNavy }
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* ============================================================
          TABLE
          ============================================================ */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          boxShadow: `0 2px 8px ${colors.cardShadow}`,
          overflowX: 'auto',
          bgcolor: colors.bgWhite,
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600, minWidth: 150 }}>Training</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Trainer</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }} align="center">Participants</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <School sx={{ fontSize: 48, color: colors.textLight, mb: 1 }} />
                    <Typography variant="body1" sx={{ color: colors.textLight }}>
                      No trainings found
                    </Typography>
                    {(isSuperAdmin || isEngineer) && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                          mt: 2,
                          bgcolor: colors.darkNavy,
                          '&:hover': { bgcolor: colors.darkNavyHover },
                          boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                        }}
                      >
                        Create First Training
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTrainings.map((training) => (
                <TableRow
                  key={training.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: colors.bgLight },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.textPrimary }}>
                      {training.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textLight, display: 'block' }}>
                      {training.start_date ? new Date(training.start_date).toLocaleDateString() : 'TBD'}
                      {training.end_date && ` - ${new Date(training.end_date).toLocaleDateString()}`}
                    </Typography>
                  </TableCell>
                  <TableCell>{getTypeChip(training.type)}</TableCell>
                  <TableCell sx={{ color: colors.textLight }}>
                    {training.trainer_name || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.textLight }}>
                    {training.department || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={training.participants_count || 0}
                      size="small"
                      sx={{
                        bgcolor: colors.darkNavy,
                        color: colors.textWhite,
                        fontWeight: 600,
                        minWidth: 30,
                      }}
                    />
                  </TableCell>
                  <TableCell>{getStatusChip(training.status)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleView(training)}
                          sx={{
                            color: colors.darkNavy,
                            '&:hover': { color: colors.lightCyanDark }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {(isSuperAdmin || isEngineer) && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(training)}
                            sx={{
                              color: colors.darkNavy,
                              '&:hover': { color: colors.lightCyanDark }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {(isSuperAdmin || isEngineer) && (
                        <Tooltip title="Add Participant">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenParticipantDialog(training)}
                            sx={{
                              color: colors.info,
                              '&:hover': { color: colors.lightCyanDark }
                            }}
                          >
                            <PersonAdd fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {isSuperAdmin && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(training.id)}
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
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            bgcolor: colors.bgWhite,
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: colors.darkNavy,
          color: colors.textWhite,
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {editingTraining ? 'Edit Training' : 'Add New Training'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: colors.textWhite }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: colors.borderColor }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.textLight }}>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  label="Type"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colors.borderDark },
                      '&:hover fieldset': { borderColor: colors.darkNavy },
                      '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                <InputLabel sx={{ color: colors.textLight }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colors.borderDark },
                      '&:hover fieldset': { borderColor: colors.darkNavy },
                      '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.darkNavy },
                    '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: colors.textLight,
              '&:hover': { backgroundColor: `${colors.darkNavy}08` }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: colors.darkNavy,
              '&:hover': { bgcolor: colors.darkNavyHover },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              px: 4,
            }}
          >
            {editingTraining ? 'Update' : 'Create'}
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
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            bgcolor: colors.bgWhite,
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: colors.darkNavy,
          color: colors.textWhite,
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Training Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: colors.textWhite }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: colors.borderColor }}>
          {viewingTraining && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: colors.darkNavy, width: 56, height: 56 }}>
                  <School sx={{ fontSize: 28, color: colors.textWhite }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600} sx={{ color: colors.textPrimary }}>
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
                  <Typography variant="caption" sx={{ color: colors.textLight }}>Trainer</Typography>
                  <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                    {viewingTraining.trainer_name || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.textLight }}>Department</Typography>
                  <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                    {viewingTraining.department || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.textLight }}>
                    <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    Start Date
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                    {viewingTraining.start_date ? new Date(viewingTraining.start_date).toLocaleDateString() : 'TBD'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.textLight }}>
                    <EventNote sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    End Date
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                    {viewingTraining.end_date ? new Date(viewingTraining.end_date).toLocaleDateString() : 'TBD'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: colors.textLight }}>
                    <LocationOn sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    Location
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                    {viewingTraining.location || '-'}
                  </Typography>
                </Grid>

                {viewingTraining.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.textLight }}>Description</Typography>
                    <Paper sx={{
                      p: 2,
                      bgcolor: colors.bgLight,
                      borderRadius: 2,
                      border: `1px solid ${colors.borderDark}`,
                      mt: 0.5,
                    }}>
                      <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                        {viewingTraining.description}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <People sx={{ color: colors.textLight }} />
                    <Typography variant="subtitle2" sx={{ color: colors.textPrimary }}>
                      Participants ({viewingTraining.participants_count || 0})
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseView}
            variant="contained"
            sx={{
              bgcolor: colors.darkNavy,
              '&:hover': { bgcolor: colors.darkNavyHover },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
            }}
          >
            Close
          </Button>
          {isSuperAdmin && viewingTraining && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(viewingTraining.id);
                handleCloseView();
              }}
              startIcon={<Delete />}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ============================================================
          ADD PARTICIPANT DIALOG
          ============================================================ */}
      <Dialog
        open={openParticipantDialog}
        onClose={handleCloseParticipantDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            bgcolor: colors.bgWhite,
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: colors.info,
          color: colors.textWhite,
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              <PersonAdd sx={{ mr: 1, verticalAlign: 'middle' }} />
              Add Participant
            </Typography>
            <IconButton onClick={handleCloseParticipantDialog} sx={{ color: colors.textWhite }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: colors.borderColor }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Add participant to: <strong>{selectedTraining?.title}</strong>
          </Alert>

          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.textLight }}>Select User</InputLabel>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              label="Select User"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.darkNavy },
                  '&.Mui-focused fieldset': { borderColor: colors.darkNavy }
                }
              }}
            >
              <MenuItem value="">Select a user</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseParticipantDialog}
            sx={{ color: colors.textLight }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddParticipant}
            disabled={!selectedUserId}
            sx={{
              bgcolor: colors.info,
              '&:hover': { bgcolor: '#1D4ED8' },
              boxShadow: `0 4px 16px ${colors.info}44`,
            }}
            startIcon={<PersonAdd />}
          >
            Add Participant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Training;