-- database/schema.sql

CREATE DATABASE IF NOT EXISTS hospital_equipment_management;
USE hospital_equipment_management;

-- Roles Table
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
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

-- Hospitals Table
CREATE TABLE hospitals (
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
);

-- Departments Table
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- Equipment Categories Table
CREATE TABLE equipment_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Table
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
    image_url VARCHAR(255),
    warranty_expiry DATE,
    amc_details TEXT,
    calibration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Error Logs Table
CREATE TABLE error_logs (
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
);

-- Repairs Table
CREATE TABLE repairs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    error_log_id INT,
    engineer_id INT,
    root_cause TEXT,
    problem_analysis TEXT,
    corrective_action TEXT,
    repair_procedure TEXT,
    solution_description TEXT,
    time_taken INT, -- in minutes
    repair_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    spare_part_used BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    status ENUM('Pending', 'In Progress', 'Completed', 'Verified') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (error_log_id) REFERENCES error_logs(id),
    FOREIGN KEY (engineer_id) REFERENCES users(id)
);

-- Spare Parts Table
CREATE TABLE spare_parts (
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
);

-- Maintenance Schedule Table
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
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Overdue') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

-- AMC Contracts Table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

-- Purchase Orders Table
CREATE TABLE purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    hospital_id INT,
    vendor_name VARCHAR(100),
    order_date DATE,
    delivery_date DATE,
    total_amount DECIMAL(12, 2),
    status ENUM('Draft', 'Pending Approval', 'Approved', 'Ordered', 'Received', 'Cancelled') DEFAULT 'Draft',
    created_by INT,
    approved_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Equipment Procurement Table
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
    approval_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type ENUM('Error', 'Repair', 'Maintenance', 'System', 'AMC') DEFAULT 'System',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Knowledge Base Table
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
    images TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit Logs Table
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

-- Insert Default Roles
INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Super Administrator with full system access'),
('HOSPITAL_ADMIN', 'Hospital Administrator'),
('ENGINEER', 'Biomedical Engineer');

-- Insert Default Equipment Categories
INSERT INTO equipment_categories (name, description) VALUES
('Ventilator', 'Respiratory support equipment'),
('Patient Monitor', 'Patient vital signs monitoring equipment'),
('ECG Machine', 'Electrocardiogram machines'),
('Defibrillator', 'Emergency cardiac defibrillators'),
('Infusion Pump', 'IV infusion pumps'),
('Syringe Pump', 'Syringe infusion pumps'),
('Ultrasound', 'Ultrasound imaging machines'),
('X-Ray Machine', 'Digital X-Ray equipment'),
('CT Scanner', 'Computed Tomography scanners'),
('MRI Machine', 'Magnetic Resonance Imaging machines');

-- Insert Sample Hospitals
INSERT INTO hospitals (name, address, city, state, country, phone, email, biomedical_head) VALUES
('PAEC Islamabad Hospital', 'Sector G-9/1', 'Islamabad', 'ICT', 'Pakistan', '+92-51-1234567', 'admin@paec.edu.pk', 'Dr. Ahmed Khan'),
('PAEC Lahore Hospital', 'Main Boulevard', 'Lahore', 'Punjab', 'Pakistan', '+92-42-1234567', 'lahore@paec.edu.pk', 'Dr. Fatima Ali');

-- Insert Sample Users (Passwords: admin123, hospital123, engineer123)
-- Note: In production, use proper password hashing
INSERT INTO users (username, email, password_hash, full_name, role_id, hospital_id, phone, is_active) VALUES
('superadmin', 'superadmin@paec.edu.pk', '$2b$10$YourHashedPasswordHere', 'Super Admin', 1, NULL, '+92-51-9999999', TRUE),
('hospitaladmin', 'admin@paec.edu.pk', '$2b$10$YourHashedPasswordHere', 'Hospital Admin', 2, 1, '+92-51-1234567', TRUE),
('engineer1', 'engineer1@paec.edu.pk', '$2b$10$YourHashedPasswordHere', 'Engineer Ali', 3, 1, '+92-51-1234568', TRUE);