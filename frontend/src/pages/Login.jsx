// frontend/src/pages/Login.jsx
// ✅ Correct paths for logo and video files

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
    useMediaQuery
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../redux/slices/authSlice';

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
                background: videoError ? 'linear-gradient(135deg, #0B5FA5 0%, #1a7fc9 100%)' : 'none',
            }}
        >
            {/* ✅ VIDEO BACKGROUND - CORRECT PATHS */}
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
                    {/* ✅ CORRECT PATHS - These files should be in public/videos/ */}
                    <source src="/videos/login-bg.mp4" type="video/mp4" />
                    <source src="/videos/login-bg.webm" type="video/webm" />
                    {/* ✅ Fallback URL if local files don't exist */}
                    <source 
                        src="https://cdn.pixabay.com/video/2020/09/04/48267-448099234_large.mp4" 
                        type="video/mp4" 
                    />
                </Box>
            )}

            {/* ✅ OVERLAY */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)',
                    zIndex: 1,
                }}
            />

            {/* ✅ LOGIN FORM - PERFECT CENTER */}
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
                    py: { xs: 2, sm: 3 },
                }}
            >
                <Paper
                    elevation={24}
                    sx={{
                        width: '100%',
                        maxWidth: { xs: '92%', sm: 400, md: 420 },
                        p: { xs: 2.5, sm: 3.5, md: 4 },
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        mx: 'auto',
                    }}
                >
                    {/* ✅ Form Content */}
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* ✅ Logo - CORRECT PATH */}
                        <Box sx={{ textAlign: 'center', mb: { xs: 2.5, sm: 3.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, sm: 2 } }}>
                                <img
                                    src="/logo.png"
                                    alt="PAEC Logo"
                                    style={{
                                        height: isMobile ? '60px' : '80px',
                                        width: 'auto',
                                        borderRadius: '12px',
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        padding: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                    }}
                                    onError={(e) => { 
                                        console.warn('⚠️ Logo not found at /logo.png');
                                        e.target.style.display = 'none'; 
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
                                    textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                                    letterSpacing: '0.3px',
                                    lineHeight: 1.3,
                                }}
                            >
                                PAEC Equipment Management Portal
                            </Typography>
                        </Box>

                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 2.5, 
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    borderRadius: 2,
                                }}
                            >
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
                                sx={{ mb: { xs: 2, sm: 2.5 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: '#888', fontSize: '1.1rem' }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        borderRadius: 2,
                                        '& .MuiInputLabel-root': { 
                                            color: '#555',
                                            fontWeight: 500,
                                        },
                                        '& .MuiInputBase-input': { 
                                            color: '#222',
                                            padding: '10px 14px',
                                            fontSize: '0.95rem',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(0,0,0,0.05)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(11, 95, 165, 0.3)',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#0B5FA5',
                                            borderWidth: 2,
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
                                sx={{ mb: { xs: 2.5, sm: 3 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: '#888', fontSize: '1.1rem' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                sx={{ color: '#888' }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        borderRadius: 2,
                                        '& .MuiInputLabel-root': { 
                                            color: '#555',
                                            fontWeight: 500,
                                        },
                                        '& .MuiInputBase-input': { 
                                            color: '#222',
                                            padding: '10px 14px',
                                            fontSize: '0.95rem',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(0,0,0,0.05)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(11, 95, 165, 0.3)',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#0B5FA5',
                                            borderWidth: 2,
                                        },
                                    }
                                }}
                            />

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: { xs: 1.3, sm: 1.5 },
                                    bgcolor: '#0B5FA5',
                                    '&:hover': { 
                                        bgcolor: '#084a8a',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 8px 30px rgba(11, 95, 165, 0.4)',
                                    },
                                    borderRadius: 2,
                                    fontSize: { xs: '15px', sm: '17px' },
                                    fontWeight: 700,
                                    mt: 1,
                                    boxShadow: '0 4px 20px rgba(11, 95, 165, 0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.2px',
                                    transition: 'all 0.3s ease',
                                    padding: '12px',
                                }}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
