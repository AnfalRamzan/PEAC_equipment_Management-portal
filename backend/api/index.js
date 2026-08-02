const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./auth');
const hospitalRoutes = require('./hospitals');
const userRoutes = require('./users');
const equipmentRoutes = require('./equipment');
const errorRoutes = require('./errors');
const repairRoutes = require('./repairs');
const sparePartRoutes = require('./spareParts');
const maintenanceRoutes = require('./maintenance');
const knowledgeBaseRoutes = require('./knowledgeBase');
const reportRoutes = require('./reports');
const amcRoutes = require('./amc');
const purchaseOrderRoutes = require('./purchaseOrders');
const procurementRoutes = require('./procurement');
const notificationRoutes = require('./notifications');
const dashboardRoutes = require('./dashboard');

// Routes - ALL MUST BE DEFINED
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/spare-parts', sparePartRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/amc', amcRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Export for Vercel
module.exports = app;