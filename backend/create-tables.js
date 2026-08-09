const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

async function createTables() {
    try {
        console.log('📡 Creating tables...');

        // 1. Roles
        await query(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Roles table created');

        // 2. Users
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                role_id INT,
                hospital_id INT,
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                profile_image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )
        `);
        console.log('✅ Users table created');

        // 3. Hospitals
        await query(`
            CREATE TABLE IF NOT EXISTS hospitals (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                address TEXT,
                city VARCHAR(50),
                state VARCHAR(50),
                country VARCHAR(50),
                postal_code VARCHAR(20),
                phone VARCHAR(20),
                email VARCHAR(100),
                website VARCHAR(100),
                biomedical_head VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Hospitals table created');

        // 4. Departments
        await query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                hospital_id INT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
            )
        `);
        console.log('✅ Departments table created');

        // 5. Equipment Categories
        await query(`
            CREATE TABLE IF NOT EXISTS equipment_categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Equipment Categories table created');

        // 6. Equipment
        await query(`
            CREATE TABLE IF NOT EXISTS equipment (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                category_id INT,
                manufacturer VARCHAR(100),
                model VARCHAR(100),
                serial_number VARCHAR(100) UNIQUE,
                installation_year YEAR,
                hospital_id INT,
                department_id INT,
                location VARCHAR(100),
                status ENUM('Active', 'Inactive', 'Maintenance', 'Retired') DEFAULT 'Active',
                image_url VARCHAR(255),
                warranty_expiry DATE,
                amc_details TEXT,
                calibration_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )
        `);
        console.log('✅ Equipment table created');

        // 7. Error Logs
        await query(`
            CREATE TABLE IF NOT EXISTS error_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                equipment_id INT,
                error_code VARCHAR(50),
                error_title VARCHAR(200) NOT NULL,
                error_description TEXT,
                error_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                reported_by INT,
                assigned_to INT,
                status ENUM('Pending', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Pending',
                severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
                images TEXT,
                videos TEXT,
                documents TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id),
                FOREIGN KEY (reported_by) REFERENCES users(id),
                FOREIGN KEY (assigned_to) REFERENCES users(id)
            )
        `);
        console.log('✅ Error Logs table created');

        // 8. Repairs
        await query(`
            CREATE TABLE IF NOT EXISTS repairs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                error_log_id INT,
                engineer_id INT,
                root_cause TEXT,
                problem_analysis TEXT,
                corrective_action TEXT,
                repair_procedure TEXT,
                solution_description TEXT,
                time_taken INT,
                repair_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                spare_part_used BOOLEAN DEFAULT FALSE,
                remarks TEXT,
                status ENUM('Pending', 'In Progress', 'Completed', 'Verified') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (error_log_id) REFERENCES error_logs(id),
                FOREIGN KEY (engineer_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Repairs table created');

        // 9. Spare Parts
        await query(`
            CREATE TABLE IF NOT EXISTS spare_parts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                repair_id INT,
                part_name VARCHAR(100) NOT NULL,
                part_number VARCHAR(50),
                brand VARCHAR(50),
                quantity INT DEFAULT 1,
                unit_cost DECIMAL(10, 2),
                total_cost DECIMAL(10, 2),
                compatible_equipment VARCHAR(255),
                image_url VARCHAR(255),
                installation_notes TEXT,
                manufacturer VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (repair_id) REFERENCES repairs(id)
            )
        `);
        console.log('✅ Spare Parts table created');

        // 10. Notifications
        await query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                title VARCHAR(200) NOT NULL,
                message TEXT,
                type ENUM('Error', 'Repair', 'Maintenance', 'System', 'AMC') DEFAULT 'System',
                is_read BOOLEAN DEFAULT FALSE,
                link VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Notifications table created');

        // 11. Knowledge Base
        await query(`
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id INT PRIMARY KEY AUTO_INCREMENT,
                equipment_id INT,
                error_code VARCHAR(50),
                error_title VARCHAR(200) NOT NULL,
                error_description TEXT,
                root_cause TEXT,
                solution TEXT,
                repair_procedure TEXT,
                time_taken INT,
                spare_parts_used TEXT,
                images TEXT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log('✅ Knowledge Base table created');

        // 12. Insert Roles
        await query(`
            INSERT IGNORE INTO roles (name, description) VALUES
            ('SUPER_ADMIN', 'Super Administrator with full system access'),
            ('HOSPITAL_ADMIN', 'Hospital Administrator'),
            ('ENGINEER', 'Biomedical Engineer')
        `);
        console.log('✅ Default roles inserted');

        // 13. Insert Categories
        await query(`
            INSERT IGNORE INTO equipment_categories (name, description) VALUES
            ('Ventilator', 'Respiratory support equipment'),
            ('Patient Monitor', 'Patient vital signs monitoring equipment'),
            ('ECG Machine', 'Electrocardiogram machines'),
            ('Defibrillator', 'Emergency cardiac defibrillators'),
            ('Infusion Pump', 'IV infusion pumps'),
            ('Syringe Pump', 'Syringe infusion pumps'),
            ('Ultrasound', 'Ultrasound imaging machines'),
            ('X-Ray Machine', 'Digital X-Ray equipment'),
            ('CT Scanner', 'Computed Tomography scanners'),
            ('MRI Machine', 'Magnetic Resonance Imaging machines')
        `);
        console.log('✅ Default categories inserted');

        // 14. Insert Super Admin
        const superAdminHash = await bcrypt.hash('admin123', 10);
        await query(`
            INSERT IGNORE INTO users (username, email, password_hash, full_name, role_id, hospital_id, phone, is_active) VALUES
            ('superadmin', 'superadmin@paec.edu.pk', ?, 'Super Admin', 1, NULL, '+92-51-9999999', TRUE)
        `, [superAdminHash]);
        console.log('✅ Super Admin inserted');

        console.log('🎉 All tables created successfully!');
        console.log('🔑 Login: superadmin@paec.edu.pk / admin123');

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
}

createTables();