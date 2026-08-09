import React from 'react'
import { Box, Paper, Typography, Button } from '@mui/material'
import { ErrorOutline } from '@mui/icons-material'  // ✅ ADD THIS
import { useNavigate } from 'react-router-dom'

const AccessDenied = ({ message, icon }) => {
    const navigate = useNavigate()
    
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
                {icon || <ErrorOutline sx={{ fontSize: 64, color: '#dc3545', mb: 2 }} />}
                <Typography variant="h5" color="error" gutterBottom>
                    Access Denied
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    {message || 'You do not have permission to access this page.'}
                </Typography>
                <Button 
                    variant="contained" 
                    sx={{ mt: 2, bgcolor: '#0B5FA5' }}
                    onClick={() => navigate('/dashboard')}
                >
                    Go to Dashboard
                </Button>
            </Paper>
        </Box>
    )
}

export default AccessDenied