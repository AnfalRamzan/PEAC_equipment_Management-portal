// frontend/src/pages/Login.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Transparent Logo

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
import { toast } from 'react-toastify'; // ✅ ADDED - Fixes the error
import 'react-toastify/dist/ReactToastify.css'; // ✅ ADDED - Toast styles

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS
// ============================================================
const colors = {
    // Dark Navy Base
    darkNavy: '#0F172A',
    darkNavyLight: '#1E293B',
    darkNavyDark: '#0A0F1E',
    darkNavyHover: '#1E3A5F',
    
    // Light Cyan Accents
    lightCyan: '#67E8F9',
    lightCyanBright: '#A5F3FC',
    lightCyanDark: '#22D3EE',
    lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
    lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
    
    // Gold accent (keeping PAEC branding)
    accentGold: '#C9A227',
    goldLight: '#E8C84A',
    
    // Text
    text: '#FFFFFF',
    secondaryText: '#94A3B8',
    textLight: '#CBD5E1',
    cyanText: '#67E8F9',
    darkText: '#0F172A',
    lightText: '#64748B',
    
    // Status colors
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
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
            try {
                console.log('📤 Sending login request:', { email: formData.email });
                const result = await dispatch(login(formData));
                console.log('📥 Login response:', result);
                
                if (result.payload && result.payload.user) {
                    console.log('👤 Logged in user:', result.payload.user.email, 'Role:', result.payload.user.role);
                    toast.success(`Welcome back, ${result.payload.user.full_name || result.payload.user.email}!`);
                    navigate('/dashboard');
                } else if (result.error) {
                    toast.error(result.error.message || 'Login failed');
                }
            } catch (err) {
                console.error('❌ Login error:', err);
                toast.error(err.message || 'Login failed');
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
                    ? `linear-gradient(135deg, ${colors.darkNavy} 0%, ${colors.darkNavyLight} 50%, ${colors.darkNavy} 100%)` 
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

            {/* Overlay - Dark Navy tint */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
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
                        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.12) 0%, rgba(30, 58, 95, 0.08) 50%, rgba(15, 23, 42, 0.12) 100%)`,
                        backgroundColor: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        border: `1px solid rgba(103, 232, 249, 0.15)`,
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
                            background: `linear-gradient(90deg, ${colors.darkNavy}, ${colors.lightCyan}, ${colors.accentGold}, ${colors.lightCyan}, ${colors.darkNavy})`,
                            backgroundSize: '200% 100%',
                            animation: 'gradient 3s ease infinite',
                            borderRadius: '4px 4px 0 0',
                        },
                        '@keyframes gradient': {
                            '0%': { backgroundPosition: '0% 50%' },
                            '50%': { backgroundPosition: '100% 50%' },
                            '100%': { backgroundPosition: '0% 50%' },
                        },
                        '&:hover': {
                            borderColor: `rgba(103, 232, 249, 0.25)`,
                            boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(103, 232, 249, 0.05)',
                        }
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
                                            filter: 'drop-shadow(0 0 40px rgba(103, 232, 249, 0.2))',
                                            objectFit: 'contain',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                            e.target.style.filter = 'drop-shadow(0 0 60px rgba(103, 232, 249, 0.4))';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.filter = 'drop-shadow(0 0 40px rgba(103, 232, 249, 0.2))';
                                        }}
                                        onError={(e) => { 
                                            console.warn('⚠️ Logo not found');
                                            e.target.style.display = 'none'; 
                                        }}
                                    />
                                    {/* Cyan Glow Behind Logo */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '-30px',
                                            left: '-30px',
                                            right: '-30px',
                                            bottom: '-30px',
                                            borderRadius: '50%',
                                            background: `radial-gradient(circle, rgba(103, 232, 249, 0.08) 0%, transparent 70%)`,
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
                                            background: `radial-gradient(circle, rgba(103, 232, 249, 0.04) 0%, transparent 70%)`,
                                            animation: 'pulseGlow 3s ease-in-out infinite 1s',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    {/* Gold accent glow */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '-40px',
                                            left: '-40px',
                                            right: '-40px',
                                            bottom: '-40px',
                                            borderRadius: '50%',
                                            background: `radial-gradient(circle, rgba(201, 162, 39, 0.04) 0%, transparent 70%)`,
                                            animation: 'pulseGlow 4s ease-in-out infinite 0.5s',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                </Box>
                            </Box>
                            
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: colors.darkNavy,
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

                        {/* Error Alert - Cyan themed */}
                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 2.5, 
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
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
                                            borderColor: colors.lightCyan,
                                            borderWidth: 2,
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.lightCyanDark,
                                            borderWidth: 2.5,
                                            boxShadow: `0 0 0 6px ${colors.lightCyanGlow}`,
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        color: colors.lightText,
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: colors.darkNavy,
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
                                            borderColor: colors.lightCyan,
                                            borderWidth: 2,
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.lightCyanDark,
                                            borderWidth: 2.5,
                                            boxShadow: `0 0 0 6px ${colors.lightCyanGlow}`,
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        color: colors.lightText,
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: colors.darkNavy,
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
                                                        color: colors.lightCyanDark,
                                                        backgroundColor: `${colors.lightCyanGlow}`,
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

                            {/* Login Button - Dark Navy + Cyan */}
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: { xs: 1.5, sm: 1.8 },
                                    background: `linear-gradient(135deg, ${colors.darkNavy} 0%, ${colors.darkNavyHover} 50%, ${colors.darkNavy} 100%)`,
                                    backgroundSize: '200% 200%',
                                    animation: 'buttonGradient 3s ease infinite',
                                    '&:hover': { 
                                        background: `linear-gradient(135deg, ${colors.darkNavyHover} 0%, ${colors.lightCyanDark} 50%, ${colors.darkNavyHover} 100%)`,
                                        transform: 'translateY(-2px) scale(1.01)',
                                        boxShadow: `0 10px 35px ${colors.lightCyanGlowStrong}`,
                                    },
                                    borderRadius: 2.5,
                                    fontSize: { xs: '16px', sm: '18px' },
                                    fontWeight: 700,
                                    mt: 1,
                                    boxShadow: `0 6px 25px ${colors.lightCyanGlow}`,
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