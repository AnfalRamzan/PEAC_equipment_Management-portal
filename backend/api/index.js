const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// For Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}