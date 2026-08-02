import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const KnowledgeBase = () => {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50', mb: 3 }}>
        Knowledge Base
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography>Knowledge Base Module - Coming Soon</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          This module will display all equipment with their error history and solutions.
        </Typography>
      </Paper>
    </Box>
  )
}

export default KnowledgeBase