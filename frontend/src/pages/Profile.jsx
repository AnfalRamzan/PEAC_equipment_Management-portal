import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  Card,
  CardContent,
  Chip,
  LinearProgress
} from '@mui/material'
import {
  AccountCircle,
  Email,
  Phone,
  Business,
  Badge,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material'
import { useSelector } from 'react-redux'

const Profile = () => {
  const { user } = useSelector((state) => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = () => {
    // In production, this would call an API
    setIsEditing(false)
  }

  if (!user) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50', mb: 3 }}>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                bgcolor: '#0B5FA5',
                fontSize: 48,
                fontWeight: 600
              }}
            >
              {user.full_name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
              {user.full_name}
            </Typography>
            <Chip
              label={user.role}
              color="primary"
              sx={{ mt: 1 }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {user.email}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Badge fontSize="small" color="action" />
                Role: <strong>{user.role}</strong>
              </Typography>
              {user.hospital_id && (
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" color="action" />
                  Hospital ID: <strong>{user.hospital_id}</strong>
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Profile Edit Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Personal Information
              </Typography>
              <Button
                variant={isEditing ? 'outlined' : 'contained'}
                startIcon={isEditing ? <Cancel /> : <Edit />}
                onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                color={isEditing ? 'error' : 'primary'}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <AccountCircle sx={{ mr: 1, color: '#6c757d' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: '#6c757d' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: '#6c757d' }} />
                  }}
                />
              </Grid>
            </Grid>

            {isEditing && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  sx={{
                    bgcolor: '#0B5FA5',
                    '&:hover': { bgcolor: '#084a8a' }
                  }}
                >
                  Save Changes
                </Button>
              </Box>
            )}
          </Paper>

          {/* Account Security */}
          <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Account Security
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mr: 2 }}
            >
              Change Password
            </Button>
            <Button variant="outlined" color="error">
              Deactivate Account
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Profile