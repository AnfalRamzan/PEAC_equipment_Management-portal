const mysql = require('mysql2/promise');

// ✅ Aiven Cloud Database Configuration (Same for all environments)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-24c4e904-anfalramzan548-cc66.j.aivencloud.com',
    port: parseInt(process.env.DB_PORT) || 28080,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS_H6sUyjUqjeTtlMLKjU3',
    database: process.env.DB_NAME || 'defaultdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
    ssl: {
        rejectUnauthorized: false  // Required for Aiven Cloud
    },
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// ✅ Test connection function
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully to Aiven Cloud!');
        console.log(`📊 Host: ${process.env.DB_HOST || 'mysql-24c4e904-anfalramzan548-cc66.j.aivencloud.com'}`);
        console.log(`📊 Database: ${process.env.DB_NAME || 'defaultdb'}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('❌ Error code:', error.code);
        return false;
    }
};

// ✅ Query function with retry
const query = async (sql, params = [], retries = 2) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        if (retries > 0 && error.code === 'ECONNRESET') {
            console.log(`🔄 Retrying query... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return query(sql, params, retries - 1);
        }
        console.error('❌ SQL Error:', error.message);
        console.error('❌ SQL Query:', sql);
        throw error;
    }
};

// ✅ Get connection for transactions
const getConnection = async () => {
    return await pool.getConnection();
};

module.exports = { query, pool, testConnection, getConnection };