-- ============================================================
-- HOSPITAL EQUIPMENT MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_equipment_management;
USE hospital_equipment_management;

-- ============================================================
-- 1. ROLES TABLE
-- ============================================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. USERS TABLE
-- ============================================================
CREATE TABLE users (
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
);

-- ============================================================
-- 3. HOSPITALS TABLE (FIXED)
-- ============================================================
CREATE TABLE hospitals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    hospital_code VARCHAR(50) UNIQUE,  -- ✅ ADDED
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Pakistan',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(100),
    biomedical_head VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- ============================================================
-- 5. EQUIPMENT CATEGORIES TABLE
-- ============================================================
CREATE TABLE equipment_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,  -- ✅ ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. EQUIPMENT TABLE (FIXED)
-- ============================================================
CREATE TABLE equipment (
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
    image_url TEXT,  -- ✅ Changed to TEXT
    warranty_expiry DATE,
    amc_details TEXT,
    calibration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ============================================================
-- 7. ERROR LOGS TABLE (FIXED)
-- ============================================================
CREATE TABLE error_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    error_code VARCHAR(50),
    error_title VARCHAR(200) NOT NULL,
    error_description TEXT,
    error_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    reported_by INT,
    assigned_to INT,
    department_id INT,  -- ✅ ADDED
    status ENUM('Pending', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Pending',
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',  -- ✅ ADDED
    images TEXT,
    videos TEXT,
    documents TEXT,
    attachments TEXT,  -- ✅ ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)  -- ✅ ADDED
);

-- ============================================================
-- 8. REPAIRS TABLE (FIXED)
-- ============================================================
CREATE TABLE repairs (
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
    status ENUM('Pending', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Resolved', 'Closed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (error_log_id) REFERENCES error_logs(id),
    FOREIGN KEY (engineer_id) REFERENCES users(id)
);

-- ============================================================
-- 9. SPARE PARTS TABLE
-- ============================================================
CREATE TABLE spare_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    repair_id INT,
    part_name VARCHAR(100) NOT NULL,
    part_number VARCHAR(50),
    brand VARCHAR(50),
    manufacturer VARCHAR(100),  -- ✅ ADDED
    quantity INT DEFAULT 1,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    compatible_equipment TEXT,
    image_url VARCHAR(255),
    installation_notes TEXT,
    minimum_stock_level INT DEFAULT 5,  -- ✅ ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repair_id) REFERENCES repairs(id)
);

-- ============================================================
-- 10. MAINTENANCE SCHEDULE TABLE (FIXED)
-- ============================================================
CREATE TABLE maintenance_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    maintenance_type ENUM('Preventive', 'Corrective', 'Emergency') DEFAULT 'Preventive',
    frequency ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly') DEFAULT 'Monthly',
    last_maintenance_date DATE,
    next_due_date DATE,
    maintenance_checklist TEXT,
    calibration_date DATE,
    warranty_expiry DATE,
    amc_details TEXT,
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled') DEFAULT 'Scheduled',
    assigned_to INT,  -- ✅ ADDED
    priority VARCHAR(50) DEFAULT 'Medium',  -- ✅ ADDED
    description TEXT,  -- ✅ ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)  -- ✅ ADDED
);

-- ============================================================
-- 11. AMC CONTRACTS TABLE (FIXED)
-- ============================================================
CREATE TABLE amc_contracts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    vendor_name VARCHAR(100),
    contract_number VARCHAR(50),
    start_date DATE,
    end_date DATE,
    cost DECIMAL(10, 2),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    status ENUM('Active', 'Expired', 'Pending') DEFAULT 'Active',
    document_url VARCHAR(255),
    notes TEXT,  -- ✅ ADDED
    documents TEXT,  -- ✅ ADDED
    created_by INT,  -- ✅ ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (created_by) REFERENCES users(id)  -- ✅ ADDED
);

-- ============================================================
-- 12. AMC RENEWAL HISTORY TABLE (NEW)
-- ============================================================
CREATE TABLE amc_renewal_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contract_id INT,
    previous_end_date DATE,
    new_end_date DATE,
    previous_cost DECIMAL(10, 2),
    new_cost DECIMAL(10, 2),
    renewed_by INT,
    renewal_notes TEXT,
    renewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES amc_contracts(id),
    FOREIGN KEY (renewed_by) REFERENCES users(id)
);

-- ============================================================
-- 13. PURCHASE ORDERS TABLE (FIXED)
-- ============================================================
CREATE TABLE purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    hospital_id INT,
    vendor_name VARCHAR(100),
    vendor_contact VARCHAR(100),  -- ✅ ADDED
    vendor_email VARCHAR(100),  -- ✅ ADDED
    vendor_phone VARCHAR(20),  -- ✅ ADDED
    vendor_address TEXT,  -- ✅ ADDED
    order_date DATE,
    delivery_date DATE,
    total_amount DECIMAL(12, 2),
    status ENUM('Draft', 'Pending Approval', 'Approved', 'Ordered', 'Received', 'Cancelled') DEFAULT 'Draft',
    created_by INT,
    approved_by INT,
    notes TEXT,
    documents TEXT,  -- ✅ ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ============================================================
-- 14. PURCHASE ORDER ITEMS TABLE (NEW)
-- ============================================================
CREATE TABLE purchase_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_order_id INT,
    description TEXT,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
);

-- ============================================================
-- 15. PROCUREMENT TABLE (FIXED)
-- ============================================================
CREATE TABLE equipment_procurement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT,
    equipment_name VARCHAR(100) NOT NULL,
    category_id INT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    quantity INT,
    estimated_cost DECIMAL(12, 2),
    justification TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    status ENUM('Requested', 'Under Review', 'Approved', 'Rejected', 'Procured') DEFAULT 'Requested',
    requested_by INT,
    approved_by INT,
    approved_at TIMESTAMP,  -- ✅ FIXED
    rejected_by INT,  -- ✅ ADDED
    rejected_at TIMESTAMP,  -- ✅ ADDED
    rejection_reason TEXT,  -- ✅ ADDED
    procured_at TIMESTAMP,  -- ✅ ADDED
    department VARCHAR(200),  -- ✅ ADDED
    attachments TEXT,  -- ✅ ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (rejected_by) REFERENCES users(id)  -- ✅ ADDED
);

-- ============================================================
-- 16. NOTIFICATIONS TABLE (FIXED)
-- ============================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'System',
    related_id INT,
    related_module VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 17. KNOWLEDGE BASE TABLE (FIXED)
-- ============================================================
CREATE TABLE knowledge_base (
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
    spare_part_images TEXT,
    before_repair_images TEXT,
    after_repair_images TEXT,
    attachments TEXT,
    repair_date DATE,
    remarks TEXT,
    reported_by VARCHAR(200),
    engineer_name VARCHAR(200),
    hospital_name VARCHAR(200),
    department_name VARCHAR(200),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- 18. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50),
    module VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 19. SYSTEM SETTINGS TABLE (NEW)
-- ============================================================
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_name VARCHAR(200) DEFAULT 'PAEC Equipment Management Portal',
    organization_name VARCHAR(200) DEFAULT 'PAEC',
    timezone VARCHAR(100) DEFAULT 'Asia/Karachi',
    date_format VARCHAR(50) DEFAULT 'DD-MM-YYYY',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    session_timeout INT DEFAULT 30,
    max_login_attempts INT DEFAULT 5,
    min_password_length INT DEFAULT 8,
    require_complex_password BOOLEAN DEFAULT TRUE,
    enable_2fa BOOLEAN DEFAULT FALSE,
    force_password_change BOOLEAN DEFAULT TRUE,
    smtp_host VARCHAR(200) DEFAULT 'smtp.gmail.com',
    smtp_port VARCHAR(10) DEFAULT '587',
    sender_email VARCHAR(200) DEFAULT 'noreply@paec.edu.pk',
    sender_name VARCHAR(200) DEFAULT 'PAEC Equipment Management',
    smtp_username VARCHAR(200) DEFAULT 'noreply@paec.edu.pk',
    smtp_password VARCHAR(200) DEFAULT '',
    push_notifications BOOLEAN DEFAULT TRUE,
    critical_alerts BOOLEAN DEFAULT TRUE,
    repair_updates BOOLEAN DEFAULT TRUE,
    maintenance_reminders BOOLEAN DEFAULT TRUE,
    low_stock_alerts BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    monthly_reports BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 20. INSERT DEFAULT ROLES
-- ============================================================
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'SUPER_ADMIN', 'Super Administrator with full system access'),
(2, 'HOSPITAL_ADMIN', 'Hospital Administrator'),
(3, 'ENGINEER', 'Biomedical Engineer');

-- ============================================================
-- 21. INSERT DEFAULT EQUIPMENT CATEGORIES
-- ============================================================
INSERT IGNORE INTO equipment_categories (id, name, description) VALUES
(1, 'Ventilator', 'Respiratory support equipment'),
(2, 'Patient Monitor', 'Patient vital signs monitoring equipment'),
(3, 'ECG Machine', 'Electrocardiogram machines'),
(4, 'Defibrillator', 'Emergency cardiac defibrillators'),
(5, 'Infusion Pump', 'IV infusion pumps'),
(6, 'Syringe Pump', 'Syringe infusion pumps'),
(7, 'Ultrasound', 'Ultrasound imaging machines'),
(8, 'X-Ray Machine', 'Digital X-Ray equipment'),
(9, 'CT Scanner', 'Computed Tomography scanners'),
(10, 'MRI Machine', 'Magnetic Resonance Imaging machines');

-- ============================================================
-- 22. INSERT DEFAULT HOSPITALS
-- ============================================================
INSERT IGNORE INTO hospitals (id, name, hospital_code, address, city, state, country, phone, email, biomedical_head) VALUES
(1, 'PAEC Islamabad Hospital', 'HOS-001', 'Sector G-9/1', 'Islamabad', 'ICT', 'Pakistan', '+92-51-1234567', 'admin@paec.edu.pk', 'Dr. Ahmed Khan'),
(2, 'PAEC Lahore Hospital', 'HOS-002', 'Main Boulevard', 'Lahore', 'Punjab', 'Pakistan', '+92-42-1234567', 'lahore@paec.edu.pk', 'Dr. Fatima Ali');

-- ============================================================
-- 23. INSERT DEFAULT DEPARTMENTS
-- ============================================================
INSERT IGNORE INTO departments (id, name, hospital_id) VALUES
(1, 'Biomedical Engineering', 1),
(2, 'Cardiology', 1),
(3, 'Neurology', 1),
(4, 'Radiology', 1),
(5, 'Emergency', 1);

-- ============================================================
-- 24. INSERT DEFAULT SYSTEM SETTINGS
-- ============================================================
INSERT IGNORE INTO system_settings (id) VALUES (1);

-- ============================================================
-- 25. INSERT SAMPLE USERS (password: Password123!)
-- ============================================================
-- Note: In production, use proper password hashing
INSERT IGNORE INTO users (id, username, email, password_hash, full_name, role_id, hospital_id, phone, is_active) VALUES
(1, 'superadmin', 'superadmin@paec.edu.pk', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Super Admin', 1, NULL, '+92-51-9999999', TRUE),
(2, 'hospitaladmin', 'admin@paec.edu.pk', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hospital Admin', 2, 1, '+92-51-1234567', TRUE),
(3, 'engineer1', 'engineer1@paec.edu.pk', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Engineer Ali', 3, 1, '+92-51-1234568', TRUE);

-- ============================================================
-- ✅ DATABASE SETUP COMPLETE
-- ============================================================