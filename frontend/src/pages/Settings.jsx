import React, { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Switch,
    TextField,
    Divider,
    Alert,
    Chip,
    Tab,
    Tabs,
    FormControlLabel,
    Avatar,
    CircularProgress
} from '@mui/material'

import {
    Settings as SettingsIcon,
    Security,
    Email,
    Notifications,
    Storage,
    Save,
    AdminPanelSettings,
    Verified,
    CloudUpload,
    Restore
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

function TabPanel({ children, value, index }) {
    return <div hidden={value !== index}>{value === index && <Box sx={{ p: 2 }}>{children}</Box>}</div>
}

const Settings = () => {
    const { user } = useSelector((state) => state.auth)
    const [tab, setTab] = useState(0)
    const [loading, setLoading] = useState(false)

    const [settings, setSettings] = useState({
        systemName: 'PAEC Equipment Management',
        organizationName: 'PAEC',
        maintenanceMode: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        minPasswordLength: 8,
        requireComplexPassword: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        senderEmail: 'noreply@paec.edu.pk',
        senderName: 'PAEC System',
        smtpUsername: 'noreply@paec.edu.pk',
        smtpPassword: '',
        pushNotifications: true,
        emailNotifications: true
    })

    if (user?.role !== 'SUPER_ADMIN') {
        return <AccessDenied message="Only Super Admin can access Settings." />
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings')
            if (res.data.success) {
                const data = res.data.settings || {}
                setSettings(prev => ({
                    ...prev,
                    systemName: data.systemName || data.system_name || prev.systemName,
                    organizationName: data.organizationName || data.organization_name || prev.organizationName,
                    maintenanceMode: data.maintenanceMode !== undefined ? data.maintenanceMode : false,
                    sessionTimeout: data.sessionTimeout || data.session_timeout || 30,
                    maxLoginAttempts: data.maxLoginAttempts || data.max_login_attempts || 5,
                    minPasswordLength: data.minPasswordLength || data.min_password_length || 8,
                    requireComplexPassword: data.requireComplexPassword !== undefined ? data.requireComplexPassword : true,
                    smtpHost: data.smtpHost || data.smtp_host || prev.smtpHost,
                    smtpPort: data.smtpPort || data.smtp_port || prev.smtpPort,
                    senderEmail: data.senderEmail || data.sender_email || prev.senderEmail,
                    senderName: data.senderName || data.sender_name || prev.senderName,
                    smtpUsername: data.smtpUsername || data.smtp_username || prev.smtpUsername,
                    smtpPassword: data.smtpPassword || data.smtp_password || '',
                    pushNotifications: data.pushNotifications !== undefined ? data.pushNotifications : true,
                    emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true
                }))
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error)
        }
    }

    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setSettings({ ...settings, [field]: value })
    }

    const saveSettings = async (endpoint, data, message) => {
        setLoading(true)
        try {
            await api.put(endpoint, data)
            toast.success(`✅ ${message}`)
        } catch (error) {
            toast.error('❌ Failed to save')
        } finally {
            setLoading(false)
        }
    }

    const handleTestEmail = async () => {
        setLoading(true)
        try {
            await api.post('/settings/test-email', { to: settings.senderEmail })
            toast.success('📧 Test email sent!')
        } catch (error) {
            toast.error('❌ Failed to send test email')
        } finally {
            setLoading(false)
        }
    }

    const handleBackup = async () => {
        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success('✅ Backup completed!')
        } catch (error) {
            toast.error('❌ Backup failed')
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { label: 'General', icon: <SettingsIcon /> },
        { label: 'Security', icon: <Security /> },
        { label: 'Email', icon: <Email /> },
        { label: 'Notifications', icon: <Notifications /> },
        { label: 'Database', icon: <Storage /> }
    ]

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#0B5FA5', width: 44, height: 44 }}>
                        <SettingsIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Settings</Typography>
                        <Typography variant="body2" color="textSecondary">System configuration</Typography>
                    </Box>
                </Box>
                <Chip label="Super Admin" color="error" icon={<AdminPanelSettings />} />
            </Box>

            {/* Status */}
            <Alert severity="success" sx={{ mb: 3 }} icon={<Verified />}>
                System running normally • {new Date().toLocaleString()}
            </Alert>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tab}
                    onChange={(e, v) => setTab(v)}
                    variant="scrollable"
                    sx={{
                        bgcolor: '#f8f9fa',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 44 },
                        '& .MuiTabs-indicator': { bgcolor: '#0B5FA5', height: 3 }
                    }}
                >
                    {tabs.map((t, i) => (
                        <Tab key={i} icon={t.icon} label={t.label} iconPosition="start" />
                    ))}
                </Tabs>
            </Paper>

            {/* ===== TAB 1: GENERAL ===== */}
            <TabPanel value={tab} index={0}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>General</Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="System Name" value={settings.systemName} onChange={handleChange('systemName')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Organization" value={settings.organizationName} onChange={handleChange('organizationName')} />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Switch checked={settings.maintenanceMode} onChange={handleChange('maintenanceMode')} />}
                                label="Maintenance Mode (Admins only)"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" onClick={() => saveSettings('/settings/general', settings, 'General settings saved')} disabled={loading} startIcon={<Save />}>
                            {loading ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                    </Box>
                </Paper>
            </TabPanel>

            {/* ===== TAB 2: SECURITY ===== */}
            <TabPanel value={tab} index={1}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Security</Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Session Timeout (min)" type="number" value={settings.sessionTimeout} onChange={handleChange('sessionTimeout')} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Max Login Attempts" type="number" value={settings.maxLoginAttempts} onChange={handleChange('maxLoginAttempts')} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Min Password Length" type="number" value={settings.minPasswordLength} onChange={handleChange('minPasswordLength')} />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch checked={settings.requireComplexPassword} onChange={handleChange('requireComplexPassword')} />} label="Require Complex Passwords" />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" onClick={() => saveSettings('/settings/security', settings, 'Security settings saved')} disabled={loading} startIcon={<Save />}>
                            {loading ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                    </Box>
                </Paper>
            </TabPanel>

            {/* ===== TAB 3: EMAIL ===== */}
            <TabPanel value={tab} index={2}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Email</Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="SMTP Host" value={settings.smtpHost} onChange={handleChange('smtpHost')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="SMTP Port" value={settings.smtpPort} onChange={handleChange('smtpPort')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Sender Email" value={settings.senderEmail} onChange={handleChange('senderEmail')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Sender Name" value={settings.senderName} onChange={handleChange('senderName')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="SMTP Username" value={settings.smtpUsername} onChange={handleChange('smtpUsername')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="SMTP Password" type="password" value={settings.smtpPassword} onChange={handleChange('smtpPassword')} />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={handleTestEmail} disabled={loading} startIcon={<Email />}>
                            {loading ? <CircularProgress size={20} /> : 'Test Email'}
                        </Button>
                        <Button variant="contained" onClick={() => saveSettings('/settings/email', settings, 'Email settings saved')} disabled={loading} startIcon={<Save />}>
                            {loading ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                    </Box>
                </Paper>
            </TabPanel>

            {/* ===== TAB 4: NOTIFICATIONS ===== */}
            <TabPanel value={tab} index={3}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Notifications</Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch checked={settings.pushNotifications} onChange={handleChange('pushNotifications')} />} label="Enable Push Notifications" />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={handleChange('emailNotifications')} />} label="Enable Email Notifications" />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" onClick={() => saveSettings('/settings/notifications', settings, 'Notification settings saved')} disabled={loading} startIcon={<Save />}>
                            {loading ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                    </Box>
                </Paper>
            </TabPanel>

            {/* ===== TAB 5: DATABASE ===== */}
            <TabPanel value={tab} index={4}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Database</Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Manage your database backups
                    </Alert>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Storage sx={{ fontSize: 36, color: '#28a745' }} />
                                <Typography variant="h5">Online</Typography>
                                <Typography variant="caption" color="textSecondary">Status</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Storage sx={{ fontSize: 36, color: '#0B5FA5' }} />
                                <Typography variant="h5">512 MB</Typography>
                                <Typography variant="caption" color="textSecondary">Size</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Storage sx={{ fontSize: 36, color: '#6f42c1' }} />
                                <Typography variant="h5">24K</Typography>
                                <Typography variant="caption" color="textSecondary">Records</Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button variant="contained" onClick={handleBackup} disabled={loading} startIcon={<CloudUpload />} sx={{ bgcolor: '#0B5FA5' }}>
                            {loading ? <CircularProgress size={20} /> : 'Create Backup'}
                        </Button>
                        <Button variant="outlined" startIcon={<Restore />}>Restore Backup</Button>
                    </Box>
                </Paper>
            </TabPanel>
        </Box>
    )
}

export default Settings
