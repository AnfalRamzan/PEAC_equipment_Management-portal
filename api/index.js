const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    // Hardcoded users for testing
    const users = {
        'superadmin@paec.edu.pk': {
            password: 'admin123',
            user: {
                id: 1,
                username: 'superadmin',
                full_name: 'Super Admin',
                email: 'superadmin@paec.edu.pk',
                role: 'SUPER_ADMIN'
            }
        },
        'admin@paec.edu.pk': {
            password: 'hospital123',
            user: {
                id: 2,
                username: 'hospitaladmin',
                full_name: 'Hospital Admin',
                email: 'admin@paec.edu.pk',
                role: 'HOSPITAL_ADMIN'
            }
        },
        'engineer1@paec.edu.pk': {
            password: 'engineer123',
            user: {
                id: 3,
                username: 'engineer1',
                full_name: 'Engineer Ali',
                email: 'engineer1@paec.edu.pk',
                role: 'ENGINEER'
            }
        }
    };
    
    const userData = users[email];
    
    if (!userData || userData.password !== password) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }
    
    res.json({
        success: true,
        token: 'test-token-' + Date.now(),
        user: userData.user
    });
});

// Dashboard stats (for testing)
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        success: true,
        totalEquipment: 15,
        openErrors: 3,
        resolvedErrors: 12,
        totalHospitals: 2,
        totalEngineers: 5,
        totalReports: 20
    });
});

// 404 handler
app.use((req, res) => {
    console.log('404:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Export for Vercel
module.exports = app;

// For local testing - only listen if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    });
}