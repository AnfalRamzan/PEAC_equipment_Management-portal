import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    Switch,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
    Box,
    Typography,
    Paper,
    FormControlLabel
} from '@mui/material';
import {
    Notifications,
    NotificationsOff,
    VolumeUp,
    VolumeOff,
    Settings,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

const NotificationControls = () => {
    const dispatch = useDispatch();
    const [anchorEl, setAnchorEl] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [browserNotifications, setBrowserNotifications] = useState(true);
    const [notificationPermission, setNotificationPermission] = useState('default');

    // Check notification permission on load
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    // Request permission
    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('Browser notifications not supported');
            return;
        }

        if (Notification.permission === 'granted') {
            toast.info('Notifications already enabled');
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
            toast.success('Browser notifications enabled!');
            setBrowserNotifications(true);
        } else {
            toast.warning('Browser notifications denied');
            setBrowserNotifications(false);
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        localStorage.setItem('notificationSound', JSON.stringify(newState));
        toast.info(newState ? '🔊 Sound enabled' : '🔇 Sound disabled');
        
        // Play test sound if enabled
        if (newState) {
            playTestSound();
        }
    };

    const toggleBrowserNotifications = () => {
        if (!browserNotifications) {
            // Trying to enable - request permission
            requestPermission();
        } else {
            setBrowserNotifications(false);
            localStorage.setItem('browserNotifications', JSON.stringify(false));
            toast.info('🔔 Browser notifications disabled');
        }
    };

    const playTestSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const tones = [
                { freq: 800, delay: 0 },
                { freq: 1000, delay: 0.18 },
                { freq: 1200, delay: 0.36 }
            ];
            tones.forEach(({ freq, delay }) => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                const startTime = audioCtx.currentTime + delay;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.15);
            });
        } catch(e) {
            console.log('Sound test failed');
        }
    };

    // Load settings from localStorage
    useEffect(() => {
        const savedSound = localStorage.getItem('notificationSound');
        if (savedSound !== null) {
            setSoundEnabled(JSON.parse(savedSound));
        }
        const savedBrowser = localStorage.getItem('browserNotifications');
        if (savedBrowser !== null) {
            setBrowserNotifications(JSON.parse(savedBrowser));
        }
    }, []);

    // Save sound setting globally
    useEffect(() => {
        // Store in window for global access
        window.__notificationSoundEnabled = soundEnabled;
        window.__browserNotificationsEnabled = browserNotifications;
    }, [soundEnabled, browserNotifications]);

    return (
        <>
            <Tooltip title="Notification Settings">
                <IconButton
                    color="primary"
                    onClick={handleMenuOpen}
                    sx={{
                        padding: { xs: 0.5, sm: 1 },
                        position: 'relative',
                    }}
                >
                    <Badge
                        badgeContent={notificationPermission === 'granted' ? '✓' : '!'}
                        color={notificationPermission === 'granted' ? 'success' : 'warning'}
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '10px',
                                minWidth: 16,
                                height: 16,
                                right: -2,
                                top: -2,
                            }
                        }}
                    >
                        <Settings sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        width: 280,
                        p: 1,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box sx={{ p: 1, pb: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="#0B5FA5">
                        Notification Settings
                    </Typography>
                    <Divider sx={{ mt: 1 }} />
                </Box>

                {/* Sound Toggle */}
                <MenuItem onClick={toggleSound} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        {soundEnabled ? (
                            <VolumeUp sx={{ color: '#28a745' }} />
                        ) : (
                            <VolumeOff sx={{ color: '#dc3545' }} />
                        )}
                    </ListItemIcon>
                    <ListItemText 
                        primary="Sound Notifications"
                        secondary={soundEnabled ? '🔊 Enabled' : '🔇 Disabled'}
                    />
                    <Switch 
                        checked={soundEnabled}
                        onChange={toggleSound}
                        color="primary"
                        size="small"
                    />
                </MenuItem>

                {/* Browser Notification Toggle */}
                <MenuItem onClick={toggleBrowserNotifications} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        {browserNotifications && notificationPermission === 'granted' ? (
                            <Notifications sx={{ color: '#28a745' }} />
                        ) : (
                            <NotificationsOff sx={{ color: '#dc3545' }} />
                        )}
                    </ListItemIcon>
                    <ListItemText 
                        primary="Browser Notifications"
                        secondary={
                            notificationPermission === 'granted' 
                                ? '✅ Enabled' 
                                : notificationPermission === 'denied'
                                ? '❌ Blocked'
                                : '⚠️ Click to enable'
                        }
                    />
                    <Switch 
                        checked={browserNotifications && notificationPermission === 'granted'}
                        onChange={toggleBrowserNotifications}
                        color="primary"
                        size="small"
                        disabled={notificationPermission === 'denied'}
                    />
                </MenuItem>

                <Divider />

                {/* Test Sound Button */}
                <MenuItem onClick={() => {
                    playTestSound();
                    toast.info('🔊 Testing sound...');
                }}>
                    <ListItemIcon>
                        <VolumeUp sx={{ color: '#0B5FA5' }} />
                    </ListItemIcon>
                    <ListItemText primary="Test Sound" />
                </MenuItem>

                {/* Request Permission (if not granted) */}
                {notificationPermission !== 'granted' && (
                    <MenuItem onClick={requestPermission}>
                        <ListItemIcon>
                            <Notifications sx={{ color: '#ff9800' }} />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Enable Browser Notifications"
                            secondary="Click to request permission"
                        />
                    </MenuItem>
                )}

                {/* Status */}
                <Box sx={{ p: 1, pt: 0 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="caption" color="textSecondary">
                        Status: 
                        {soundEnabled ? ' 🔊 Sound' : ' 🔇 Muted'} | 
                        {notificationPermission === 'granted' ? ' ✅ Notifications' : ' ❌ No Notifications'}
                    </Typography>
                </Box>
            </Menu>
        </>
    );
};

export default NotificationControls;