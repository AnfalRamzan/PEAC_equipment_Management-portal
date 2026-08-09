const { query } = require('./config/database');

async function testConnection() {
    try {
        console.log('📡 Testing database connection...');
        console.log('⏳ Connecting to Aiven MySQL...');
        
        // Test 1: Simple query
        const result = await query('SELECT 1 as test, NOW() as time, VERSION() as version');
        console.log('✅ Database connected successfully!');
        console.log('✅ MySQL Version:', result[0].version);
        
        // Test 2: Check database
        const dbResult = await query('SELECT DATABASE() as db');
        console.log('📚 Current database:', dbResult[0].db);
        
        // Test 3: Check tables
        const tables = await query('SHOW TABLES');
        console.log('📋 Tables found:', tables.length);
        tables.forEach(t => {
            console.log('   -', Object.values(t)[0]);
        });
        
        // Test 4: Check users
        const users = await query('SELECT id, username, email, role_id FROM users');
        console.log('👤 Users found:', users.length);
        users.forEach(u => {
            console.log(`   - ${u.username} (${u.email})`);
        });
        
        // Test 5: Check roles
        const roles = await query('SELECT id, name FROM roles');
        console.log('📋 Roles found:', roles.length);
        roles.forEach(r => {
            console.log(`   - ${r.name}`);
        });
        
        console.log('✅ All tests passed! Database is ready.');
        console.log('🔑 Login: superadmin@paec.edu.pk / admin123');
        
    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('❌ Error:', error.message);
        console.error('❌ Please check:');
        console.error('   1. .env file has correct credentials');
        console.error('   2. DB_HOST is correct');
        console.error('   3. DB_PASSWORD is correct');
        console.error('   4. Internet connection is active');
    }
}

testConnection();