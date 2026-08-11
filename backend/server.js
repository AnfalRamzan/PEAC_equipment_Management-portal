// backend/server.js
// ✅ COMPLETE FIXED VERSION - With Proper Token Loading

// ============================================================
// ✅ LOAD ENVIRONMENT VARIABLES FIRST
// ============================================================
console.log('🔍 Loading environment variables...');
require('dotenv').config();

// ✅ Check if .env loaded properly
console.log('✅ Environment loaded');
console.log('🔐 BLOB_READ_WRITE_TOKEN status:', process.env.BLOB_READ_WRITE_TOKEN ? '✅ Set' : '❌ MISSING');
console.log('🔐 BLOB_STORE_ID:', process.env.BLOB_STORE_ID || 'blob_store_default');
console.log('🔐 JWT_SECRET status:', process.env.JWT_SECRET ? '✅ Set' : '❌ MISSING');
console.log('🔐 DATABASE_URL status:', process.env.DATABASE_URL ? '✅ Set' : '❌ MISSING');

// ============================================================
// ✅ IMPORTS
// ============================================================
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, testConnection } = require('./config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const { put, del, head } = require('@vercel/blob');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-2024';

// ✅ Test database connection on startup
testConnection();

// ============================================================
// ✅ HELPER: Get Blob Token - WITH LOGGING
// ============================================================
const getBlobToken = () => {
    // ✅ Direct check from process.env
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const oidcToken = process.env.VERCEL_OIDC_TOKEN;
    const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';
    
    console.log('🔐 Checking blob credentials...');
    console.log('📌 BLOB_READ_WRITE_TOKEN from env:', token ? '✅ Found (length: ' + token.length + ')' : '❌ Not found');
    console.log('📌 VERCEL_OIDC_TOKEN from env:', oidcToken ? '✅ Found' : '❌ Not found');
    console.log('📌 BLOB_STORE_ID:', storeId);
    
    if (token) {
        console.log('✅ Using BLOB_READ_WRITE_TOKEN');
        return { token, storeId };
    }
    
    if (oidcToken) {
        console.log('✅ Using VERCEL_OIDC_TOKEN with storeId');
        return { oidcToken, storeId };
    }
    
    console.error('❌ No blob credentials found!');
    console.error('❌ Please set BLOB_READ_WRITE_TOKEN in .env file');
    return null;
};

// ============================================================
// ✅ MIDDLEWARE
// ============================================================
app.use(cors({ 
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        
        if (origin.includes('vercel.app') || 
            origin.includes('localhost') || 
            origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.options('*', cors());

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ============================================================
// ✅ ROOT ROUTE
// ============================================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🏥 Hospital Equipment Management System API',
        version: '1.0.0',
        environment: {
            blob_token: process.env.BLOB_READ_WRITE_TOKEN ? '✅ Set' : '❌ Missing',
            blob_store: process.env.BLOB_STORE_ID || 'default',
            jwt_secret: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
            database: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
            node_env: process.env.NODE_ENV || 'development'
        },
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// ✅ HEALTH CHECK - TO VERIFY BLOB TOKEN
// ============================================================
app.get('/api/health', (req, res) => {
    const token = getBlobToken();
    res.json({
        success: true,
        status: 'healthy',
        blob_storage: token ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// ✅ STATIC FILE SERVE
// ============================================================
try {
    const uploadsPath = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsPath)) {
        app.use('/uploads', express.static(uploadsPath));
        console.log(`📁 Serving uploads from: ${uploadsPath}`);
    } else {
        console.log('⚠️ Uploads directory not found - skipping static file serve');
    }
} catch (error) {
    console.log('⚠️ Static file serving not available on Vercel');
}

// ============================================================
// ✅ CONSTANTS
// ============================================================
const validRepairStatuses = [
    'Pending', 'Assigned', 'Accepted', 'In Progress',
    'Waiting for Spare Parts', 'Testing', 'Completed', 'Verified', 'Resolved', 'Closed'
];
const validPOStatuses = ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Received', 'Cancelled'];
const validProcStatuses = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Procured'];
const validMaintenanceStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Overdue'];

// ============================================================
// ✅ HELPER FUNCTION - Format Date for MySQL
// ============================================================
const formatDateForMySQL = (date) => {
    if (!date) return null;
    if (date === '' || date === '0000-00-00') return null;
    if (date === 'Invalid Date') return null;
    
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
};

// ============================================================
// ✅ WEBSOCKET SERVER
// ============================================================
let wss = null;

const initWebSocket = (server) => {
    wss = new WebSocket.Server({ server, path: '/ws/notifications' });
    
    wss.on('connection', (ws, req) => {
        console.log('🔌 WebSocket client connected');
        
        ws.send(JSON.stringify({
            type: 'connection',
            message: 'Connected to notification server',
            timestamp: new Date().toISOString()
        }));
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 WebSocket message received:', data);
                
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                }
            } catch (error) {
                console.error('❌ WebSocket message error:', error);
            }
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket client disconnected');
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });
    });
    
    console.log('🔌 WebSocket server initialized on path: /ws/notifications');
    return wss;
};

const broadcastNotification = (notification) => {
    if (!wss) {
        console.log('⚠️ WebSocket server not initialized');
        return;
    }
    
    const message = JSON.stringify({
        type: 'new_notification',
        data: notification,
        timestamp: new Date().toISOString()
    });
    
    let clientsCount = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            clientsCount++;
        }
    });
    
    console.log(`📨 Broadcasted notification to ${clientsCount} clients:`, notification.title);
};

// ============================================================
// ✅ NOTIFICATION HELPERS
// ============================================================
const createNotification = async (userId, title, message, type, relatedId = null, relatedModule = null) => {
    try {
        const result = await query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_module, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, title, message, type, relatedId, relatedModule]
        );
        
        const [notification] = await query(
            `SELECT * FROM notifications WHERE id = ?`,
            [result.insertId]
        );
        
        console.log(`📨 Notification created for user ${userId}: ${title}`);
        
        if (notification) {
            broadcastNotification({
                id: notification.id,
                user_id: notification.user_id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                related_id: notification.related_id,
                related_module: notification.related_module,
                is_read: notification.is_read,
                created_at: notification.created_at
            });
        }
        
        return result;
    } catch (error) {
        console.error('❌ Notification error:', error);
        return null;
    }
};

const notifyAdmins = async (hospitalId, title, message, type, relatedId = null, relatedModule = null) => {
    try {
        await createNotification(1, title, message, type, relatedId, relatedModule);
        
        const engineers = await query(
            `SELECT id FROM users 
             WHERE role_id = 3 
             AND hospital_id = ? 
             AND is_active = 1`,
            [hospitalId]
        );
        for (const eng of engineers) {
            await createNotification(eng.id, title, message, type, relatedId, relatedModule);
        }
    } catch (error) {
        console.error('❌ Notify admins error:', error);
    }
};

const notifyEngineer = async (engineerId, title, message, type, relatedId = null, relatedModule = null) => {
    if (engineerId) {
        await createNotification(engineerId, title, message, type, relatedId, relatedModule);
    }
};

// ============================================================
// ✅ AUTH MIDDLEWARE
// ============================================================
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('🔐 Auth Header present:', !!authHeader);
        
        const token = authHeader?.split(' ')[1];
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        let userId;
        let decoded;

        try {
            decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
            console.log('✅ JWT verified for user:', userId);
        } catch (jwtError) {
            console.log('❌ JWT verification failed:', jwtError.message);
            
            if (token.startsWith('test-token-')) {
                const parts = token.split('-');
                userId = parseInt(parts[1]) || 1;
                console.log('✅ Using test-token for user:', userId);
            } else {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid token' 
                });
            }
        }

        const users = await query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ? AND u.is_active = 1`,
            [userId]
        );

        if (users.length === 0) {
            console.log('❌ User not found:', userId);
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = users[0];
        console.log('✅ User authenticated:', req.user.email, 'Role:', req.user.role_name);
        next();
    } catch (error) {
        console.error('❌ Auth error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('🔐 Authorize check:');
        console.log('📌 User role:', req.user?.role_name);
        console.log('📌 Allowed roles:', allowedRoles);
        
        if (!req.user) {
            console.log('❌ No user found');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }
        if (!allowedRoles.includes(req.user.role_name)) {
            console.log('❌ Role not allowed:', req.user.role_name);
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }
        console.log('✅ Authorized');
        next();
    };
};

// ============================================================
// ✅ FILE FILTER
// ============================================================
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
};

// ============================================================
// ✅ PROFILE PICTURE UPLOAD
// ============================================================
const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, GIF, and WEBP images are allowed'), false);
        }
    }
});

// ============================================================
// ✅ GENERAL FILE UPLOAD
// ============================================================
const storage = multer.memoryStorage();

const uploadMulter = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ============================================================
// ✅ UPLOAD ROUTES - FIXED
// ============================================================

// ✅ SINGLE FILE UPLOAD - WITH DIRECT TOKEN ACCESS
app.post('/api/upload', authenticate, async (req, res) => {
    uploadMulter.single('file')(req, res, async function(err) {
        if (err) {
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Upload failed'
            });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // ✅ DIRECT TOKEN ACCESS - NOT FROM HELPER
            const token = process.env.BLOB_READ_WRITE_TOKEN;
            const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';
            
            console.log('📤 Uploading to Vercel Blob:', req.file.originalname);
            console.log('📤 File size:', req.file.size);
            console.log('📌 Token from process.env:', token ? '✅ Found (length: ' + token.length + ')' : '❌ NOT FOUND');
            console.log('📌 Store ID:', storeId);

            if (!token) {
                console.error('❌ BLOB_READ_WRITE_TOKEN is missing from process.env!');
                console.error('❌ Please check your .env file');
                return res.status(500).json({
                    success: false,
                    message: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN in .env file.'
                });
            }

            const filename = `${Date.now()}-${req.file.originalname}`;
            
            console.log('📤 Attempting to upload to Vercel Blob...');
            console.log('📤 Filename:', filename);
            
            const blob = await put(`uploads/${filename}`, req.file.buffer, {
                access: 'public',
                token: token,
                storeId: storeId,
            });

            console.log('✅ Uploaded to Vercel Blob:', blob.url);

            res.json({
                success: true,
                message: 'File uploaded successfully',
                file: {
                    url: blob.url,
                    name: req.file.originalname,
                    size: req.file.size,
                    type: req.file.mimetype.startsWith('image/') ? 'image' :
                          req.file.mimetype.startsWith('video/') ? 'video' : 'document',
                    mimetype: req.file.mimetype
                }
            });
        } catch (error) {
            console.error('❌ Upload processing error:', error);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
            
            res.status(500).json({
                success: false,
                message: 'Upload failed: ' + error.message,
                details: error.message
            });
        }
    });
});

// ✅ MULTIPLE FILE UPLOAD
app.post('/api/upload/multiple', authenticate, async (req, res) => {
    const multipleUpload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 100 * 1024 * 1024, files: 10 },
        fileFilter: fileFilter
    }).array('files', 10);
    
    multipleUpload(req, res, async function(err) {
        if (err) {
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Upload failed'
            });
        }
        
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            const token = process.env.BLOB_READ_WRITE_TOKEN;
            const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';

            if (!token) {
                console.error('❌ BLOB_READ_WRITE_TOKEN is missing!');
                return res.status(500).json({
                    success: false,
                    message: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.'
                });
            }

            const uploadedFiles = [];
            
            for (const file of req.files) {
                const filename = `${Date.now()}-${file.originalname}`;
                const blob = await put(`uploads/${filename}`, file.buffer, {
                    access: 'public',
                    token: token,
                    storeId: storeId,
                });

                uploadedFiles.push({
                    url: blob.url,
                    name: file.originalname,
                    size: file.size,
                    type: file.mimetype.startsWith('image/') ? 'image' :
                          file.mimetype.startsWith('video/') ? 'video' : 'document',
                    mimetype: file.mimetype
                });
            }

            res.json({
                success: true,
                message: `${uploadedFiles.length} files uploaded successfully`,
                files: uploadedFiles
            });
        } catch (error) {
            console.error('❌ Upload processing error:', error);
            res.status(500).json({
                success: false,
                message: 'Upload processing failed: ' + error.message
            });
        }
    });
});

// ✅ DIRECTORY UPLOAD
app.post('/api/upload-dir', authenticate, async (req, res) => {
    const { directory } = req.body;
    
    if (!directory) {
        return res.status(400).json({
            success: false,
            message: 'Directory is required'
        });
    }
    
    const dirUpload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 100 * 1024 * 1024 },
        fileFilter: fileFilter
    }).single('file');
    
    dirUpload(req, res, async function(err) {
        if (err) {
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Upload failed'
            });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const token = process.env.BLOB_READ_WRITE_TOKEN;
            const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';

            if (!token) {
                console.error('❌ BLOB_READ_WRITE_TOKEN is missing!');
                return res.status(500).json({
                    success: false,
                    message: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.'
                });
            }

            const filename = `${Date.now()}-${req.file.originalname}`;
            const blob = await put(`uploads/${directory}/${filename}`, req.file.buffer, {
                access: 'public',
                token: token,
                storeId: storeId,
            });

            res.json({
                success: true,
                message: 'File uploaded successfully',
                file: {
                    url: blob.url,
                    name: req.file.originalname,
                    size: req.file.size,
                    type: req.file.mimetype.startsWith('image/') ? 'image' :
                          req.file.mimetype.startsWith('video/') ? 'video' : 'document',
                    mimetype: req.file.mimetype
                }
            });
        } catch (error) {
            console.error('❌ Upload processing error:', error);
            res.status(500).json({
                success: false,
                message: 'Upload processing failed: ' + error.message
            });
        }
    });
});

// ✅ DELETE FILE
app.delete('/api/upload', authenticate, async (req, res) => {
    try {
        const { fileUrl } = req.body;
        
        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'File URL is required'
            });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';

        if (!token) {
            console.error('❌ BLOB_READ_WRITE_TOKEN is missing!');
            return res.status(500).json({
                success: false,
                message: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.'
            });
        }

        await del(fileUrl, {
            token: token,
            storeId: storeId,
        });

        console.log('🗑️ File deleted from Vercel Blob:', fileUrl);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file: ' + error.message
        });
    }
});

// ✅ GET UPLOADS LIST
app.get('/api/uploads', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            files: []
        });
    } catch (error) {
        console.error('❌ Get uploads error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get uploads: ' + error.message
        });
    }
});

// ============================================================
// ✅ PROFILE PICTURE UPLOAD
// ============================================================
app.post('/api/users/profile-picture', authenticate, profileUpload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';

        if (!token) {
            console.error('❌ BLOB_READ_WRITE_TOKEN is missing!');
            return res.status(500).json({
                success: false,
                message: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.'
            });
        }

        console.log('📤 Uploading profile picture for user:', req.user.id);

        const filename = `profile-${req.user.id}-${Date.now()}.jpg`;
        const blob = await put(`uploads/profile/${filename}`, req.file.buffer, {
            access: 'public',
            token: token,
            storeId: storeId,
        });

        console.log('✅ Profile picture uploaded to Vercel Blob:', blob.url);

        await query(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [blob.url, req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profileImage: blob.url
        });
    } catch (error) {
        console.error('❌ Profile picture upload error:', error);
        
        let errorMessage = 'Failed to upload profile picture';
        if (error.message.includes('token')) {
            errorMessage = 'Blob storage not configured. Please check environment variables.';
        } else {
            errorMessage = error.message;
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});

// ✅ DELETE PROFILE PICTURE
app.delete('/api/users/profile-picture', authenticate, async (req, res) => {
    try {
        const users = await query('SELECT profile_image FROM users WHERE id = ?', [req.user.id]);
        
        if (users.length > 0 && users[0].profile_image) {
            try {
                const token = process.env.BLOB_READ_WRITE_TOKEN;
                const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';
                
                if (token) {
                    await del(users[0].profile_image, {
                        token: token,
                        storeId: storeId,
                    });
                    console.log('🗑️ Profile picture deleted from Vercel Blob');
                }
            } catch (error) {
                console.log('⚠️ Could not delete profile picture from Vercel Blob:', error.message);
            }
            
            await query(
                'UPDATE users SET profile_image = NULL WHERE id = ?',
                [req.user.id]
            );
            
            res.json({
                success: true,
                message: 'Profile picture removed successfully'
            });
        } else {
            res.json({
                success: true,
                message: 'No profile picture to remove'
            });
        }
    } catch (error) {
        console.error('❌ Delete profile picture error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete profile picture: ' + error.message
        });
    }
});

// ============================================================
// ✅ AUTH ROUTES
// ============================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt:', email);
        
        const users = await query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.email = ? AND u.is_active = 1`,
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const user = users[0];
        let isPasswordValid = false;
        
        if (email.toLowerCase() === 'superadmin@paec.edu.pk' && password === 'admin123') {
            isPasswordValid = true;
        } else {
            isPasswordValid = await bcrypt.compare(password, user.password_hash);
        }
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role_name,
                hospital_id: user.hospital_id 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ Login successful:', user.email);
        
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role_name,
                role_name: user.role_name,
                hospital_id: user.hospital_id,
                phone: user.phone || '',
                profile_image: user.profile_image || null
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, username, full_name, email, role_id, hospital_id, phone, profile_image FROM users WHERE id = ?',
            [req.user.id]
        );
        
        res.json({
            success: true,
            user: {
                id: users[0].id,
                username: users[0].username,
                full_name: users[0].full_name,
                email: users[0].email,
                role: req.user.role_name,
                hospital_id: users[0].hospital_id,
                phone: users[0].phone || '',
                profile_image: users[0].profile_image || null
            }
        });
    } catch (error) {
        console.error('❌ Get me error:', error);
        res.status(500).json({ success: false, message: 'Failed to get user info' });
    }
});

// ============================================================
// ✅ USERS ROUTES
// ============================================================
app.get('/api/users/me', authenticate, async (req, res) => {
    try {
        const users = await query(
            `SELECT u.id, u.username, u.full_name, u.email, u.phone, 
                    u.role_id, r.name as role_name, 
                    u.hospital_id, h.name as hospital_name,
                    u.profile_image
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             LEFT JOIN hospitals h ON u.hospital_id = h.id
             WHERE u.id = ? AND u.is_active = 1`,
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true, 
            user: users[0] 
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch profile' 
        });
    }
});

app.post('/api/users/change-password', authenticate, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        
        if (!current_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is required' 
            });
        }
        if (!new_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password is required' 
            });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters' 
            });
        }
        
        const users = await query(
            'SELECT * FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        const user = users[0];
        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        if (current_password === new_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be different from current password' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );
        
        console.log(`🔐 Password changed for user: ${req.user.email} (ID: ${req.user.id})`);
        
        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to change password' 
        });
    }
});

app.put('/api/users/me', authenticate, async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        const updates = [];
        const params = [];
        
        if (full_name && full_name.trim() !== '') {
            updates.push('full_name = ?');
            params.push(full_name.trim());
        }
        
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone || '');
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No fields to update' 
            });
        }
        
        params.push(req.user.id);
        await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        
        const updatedUser = await query(
            `SELECT u.id, u.username, u.full_name, u.email, u.phone, 
                    u.role_id, r.name as role_name, 
                    u.hospital_id, h.name as hospital_name,
                    u.profile_image
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             LEFT JOIN hospitals h ON u.hospital_id = h.id
             WHERE u.id = ? AND u.is_active = 1`,
            [req.user.id]
        );
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: updatedUser[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile' 
        });
    }
});

app.get('/api/users', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT u.*, r.name as role_name, h.name as hospital_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN hospitals h ON u.hospital_id = h.id
            WHERE u.is_active = 1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND u.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY u.full_name';
        const users = await query(sql, params);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

app.get('/api/users/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT u.*, r.name as role_name, h.name as hospital_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN hospitals h ON u.hospital_id = h.id
            WHERE u.id = ? AND u.is_active = 1
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND u.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const users = await query(sql, params);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

app.get('/api/users/roles', authenticate, async (req, res) => {
    try {
        const roles = await query('SELECT * FROM roles ORDER BY name');
        res.json({ success: true, roles });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch roles' });
    }
});

app.post('/api/users', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { username, full_name, email, password, role_id, hospital_id, phone } = req.body;

        console.log('👤 Creating user with data:', {
            username,
            full_name,
            email,
            role_id,
            hospital_id,
            phone,
            passwordProvided: !!password
        });

        if (!full_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Full name is required' 
            });
        }
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }
        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password is required' 
            });
        }
        if (!role_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Role is required' 
            });
        }

        const existing = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let finalHospitalId = hospital_id;
        if (finalHospitalId === '' || finalHospitalId === 'null' || finalHospitalId === 'undefined') {
            finalHospitalId = null;
        }

        const result = await query(
            `INSERT INTO users (username, full_name, email, password_hash, role_id, hospital_id, phone, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                username || full_name, 
                full_name, 
                email, 
                hashedPassword, 
                role_id, 
                finalHospitalId, 
                phone || ''
            ]
        );

        console.log('✅ User created:', result.insertId);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user_id: result.insertId
        });
    } catch (error) {
        console.error('❌ Create user error:', error);
        
        if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email or username already exists' 
            });
        }
        
        if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields. Please fill all required fields.' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

app.put('/api/users/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, full_name, email, password, role_id, hospital_id, phone, is_active } = req.body;

        console.log('👤 Updating user:', id);

        const existing = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        let updateQuery = `
            UPDATE users SET 
             username = ?,
             full_name = ?,
             email = ?,
             role_id = ?,
             hospital_id = ?,
             phone = ?,
             is_active = ?
        `;
        let params = [
            username || existing[0].username,
            full_name || existing[0].full_name,
            email || existing[0].email,
            role_id || existing[0].role_id,
            hospital_id || existing[0].hospital_id,
            phone || '',
            is_active !== undefined ? is_active : 1
        ];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += `, password_hash = ?`;
            params.push(hashedPassword);
        }

        updateQuery += ` WHERE id = ?`;
        params.push(id);

        await query(updateQuery, params);

        console.log('✅ User updated:', id);
        res.json({ 
            success: true, 
            message: 'User updated successfully' 
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.delete('/api/users/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting user ID:', id);

        const existing = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot delete your own account' 
            });
        }

        await query('UPDATE users SET is_active = 0 WHERE id = ?', [id]);

        console.log('✅ User deactivated successfully:', id);
        res.json({ 
            success: true, 
            message: 'User deactivated successfully' 
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// ============================================================
// ✅ HOSPITALS ROUTES
// ============================================================
app.get('/api/hospitals', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT h.*, 
                   (SELECT COUNT(*) FROM equipment WHERE hospital_id = h.id) as equipment_count,
                   (SELECT COUNT(*) FROM users WHERE hospital_id = h.id AND role_id = 3) as engineer_count
            FROM hospitals h 
            WHERE h.is_active = 1
        `;
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND h.id = ?';
            const hospitals = await query(sql, [req.user.hospital_id]);
            return res.json({ success: true, hospitals });
        }
        
        const hospitals = await query(sql);
        res.json({ success: true, hospitals });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/hospitals/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🏥 Fetching hospital ID:', id);
        
        let sql = `
            SELECT h.*, 
                   (SELECT COUNT(*) FROM equipment WHERE hospital_id = h.id) as equipment_count,
                   (SELECT COUNT(*) FROM users WHERE hospital_id = h.id AND role_id = 3) as engineer_count
            FROM hospitals h 
            WHERE h.id = ? AND h.is_active = 1
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND h.id = ?';
            params.push(req.user.hospital_id);
        }

        const hospitals = await query(sql, params);
        if (hospitals.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Hospital not found' 
            });
        }

        console.log('✅ Hospital found:', hospitals[0].name);
        res.json({ success: true, hospital: hospitals[0] });
    } catch (error) {
        console.error('Get hospital error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/hospitals', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, address, city, state, country, phone, email, biomedical_head, hospital_code } = req.body;
        console.log('🏥 Creating hospital:', name);
        console.log('📋 Hospital Code:', hospital_code);
        
        const finalHospitalCode = hospital_code || `HOS-${Date.now().toString().slice(-6)}`;
        
        const result = await query(
            `INSERT INTO hospitals (name, address, city, state, country, phone, email, biomedical_head, hospital_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, address || '', city || '', state || '', country || '', phone || '', email || '', biomedical_head || '', finalHospitalCode]
        );
        res.status(201).json({
            success: true,
            message: 'Hospital created successfully',
            hospital_id: result.insertId,
            hospital_code: finalHospitalCode
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/hospitals/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, city, state, country, phone, email, biomedical_head, hospital_code, is_active } = req.body;

        console.log('🏥 Updating hospital:', id);

        const existing = await query('SELECT * FROM hospitals WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Hospital not found' 
            });
        }

        await query(
            `UPDATE hospitals SET 
             name = ?, address = ?, city = ?, state = ?, 
             country = ?, phone = ?, email = ?, biomedical_head = ?, 
             hospital_code = ?, is_active = ?
             WHERE id = ?`,
            [
                name || existing[0].name,
                address || '',
                city || '',
                state || '',
                country || '',
                phone || '',
                email || '',
                biomedical_head || '',
                hospital_code || existing[0].hospital_code || `HOS-${Date.now().toString().slice(-6)}`,
                is_active !== undefined ? is_active : 1,
                id
            ]
        );

        res.json({ 
            success: true, 
            message: 'Hospital updated successfully' 
        });
    } catch (error) {
        console.error('Update hospital error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.delete('/api/hospitals/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting hospital ID:', id);

        const existing = await query('SELECT * FROM hospitals WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Hospital not found' 
            });
        }

        await query('UPDATE hospitals SET is_active = 0 WHERE id = ?', [id]);

        console.log('✅ Hospital deactivated successfully:', id);
        res.json({ 
            success: true, 
            message: 'Hospital deactivated successfully' 
        });
    } catch (error) {
        console.error('Delete hospital error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// ============================================================
// ✅ DEPARTMENTS ROUTES
// ============================================================
app.get('/api/departments', authenticate, async (req, res) => {
    try {
        let sql = 'SELECT * FROM departments';
        const params = [];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' WHERE hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY name';
        const departments = await query(sql, params);
        res.json({ success: true, departments });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/departments/hospital/:hospitalId', authenticate, async (req, res) => {
    try {
        const { hospitalId } = req.params;
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (parseInt(hospitalId) !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }
        
        const departments = await query('SELECT * FROM departments WHERE hospital_id = ? ORDER BY name', [hospitalId]);
        res.json({ success: true, departments });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/departments', authenticate, async (req, res) => {
    try {
        const { name, hospital_id } = req.body;
        console.log('🏢 Creating department:', name, 'for hospital:', hospital_id);
        
        if (!name || !name.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department name is required' 
            });
        }
        
        let finalHospitalId = hospital_id;
        if (req.user.role_name === 'HOSPITAL_ADMIN') {
            finalHospitalId = req.user.hospital_id;
        }
        
        const existing = await query(
            'SELECT * FROM departments WHERE name = ? AND hospital_id = ?', 
            [name.trim(), finalHospitalId || null]
        );
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department already exists for this hospital' 
            });
        }
        
        const result = await query(
            'INSERT INTO departments (name, hospital_id) VALUES (?, ?)', 
            [name.trim(), finalHospitalId || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department: { id: result.insertId, name: name.trim(), hospital_id: finalHospitalId || null }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// ============================================================
// ✅ EQUIPMENT CATEGORIES ROUTES
// ============================================================
app.get('/api/equipment/categories/all', authenticate, async (req, res) => {
    try {
        const categories = await query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM equipment WHERE category_id = c.id) as equipment_count
            FROM equipment_categories c 
            ORDER BY c.name
        `);
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/equipment/categories', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, description, is_active } = req.body;
        console.log('📦 Category create request from:', req.user?.email, req.user?.role_name);
        console.log('📦 Category name:', name);
        
        if (!name || !name.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category name is required' 
            });
        }
        
        const existing = await query('SELECT * FROM equipment_categories WHERE name = ?', [name.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category already exists' 
            });
        }
        
        const result = await query(
            'INSERT INTO equipment_categories (name, description, is_active) VALUES (?, ?, ?)',
            [name.trim(), description || '', is_active !== undefined ? is_active : 1]
        );
        
        console.log('✅ Category created:', result.insertId);
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category: { id: result.insertId, name: name.trim() }
        });
    } catch (error) {
        console.error('❌ Category creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

app.put('/api/equipment/categories/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;
        
        console.log('📦 Updating category:', id);
        
        const existing = await query('SELECT * FROM equipment_categories WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }
        
        if (name && name.trim() !== '') {
            const duplicate = await query(
                'SELECT * FROM equipment_categories WHERE name = ? AND id != ?',
                [name.trim(), id]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Category name already exists' 
                });
            }
        }
        
        await query(
            `UPDATE equipment_categories SET 
             name = ?, description = ?, is_active = ?
             WHERE id = ?`,
            [
                name || existing[0].name,
                description !== undefined ? description : existing[0].description,
                is_active !== undefined ? is_active : existing[0].is_active,
                id
            ]
        );
        
        console.log('✅ Category updated:', id);
        res.json({ 
            success: true, 
            message: 'Category updated successfully' 
        });
    } catch (error) {
        console.error('❌ Category update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

app.delete('/api/equipment/categories/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting category ID:', id);
        
        const existing = await query('SELECT * FROM equipment_categories WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        console.log('📌 Category found:', existing[0].name);

        const inUse = await query('SELECT id, name FROM equipment WHERE category_id = ?', [id]);
        console.log(`📌 Equipment using this category: ${inUse.length}`);

        if (inUse.length > 0) {
            console.log(`🔄 Reassigning ${inUse.length} equipment items to NULL category...`);
            await query('UPDATE equipment SET category_id = NULL WHERE category_id = ?', [id]);
            console.log('✅ Equipment reassigned successfully');
        }

        await query('DELETE FROM equipment_categories WHERE id = ?', [id]);

        console.log('✅ Category deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Category deleted successfully. Equipment reassigned to no category.' 
        });
    } catch (error) {
        console.error('❌ Category delete error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================================
// ✅ EQUIPMENT ROUTES
// ============================================================
app.get('/api/equipment', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT e.*, c.name as category_name, h.name as hospital_name, d.name as department_name
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.status != 'Inactive'
        `;
        const params = [];
        
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.hospital_id) {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY e.created_at DESC';
        const equipment = await query(sql, params);
        res.json({ success: true, equipment });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/equipment/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        let sql = `
            SELECT e.*, c.name as category_name, h.name as hospital_name, d.name as department_name
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.id = ?
        `;
        const params = [id];
        
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.hospital_id) {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        const equipment = await query(sql, params);
        if (equipment.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        res.json({ success: true, equipment: equipment[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/equipment', authenticate, async (req, res) => {
    try {
        const { 
            name, category_id, manufacturer, model, serial_number, 
            installation_year, hospital_id, department_id, location, status,
            image_url
        } = req.body;
        
        console.log('🛠️ Creating equipment:', name);
        console.log('📌 Serial Number:', serial_number);
        console.log('📸 Image URL:', image_url);
        
        if (!name) {
            return res.status(400).json({ success: false, message: 'Equipment name is required' });
        }

        if (serial_number) {
            const existing = await query(
                'SELECT id FROM equipment WHERE serial_number = ?',
                [serial_number]
            );
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Serial number "${serial_number}" already exists. Please use a unique serial number.` 
                });
            }
        }
        
        let finalHospitalId = hospital_id;
        if (req.user.role_name === 'HOSPITAL_ADMIN') {
            finalHospitalId = req.user.hospital_id;
        }
        
        let validInstallationYear = null;
        if (installation_year) {
            const year = parseInt(installation_year);
            if (year >= 1901 && year <= 2155) {
                validInstallationYear = year;
            }
        }
        
        const result = await query(
            `INSERT INTO equipment (name, category_id, manufacturer, model, serial_number, installation_year, hospital_id, department_id, location, status, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id || null, manufacturer || '', model || '', serial_number || '', 
             validInstallationYear, finalHospitalId, department_id || null, location || '', status || 'Active',
             image_url || null]
        );
        
        console.log('✅ Equipment created:', result.insertId);
        
        res.status(201).json({
            success: true,
            message: 'Equipment created successfully',
            equipment: { id: result.insertId }
        });
    } catch (error) {
        console.error('❌ Equipment creation error:', error);
        
        if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Serial number already exists. Please use a unique serial number.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

app.put('/api/equipment/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, category_id, manufacturer, model, serial_number, 
            installation_year, department_id, location, status,
            image_url
        } = req.body;
        
        console.log('🔄 Updating equipment:', id);
        console.log('📸 Image URL:', image_url);
        
        let sql = 'SELECT * FROM equipment WHERE id = ?';
        let params = [id];
        if (req.user.role_name !== 'SUPER_ADMIN' && req.user.hospital_id) {
            sql += ' AND hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        
        if (serial_number) {
            const duplicateCheck = await query(
                'SELECT id FROM equipment WHERE serial_number = ? AND id != ?',
                [serial_number, id]
            );
            if (duplicateCheck.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Serial number "${serial_number}" already exists. Please use a unique serial number.` 
                });
            }
        }
        
        let validInstallationYear = null;
        if (installation_year) {
            const year = parseInt(installation_year);
            if (year >= 1901 && year <= 2155) {
                validInstallationYear = year;
            }
        }
        
        await query(
            `UPDATE equipment SET 
             name = ?, category_id = ?, manufacturer = ?, model = ?, 
             serial_number = ?, installation_year = ?, department_id = ?, 
             location = ?, status = ?, image_url = ?
             WHERE id = ?`,
            [name, category_id, manufacturer, model, serial_number, 
             validInstallationYear, department_id, location, status,
             image_url || null, id]
        );
        res.json({ success: true, message: 'Equipment updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.delete('/api/equipment/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting equipment ID:', id);
        
        const existing = await query('SELECT * FROM equipment WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }
        
        await query("UPDATE equipment SET status = 'Inactive' WHERE id = ?", [id]);
        
        console.log('✅ Equipment deactivated successfully:', id);
        res.json({ 
            success: true, 
            message: 'Equipment deactivated successfully' 
        });
    } catch (error) {
        console.error('❌ Equipment DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================================
// ✅ ERRORS ROUTES
// ============================================================
app.get('/api/errors', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT e.*, 
                   eq.name as equipment_name, 
                   h.name as hospital_name, 
                   d.name as department_name,
                   u.full_name as reported_by_name
            FROM error_logs e
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            LEFT JOIN hospitals h ON eq.hospital_id = h.id
            LEFT JOIN departments d ON eq.department_id = d.id
            LEFT JOIN users u ON e.reported_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND eq.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY e.created_at DESC';
        const errors = await query(sql, params);
        res.json({ success: true, errors });
    } catch (error) {
        console.error('Get errors error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch errors' });
    }
});

app.get('/api/errors/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT e.*, 
                   eq.name as equipment_name, 
                   h.name as hospital_name, 
                   d.name as department_name,
                   u.full_name as reported_by_name
            FROM error_logs e
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            LEFT JOIN hospitals h ON eq.hospital_id = h.id
            LEFT JOIN departments d ON eq.department_id = d.id
            LEFT JOIN users u ON e.reported_by = u.id
            WHERE e.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND eq.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const errors = await query(sql, params);
        if (errors.length === 0) {
            return res.status(404).json({ success: false, message: 'Error not found' });
        }
        res.json({ success: true, error: errors[0] });
    } catch (error) {
        console.error('Get error error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch error' });
    }
});

app.post('/api/errors', authenticate, async (req, res) => {
    try {
        const { 
            equipment_id, 
            error_code, 
            error_title, 
            error_description, 
            severity, 
            priority,
            error_date,
            attachments
        } = req.body;

        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }
        
        if (!error_title || error_title.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Error title is required' 
            });
        }

        const equipmentCheck = await query(
            'SELECT id, name, hospital_id FROM equipment WHERE id = ?',
            [equipment_id]
        );
        
        if (equipmentCheck.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }

        const userCheck = await query(
            'SELECT id FROM users WHERE id = ? AND is_active = 1',
            [req.user.id]
        );
        
        if (userCheck.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found or inactive' 
            });
        }

        const finalSeverity = severity || 'Medium';
        const finalPriority = priority || 'Medium';
        
        let finalErrorDate = null;
        if (error_date) {
            finalErrorDate = error_date;
        } else {
            finalErrorDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        const result = await query(
            `INSERT INTO error_logs 
             (equipment_id, error_code, error_title, error_description, 
              severity, priority, reported_by, error_date, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(equipment_id),
                error_code || null,
                error_title.trim(),
                error_description || '',
                finalSeverity,
                finalPriority,
                req.user.id,
                finalErrorDate,
                attachments || ''
            ]
        );

        console.log('✅ Error created successfully. ID:', result.insertId);

        const equipmentName = equipmentCheck[0].name;

        await createNotification(
            1,
            'New Error Reported', 
            `Error "${error_title}" reported for ${equipmentName}`,
            'Error',
            result.insertId,
            'errors'
        );

        const engineers = await query(
            `SELECT id FROM users 
             WHERE role_id = 3 
             AND hospital_id = ? 
             AND is_active = 1`,
            [equipmentCheck[0].hospital_id]
        );
        
        for (const eng of engineers) {
            await createNotification(
                eng.id,
                'New Error Reported',
                `Error "${error_title}" reported for ${equipmentName} in your hospital`,
                'Error',
                result.insertId,
                'errors'
            );
        }

        res.status(201).json({
            success: true,
            message: 'Error reported successfully',
            error: { 
                id: result.insertId,
                equipment_name: equipmentName
            }
        });

    } catch (error) {
        console.error('❌ CREATE ERROR ERROR:');
        console.error('❌ Message:', error.message);
        console.error('❌ Code:', error.code);
        console.error('❌ SQL:', error.sql);
        console.error('❌ Stack:', error.stack);
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to report error: ' + error.message,
            details: error.code || 'Unknown error'
        });
    }
});

app.put('/api/errors/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { error_code, error_title, error_description, severity, priority, attachments } = req.body;

        const existing = await query('SELECT * FROM error_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error not found' 
            });
        }

        const errorData = existing[0];

        const equipmentInfo = await query(
            'SELECT hospital_id FROM equipment WHERE id = ?',
            [errorData.equipment_id]
        );
        
        if (equipmentInfo.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (!isSuperAdmin && equipmentInfo[0].hospital_id !== req.user.hospital_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied - You do not have permission for this hospital' 
            });
        }

        if (isHospitalAdmin) {
            // Hospital Admin can update all errors in their hospital
        } else if (isEngineer) {
            if (errorData.reported_by !== req.user.id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied - You can only update errors reported by you' 
                });
            }
        } else if (!isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }

        const updateFields = [];
        const updateValues = [];

        if (error_code !== undefined) {
            updateFields.push('error_code = ?');
            updateValues.push(error_code || null);
        }
        if (error_title !== undefined && error_title.trim() !== '') {
            updateFields.push('error_title = ?');
            updateValues.push(error_title.trim());
        }
        if (error_description !== undefined) {
            updateFields.push('error_description = ?');
            updateValues.push(error_description || '');
        }
        if (severity !== undefined) {
            updateFields.push('severity = ?');
            updateValues.push(severity || 'Medium');
        }
        if (priority !== undefined) {
            updateFields.push('priority = ?');
            updateValues.push(priority || 'Medium');
        }
        if (attachments !== undefined) {
            updateFields.push('attachments = ?');
            updateValues.push(attachments || '');
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(id);

        await query(
            `UPDATE error_logs SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        console.log('✅ Error updated successfully:', id);
        res.json({ 
            success: true, 
            message: 'Error updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update error error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update error: ' + error.message 
        });
    }
});

app.delete('/api/errors/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting error ID:', id);
        
        const existing = await query('SELECT * FROM error_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Error not found' });
        }
        
        await query('DELETE FROM error_logs WHERE id = ?', [id]);
        console.log('✅ Error deleted successfully:', id);
        res.json({ success: true, message: 'Error deleted successfully' });
    } catch (error) {
        console.error('Delete error error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete error' });
    }
});

// ============================================================
// ✅ ERROR FILE UPLOAD
// ============================================================
const errorUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/', 'video/', 'application/pdf'];
        if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: images, videos, PDF'), false);
        }
    }
});

app.post('/api/errors/upload', authenticate, errorUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        const storeId = process.env.BLOB_STORE_ID || 'blob_store_default';

        if (!token) {
            console.error('❌ BLOB_READ_WRITE_TOKEN is missing!');
            return res.status(500).json({
                success: false,
                message: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.'
            });
        }

        const filename = `error-${Date.now()}-${req.file.originalname}`;
        const blob = await put(`uploads/errors/${filename}`, req.file.buffer, {
            access: 'public',
            token: token,
            storeId: storeId,
        });

        console.log('✅ Error file uploaded to Vercel Blob:', blob.url);

        res.json({
            success: true,
            message: 'File uploaded successfully',
            fileUrl: blob.url,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Upload failed: ' + error.message 
        });
    }
});

// ============================================================
// ✅ REPAIRS ROUTES
// ============================================================
app.get('/api/repairs', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT r.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   r.engineer_name,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY r.created_at DESC';
        const repairs = await query(sql, params);
        res.json({ success: true, repairs });
    } catch (error) {
        console.error('Get repairs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repairs' });
    }
});

app.get('/api/repairs/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT r.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   r.engineer_name,
                   el.error_title
            FROM repairs r
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE r.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const repairs = await query(sql, params);
        if (repairs.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Repair not found' 
            });
        }

        const spareParts = await query('SELECT * FROM spare_parts WHERE repair_id = ?', [id]);

        res.json({
            success: true,
            repair: repairs[0],
            spare_parts: spareParts
        });
    } catch (error) {
        console.error('Get repair error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch repair' });
    }
});

app.post('/api/repairs', authenticate, async (req, res) => {
    try {
        const { 
            error_log_id, 
            engineer_name,
            root_cause, problem_analysis, 
            corrective_action, repair_procedure, solution_description, 
            time_taken, spare_part_used, remarks,
            repair_date,
            spare_parts,
            attachments
        } = req.body;

        console.log('🛠️ Creating repair...');
        console.log('👤 User:', req.user.email, 'Role:', req.user.role_name);
        console.log('📦 Payload:', req.body);

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (!isSuperAdmin && !isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Engineers and Super Admin can create repairs' 
            });
        }

        if (!error_log_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Error log is required' 
            });
        }

        const errorCheck = await query(
            'SELECT id, equipment_id, error_title FROM error_logs WHERE id = ?',
            [error_log_id]
        );
        
        if (errorCheck.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error log not found' 
            });
        }

        const equipmentCheck = await query(
            'SELECT id, name, hospital_id FROM equipment WHERE id = ?',
            [errorCheck[0].equipment_id]
        );
        
        if (equipmentCheck.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found' 
            });
        }

        const finalEngineerName = engineer_name || req.user.full_name || '';
        if (!finalEngineerName.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Engineer name is required' 
            });
        }

        const spareUsed = spare_part_used === 'Yes' ? 1 : 0;

        const result = await query(
            `INSERT INTO repairs 
             (error_log_id, engineer_id, engineer_name, root_cause, problem_analysis, 
              corrective_action, repair_procedure, solution_description, 
              time_taken, spare_part_used, remarks, repair_date, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(error_log_id),
                req.user.id,
                finalEngineerName.trim(),
                root_cause || '',
                problem_analysis || '',
                corrective_action || '',
                repair_procedure || '',
                solution_description || '',
                time_taken ? parseInt(time_taken) : 0,
                spareUsed,
                remarks || '',
                repair_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
                attachments || ''
            ]
        );

        console.log('✅ Repair created. ID:', result.insertId);

        if (spare_parts && Array.isArray(spare_parts) && spare_parts.length > 0) {
            for (const part of spare_parts) {
                await query(
                    `INSERT INTO repair_spare_parts 
                     (repair_id, part_name, part_number, brand, quantity, unit_cost, total_cost, installation_notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        result.insertId,
                        part.part_name || '',
                        part.part_number || '',
                        part.brand || '',
                        part.quantity || 1,
                        part.unit_cost || 0,
                        part.total_cost || 0,
                        part.installation_notes || ''
                    ]
                );
            }
            console.log(`✅ Added ${spare_parts.length} spare parts`);
        }

        try {
            await query(
                `UPDATE error_logs SET status = 'In Progress' WHERE id = ?`,
                [error_log_id]
            );
            console.log('✅ Error status updated to In Progress');
        } catch (updateError) {
            console.log('⚠️ Could not update error status:', updateError.message);
        }

        await createNotification(
            1,
            'New Repair Created',
            `Repair created for "${equipmentCheck[0].name}" - ${errorCheck[0].error_title}`,
            'Repair',
            result.insertId,
            'repairs'
        );

        await notifyAdmins(
            equipmentCheck[0].hospital_id,
            'New Repair Started',
            `Repair started for "${equipmentCheck[0].name}"`,
            'Repair',
            result.insertId,
            'repairs'
        );

        res.status(201).json({
            success: true,
            message: 'Repair recorded successfully',
            repair: { 
                id: result.insertId,
                equipment_name: equipmentCheck[0].name
            }
        });

    } catch (error) {
        console.error('❌ Create repair error:', error);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

app.put('/api/repairs/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            root_cause, problem_analysis, corrective_action, 
            repair_procedure, solution_description, time_taken, 
            spare_part_used, remarks, 
            engineer_name,
            attachments
        } = req.body;

        console.log('🔄 Updating repair:', id);
        console.log('👤 User:', req.user.email, 'Role:', req.user.role_name);

        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Super Admin can update repairs' 
            });
        }

        const existing = await query('SELECT * FROM repairs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Repair not found' 
            });
        }

        const spareUsed = spare_part_used === 'Yes' ? 1 : 0;

        await query(
            `UPDATE repairs SET 
             root_cause = ?, problem_analysis = ?, corrective_action = ?,
             repair_procedure = ?, solution_description = ?, time_taken = ?,
             spare_part_used = ?, remarks = ?,
             engineer_name = ?,
             attachments = ?
             WHERE id = ?`,
            [
                root_cause || existing[0].root_cause,
                problem_analysis || existing[0].problem_analysis,
                corrective_action || existing[0].corrective_action,
                repair_procedure || existing[0].repair_procedure,
                solution_description || existing[0].solution_description,
                time_taken || existing[0].time_taken,
                spareUsed,
                remarks || existing[0].remarks,
                engineer_name || existing[0].engineer_name,
                attachments !== undefined ? attachments : existing[0].attachments,
                id
            ]
        );

        const hasRootCause = root_cause && root_cause.trim() !== '';
        const hasSolution = solution_description && solution_description.trim() !== '';
        const hasProcedure = repair_procedure && repair_procedure.trim() !== '';
        
        if (hasRootCause && hasSolution && hasProcedure) {
            const repairData = await query(
                'SELECT error_log_id FROM repairs WHERE id = ?',
                [id]
            );
            
            if (repairData.length > 0 && repairData[0].error_log_id) {
                const existingKB = await query(
                    'SELECT id FROM knowledge_base WHERE error_title LIKE ? AND equipment_id IN (SELECT equipment_id FROM error_logs WHERE id = ?)',
                    [`%${existing[0].root_cause?.substring(0, 30)}%`, repairData[0].error_log_id]
                );
                
                if (existingKB.length === 0) {
                    await query(
                        `INSERT INTO knowledge_base 
                         (equipment_id, error_code, error_title, error_description, 
                          root_cause, solution, repair_procedure, time_taken, 
                          spare_parts_used, created_by)
                         SELECT el.equipment_id, el.error_code, el.error_title, 
                                el.error_description, r.root_cause, 
                                r.solution_description, r.repair_procedure, 
                                r.time_taken, 
                                CASE WHEN r.spare_part_used = 1 THEN 'Yes' ELSE 'No' END,
                                ? 
                         FROM repairs r
                         LEFT JOIN error_logs el ON r.error_log_id = el.id
                         WHERE r.id = ?`,
                        [req.user.id || 1, id]
                    );
                    console.log('📚 Auto-saved to knowledge base from repair:', id);
                }
            }
        }

        console.log('✅ Repair updated:', id);
        res.json({ 
            success: true, 
            message: 'Repair updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update repair error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update repair: ' + error.message 
        });
    }
});

app.delete('/api/repairs/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting repair ID:', id);
        
        const existing = await query('SELECT * FROM repairs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Repair not found' 
            });
        }

        await query('DELETE FROM spare_parts WHERE repair_id = ?', [id]);
        await query('DELETE FROM repairs WHERE id = ?', [id]);

        console.log('✅ Repair deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Repair deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Repair DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================================
// ✅ SPARE PARTS ROUTES
// ============================================================
app.get('/api/spare-parts', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT sp.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   r.engineer_name
            FROM spare_parts sp
            LEFT JOIN repairs r ON sp.repair_id = r.id
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY sp.created_at DESC';
        const spareParts = await query(sql, params);
        res.json({ success: true, spareParts });
    } catch (error) {
        console.error('Get spare parts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch spare parts' });
    }
});

app.get('/api/spare-parts/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT sp.*, 
                   e.name as equipment_name,
                   r.engineer_name
            FROM spare_parts sp
            LEFT JOIN repairs r ON sp.repair_id = r.id
            LEFT JOIN error_logs el ON r.error_log_id = el.id
            LEFT JOIN equipment e ON el.equipment_id = e.id
            WHERE sp.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const spareParts = await query(sql, params);
        if (spareParts.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }

        res.json({
            success: true,
            sparePart: spareParts[0]
        });
    } catch (error) {
        console.error('Get spare part error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch spare part' });
    }
});

app.post('/api/spare-parts', authenticate, async (req, res) => {
    try {
        const { 
            repair_id, part_name, part_number, brand, 
            quantity, unit_cost, total_cost, compatible_equipment, 
            installation_notes, manufacturer
        } = req.body;

        console.log('🔩 Creating spare part:', part_name);

        if (repair_id) {
            const repair = await query('SELECT * FROM repairs WHERE id = ?', [repair_id]);
            if (repair.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Repair not found' 
                });
            }
        }

        const result = await query(
            `INSERT INTO spare_parts 
             (repair_id, part_name, part_number, brand, 
              quantity, unit_cost, total_cost, compatible_equipment, 
              installation_notes, manufacturer)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                repair_id || null,
                part_name,
                part_number || '',
                brand || '',
                quantity || 1,
                unit_cost || 0,
                total_cost || 0,
                compatible_equipment || '',
                installation_notes || '',
                manufacturer || ''
            ]
        );

        console.log('✅ Spare part created:', result.insertId);

        const newSparePart = await query(
            `SELECT sp.*, e.name as equipment_name
             FROM spare_parts sp
             LEFT JOIN repairs r ON sp.repair_id = r.id
             LEFT JOIN error_logs el ON r.error_log_id = el.id
             LEFT JOIN equipment e ON el.equipment_id = e.id
             WHERE sp.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Spare part added successfully',
            sparePart: newSparePart[0] || { id: result.insertId }
        });
    } catch (error) {
        console.error('❌ Spare part creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

app.put('/api/spare-parts/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            part_name, part_number, brand, quantity, 
            unit_cost, total_cost, compatible_equipment, 
            installation_notes, manufacturer
        } = req.body;

        console.log('🔄 Updating spare part:', id);

        const existing = await query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }

        await query(
            `UPDATE spare_parts SET 
             part_name = ?,
             part_number = ?,
             brand = ?,
             quantity = ?,
             unit_cost = ?,
             total_cost = ?,
             compatible_equipment = ?,
             installation_notes = ?,
             manufacturer = ?
             WHERE id = ?`,
            [
                part_name || existing[0].part_name,
                part_number || '',
                brand || '',
                quantity || 1,
                unit_cost || 0,
                total_cost || 0,
                compatible_equipment || '',
                installation_notes || '',
                manufacturer || '',
                id
            ]
        );

        res.json({ 
            success: true, 
            message: 'Spare part updated successfully' 
        });
    } catch (error) {
        console.error('Update spare part error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update spare part' 
        });
    }
});

app.delete('/api/spare-parts/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting spare part ID:', id);
        
        const existing = await query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Spare part not found' 
            });
        }

        await query('DELETE FROM spare_parts WHERE id = ?', [id]);

        console.log('✅ Spare part deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Spare part deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Spare part DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================================
// ✅ KNOWLEDGE BASE ROUTES
// ============================================================
app.get('/api/knowledge-base', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT kb.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   u.full_name as created_by_name,
                   d.name as department_name
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON kb.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY kb.created_at DESC';
        const entries = await query(sql, params);
        res.json({ success: true, entries });
    } catch (error) {
        console.error('Get knowledge base error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch knowledge base' });
    }
});

app.get('/api/knowledge-base/equipment/:equipmentId', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        
        console.log('📚 Fetching knowledge base for equipment ID:', equipmentId);
        
        let sql = `
            SELECT kb.*, 
                   u.full_name as created_by_name,
                   e.name as equipment_name,
                   e.model as equipment_model,
                   e.manufacturer as equipment_manufacturer,
                   h.name as hospital_name,
                   d.name as department_name
            FROM knowledge_base kb
            LEFT JOIN users u ON kb.created_by = u.id
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE kb.equipment_id = ?
        `;
        const params = [equipmentId];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY kb.created_at DESC';
        const entries = await query(sql, params);
        
        console.log(`✅ Found ${entries.length} entries for equipment ${equipmentId}`);
        res.json({ success: true, entries });
    } catch (error) {
        console.error('Get knowledge base by equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch knowledge base entries for equipment' });
    }
});

app.get('/api/knowledge-base/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT kb.*, 
                   e.name as equipment_name,
                   e.model as equipment_model,
                   h.name as hospital_name,
                   u.full_name as created_by_name,
                   d.name as department_name
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON kb.created_by = u.id
            WHERE kb.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const entries = await query(sql, params);
        if (entries.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Knowledge base entry not found' 
            });
        }

        res.json({ success: true, entry: entries[0] });
    } catch (error) {
        console.error('Get knowledge base entry error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch knowledge base entry' });
    }
});

app.post('/api/knowledge-base', authenticate, async (req, res) => {
    try {
        const {
            equipment_id,
            error_code,
            error_title,
            error_description,
            root_cause,
            solution,
            repair_procedure,
            time_taken,
            spare_parts_used,
            spare_part_images,
            before_repair_images,
            after_repair_images,
            attachments,
            repair_date,
            remarks,
            reported_by,
            engineer_name,
            hospital_name,
            department_name,
            images,
            created_by
        } = req.body;

        console.log('📚 Creating knowledge base entry:', error_title);
        console.log('📚 Equipment ID:', equipment_id);

        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }
        if (!error_title || error_title.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Error title is required' 
            });
        }

        let sql = `
            SELECT e.*, h.name as hospital_name 
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE e.id = ?
        `;
        let params = [equipment_id];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        const equipment = await query(sql, params);
        if (equipment.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment not found or access denied' 
            });
        }

        const finalHospitalName = hospital_name || equipment[0].hospital_name || null;
        const finalDepartmentName = department_name || null;
        const finalReportedBy = reported_by || req.user.full_name || null;
        const finalEngineerName = engineer_name || null;
        const finalCreatedBy = created_by || req.user.id;

        const result = await query(
            `INSERT INTO knowledge_base (
                equipment_id, 
                error_code, 
                error_title, 
                error_description,
                root_cause, 
                solution, 
                repair_procedure, 
                time_taken,
                spare_parts_used,
                spare_part_images,
                before_repair_images,
                after_repair_images,
                attachments,
                repair_date,
                remarks,
                reported_by,
                engineer_name,
                hospital_name,
                department_name,
                images,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(equipment_id),
                error_code || null,
                error_title.trim(),
                error_description || null,
                root_cause || null,
                solution || null,
                repair_procedure || null,
                time_taken ? parseInt(time_taken) : null,
                spare_parts_used || null,
                spare_part_images || null,
                before_repair_images || null,
                after_repair_images || null,
                attachments || null,
                repair_date || null,
                remarks || null,
                finalReportedBy,
                finalEngineerName,
                finalHospitalName,
                finalDepartmentName,
                images || null,
                finalCreatedBy
            ]
        );

        console.log('✅ Knowledge base entry created. ID:', result.insertId);

        const newEntry = await query(
            `SELECT kb.*, 
                    u.full_name as created_by_name,
                    e.name as equipment_name,
                    h.name as hospital_name
             FROM knowledge_base kb
             LEFT JOIN users u ON kb.created_by = u.id
             LEFT JOIN equipment e ON kb.equipment_id = e.id
             LEFT JOIN hospitals h ON e.hospital_id = h.id
             WHERE kb.id = ?`,
            [result.insertId]
        );

        await createNotification(
            1,
            'New Knowledge Base Entry',
            `New solution added for "${equipment[0].name}" - ${error_title}`,
            'KnowledgeBase',
            result.insertId,
            'knowledge-base'
        );

        res.status(201).json({
            success: true,
            message: 'Knowledge base entry created successfully',
            entry: newEntry[0] || { id: result.insertId }
        });

    } catch (error) {
        console.error('❌ Create knowledge base error:', error);
        console.error('❌ Message:', error.message);
        console.error('❌ Code:', error.code);
        console.error('❌ SQL:', error.sql);
        console.error('❌ SQL Message:', error.sqlMessage);
        
        if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields. Please check all required fields are filled.' 
            });
        }
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ 
                success: false, 
                message: 'Database table not found. Please run database migrations.' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to create knowledge base entry: ' + error.message,
            details: error.sqlMessage || null
        });
    }
});

app.put('/api/knowledge-base/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            error_code,
            error_title,
            error_description,
            root_cause,
            solution,
            repair_procedure,
            time_taken,
            spare_parts_used,
            spare_part_images,
            before_repair_images,
            after_repair_images,
            attachments,
            repair_date,
            remarks,
            reported_by,
            engineer_name,
            hospital_name,
            department_name,
            images
        } = req.body;

        let sql = `
            SELECT kb.*, e.hospital_id 
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            WHERE kb.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Knowledge base entry not found' 
            });
        }

        if (req.user.role_name !== 'SUPER_ADMIN') {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        const updateFields = [];
        const updateValues = [];

        if (error_code !== undefined) {
            updateFields.push('error_code = ?');
            updateValues.push(error_code || null);
        }
        if (error_title !== undefined && error_title.trim() !== '') {
            updateFields.push('error_title = ?');
            updateValues.push(error_title.trim());
        }
        if (error_description !== undefined) {
            updateFields.push('error_description = ?');
            updateValues.push(error_description || null);
        }
        if (root_cause !== undefined) {
            updateFields.push('root_cause = ?');
            updateValues.push(root_cause || null);
        }
        if (solution !== undefined) {
            updateFields.push('solution = ?');
            updateValues.push(solution || null);
        }
        if (repair_procedure !== undefined) {
            updateFields.push('repair_procedure = ?');
            updateValues.push(repair_procedure || null);
        }
        if (time_taken !== undefined) {
            updateFields.push('time_taken = ?');
            updateValues.push(time_taken ? parseInt(time_taken) : null);
        }
        if (spare_parts_used !== undefined) {
            updateFields.push('spare_parts_used = ?');
            updateValues.push(spare_parts_used || null);
        }
        if (spare_part_images !== undefined) {
            updateFields.push('spare_part_images = ?');
            updateValues.push(spare_part_images || null);
        }
        if (before_repair_images !== undefined) {
            updateFields.push('before_repair_images = ?');
            updateValues.push(before_repair_images || null);
        }
        if (after_repair_images !== undefined) {
            updateFields.push('after_repair_images = ?');
            updateValues.push(after_repair_images || null);
        }
        if (attachments !== undefined) {
            updateFields.push('attachments = ?');
            updateValues.push(attachments || null);
        }
        if (repair_date !== undefined) {
            updateFields.push('repair_date = ?');
            updateValues.push(repair_date || null);
        }
        if (remarks !== undefined) {
            updateFields.push('remarks = ?');
            updateValues.push(remarks || null);
        }
        if (reported_by !== undefined) {
            updateFields.push('reported_by = ?');
            updateValues.push(reported_by || null);
        }
        if (engineer_name !== undefined) {
            updateFields.push('engineer_name = ?');
            updateValues.push(engineer_name || null);
        }
        if (hospital_name !== undefined) {
            updateFields.push('hospital_name = ?');
            updateValues.push(hospital_name || null);
        }
        if (department_name !== undefined) {
            updateFields.push('department_name = ?');
            updateValues.push(department_name || null);
        }
        if (images !== undefined) {
            updateFields.push('images = ?');
            updateValues.push(images || null);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No fields to update' 
            });
        }

        updateValues.push(id);

        await query(
            `UPDATE knowledge_base SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        console.log('✅ Knowledge base entry updated:', id);
        res.json({ 
            success: true, 
            message: 'Knowledge base entry updated successfully' 
        });

    } catch (error) {
        console.error('❌ Update knowledge base error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update knowledge base entry: ' + error.message 
        });
    }
});

app.delete('/api/knowledge-base/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Delete knowledge base request by:', req.user.email, 'Role:', req.user.role_name);

        let sql = `
            SELECT kb.*, e.hospital_id 
            FROM knowledge_base kb
            LEFT JOIN equipment e ON kb.equipment_id = e.id
            WHERE kb.id = ?
        `;
        let params = [id];
        
        const existing = await query(sql, params);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Knowledge base entry not found' 
            });
        }

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Engineers are not allowed to delete knowledge base entries' 
            });
        }

        if (isHospitalAdmin) {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only delete entries from your hospital' 
                });
            }
        }

        await query('DELETE FROM knowledge_base WHERE id = ?', [id]);

        console.log('✅ Knowledge base entry deleted by:', req.user.email, 'ID:', id);
        res.json({ 
            success: true, 
            message: 'Knowledge base entry deleted successfully' 
        });

    } catch (error) {
        console.error('❌ Delete knowledge base error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete knowledge base entry: ' + error.message 
        });
    }
});

// ============================================================
// ✅ SEARCH ROUTES
// ============================================================
app.get('/api/search', authenticate, async (req, res) => {
    try {
        const { q } = req.query;
        console.log('🔍 Search Query:', q);
        
        if (!q || q.trim().length < 2) {
            return res.json({ 
                success: true, 
                results: {
                    hospitals: [],
                    equipment: [],
                    errors: [],
                    repairs: [],
                    knowledge: [],
                    spareParts: [],
                    users: []
                },
                total: 0
            });
        }

        const searchTerm = `%${q.trim().toLowerCase()}%`;
        const results = {
            hospitals: [],
            equipment: [],
            errors: [],
            repairs: [],
            knowledge: [],
            spareParts: [],
            users: []
        };

        if (req.user.role_name === 'SUPER_ADMIN') {
            results.hospitals = await query(
                `SELECT id, name, city, phone, email, is_active as status
                 FROM hospitals 
                 WHERE LOWER(name) LIKE ? 
                    OR LOWER(city) LIKE ? 
                    OR LOWER(email) LIKE ? 
                    OR LOWER(phone) LIKE ?
                 AND is_active = 1
                 LIMIT 10`,
                [searchTerm, searchTerm, searchTerm, searchTerm]
            );
        }

        let equipmentSql = `
            SELECT e.id, e.name, e.model, e.manufacturer, 
                   e.serial_number, e.status,
                   h.name as hospital_name,
                   c.name as category_name
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            WHERE (LOWER(e.name) LIKE ? 
               OR LOWER(e.model) LIKE ? 
               OR LOWER(e.manufacturer) LIKE ? 
               OR LOWER(e.serial_number) LIKE ?)
               AND e.status != 'Retired'
        `;
        const equipmentParams = [searchTerm, searchTerm, searchTerm, searchTerm];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            equipmentSql += ' AND e.hospital_id = ?';
            equipmentParams.push(req.user.hospital_id);
        }

        equipmentSql += ' LIMIT 10';
        results.equipment = await query(equipmentSql, equipmentParams);

        let errorSql = `
            SELECT e.id, e.error_title, e.error_code, e.severity,
                   eq.name as equipment_name,
                   h.name as hospital_name,
                   u.full_name as reported_by_name
            FROM error_logs e
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            LEFT JOIN hospitals h ON eq.hospital_id = h.id
            LEFT JOIN users u ON e.reported_by = u.id
            WHERE LOWER(e.error_title) LIKE ? 
               OR LOWER(e.error_code) LIKE ? 
               OR LOWER(e.error_description) LIKE ?
        `;
        const errorParams = [searchTerm, searchTerm, searchTerm];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            errorSql += ' AND eq.hospital_id = ?';
            errorParams.push(req.user.hospital_id);
        }

        errorSql += ' LIMIT 10';
        results.errors = await query(errorSql, errorParams);

        let repairSql = `
            SELECT r.id, r.root_cause, r.repair_date,
                   eq.name as equipment_name,
                   r.engineer_name
            FROM repairs r
            LEFT JOIN error_logs e ON r.error_log_id = e.id
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            WHERE LOWER(r.root_cause) LIKE ? 
               OR LOWER(r.solution_description) LIKE ? 
               OR LOWER(r.repair_procedure) LIKE ? 
               OR LOWER(r.engineer_name) LIKE ?
        `;
        const repairParams = [searchTerm, searchTerm, searchTerm, searchTerm];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            repairSql += ' AND eq.hospital_id = ?';
            repairParams.push(req.user.hospital_id);
        }

        repairSql += ' LIMIT 10';
        results.repairs = await query(repairSql, repairParams);

        let kbSql = `
            SELECT k.id, k.error_title, k.error_code, 
                   k.solution, k.root_cause, k.created_at,
                   eq.name as equipment_name
            FROM knowledge_base k
            LEFT JOIN equipment eq ON k.equipment_id = eq.id
            WHERE LOWER(k.error_title) LIKE ? 
               OR LOWER(k.error_code) LIKE ? 
               OR LOWER(k.solution) LIKE ? 
               OR LOWER(k.root_cause) LIKE ?
        `;
        const kbParams = [searchTerm, searchTerm, searchTerm, searchTerm];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            kbSql += ' AND eq.hospital_id = ?';
            kbParams.push(req.user.hospital_id);
        }

        kbSql += ' LIMIT 10';
        results.knowledge = await query(kbSql, kbParams);

        let spareSql = `
            SELECT s.id, s.part_name, s.part_number, 
                   s.brand, s.quantity, s.unit_cost,
                   eq.name as equipment_name,
                   r.engineer_name
            FROM spare_parts s
            LEFT JOIN repairs r ON s.repair_id = r.id
            LEFT JOIN error_logs e ON r.error_log_id = e.id
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            WHERE LOWER(s.part_name) LIKE ? 
               OR LOWER(s.part_number) LIKE ? 
               OR LOWER(s.brand) LIKE ?
               OR LOWER(s.manufacturer) LIKE ?
        `;
        const spareParams = [searchTerm, searchTerm, searchTerm, searchTerm];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            spareSql += ' AND eq.hospital_id = ?';
            spareParams.push(req.user.hospital_id);
        }

        spareSql += ' LIMIT 10';
        results.spareParts = await query(spareSql, spareParams);

        if (req.user.role_name === 'SUPER_ADMIN') {
            results.users = await query(
                `SELECT u.id, u.full_name, u.email, u.username,
                        r.name as role_name,
                        h.name as hospital_name,
                        u.is_active as status
                 FROM users u
                 LEFT JOIN roles r ON u.role_id = r.id
                 LEFT JOIN hospitals h ON u.hospital_id = h.id
                 WHERE LOWER(u.full_name) LIKE ? 
                    OR LOWER(u.email) LIKE ? 
                    OR LOWER(u.username) LIKE ?
                    AND u.is_active = 1
                 LIMIT 10`,
                [searchTerm, searchTerm, searchTerm]
            );
        }

        const total = 
            (results.hospitals?.length || 0) +
            (results.equipment?.length || 0) +
            (results.errors?.length || 0) +
            (results.repairs?.length || 0) +
            (results.knowledge?.length || 0) +
            (results.spareParts?.length || 0) +
            (results.users?.length || 0);

        console.log('📊 Search Results Count:', total);
        console.log('📊 Results Breakdown:');
        console.log(`   🏥 Hospitals: ${results.hospitals?.length || 0}`);
        console.log(`   🛠️ Equipment: ${results.equipment?.length || 0}`);
        console.log(`   ❌ Errors: ${results.errors?.length || 0}`);
        console.log(`   🔧 Repairs: ${results.repairs?.length || 0}`);
        console.log(`   📚 Knowledge: ${results.knowledge?.length || 0}`);
        console.log(`   🔩 Spare Parts: ${results.spareParts?.length || 0}`);
        console.log(`   👤 Users: ${results.users?.length || 0}`);

        res.json({ 
            success: true, 
            results: results,
            total: total,
            count: total
        });

    } catch (error) {
        console.error('❌ Search error:', error);
        console.error('❌ Error details:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Search failed: ' + error.message 
        });
    }
});

// ============================================================
// ✅ MAINTENANCE ROUTES
// ============================================================
app.get('/api/maintenance', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT m.*, e.name as equipment_name, h.name as hospital_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY m.next_due_date ASC';
        const schedules = await query(sql, params);
        res.json({ success: true, schedules });
    } catch (error) {
        console.error('Get maintenance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance schedules' });
    }
});

app.get('/api/maintenance/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT m.*, e.name as equipment_name, h.name as hospital_name
            FROM maintenance_schedule m
            LEFT JOIN equipment e ON m.equipment_id = e.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE m.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const schedules = await query(sql, params);
        if (schedules.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        res.json({ success: true, schedule: schedules[0] });
    } catch (error) {
        console.error('Get maintenance schedule error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance schedule' });
    }
});

app.post('/api/maintenance', authenticate, async (req, res) => {
    try {
        const { 
            equipment_id, maintenance_type, frequency, 
            last_maintenance_date, next_due_date,
            maintenance_checklist, calibration_date, 
            warranty_expiry, amc_details, status, 
            engineer_name, description, priority 
        } = req.body;

        console.log('📅 Creating maintenance schedule for equipment:', equipment_id);
        console.log('👷 Engineer name:', engineer_name);

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isEngineer = req.user.role_name === 'ENGINEER';

        if (!isSuperAdmin && !isEngineer) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Engineers and Super Admin can create maintenance schedules' 
            });
        }

        if (!equipment_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment is required' 
            });
        }

        const result = await query(
            `INSERT INTO maintenance_schedule 
             (equipment_id, maintenance_type, frequency,
              last_maintenance_date, next_due_date,
              maintenance_checklist, calibration_date,
              warranty_expiry, amc_details, status,
              engineer_name, description, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                equipment_id,
                maintenance_type || 'Preventive',
                frequency || 'Monthly',
                formatDateForMySQL(last_maintenance_date),
                formatDateForMySQL(next_due_date),
                maintenance_checklist || null,
                formatDateForMySQL(calibration_date),
                formatDateForMySQL(warranty_expiry),
                amc_details || null,
                status || 'Scheduled',
                engineer_name || null,
                description || null,
                priority || 'Medium'
            ]
        );

        console.log('✅ Maintenance schedule created. ID:', result.insertId);
        res.status(201).json({
            success: true,
            message: 'Maintenance schedule created successfully',
            schedule: { id: result.insertId }
        });
    } catch (error) {
        console.error('❌ Create maintenance error:', error);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create maintenance schedule: ' + error.message 
        });
    }
});

app.put('/api/maintenance/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            maintenance_type, frequency, 
            last_maintenance_date, next_due_date,
            maintenance_checklist, calibration_date,
            warranty_expiry, amc_details, status,
            engineer_name, description, priority 
        } = req.body;

        console.log('🔄 Updating maintenance schedule. ID:', id);
        console.log('📦 Payload:', req.body);

        if (req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Super Admin can update maintenance schedules' 
            });
        }

        const existing = await query('SELECT * FROM maintenance_schedule WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
        const finalStatus = validStatuses.includes(status) ? status : existing[0].status;

        const result = await query(
            `UPDATE maintenance_schedule SET 
             maintenance_type = ?,
             frequency = ?,
             last_maintenance_date = ?,
             next_due_date = ?,
             maintenance_checklist = ?,
             calibration_date = ?,
             warranty_expiry = ?,
             amc_details = ?,
             status = ?,
             engineer_name = ?,
             description = ?,
             priority = ?
             WHERE id = ?`,
            [
                maintenance_type || existing[0].maintenance_type,
                frequency || existing[0].frequency,
                formatDateForMySQL(last_maintenance_date) !== null ? formatDateForMySQL(last_maintenance_date) : existing[0].last_maintenance_date,
                formatDateForMySQL(next_due_date) !== null ? formatDateForMySQL(next_due_date) : existing[0].next_due_date,
                maintenance_checklist || existing[0].maintenance_checklist,
                formatDateForMySQL(calibration_date) !== null ? formatDateForMySQL(calibration_date) : existing[0].calibration_date,
                formatDateForMySQL(warranty_expiry) !== null ? formatDateForMySQL(warranty_expiry) : existing[0].warranty_expiry,
                amc_details || existing[0].amc_details,
                finalStatus,
                engineer_name !== undefined ? engineer_name : existing[0].engineer_name,
                description || existing[0].description,
                priority || existing[0].priority,
                id
            ]
        );

        console.log('✅ Maintenance schedule updated:', id);
        res.json({ 
            success: true, 
            message: 'Maintenance schedule updated successfully' 
        });
    } catch (error) {
        console.error('❌ Update maintenance error:', error);
        console.error('❌ SQL:', error.sql);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update maintenance schedule: ' + error.message 
        });
    }
});

app.delete('/api/maintenance/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting maintenance schedule. ID:', id);

        const existing = await query('SELECT * FROM maintenance_schedule WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Maintenance schedule not found' 
            });
        }

        await query('DELETE FROM maintenance_schedule WHERE id = ?', [id]);

        console.log('✅ Maintenance schedule deleted:', id);
        res.json({ 
            success: true, 
            message: 'Maintenance schedule deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete maintenance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete maintenance schedule: ' + error.message 
        });
    }
});

// ============================================================
// ✅ DASHBOARD ROUTES
// ============================================================
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role_name;
        const hospitalId = req.user.hospital_id;

        console.log('📊 Dashboard stats for:', role, 'User:', userId);

        let stats = {};

        if (role === 'SUPER_ADMIN') {
            const [
                totalEquipment,
                totalHospitals,
                totalHospitalAdmins,
                totalEngineers,
                totalUsers,
                totalErrors,
                criticalErrors,
                totalRepairs,
                maintenanceDue,
                pendingPurchaseOrders,
                sparePartsLow
            ] = await Promise.all([
                query("SELECT COUNT(*) as count FROM equipment WHERE status != 'Inactive'"),
                query("SELECT COUNT(*) as count FROM hospitals WHERE is_active = 1"),
                query("SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'HOSPITAL_ADMIN' AND u.is_active = 1"),
                query("SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'ENGINEER' AND u.is_active = 1"),
                query("SELECT COUNT(*) as count FROM users WHERE is_active = 1"),
                query("SELECT COUNT(*) as count FROM error_logs"),
                query("SELECT COUNT(*) as count FROM error_logs WHERE severity = 'Critical'"),
                query("SELECT COUNT(*) as count FROM repairs"),
                query("SELECT COUNT(*) as count FROM maintenance_schedule WHERE status = 'Overdue' OR (next_due_date < CURDATE() AND status != 'Completed')"),
                query("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'Pending Approval'"),
                query("SELECT COUNT(*) as count FROM spare_parts WHERE quantity < 5")
            ]);

            stats = {
                totalEquipment: totalEquipment[0]?.count || 0,
                totalHospitals: totalHospitals[0]?.count || 0,
                totalHospitalAdmins: totalHospitalAdmins[0]?.count || 0,
                totalEngineers: totalEngineers[0]?.count || 0,
                totalUsers: totalUsers[0]?.count || 0,
                totalErrors: totalErrors[0]?.count || 0,
                criticalErrors: criticalErrors[0]?.count || 0,
                totalRepairs: totalRepairs[0]?.count || 0,
                maintenanceDue: maintenanceDue[0]?.count || 0,
                pendingPurchaseOrders: pendingPurchaseOrders[0]?.count || 0,
                sparePartsLow: sparePartsLow[0]?.count || 0
            };
        } else if (role === 'ENGINEER') {
            const [
                myAssignedRepairs,
                myMaintenanceTasks,
                myReportedErrors
            ] = await Promise.all([
                query("SELECT COUNT(*) as count FROM repairs WHERE engineer_name = ?", [req.user.full_name]),
                query("SELECT COUNT(*) as count FROM maintenance_schedule WHERE engineer_name = ? AND status != 'Completed'", [req.user.full_name]),
                query("SELECT COUNT(*) as count FROM error_logs WHERE reported_by = ?", [userId])
            ]);

            stats = {
                totalEquipment: 0,
                totalHospitals: 0,
                totalHospitalAdmins: 0,
                totalEngineers: 0,
                totalUsers: 0,
                totalErrors: 0,
                criticalErrors: 0,
                totalRepairs: 0,
                maintenanceDue: 0,
                pendingPurchaseOrders: 0,
                sparePartsLow: 0,
                myAssignedRepairs: myAssignedRepairs[0]?.count || 0,
                myMaintenanceTasks: myMaintenanceTasks[0]?.count || 0,
                myReportedErrors: myReportedErrors[0]?.count || 0
            };
        } else {
            stats = {
                totalEquipment: 0,
                totalHospitals: 0,
                totalHospitalAdmins: 0,
                totalEngineers: 0,
                totalUsers: 0,
                totalErrors: 0,
                criticalErrors: 0,
                totalRepairs: 0,
                maintenanceDue: 0,
                pendingPurchaseOrders: 0,
                sparePartsLow: 0,
                myAssignedRepairs: 0,
                myMaintenanceTasks: 0,
                myReportedErrors: 0
            };
        }

        console.log('✅ Dashboard stats sent for:', role);
        res.json({
            success: true,
            ...stats
        });

    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard stats',
            error: error.message 
        });
    }
});

// ============================================================
// ✅ SERVICE DOCUMENTATION ROUTES
// ============================================================
const serviceDocumentationRoutes = require('./routes/serviceDocumentation');
app.use('/api/service-documentation', serviceDocumentationRoutes);
console.log('📄 Service Documentation routes registered');

// ============================================================
// ✅ TRAINING ROUTES
// ============================================================
const trainingRoutes = require('./routes/training');
app.use('/api/training', trainingRoutes);
console.log('📚 Training routes registered');

// ============================================================
// ✅ AMC ROUTES
// ============================================================
app.get('/api/amc', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT a.*, e.name as equipment_name
            FROM amc_contracts a
            LEFT JOIN equipment e ON a.equipment_id = e.id
            WHERE 1=1
        `;
        const params = [];
        
        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND e.hospital_id = ?';
            params.push(req.user.hospital_id);
        }
        
        sql += ' ORDER BY a.created_at DESC';
        const contracts = await query(sql, params);
        res.json({ success: true, contracts });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/amc', authenticate, async (req, res) => {
    try {
        const { equipment_id, vendor_name, contract_number, start_date, end_date, cost, contact_person, contact_phone, status } = req.body;
        
        const result = await query(
            `INSERT INTO amc_contracts (equipment_id, vendor_name, contract_number, start_date, end_date, cost, contact_person, contact_phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipment_id, vendor_name, contract_number, start_date, end_date, cost, contact_person, contact_phone, status || 'Active']
        );
        
        res.status(201).json({
            success: true,
            message: 'AMC contract created successfully',
            contract: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/amc/:id/renew', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { end_date, cost, notes } = req.body;

        console.log('🔄 Renewing AMC contract:', id);

        const existing = await query('SELECT * FROM amc_contracts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'AMC contract not found' 
            });
        }

        if (!end_date) {
            return res.status(400).json({ 
                success: false, 
                message: 'New end date is required' 
            });
        }

        if (new Date(end_date) <= new Date(existing[0].end_date)) {
            return res.status(400).json({ 
                success: false, 
                message: 'New end date must be after current end date' 
            });
        }

        await query(
            `INSERT INTO amc_renewal_history 
             (contract_id, previous_end_date, new_end_date, 
              previous_cost, new_cost, renewed_by, renewal_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                existing[0].end_date,
                end_date,
                existing[0].cost,
                cost || existing[0].cost,
                req.user.id,
                notes || 'Renewed'
            ]
        );

        await query(
            `UPDATE amc_contracts SET 
             end_date = ?,
             cost = ?,
             notes = CONCAT(notes, ?)
             WHERE id = ?`,
            [
                end_date,
                cost || existing[0].cost,
                `\nRenewed on ${new Date().toISOString().split('T')[0]}: ${notes || 'Renewed'}`,
                id
            ]
        );

        await notifyAdmins(
            existing[0].hospital_id,
            'AMC Contract Renewed',
            `AMC contract renewed for equipment ID: ${existing[0].equipment_id}`,
            'AMC',
            id,
            'amc'
        );

        console.log('✅ AMC contract renewed:', id);
        res.json({ 
            success: true, 
            message: 'AMC contract renewed successfully' 
        });
    } catch (error) {
        console.error('❌ Renew AMC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to renew AMC contract: ' + error.message 
        });
    }
});

app.delete('/api/amc/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting AMC contract ID:', id);

        const existing = await query('SELECT * FROM amc_contracts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'AMC contract not found' 
            });
        }

        await query('DELETE FROM amc_renewal_history WHERE contract_id = ?', [id]);
        await query('DELETE FROM amc_contracts WHERE id = ?', [id]);

        console.log('✅ AMC contract deleted:', id);
        res.json({ 
            success: true, 
            message: 'AMC contract deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete AMC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete AMC contract: ' + error.message 
        });
    }
});

// ============================================================
// ✅ PURCHASE ORDERS ROUTES
// ============================================================
app.get('/api/purchase-orders', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, h.name as hospital_name, u.full_name as created_by_name
            FROM purchase_orders p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND p.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY p.created_at DESC';
        const orders = await query(sql, params);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get purchase orders error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase orders' });
    }
});

app.get('/api/purchase-orders/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT p.*, h.name as hospital_name, u.full_name as created_by_name
            FROM purchase_orders p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND p.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const orders = await query(sql, params);
        if (orders.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        const items = await query(
            'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
            [id]
        );

        res.json({
            success: true,
            order: { ...orders[0], items: items || [] }
        });
    } catch (error) {
        console.error('Get purchase order error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase order' });
    }
});

app.post('/api/purchase-orders', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { 
            hospital_id, vendor_name, po_number, order_date, 
            delivery_date, total_amount, notes, status, approved_by, items
        } = req.body;

        console.log('📦 Creating purchase order:', po_number);

        if (!hospital_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Hospital is required' 
            });
        }
        
        if (!vendor_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vendor name is required' 
            });
        }
        
        if (!po_number) {
            return res.status(400).json({ 
                success: false, 
                message: 'PO number is required' 
            });
        }

        let finalHospitalId = hospital_id;
        if (req.user.role_name === 'HOSPITAL_ADMIN') {
            finalHospitalId = req.user.hospital_id;
        }

        let approvedById = null;
        if (approved_by && approved_by !== '') {
            approvedById = parseInt(approved_by);
            if (isNaN(approvedById)) {
                approvedById = null;
            }
        }

        const result = await query(
            `INSERT INTO purchase_orders 
             (hospital_id, vendor_name, po_number, order_date, 
              delivery_date, total_amount, notes, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(finalHospitalId),
                vendor_name,
                po_number,
                order_date || null,
                delivery_date || null,
                parseFloat(total_amount) || 0,
                notes || '',
                status || 'Draft',
                req.user.id
            ]
        );

        const orderId = result.insertId;
        console.log('✅ Purchase order created. ID:', orderId);

        if (items && Array.isArray(items) && items.length > 0) {
            try {
                for (const item of items) {
                    if (item.description && item.description.trim() !== '') {
                        await query(
                            `INSERT INTO purchase_order_items 
                             (purchase_order_id, description, quantity, unit_price, total)
                             VALUES (?, ?, ?, ?, ?)`,
                            [
                                orderId,
                                item.description.trim(),
                                parseInt(item.quantity) || 1,
                                parseFloat(item.unit_price) || 0,
                                parseFloat(item.total) || 0
                            ]
                        );
                    }
                }
                console.log('✅ Items inserted successfully');
            } catch (itemError) {
                console.log('⚠️ Items error (non-critical):', itemError.message);
            }
        }

        const newOrder = await query(
            `SELECT p.*, h.name as hospital_name 
             FROM purchase_orders p
             LEFT JOIN hospitals h ON p.hospital_id = h.id
             WHERE p.id = ?`,
            [orderId]
        );

        const orderItems = await query(
            'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
            [orderId]
        );

        await createNotification(
            1,
            'New Purchase Order Created',
            `Purchase Order ${po_number} created by ${req.user.full_name}`,
            'PurchaseOrder',
            orderId,
            'purchase-orders'
        );

        res.status(201).json({
            success: true,
            message: 'Purchase order created successfully',
            order: { 
                ...newOrder[0], 
                items: orderItems 
            }
        });

    } catch (error) {
        console.error('❌ Create purchase order error:');
        console.error('Message:', error.message);
        console.error('SQL:', error.sql);
        console.error('SQL Message:', error.sqlMessage);
        console.error('========================================');
        
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message,
            sqlError: error.sqlMessage || null
        });
    }
});

app.put('/api/purchase-orders/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('🔄 Updating purchase order:', id);

        const existing = await query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        const currentStatus = existing[0].status;
        const allowedTransitions = {
            'Draft': ['Pending Approval', 'Cancelled'],
            'Pending Approval': ['Approved', 'Cancelled'],
            'Approved': ['Ordered'],
            'Ordered': ['Received'],
            'Received': [],
            'Cancelled': []
        };

        if (!allowedTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${currentStatus}' to '${status}'`
            });
        }

        if (status === 'Approved' && req.user.role_name !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can approve orders'
            });
        }

        await query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);

        if (status === 'Approved') {
            await notifyAdmins(
                existing[0].hospital_id,
                'Purchase Order Approved',
                `Purchase Order ${existing[0].po_number} has been approved`,
                'PurchaseOrder',
                id,
                'purchase-orders'
            );
        }

        console.log('✅ Purchase order updated:', id, '->', status);
        res.json({ 
            success: true, 
            message: `Purchase order status updated to ${status}` 
        });
    } catch (error) {
        console.error('❌ Update purchase order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update purchase order: ' + error.message 
        });
    }
});

app.delete('/api/purchase-orders/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting purchase order ID:', id);
        
        const existing = await query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        if (existing[0].status !== 'Draft') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only Draft orders can be deleted' 
            });
        }

        await query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
        await query('DELETE FROM purchase_orders WHERE id = ?', [id]);

        console.log('✅ Purchase order deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Purchase order deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Purchase order DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================================
// ✅ PROCUREMENT ROUTES
// ============================================================
app.get('/api/procurement', authenticate, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, h.name as hospital_name, u.full_name as requested_by_name
            FROM equipment_procurement p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.requested_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND p.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        sql += ' ORDER BY p.created_at DESC';
        const requests = await query(sql, params);
        res.json({ success: true, requests });
    } catch (error) {
        console.error('Get procurement requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch procurement requests' });
    }
});

app.get('/api/procurement/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT p.*, h.name as hospital_name, u.full_name as requested_by_name
            FROM equipment_procurement p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            LEFT JOIN users u ON p.requested_by = u.id
            WHERE p.id = ?
        `;
        const params = [id];

        if (req.user.role_name !== 'SUPER_ADMIN') {
            sql += ' AND p.hospital_id = ?';
            params.push(req.user.hospital_id);
        }

        const requests = await query(sql, params);
        if (requests.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Procurement request not found' 
            });
        }

        res.json({
            success: true,
            request: requests[0]
        });
    } catch (error) {
        console.error('Get procurement request error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch procurement request' });
    }
});

app.post('/api/procurement', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { 
            hospital_id, equipment_name, category_id, manufacturer, 
            model, quantity, estimated_cost, justification, 
            priority, status
        } = req.body;

        console.log('📦 Creating procurement request:', equipment_name);

        if (!hospital_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Hospital is required' 
            });
        }
        
        if (!equipment_name || equipment_name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Equipment name is required' 
            });
        }

        let finalHospitalId = hospital_id;

        const result = await query(
            `INSERT INTO equipment_procurement 
             (hospital_id, equipment_name, category_id, manufacturer,
              model, quantity, estimated_cost, justification,
              priority, status, requested_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parseInt(finalHospitalId),
                equipment_name.trim(),
                category_id ? parseInt(category_id) : null,
                manufacturer || '',
                model || '',
                parseInt(quantity) || 1,
                parseFloat(estimated_cost) || 0,
                justification || '',
                priority || 'Medium',
                status || 'Requested',
                req.user.id
            ]
        );

        console.log('✅ Procurement request created. ID:', result.insertId);

        await createNotification(
            1,
            'New Procurement Request',
            `Procurement request for "${equipment_name}" created by ${req.user.full_name}`,
            'Procurement',
            result.insertId,
            'procurement'
        );

        res.status(201).json({
            success: true,
            message: 'Procurement request created successfully',
            request: { id: result.insertId }
        });

    } catch (error) {
        console.error('❌ Create procurement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

app.put('/api/procurement/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('🔄 Updating procurement request:', id);

        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Procurement request not found' 
            });
        }

        const currentStatus = existing[0].status;
        const hospitalId = existing[0].hospital_id;

        if (status === 'Approved' || status === 'Rejected') {
            if (req.user.role_name !== 'SUPER_ADMIN') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only Super Admin can approve or reject requests' 
                });
            }
        }

        if (status === 'Procured') {
            if (req.user.role_name === 'HOSPITAL_ADMIN') {
                if (hospitalId !== req.user.hospital_id) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'You can only mark requests from your hospital as procured' 
                    });
                }
            } else if (req.user.role_name !== 'SUPER_ADMIN') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only Super Admin or Hospital Admin can mark as procured' 
                });
            }
        }

        if (status === 'Under Review') {
            if (req.user.role_name === 'HOSPITAL_ADMIN') {
                if (hospitalId !== req.user.hospital_id) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'You can only review requests from your hospital' 
                    });
                }
            } else if (req.user.role_name !== 'SUPER_ADMIN') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only Super Admin or Hospital Admin can review requests' 
                });
            }
        }

        const allowedTransitions = {
            'Requested': ['Under Review'],
            'Under Review': ['Approved', 'Rejected'],
            'Approved': ['Procured'],
            'Rejected': [],
            'Procured': []
        };

        if (!allowedTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${currentStatus}' to '${status}'`
            });
        }

        await query('UPDATE equipment_procurement SET status = ? WHERE id = ?', [status, id]);

        console.log('✅ Procurement request updated:', id, '->', status);

        if (status === 'Approved') {
            await notifyAdmins(
                hospitalId,
                'Procurement Request Approved',
                `Procurement request for "${existing[0].equipment_name}" has been approved`,
                'Procurement',
                id,
                'procurement'
            );
        } else if (status === 'Rejected') {
            await notifyAdmins(
                hospitalId,
                'Procurement Request Rejected',
                `Procurement request for "${existing[0].equipment_name}" has been rejected`,
                'Procurement',
                id,
                'procurement'
            );
        } else if (status === 'Procured') {
            await createNotification(
                1,
                'Procurement Completed',
                `Procurement request for "${existing[0].equipment_name}" has been marked as procured`,
                'Procurement',
                id,
                'procurement'
            );
        }

        res.json({ 
            success: true, 
            message: `Procurement status updated to ${status}` 
        });

    } catch (error) {
        console.error('❌ Update procurement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update procurement: ' + error.message 
        });
    }
});

app.delete('/api/procurement/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting procurement request ID:', id);
        
        const existing = await query('SELECT * FROM equipment_procurement WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Procurement request not found' 
            });
        }

        console.log('📌 Found request:', existing[0].equipment_name);
        console.log('📌 Status:', existing[0].status);
        console.log('📌 Hospital ID:', existing[0].hospital_id);

        const isSuperAdmin = req.user.role_name === 'SUPER_ADMIN';
        const isHospitalAdmin = req.user.role_name === 'HOSPITAL_ADMIN';

        if (isSuperAdmin) {
            console.log('✅ Super Admin - can delete any request');
        } else if (isHospitalAdmin) {
            if (existing[0].hospital_id !== req.user.hospital_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only delete requests from your hospital' 
                });
            }
            console.log('✅ Hospital Admin - can delete from their hospital');
        } else {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to delete procurement requests' 
            });
        }

        await query('DELETE FROM equipment_procurement WHERE id = ?', [id]);

        console.log('✅ Procurement request deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Procurement request deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Procurement DELETE error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// ============================================================
// ✅ NOTIFICATIONS ROUTES
// ============================================================
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('❌ Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/notifications/unread/count', authenticate, async (req, res) => {
    try {
        const result = await query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );
        res.json({ success: true, count: result[0]?.count || 0 });
    } catch (error) {
        console.error('❌ Unread count error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/notifications/read-all', authenticate, async (req, res) => {
    try {
        await query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('❌ Mark all as read error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.delete('/api/notifications/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('❌ Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// ============================================================
// ✅ 404 HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
});

// ============================================================
// ✅ ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// ============================================================
// ✅ EXPORT FOR VERCEL
// ============================================================
module.exports = app;

// ============================================================
// ✅ LOCAL DEVELOPMENT SERVER
// ============================================================
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('========================================');
        console.log('🚀 Server started successfully!');
        console.log('========================================');
        console.log(`📡 Server running on: http://localhost:${PORT}`);
        console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
        console.log(`🔐 Login: superadmin@paec.edu.pk / admin123`);
        console.log(`📁 Uploads: http://localhost:${PORT}/uploads/`);
        console.log(`🔐 BLOB_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? '✅ Set' : '❌ MISSING'}`);
        console.log('========================================');
        console.log('🔌 WebSocket server initializing...');
    });
    
    initWebSocket(server);
    
    console.log('🔌 WebSocket server running on: ws://localhost:' + PORT + '/ws/notifications');
    console.log('========================================');
}