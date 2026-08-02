import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const Maintenance = () => {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50', mb: 3 }}>
        Preventive Maintenance
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography>Maintenance Module - Coming Soon</Typography>
      </Paper>
    </Box>
  )
}

export default Maintenance