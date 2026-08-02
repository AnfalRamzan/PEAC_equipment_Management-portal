const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { query, pool } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./api/auth');
const hospitalRoutes = require('./api/hospitals');
const userRoutes = require('./api/users');
const equipmentRoutes = require('./api/equipment');
const errorRoutes = require('./api/errors');
const repairRoutes = require('./api/repairs');
const sparePartRoutes = require('./api/spareParts');
const maintenanceRoutes = require('./api/maintenance');
const knowledgeBaseRoutes = require('./api/knowledgeBase');
const reportRoutes = require('./api/reports');
const amcRoutes = require('./api/amc');
const purchaseOrderRoutes = require('./api/purchaseOrders');
const procurementRoutes = require('./api/procurement');
const notificationRoutes = require('./api/notifications');
const dashboardRoutes = require('./api/dashboard');

// Routes
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});