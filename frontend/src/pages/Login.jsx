// frontend/src/pages/Login.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching MainLayout

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
    Fade,
    Grow,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
};

// ============================================================
// ✅ ANIMATIONS
// ============================================================
const loginStyles = `
@keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes pulseGlow {
    0% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
    100% { opacity: 0.3; transform: scale(1); }
}

@keyframes shimmerFloat {
    0% { transform: translateX(-100%) rotate(-5deg); opacity: 0; }
    20% { opacity: 0.6; }
    50% { opacity: 1; }
    80% { opacity: 0.6; }
    100% { transform: translateX(200%) rotate(-5deg); opacity: 0; }
}

@keyframes cyanGlowPulse {
    0% { box-shadow: 0 0 20px rgba(103, 232, 249, 0.1); }
    50% { box-shadow: 0 0 60px rgba(103, 232, 249, 0.2); }
    100% { box-shadow: 0 0 20px rgba(103, 232, 249, 0.1); }
}

@keyframes buttonGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes bottomGlow {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}

.login-paper {
    animation: cyanGlowPulse 4s ease-in-out infinite;
}

.glow-ring {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(circle, rgba(103, 232, 249, 0.08) 0%, transparent 70%);
    animation: pulseGlow 3s ease-in-out infinite;
}
`

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
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');

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
        <>
            <style>{loginStyles}</style>
            
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
                        ? `linear-gradient(135deg, ${colors.darkNavy} 0%, ${colors.darkNavyLight} 50%, ${colors.darkNavyDark} 100%)` 
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
                        background: `linear-gradient(135deg, 
                            rgba(15, 23, 42, 0.6) 0%, 
                            rgba(15, 23, 42, 0.75) 30%,
                            rgba(30, 58, 95, 0.4) 60%,
                            rgba(15, 23, 42, 0.7) 100%
                        )`,
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
                        py: { 
                            xs: isLandscape ? 1 : 2, 
                            sm: 3, 
                            md: 4 
                        },
                        px: { xs: 1.5, sm: 2, md: 3 },
                    }}
                >
                    <Grow in timeout={800}>
                        <Paper
                            elevation={30}
                            className="login-paper"
                            sx={{
                                width: '100%',
                                maxWidth: { 
                                    xs: isLandscape ? '80%' : '92%', 
                                    sm: 420, 
                                    md: 440, 
                                    lg: 460 
                                },
                                p: { 
                                    xs: isLandscape ? 2 : 3, 
                                    sm: 4, 
                                    md: 4.5 
                                },
                                borderRadius: { xs: 3, sm: 4 },
                                background: `linear-gradient(135deg, 
                                    rgba(255, 255, 255, 0.95) 0%, 
                                    rgba(248, 250, 252, 0.92) 50%, 
                                    rgba(255, 255, 255, 0.95) 100%
                                )`,
                                backdropFilter: 'blur(30px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                                border: `1px solid rgba(103, 232, 249, 0.15)`,
                                boxShadow: `
                                    0 30px 80px rgba(0,0,0,0.5), 
                                    inset 0 1px 0 rgba(255,255,255,0.2),
                                    0 0 60px rgba(103, 232, 249, 0.03)
                                `,
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                mx: 'auto',
                                maxHeight: {
                                    xs: isLandscape ? '95vh' : 'auto',
                                    sm: 'auto',
                                },
                                overflowY: 'auto',
                                // ✅ TOP GRADIENT BAR - Always visible
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: `linear-gradient(90deg, 
                                        ${colors.darkNavy}, 
                                        ${colors.lightCyan}, 
                                        ${colors.accentGold}, 
                                        ${colors.lightCyan}, 
                                        ${colors.darkNavy}
                                    )`,
                                    backgroundSize: '200% 100%',
                                    animation: 'gradient 3s ease infinite',
                                    borderRadius: '4px 4px 0 0',
                                    zIndex: 10,
                                    pointerEvents: 'none',
                                },
                                // ✅ BOTTOM GLOW LINE - Always visible, full width
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: `linear-gradient(90deg, 
                                        ${colors.darkNavy}, 
                                        ${colors.lightCyan}, 
                                        ${colors.accentGold}, 
                                        ${colors.lightCyan}, 
                                        ${colors.darkNavy}
                                    )`,
                                    backgroundSize: '200% 100%',
                                    animation: 'gradient 3s ease infinite',
                                    borderRadius: '0 0 4px 4px',
                                    zIndex: 10,
                                    pointerEvents: 'none',
                                    opacity: 0.8,
                                },
                                // ✅ LEFT SIDE BORDER GLOW
                                '&::before:before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: '2px',
                                    background: `linear-gradient(180deg, 
                                        ${colors.darkNavy}, 
                                        ${colors.lightCyan}, 
                                        ${colors.accentGold},
                                        ${colors.lightCyan}, 
                                        ${colors.darkNavy}
                                    )`,
                                    backgroundSize: '100% 200%',
                                    animation: 'gradient 3s ease infinite',
                                    zIndex: 10,
                                    pointerEvents: 'none',
                                },
                                // ✅ RIGHT SIDE BORDER GLOW
                                '&::before:after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    right: 0,
                                    width: '2px',
                                    background: `linear-gradient(180deg, 
                                        ${colors.darkNavy}, 
                                        ${colors.lightCyan}, 
                                        ${colors.accentGold},
                                        ${colors.lightCyan}, 
                                        ${colors.darkNavy}
                                    )`,
                                    backgroundSize: '100% 200%',
                                    animation: 'gradient 3s ease infinite',
                                    zIndex: 10,
                                    pointerEvents: 'none',
                                },
                                '&:hover': {
                                    borderColor: `rgba(103, 232, 249, 0.3)`,
                                    boxShadow: `
                                        0 30px 80px rgba(0,0,0,0.5), 
                                        0 0 80px rgba(103, 232, 249, 0.08),
                                        inset 0 1px 0 rgba(255,255,255,0.3)
                                    `,
                                    transform: 'translateY(-2px)',
                                },
                                '&::-webkit-scrollbar': {
                                    width: '4px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: 'rgba(0,0,0,0.05)',
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: colors.lightCyan,
                                    borderRadius: '4px',
                                },
                            }}
                        >
                            {/* Content */}
                            <Box sx={{ 
                                position: 'relative', 
                                zIndex: 1,
                                pt: { xs: 0.5, sm: 0.5, md: 0.5 },
                                pb: { xs: 0.5, sm: 0.5, md: 0.5 },
                            }}>
                                {/* Logo Section */}
                                <Box sx={{ 
                                    textAlign: 'center', 
                                    mb: { 
                                        xs: isLandscape ? 1.5 : 2.5, 
                                        sm: 3.5, 
                                        md: 4 
                                    } 
                                }}>
                                    <Box 
                                        sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            mb: { 
                                                xs: isLandscape ? 0.5 : 1.5, 
                                                sm: 2, 
                                                md: 2.5 
                                            },
                                            position: 'relative',
                                        }}
                                    >
                                        <Box sx={{ position: 'relative' }}>
                                            <img
                                                src="/logoo.png"
                                                alt="PAEC Logo"
                                                style={{
                                                    height: isMobile 
                                                        ? (isLandscape ? '60px' : '80px')
                                                        : isTablet 
                                                            ? '100px' 
                                                            : '120px',
                                                    width: 'auto',
                                                    backgroundColor: 'transparent',
                                                    padding: '0px',
                                                    borderRadius: '0px',
                                                    border: 'none',
                                                    filter: `
                                                        drop-shadow(0 0 40px rgba(103, 232, 249, 0.15))
                                                        drop-shadow(0 0 80px rgba(103, 232, 249, 0.05))
                                                    `,
                                                    objectFit: 'contain',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'scale(1.08)';
                                                    e.target.style.filter = `
                                                        drop-shadow(0 0 60px rgba(103, 232, 249, 0.3))
                                                        drop-shadow(0 0 100px rgba(103, 232, 249, 0.1))
                                                    `;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'scale(1)';
                                                    e.target.style.filter = `
                                                        drop-shadow(0 0 40px rgba(103, 232, 249, 0.15))
                                                        drop-shadow(0 0 80px rgba(103, 232, 249, 0.05))
                                                    `;
                                                }}
                                                onError={(e) => { 
                                                    console.warn('⚠️ Logo not found');
                                                    e.target.style.display = 'none'; 
                                                }}
                                            />
                                            {/* Glow rings behind logo */}
                                            <Box
                                                className="glow-ring"
                                                sx={{
                                                    position: 'absolute',
                                                    top: '-40px',
                                                    left: '-40px',
                                                    right: '-40px',
                                                    bottom: '-40px',
                                                    borderRadius: '50%',
                                                    background: `radial-gradient(circle, rgba(103, 232, 249, 0.08) 0%, transparent 70%)`,
                                                    animation: 'pulseGlow 3s ease-in-out infinite',
                                                    pointerEvents: 'none',
                                                    display: {
                                                        xs: isLandscape ? 'none' : 'block',
                                                        sm: 'block',
                                                    }
                                                }}
                                            />
                                            <Box
                                                className="glow-ring"
                                                sx={{
                                                    position: 'absolute',
                                                    top: '-60px',
                                                    left: '-60px',
                                                    right: '-60px',
                                                    bottom: '-60px',
                                                    borderRadius: '50%',
                                                    background: `radial-gradient(circle, rgba(103, 232, 249, 0.04) 0%, transparent 70%)`,
                                                    animation: 'pulseGlow 3s ease-in-out infinite 1s',
                                                    pointerEvents: 'none',
                                                    display: {
                                                        xs: isLandscape ? 'none' : 'block',
                                                        sm: 'block',
                                                    }
                                                }}
                                            />
                                            <Box
                                                className="glow-ring"
                                                sx={{
                                                    position: 'absolute',
                                                    top: '-50px',
                                                    left: '-50px',
                                                    right: '-50px',
                                                    bottom: '-50px',
                                                    borderRadius: '50%',
                                                    background: `radial-gradient(circle, rgba(201, 162, 39, 0.04) 0%, transparent 70%)`,
                                                    animation: 'pulseGlow 4s ease-in-out infinite 0.5s',
                                                    pointerEvents: 'none',
                                                    display: {
                                                        xs: isLandscape ? 'none' : 'block',
                                                        sm: 'block',
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                    
                                    <Fade in timeout={1000}>
                                        <Box>
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: colors.darkNavy,
                                                    fontSize: { 
                                                        xs: isLandscape ? '0.9rem' : '1.1rem',
                                                        sm: '1.4rem', 
                                                        md: '1.6rem' 
                                                    },
                                                    letterSpacing: '0.5px',
                                                    lineHeight: 1.3,
                                                    mt: {
                                                        xs: isLandscape ? 0 : 0.5,
                                                        sm: 1,
                                                    },
                                                    position: 'relative',
                                                    display: 'inline-block',
                                                }}
                                            >
                                                PAEC Equipment Portal
                                            </Typography>
                                        </Box>
                                    </Fade>
                                </Box>

                                {/* Error Alert */}
                                {error && (
                                    <Fade in>
                                        <Alert 
                                            severity="error" 
                                            sx={{ 
                                                mb: { 
                                                    xs: isLandscape ? 1.5 : 2,
                                                    sm: 2.5 
                                                }, 
                                                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                                borderRadius: 2,
                                                fontWeight: 500,
                                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                '& .MuiAlert-icon': {
                                                    color: colors.error,
                                                    fontSize: { xs: '1.2rem', sm: '1.5rem' },
                                                },
                                            }}
                                        >
                                            {error}
                                        </Alert>
                                    </Fade>
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
                                            mb: { 
                                                xs: isLandscape ? 1.5 : 2,
                                                sm: 2.5, 
                                                md: 3 
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(255,255,255,0.9)',
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
                                                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                                                color: colors.lightText,
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: colors.darkNavy,
                                                fontWeight: 700,
                                            },
                                            '& .MuiFormHelperText-root': {
                                                fontWeight: 500,
                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                            },
                                            '& .MuiInputBase-input': {
                                                padding: { 
                                                    xs: isLandscape ? '10px 12px' : '12px 14px',
                                                    sm: '14px 16px' 
                                                },
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                                fontWeight: 500,
                                            },
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={{ 
                                                        color: colors.lightText, 
                                                        fontSize: { xs: '1rem', sm: '1.2rem' } 
                                                    }} />
                                                </InputAdornment>
                                            ),
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
                                            mb: { 
                                                xs: isLandscape ? 2 : 2.5,
                                                sm: 3, 
                                                md: 3.5 
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(255,255,255,0.9)',
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
                                                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                                                color: colors.lightText,
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: colors.darkNavy,
                                                fontWeight: 700,
                                            },
                                            '& .MuiFormHelperText-root': {
                                                fontWeight: 500,
                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                            },
                                            '& .MuiInputBase-input': {
                                                padding: { 
                                                    xs: isLandscape ? '10px 12px' : '12px 14px',
                                                    sm: '14px 16px' 
                                                },
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                                fontWeight: 500,
                                            },
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock sx={{ 
                                                        color: colors.lightText, 
                                                        fontSize: { xs: '1rem', sm: '1.2rem' } 
                                                    }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                        sx={{ 
                                                            color: colors.lightText,
                                                            padding: { xs: 0.5, sm: 1 },
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                color: colors.lightCyanDark,
                                                                backgroundColor: `${colors.lightCyanGlow}`,
                                                                transform: 'scale(1.1)',
                                                            }
                                                        }}
                                                    >
                                                        {showPassword ? 
                                                            <VisibilityOff sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }} /> : 
                                                            <Visibility sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }} />
                                                        }
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {/* Login Button */}
                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{
                                            py: { 
                                                xs: isLandscape ? 1 : 1.3,
                                                sm: 1.5, 
                                                md: 1.8 
                                            },
                                            background: `linear-gradient(135deg, 
                                                ${colors.darkNavy} 0%, 
                                                ${colors.darkNavyHover} 40%, 
                                                ${colors.darkNavy} 100%
                                            )`,
                                            backgroundSize: '200% 200%',
                                            animation: 'buttonGradient 4s ease infinite',
                                            '&:hover': { 
                                                background: `linear-gradient(135deg, 
                                                    ${colors.darkNavyHover} 0%, 
                                                    ${colors.lightCyanDark} 40%, 
                                                    ${colors.darkNavyHover} 100%
                                                )`,
                                                transform: 'translateY(-3px) scale(1.02)',
                                                boxShadow: `0 10px 40px ${colors.lightCyanGlowStrong}`,
                                            },
                                            borderRadius: 2.5,
                                            fontSize: { 
                                                xs: isLandscape ? '13px' : '15px',
                                                sm: '16px', 
                                                md: '18px' 
                                            },
                                            fontWeight: 700,
                                            mt: { 
                                                xs: isLandscape ? 0.5 : 1,
                                                sm: 1 
                                            },
                                            boxShadow: `0 6px 30px ${colors.lightCyanGlow}`,
                                            textTransform: 'none',
                                            letterSpacing: { xs: '0.5px', sm: '0.8px' },
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            padding: { 
                                                xs: isLandscape ? '8px 16px' : '12px 20px',
                                                sm: '14px 24px' 
                                            },
                                            color: 'white',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&:disabled': {
                                                background: `linear-gradient(135deg, ${colors.lightText} 0%, ${colors.secondaryText} 100%)`,
                                                animation: 'none',
                                                boxShadow: 'none',
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: `
                                                    linear-gradient(105deg,
                                                        transparent 40%,
                                                        rgba(255,255,255,0.1) 45%,
                                                        rgba(255,255,255,0.15) 50%,
                                                        rgba(255,255,255,0.1) 55%,
                                                        transparent 60%
                                                    )
                                                `,
                                                backgroundSize: '300% 100%',
                                                animation: 'shimmerFloat 4s ease-in-out infinite',
                                                pointerEvents: 'none',
                                            },
                                        }}
                                    >
                                        {loading ? 'Logging in...' : 'Sign In'}
                                    </Button>
                                </form>
                            </Box>
                        </Paper>
                    </Grow>
                </Container>
            </Box>
        </>
    );
};

export default Login;