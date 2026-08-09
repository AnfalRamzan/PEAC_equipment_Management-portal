import React, { useState } from 'react'
import { 
  Box, Container, Paper, TextField, Button, Typography, 
  Alert, InputAdornment, IconButton 
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../redux/slices/authSlice'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      const result = await dispatch(login(formData))
      if (!result.error) {
        navigate('/dashboard')
      }
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #0B5FA5 0%, #1a7fc9 100%)', 
      padding: 2 
    }}>
      <Container maxWidth="sm">
        <Paper elevation={24} sx={{ 
          p: 5, 
          borderRadius: 4, 
          backgroundColor: 'rgba(255,255,255,0.95)',
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <img 
                src="/logo.png" 
                alt="PAEC Logo" 
                style={{ 
                  height: '120px', 
                  width: 'auto',
                  borderRadius: '12px'
                }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B5FA5' }}>
              PAEC Equipment Management Portal
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#6c757d' }} />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#6c757d' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.8,
                bgcolor: '#0B5FA5',
                '&:hover': { bgcolor: '#084a8a' },
                borderRadius: 2,
                fontSize: '18px',
                fontWeight: 600,
                mt: 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  )
}

export default Login