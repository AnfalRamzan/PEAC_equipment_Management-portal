const mysql = require('mysql2/promise');

// ✅ Create connection pool with SSL for Aiven Cloud
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    connectTimeout: 30000,
    ssl: {
        rejectUnauthorized: false
    },
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// ✅ Test connection function
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('❌ Error code:', error.code);
        return false;
    }
};

// ✅ Query function
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ SQL Error:', error.message);
        console.error('❌ SQL Query:', sql);
        throw error;
    }
};

module.exports = { query, pool, testConnection };