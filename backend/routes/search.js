const express = require('express')
const router = express.Router()
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')

// ============================================
// ✅ GLOBAL SEARCH API - FIXED
// ============================================
router.get('/', authenticate, async (req, res) => {
    try {
        const { q } = req.query
        
        // ✅ Return empty if query is too short
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
            })
        }

        const searchTerm = `%${q.trim()}%`
        
        // ✅ Initialize as OBJECT (not array)
        const results = {
            hospitals: [],
            equipment: [],
            errors: [],
            repairs: [],
            knowledge: [],
            spareParts: [],
            users: []
        }

        // ✅ 1. Search Hospitals (Super Admin only)
        if (req.user.role_name === 'SUPER_ADMIN') {
            results.hospitals = await query(
                `SELECT id, name, city, phone, email, is_active as status
                 FROM hospitals 
                 WHERE name LIKE ? OR city LIKE ? OR email LIKE ? OR phone LIKE ?
                 AND is_active = 1
                 LIMIT 10`,
                [searchTerm, searchTerm, searchTerm, searchTerm]
            )
        }

        // ✅ 2. Search Equipment
        let equipmentSql = `
            SELECT e.id, e.name, e.model, e.manufacturer, 
                   e.serial_number, e.status,
                   h.name as hospital_name,
                   c.name as category_name
            FROM equipment e
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            WHERE (e.name LIKE ? 
               OR e.model LIKE ? 
               OR e.manufacturer LIKE ? 
               OR e.serial_number LIKE ?)
               AND e.status != 'Retired'
        `
        const equipmentParams = [searchTerm, searchTerm, searchTerm, searchTerm]

        if (req.user.role_name !== 'SUPER_ADMIN') {
            equipmentSql += ' AND e.hospital_id = ?'
            equipmentParams.push(req.user.hospital_id)
        }

        equipmentSql += ' LIMIT 10'
        results.equipment = await query(equipmentSql, equipmentParams)

        // ✅ 3. Search Errors
        let errorSql = `
            SELECT e.id, e.error_title, e.error_code, e.status,
                   eq.name as equipment_name,
                   h.name as hospital_name,
                   u.full_name as reported_by_name
            FROM error_logs e
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            LEFT JOIN hospitals h ON eq.hospital_id = h.id
            LEFT JOIN users u ON e.reported_by = u.id
            WHERE e.error_title LIKE ? 
               OR e.error_code LIKE ? 
               OR e.error_description LIKE ?
        `
        const errorParams = [searchTerm, searchTerm, searchTerm]

        if (req.user.role_name !== 'SUPER_ADMIN') {
            errorSql += ' AND eq.hospital_id = ?'
            errorParams.push(req.user.hospital_id)
        }

        errorSql += ' LIMIT 10'
        results.errors = await query(errorSql, errorParams)

        // ✅ 4. Search Repairs
        let repairSql = `
            SELECT r.id, r.root_cause, r.status, r.repair_date,
                   eq.name as equipment_name,
                   u.full_name as engineer_name
            FROM repairs r
            LEFT JOIN error_logs e ON r.error_log_id = e.id
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            LEFT JOIN users u ON r.engineer_id = u.id
            WHERE r.root_cause LIKE ? 
               OR r.solution_description LIKE ? 
               OR r.repair_procedure LIKE ?
        `
        const repairParams = [searchTerm, searchTerm, searchTerm]

        if (req.user.role_name !== 'SUPER_ADMIN') {
            repairSql += ' AND eq.hospital_id = ?'
            repairParams.push(req.user.hospital_id)
        }

        repairSql += ' LIMIT 10'
        results.repairs = await query(repairSql, repairParams)

        // ✅ 5. Search Knowledge Base
        let kbSql = `
            SELECT k.id, k.error_title, k.error_code, 
                   k.solution, k.root_cause, k.created_at,
                   eq.name as equipment_name
            FROM knowledge_base k
            LEFT JOIN equipment eq ON k.equipment_id = eq.id
            WHERE k.error_title LIKE ? 
               OR k.error_code LIKE ? 
               OR k.solution LIKE ? 
               OR k.root_cause LIKE ?
        `
        const kbParams = [searchTerm, searchTerm, searchTerm, searchTerm]

        if (req.user.role_name !== 'SUPER_ADMIN') {
            kbSql += ' AND eq.hospital_id = ?'
            kbParams.push(req.user.hospital_id)
        }

        kbSql += ' LIMIT 10'
        results.knowledge = await query(kbSql, kbParams)

        // ✅ 6. Search Spare Parts
        let spareSql = `
            SELECT s.id, s.part_name, s.part_number, 
                   s.brand, s.quantity, s.unit_cost,
                   eq.name as equipment_name
            FROM spare_parts s
            LEFT JOIN repairs r ON s.repair_id = r.id
            LEFT JOIN error_logs e ON r.error_log_id = e.id
            LEFT JOIN equipment eq ON e.equipment_id = eq.id
            WHERE s.part_name LIKE ? 
               OR s.part_number LIKE ? 
               OR s.brand LIKE ?
               OR s.manufacturer LIKE ?
        `
        const spareParams = [searchTerm, searchTerm, searchTerm, searchTerm]

        if (req.user.role_name !== 'SUPER_ADMIN') {
            spareSql += ' AND eq.hospital_id = ?'
            spareParams.push(req.user.hospital_id)
        }

        spareSql += ' LIMIT 10'
        results.spareParts = await query(spareSql, spareParams)

        // ✅ 7. Search Users (Super Admin only)
        if (req.user.role_name === 'SUPER_ADMIN') {
            results.users = await query(
                `SELECT u.id, u.full_name, u.email, u.username,
                        r.name as role_name,
                        h.name as hospital_name,
                        u.is_active as status
                 FROM users u
                 LEFT JOIN roles r ON u.role_id = r.id
                 LEFT JOIN hospitals h ON u.hospital_id = h.id
                 WHERE u.full_name LIKE ? 
                    OR u.email LIKE ? 
                    OR u.username LIKE ?
                    AND u.is_active = 1
                 LIMIT 10`,
                [searchTerm, searchTerm, searchTerm]
            )
        }

        // ✅ Calculate total
        const total = 
            results.hospitals.length +
            results.equipment.length +
            results.errors.length +
            results.repairs.length +
            results.knowledge.length +
            results.spareParts.length +
            results.users.length

        console.log('📊 Search Results:', {
            query: q,
            total: total,
            equipment: results.equipment.length,
            hospitals: results.hospitals.length,
            errors: results.errors.length
        })

        // ✅ Return as OBJECT with results object
        res.json({ 
            success: true, 
            results: results,  // ✅ This is an OBJECT, not array!
            total: total,
            count: total,
            query: q.trim()
        })

    } catch (error) {
        console.error('❌ Search error:', error)
        res.status(500).json({ 
            success: false, 
            message: 'Search failed: ' + error.message 
        })
    }
})

module.exports = router