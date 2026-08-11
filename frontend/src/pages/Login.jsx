// frontend/src/pages/Login.jsx
// ✅ PAEC THEME - Transparent Logo (No White Background)

import React, { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../redux/slices/authSlice';

// ============================================================
// ✅ PAEC THEME COLORS
// ============================================================
const colors = {
    sidebar: '#01411C',
    sidebarHover: '#0B542B',
    active: '#0E6335',
    accentGold: '#C9A227',
    goldLight: '#E8C84A',
    text: '#FFFFFF',
    secondaryText: '#B8C8BE',
    mainBg: '#F0F2F5',
    white: '#FFFFFF',
    darkText: '#1A2A3A',
    lightText: '#5A7A8A',
    error: '#D32F2F',
    success: '#2E7D32',
    info: '#0B5FA5',
    borderColor: 'rgba(1, 65, 28, 0.08)',
    shadowColor: 'rgba(1, 65, 28, 0.08)',
};

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [videoError, setVideoError] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            const result = await dispatch(login(formData));
            if (!result.error) {
                navigate('/dashboard');
            }
        }
    };

    const handleVideoError = () => {
        console.log('⚠️ Video failed to load, showing fallback');
        setVideoError(true);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                margin: 0,
                padding: 0,
                background: videoError 
                    ? `linear-gradient(135deg, ${colors.sidebar} 0%, ${colors.active} 50%, ${colors.sidebar} 100%)` 
                    : 'none',
            }}
        >
            {/* Video Background */}
            {!videoError && (
                <Box
                    component="video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={handleVideoError}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                    }}
                >
                    <source src="/videos/login-bg.mp4" type="video/mp4" />
                    <source src="/videos/login-bg.webm" type="video/webm" />
                    <source 
                        src="https://cdn.pixabay.com/video/2020/09/04/48267-448099234_large.mp4" 
                        type="video/mp4" 
                    />
                </Box>
            )}

            {/* Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
                    zIndex: 1,
                }}
            />

            {/* Login Form */}
            <Container 
                maxWidth={false}
                sx={{ 
                    position: 'relative', 
                    zIndex: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    width: '100%',
                    py: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Paper
                    elevation={30}
                    sx={{
                        width: '100%',
                        maxWidth: { xs: '92%', sm: 420, md: 440, lg: 460 },
                        p: { xs: 3, sm: 4, md: 4.5 },
                        borderRadius: { xs: 3, sm: 4 },
                        background: `linear-gradient(135deg, rgba(1, 65, 28, 0.15) 0%, rgba(14, 99, 53, 0.10) 50%, rgba(1, 65, 28, 0.15) 100%)`,
                        backgroundColor: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        border: `1px solid rgba(201, 162, 39, 0.15)`,
                        boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        mx: 'auto',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: `linear-gradient(90deg, ${colors.sidebar}, ${colors.accentGold}, ${colors.sidebar})`,
                            backgroundSize: '200% 100%',
                            animation: 'gradient 3s ease infinite',
                            borderRadius: '4px 4px 0 0',
                        },
                        '@keyframes gradient': {
                            '0%': { backgroundPosition: '0% 50%' },
                            '50%': { backgroundPosition: '100% 50%' },
                            '100%': { backgroundPosition: '0% 50%' },
                        },
                    }}
                >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* Logo Section - TRANSPARENT LOGO */}
                        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    mb: { xs: 2, sm: 2.5 },
                                    position: 'relative',
                                }}
                            >
                                {/* ✅ Transparent Logo - No White Background */}
                                <Box sx={{ position: 'relative' }}>
                                    <img
                                        src="/logoo.png"
                                        alt="PAEC Logo"
                                        style={{
                                            height: isMobile ? '90px' : '120px',
                                            width: 'auto',
                                            backgroundColor: 'transparent',
                                            padding: '0px',
                                            borderRadius: '0px',
                                            border: 'none',
                                            filter: 'drop-shadow(0 0 30px rgba(201, 162, 39, 0.2))',
                                            objectFit: 'contain',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                            e.target.style.filter = 'drop-shadow(0 0 50px rgba(201, 162, 39, 0.4))';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.filter = 'drop-shadow(0 0 30px rgba(201, 162, 39, 0.2))';
                                        }}
                                        onError={(e) => { 
                                            console.warn('⚠️ Logo not found');
                                            e.target.style.display = 'none'; 
                                        }}
                                    />
                                    {/* ✅ Gold Glow Behind Logo */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '-30px',
                                            left: '-30px',
                                            right: '-30px',
                                            bottom: '-30px',
                                            borderRadius: '50%',
                                            background: `radial-gradient(circle, ${colors.accentGold}08 0%, transparent 70%)`,
                                            animation: 'pulseGlow 3s ease-in-out infinite',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '-50px',
                                            left: '-50px',
                                            right: '-50px',
                                            bottom: '-50px',
                                            borderRadius: '50%',
                                            background: `radial-gradient(circle, ${colors.accentGold}04 0%, transparent 70%)`,
                                            animation: 'pulseGlow 3s ease-in-out infinite 1s',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                </Box>
                            </Box>
                            
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: colors.sidebar,
                                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                                    letterSpacing: '0.5px',
                                    lineHeight: 1.3,
                                    mt: 1,
                                }}
                            >
                                PAEC Equipment Portal
                            </Typography>
                            
                            <Typography
                                variant="body2"
                                sx={{
                                    color: colors.lightText,
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    fontWeight: 400,
                                    mt: 0.5,
                                    letterSpacing: '0.3px',
                                }}
                            >
                                Sign in to manage your equipment
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 2.5, 
                                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                    border: '1px solid rgba(211, 47, 47, 0.2)',
                                    borderRadius: 2,
                                    fontWeight: 500,
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {/* Form */}
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
                                sx={{ 
                                    mb: { xs: 2.5, sm: 3 },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.92)',
                                        borderRadius: 2.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover fieldset': {
                                            borderColor: colors.sidebar,
                                            borderWidth: 2,
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.accentGold,
                                            borderWidth: 2.5,
                                            boxShadow: `0 0 0 6px ${colors.accentGold}22`,
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        color: colors.lightText,
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: colors.sidebar,
                                        fontWeight: 700,
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: colors.lightText, fontSize: '1.2rem' }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        '& .MuiInputBase-input': { 
                                            color: colors.darkText,
                                            padding: '14px 16px',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                        },
                                    }
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
                                sx={{ 
                                    mb: { xs: 3, sm: 3.5 },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.92)',
                                        borderRadius: 2.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover fieldset': {
                                            borderColor: colors.sidebar,
                                            borderWidth: 2,
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.accentGold,
                                            borderWidth: 2.5,
                                            boxShadow: `0 0 0 6px ${colors.accentGold}22`,
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        color: colors.lightText,
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: colors.sidebar,
                                        fontWeight: 700,
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: colors.lightText, fontSize: '1.2rem' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                sx={{ 
                                                    color: colors.lightText,
                                                    '&:hover': {
                                                        color: colors.accentGold,
                                                        backgroundColor: `${colors.accentGold}22`,
                                                    }
                                                }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        '& .MuiInputBase-input': { 
                                            color: colors.darkText,
                                            padding: '14px 16px',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                        },
                                    }
                                }}
                            />

                            {/* Login Button */}
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: { xs: 1.5, sm: 1.8 },
                                    background: `linear-gradient(135deg, ${colors.sidebar} 0%, ${colors.active} 50%, ${colors.sidebar} 100%)`,
                                    backgroundSize: '200% 200%',
                                    animation: 'buttonGradient 3s ease infinite',
                                    '&:hover': { 
                                        background: `linear-gradient(135deg, ${colors.sidebarHover} 0%, ${colors.active} 50%, ${colors.sidebarHover} 100%)`,
                                        transform: 'translateY(-2px) scale(1.01)',
                                        boxShadow: `0 10px 35px ${colors.sidebar}66`,
                                    },
                                    borderRadius: 2.5,
                                    fontSize: { xs: '16px', sm: '18px' },
                                    fontWeight: 700,
                                    mt: 1,
                                    boxShadow: `0 6px 25px ${colors.sidebar}44`,
                                    textTransform: 'none',
                                    letterSpacing: '0.8px',
                                    transition: 'all 0.3s ease',
                                    padding: '14px',
                                    color: 'white',
                                    '&:disabled': {
                                        background: `linear-gradient(135deg, ${colors.lightText} 0%, ${colors.secondaryText} 100%)`,
                                        animation: 'none',
                                    },
                                    '@keyframes buttonGradient': {
                                        '0%': { backgroundPosition: '0% 50%' },
                                        '50%': { backgroundPosition: '100% 50%' },
                                        '100%': { backgroundPosition: '0% 50%' },
                                    },
                                }}
                            >
                                {loading ? 'Logging in...' : 'Sign In'}
                            </Button>
                        </form>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;