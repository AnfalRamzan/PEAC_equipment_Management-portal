import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField
} from '@mui/material'
import { Download, PictureAsPdf, TableChart, Description } from '@mui/icons-material'

const Reports = () => {
  const [reportType, setReportType] = useState('monthly')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const reportTypes = [
    { value: 'monthly', label: 'Monthly Error Report' },
    { value: 'hospital', label: 'Hospital-wise Report' },
    { value: 'equipment', label: 'Equipment-wise Report' },
    { value: 'department', label: 'Department-wise Report' },
    { value: 'failure', label: 'Failure Frequency Report' },
    { value: 'spare-parts', label: 'Spare Parts Usage Report' },
    { value: 'maintenance', label: 'Equipment Maintenance History' },
    { value: 'downtime', label: 'Equipment Downtime Report' }
  ]

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50', mb: 3 }}>
        Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Generate Report
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Report Type"
                  >
                    {reportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    height: '100%',
                    bgcolor: '#0B5FA5',
                    '&:hover': { bgcolor: '#084a8a' }
                  }}
                >
                  Generate
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PictureAsPdf sx={{ fontSize: 48, color: '#dc3545', mb: 1 }} />
                  <Typography variant="h6">PDF Export</Typography>
                  <Button variant="outlined" color="primary" startIcon={<Download />} sx={{ mt: 1 }}>
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TableChart sx={{ fontSize: 48, color: '#28a745', mb: 1 }} />
                  <Typography variant="h6">Excel Export</Typography>
                  <Button variant="outlined" color="primary" startIcon={<Download />} sx={{ mt: 1 }}>
                    Download Excel
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Description sx={{ fontSize: 48, color: '#0B5FA5', mb: 1 }} />
                  <Typography variant="h6">CSV Export</Typography>
                  <Button variant="outlined" color="primary" startIcon={<Download />} sx={{ mt: 1 }}>
                    Download CSV
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Reports